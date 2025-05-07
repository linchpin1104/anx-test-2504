import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // URL에서 결과 ID 가져오기
    const { id } = await params;
    
    // URL 쿼리에서 사용자 ID(전화번호) 가져오기
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: '결과 ID가 유효하지 않습니다.' }, 
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' }, 
        { status: 400 }
      );
    }

    // 결과 조회 (users/{userId}/results/{resultId})
    const resultRef = firestore.collection('users').doc(userId).collection('results').doc(id);
    const resultDoc = await resultRef.get();
    
    if (!resultDoc.exists) {
      // 기존 방식으로도 조회 시도 (호환성 유지)
      const legacyRef = firestore.collection('responses').doc(id);
      const legacyDoc = await legacyRef.get();
      
      if (!legacyDoc.exists) {
        return NextResponse.json(
          { success: false, message: '결과를 찾을 수 없습니다.' }, 
          { status: 404 }
        );
      }
      
      const legacyData = legacyDoc.data();
      if (legacyData?.userInfo?.phone !== userId) {
        return NextResponse.json(
          { success: false, message: '결과에 접근할 권한이 없습니다.' }, 
          { status: 403 }
        );
      }
      
      return NextResponse.json({
        success: true,
        resultId: id,
        ...legacyData,
      });
    }

    // 결과 데이터 가져오기
    const data = resultDoc.data();
    
    // 사용자 정보 가져오기
    const userRef = firestore.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;
    
    return NextResponse.json({
      success: true,
      resultId: id,
      ...data,
      userInfo: userData
    });
    
  } catch (error) {
    console.error('[Result API]', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: '결과를 불러오는 중 오류가 발생했습니다.' 
      }, 
      { status: 500 }
    );
  }
} 