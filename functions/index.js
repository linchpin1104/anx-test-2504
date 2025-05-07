const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

admin.initializeApp();

// Google Sheets 인증 정보 설정
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = '1Nfq8Ydkrsja-hD_oO33ySWFZ_fD2hChCl_a3ZQj-F08'; // 실제 스프레드시트 ID로 변경
const KEY_FILE_PATH = path.join(__dirname, 'serviceAccountKey.json');

// 서비스 계정 키 파일을 사용한 인증
async function getAuthToken() {
  try {
    // 서비스 계정 키 파일 사용
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: SCOPES,
    });
    const authClient = await auth.getClient();
    return authClient;
  } catch (error) {
    console.error('Google API 인증 오류:', error);
    throw error;
  }
}

// Google Sheets API 인스턴스 생성
async function getSheets() {
  const authClient = await getAuthToken();
  return google.sheets({ version: 'v4', auth: authClient });
}

// 스프레드시트에 데이터 추가
async function appendToSheet(data) {
  const sheets = await getSheets();
  
  // 검사 결과 및 사용자 정보 추출
  const { categoryResults, globalResult, baiResult, userInfo } = data;
  
  // 현재 날짜/시간 - 검사 완료일
  const now = new Date().toISOString();
  
  // 각 카테고리별 결과 추출
  const parentEfficacy = categoryResults['부모역할 효능감으로 인한 불안'] || { mean: 0, label: '', description: '' };
  const childAttachment = categoryResults['자녀와의 애착에 대한 불안'] || { mean: 0, label: '', description: '' };
  const childConcern = categoryResults['자녀에 대한 염려'] || { mean: 0, label: '', description: '' };
  const socialSupport = categoryResults['사회적 지지에 대한 염려'] || { mean: 0, label: '', description: '' };
  const perfectionism = categoryResults['완벽주의로 인한 불안'] || { mean: 0, label: '', description: '' };
  
  // 스프레드시트에 추가할 데이터 준비
  const rowData = [
    now, // 검사 완료일
    userInfo?.name || '',
    userInfo?.phone || '',
    userInfo?.childAge || '',
    userInfo?.childGender || '',
    userInfo?.caregiverType || '',
    userInfo?.parentAgeGroup || '',
    userInfo?.region || '', // 지역 정보 추가
    
    // 점수들
    globalResult.mean, // 전체평균점수
    parentEfficacy.mean, // 부모역할점수
    childAttachment.mean, // 자녀애착점수
    childConcern.mean, // 자녀염려점수
    socialSupport.mean, // 사회적지지점수
    perfectionism.mean, // 완벽주의점수
    baiResult.sum, // BAI점수
    
    // 등급들
    globalResult.label, // 전체평균등급
    parentEfficacy.label, // 부모역할등급
    childAttachment.label, // 자녀애착등급
    childConcern.label, // 자녀염려등급
    socialSupport.label, // 사회적지지등급
    perfectionism.label, // 완벽주의등급
    baiResult.label, // BAI등급
    
    // 추출멘트들
    globalResult.description, // 전체평균 추출멘트
    parentEfficacy.description, // 부모역할 추출멘트
    childAttachment.description, // 자녀애착 추출멘트
    childConcern.description, // 자녀염려 추출멘트
    socialSupport.description, // 사회적지지 추출멘트
    perfectionism.description, // 완벽주의 추출멘트
    baiResult.description // BAI 추출멘트
  ];
  
  try {
    // 데이터를 스프레드시트에 추가
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:AA', // 스프레드시트 범위 (확장됨)
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData],
      },
    });
    
    console.log('스프레드시트 업데이트 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('스프레드시트 업데이트 오류:', error);
    throw error;
  }
}

// Firestore 응답 데이터가 생성될 때마다 트리거되는 함수
exports.saveResultToSheet = functions.firestore
  .document('responses/{docId}')
  .onCreate(async (snapshot, context) => {
    try {
      const data = snapshot.data();
      
      // 필요한 데이터가 모두 존재하는지 확인
      if (!data.categoryResults || !data.globalResult || !data.baiResult) {
        console.log('완전한 결과 데이터가 없습니다:', context.params.docId);
        return null;
      }
      
      // 스프레드시트에 데이터 추가
      await appendToSheet(data);
      console.log('검사 결과가 스프레드시트에 성공적으로 저장되었습니다:', context.params.docId);
      return null;
    } catch (error) {
      console.error('결과 저장 중 오류 발생:', error);
      return null;
    }
  });

// Firestore 응답 데이터가 업데이트될 때마다 트리거되는 함수 (결과가 나중에 업데이트되는 경우 대비)
exports.updateResultInSheet = functions.firestore
  .document('responses/{docId}')
  .onUpdate(async (change, context) => {
    try {
      const newData = change.after.data();
      const oldData = change.before.data();
      
      // 결과 데이터가 새로 추가된 경우에만 처리
      const hadResultBefore = oldData.categoryResults && oldData.globalResult && oldData.baiResult;
      const hasResultNow = newData.categoryResults && newData.globalResult && newData.baiResult;
      
      if (!hadResultBefore && hasResultNow) {
        // 스프레드시트에 데이터 추가
        await appendToSheet(newData);
        console.log('업데이트된 검사 결과가 스프레드시트에 성공적으로 저장되었습니다:', context.params.docId);
      } else {
        console.log('결과 데이터가 없거나 이미 처리되었습니다:', context.params.docId);
      }
      
      return null;
    } catch (error) {
      console.error('결과 업데이트 중 오류 발생:', error);
      return null;
    }
  }); 