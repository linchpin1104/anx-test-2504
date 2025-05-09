import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const resultId = context.params.id;
    
    if (!resultId) {
      return NextResponse.json(
        { success: false, message: '결과 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 개발 환경에서는 임시 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] 개발 모드에서 결과를 반환합니다.', { resultId });
      
      // 이미 로컬 스토리지에 데이터가 있다면 불러올 수 있게 설정
      return NextResponse.json({
        success: true,
        message: '개발 환경에서는 결과를 사용할 수 없습니다.',
      });
    }
    
    // 프로덕션 환경에서는 Firestore에서 데이터 검색
    if (!firestore) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    
    // 결과 가져오기 (레거시 구조 사용)
    const resultDoc = await firestore.collection('responses').doc(resultId).get();
    
    if (!resultDoc.exists) {
      return NextResponse.json({
        success: false,
        message: '결과를 찾을 수 없습니다.'
      }, { status: 404 });
    }
    
    // 결과 데이터 추출
    const resultData = resultDoc.data();
    
    // 결과 반환
    return NextResponse.json({
      success: true,
      resultId: resultId,
      categoryResults: resultData?.categoryResults,
      globalResult: resultData?.globalResult,
      baiResult: resultData?.baiResult,
      createdAt: resultData?.createdAt?.toDate?.() || null
    });
    
  } catch (error) {
    console.error('[Result API GET] Error:', error);
    
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