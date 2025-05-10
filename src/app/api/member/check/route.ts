import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // URL에서 사용자 ID (전화번호) 파라미터 추출
    const url = request.nextUrl;
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    console.log('[member/check] 사용자 정보 확인 요청:', { userId });
    
    // 개발 환경에서는 항상 불완전 데이터로 응답 (기본정보 입력페이지 테스트를 위해)
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] 개발 모드에서 테스트 데이터 반환');
      return NextResponse.json({
        success: true,
        userData: null, // 불완전 데이터를 의미
        message: '개발 환경에서는 기본 정보 입력이 필요합니다.'
      });
    }
    
    // 프로덕션 환경에서는 Firestore에서 데이터 검색
    if (!firestore || typeof firestore.collection !== 'function') {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    
    // 사용자 정보 가져오기
    const userRef = firestore.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      console.log('[member/check] 사용자 정보 없음:', userId);
      return NextResponse.json({
        success: true,
        userData: null,
        message: '사용자 정보가 없습니다.'
      });
    }
    
    // 사용자 데이터
    const userData = userSnap.data();
    console.log('[member/check] 사용자 정보 찾음:', userId);
    
    return NextResponse.json({
      success: true,
      userData: userData,
      message: '사용자 정보를 찾았습니다.'
    });
    
  } catch (error) {
    console.error('[member/check] 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: '사용자 정보를 확인하는 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
} 