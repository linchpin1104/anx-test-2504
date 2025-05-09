import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // URL에서 사용자 ID (전화번호) 파라미터 추출
    const url = request.nextUrl;
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 개발 환경에서는 임시 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] 개발 모드에서 임시 결과 이력을 반환합니다.', { userId });
      
      // 로컬 스토리지의 이력 데이터를 사용하도록 설정
      return NextResponse.json({
        success: true,
        message: '개발 환경에서는 로컬 스토리지의 이력 데이터를 사용합니다.',
        useLocalStorage: true
      });
    }
    
    // 프로덕션 환경에서는 Firestore에서 데이터 검색
    if (!firestore) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    
    // 사용자의 검사 결과 목록 가져오기
    const userRef = firestore.collection('users').doc(userId);
    const resultsRef = userRef.collection('results');
    const resultsSnapshot = await resultsRef
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    if (resultsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        results: [],
        message: '검사 결과가 없습니다.'
      });
    }
    
    // 결과 데이터 추출
    const results = resultsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.createdAt?.toDate?.() || null,
        globalResult: data.globalResult
      };
    });
    
    // 결과 반환
    return NextResponse.json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('[User History API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: '결과 이력을 불러오는 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
} 