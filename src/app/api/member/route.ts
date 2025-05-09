import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { name, phone, childAge, childGender, parentAgeGroup, caregiverType } = await request.json();
    
    // Validate required fields
    if (!name || !phone || !childAge || !childGender || !parentAgeGroup || !caregiverType) {
      return NextResponse.json(
        { success: false, message: '필수 입력 항목이 누락되었습니다.' }, 
        { status: 400 }
      );
    }

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Save user info in Firestore
    if (firestore && typeof firestore.collection === 'function') {
      try {
        const userRef = firestore.collection('users').doc(phone);
        await userRef.set({
          name,
          phone,
          childAge,
          childGender,
          parentAgeGroup,
          caregiverType,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (firestoreError) {
        console.error('[member] Firestore error:', firestoreError);
        
        // In development mode, just log the error but proceed as if successful
        if (isDevelopment) {
          console.log('[DEV] 개발 모드에서 Firestore 오류 무시됨, 계속 진행합니다.');
          return NextResponse.json({ success: true });
        }
        
        return NextResponse.json(
          { success: false, message: '사용자 정보 저장 중 오류가 발생했습니다.' }, 
          { status: 500 }
        );
      }
    } else {
      console.warn('[member] Firestore not initialized or not properly configured');
      
      // In development, we still want to proceed even if Firestore is not available
      if (isDevelopment) {
        console.log('[DEV] 개발 모드에서 Firestore 없이 계속 진행합니다.');
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { success: false, message: '데이터베이스 연결에 실패했습니다.' }, 
          { status: 503 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[member] Unexpected error:', error);
    
    // In development mode, just log the error but proceed as if successful
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] 개발 모드에서 오류 무시됨, 계속 진행합니다.');
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다. 다시 시도해주세요.' }, 
      { status: 500 }
    );
  }
} 