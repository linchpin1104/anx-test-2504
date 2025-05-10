import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // URL에서 파라미터 추출
    const url = request.nextUrl;
    const resultId = url.searchParams.get('resultId');
    const userId = url.searchParams.get('userId');
    
    if (!resultId) {
      return NextResponse.json(
        { success: false, message: '결과 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 개발 환경에서는 임시 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] 개발 모드에서 임시 결과를 반환합니다.', { resultId, userId });
      
      // 이미 로컬 스토리지에 데이터가 있다면 불러올 수 있게 설정
      return NextResponse.json({
        success: true,
        message: '개발 환경에서는 로컬 스토리지의 데이터를 사용합니다.',
        useLocalStorage: true
      });
    }
    
    // 프로덕션 환경에서는 Firestore에서 데이터 검색
    if (!firestore) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    
    let resultDoc;
    
    // 사용자 ID가 제공된 경우
    if (userId) {
      // 사용자의 검사 결과 컬렉션에서 검색
      const userRef = firestore.collection('users').doc(userId);
      const resultRef = userRef.collection('results').doc(resultId);
      resultDoc = await resultRef.get();
    } else {
      // 레거시 응답 컬렉션에서 검색
      const resultRef = firestore.collection('responses').doc(resultId);
      resultDoc = await resultRef.get();
    }
    
    if (!resultDoc.exists) {
      return NextResponse.json({
        success: false,
        message: '검사 결과를 찾을 수 없습니다.',
        noResult: true
      }, { status: 404 });
    }
    
    // 결과 데이터 추출
    const resultData = resultDoc.data();
    
    // 사용자 정보 가져오기 (userId가 있는 경우)
    let userInfo = resultData?.userInfo || null;
    if (userId && !userInfo) {
      const userRef = firestore.collection('users').doc(userId);
      const userSnapshot = await userRef.get();
      userInfo = userSnapshot.exists ? userSnapshot.data() : null;
    }
    
    // 결과 반환
    return NextResponse.json({
      success: true,
      resultId,
      categoryResults: resultData?.categoryResults || {},
      globalResult: resultData?.globalResult || {},
      baiResult: resultData?.baiResult || {},
      userInfo,
      answers: resultData?.answers || {},
      timestamp: resultData?.createdAt?.toDate() || null,
      isHistory: true
    });
    
  } catch (error) {
    console.error('[Result History API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: '결과를 불러오는 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
} 