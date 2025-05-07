// 인증 정보 초기화 스크립트
const admin = require('firebase-admin');
const path = require('path');

// 서비스 계정 키 파일을 사용한 초기화
let serviceAccount;
try {
  serviceAccount = require('../anx-test-faadd-firebase-adminsdk-fbsvc-1d9f3b41fc.json');
  
  // Firebase Admin 초기화
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin이 초기화되었습니다.');
} catch (error) {
  console.error('Firebase Admin 초기화 오류:', error);
  process.exit(1);
}

// Firestore 인스턴스 가져오기
const firestore = admin.firestore();

// 초기화할 전화번호
const phone = '01052995980';

// 인증 정보 초기화 함수
async function resetVerification() {
  try {
    console.log(`인증 정보 초기화 시도: ${phone}`);
    
    // 현재 인증 정보 확인
    const docRef = firestore.collection('verifications').doc(phone);
    const doc = await docRef.get();
    
    if (doc.exists) {
      console.log('기존 인증 정보:', doc.data());
      
      // 기존 문서 삭제
      await docRef.delete();
      console.log(`기존 인증 정보가 삭제되었습니다: ${phone}`);
    } else {
      console.log(`인증 정보가 존재하지 않습니다: ${phone}`);
    }
    
    console.log(`인증 정보 초기화 성공: ${phone}`);
  } catch (error) {
    console.error('인증 정보 초기화 실패:', error);
  } finally {
    // Firebase 앱 종료
    await admin.app().delete();
    console.log('Firebase 앱이 종료되었습니다.');
    process.exit(0);
  }
}

// 실행
resetVerification(); 