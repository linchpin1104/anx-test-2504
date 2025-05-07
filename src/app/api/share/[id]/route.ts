import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: shareId } = await params;
    
    if (!shareId) {
      return NextResponse.json(
        { success: false, message: '공유 ID가 유효하지 않습니다.' }, 
        { status: 400 }
      );
    }

    // Firestore에서 공유된 결과 조회
    const shareRef = firestore.collection('shared_results').doc(shareId);
    const doc = await shareRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, message: '공유된 결과를 찾을 수 없습니다.' }, 
        { status: 404 }
      );
    }

    // 결과 데이터 가져오기
    const result = doc.data();
    
    // 만료일 확인
    const now = new Date();
    const expiresAt = result?.expiresAt?.toDate();
    
    if (expiresAt && now > expiresAt) {
      return NextResponse.json(
        { success: false, message: '공유 링크가 만료되었습니다.' }, 
        { status: 410 }
      );
    }

    // 개인정보 보호를 위해 필요하지 않은 정보 제거
    if (result && result.userInfo) {
      delete result.userInfo.phone;
    }

    return NextResponse.json({ 
      success: true, 
      result 
    });
    
  } catch (error) {
    console.error('[share API]', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: '결과를 불러오는 중 오류가 발생했습니다.' 
      }, 
      { status: 500 }
    );
  }
} 