import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 요청 본문에서 결과 데이터 파싱
    const resultData = await request.json();
    
    // 필수 결과 데이터 확인
    if (!resultData || 
        !resultData.globalResult || 
        !resultData.categoryResults || 
        !resultData.baiResult) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 결과 데이터입니다.' }, 
        { status: 400 }
      );
    }

    // 결과를 Firestore에 저장
    const shareRef = firestore.collection('shared_results').doc();
    const shareId = shareRef.id;
    
    // 데이터 저장
    await shareRef.set({
      ...resultData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30일 후 만료
      )
    });

    // 성공 응답 반환
    return NextResponse.json({ 
      success: true, 
      shareId,
      shareUrl: `/share/${shareId}`
    });
    
  } catch (error) {
    console.error('[share API]', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: '결과 공유 중 오류가 발생했습니다. 다시 시도해주세요.' 
      }, 
      { status: 500 }
    );
  }
} 