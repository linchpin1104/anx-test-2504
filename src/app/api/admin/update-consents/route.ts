import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

// This is an admin-only endpoint that updates all users to have marketingAgreed and privacyAgreed set to true
export async function GET(request: NextRequest) {
  try {
    // Simple security check - using a secret key
    const url = request.nextUrl;
    const adminKey = url.searchParams.get('key');
    
    // Check if admin key is provided and valid
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { success: false, message: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }
    
    // Development mode check
    if (process.env.NODE_ENV === 'development') {
      console.log('[ADMIN] 개발 환경에서는 실제 데이터가 변경되지 않습니다.');
      return NextResponse.json({
        success: true,
        message: '개발 환경: 모든 사용자의 동의 항목이 업데이트된 것으로 처리됨 (시뮬레이션)',
        usersUpdated: 0
      });
    }
    
    // Check if Firestore is initialized
    if (!firestore || typeof firestore.collection !== 'function') {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    
    // Get all users from the users collection
    const usersRef = firestore.collection('users');
    const usersSnapshot = await usersRef.get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: '업데이트할 사용자가 없습니다.',
        usersUpdated: 0
      });
    }
    
    // Update all users
    const batch = firestore.batch();
    let usersCount = 0;
    
    usersSnapshot.forEach(doc => {
      const userRef = firestore.collection('users').doc(doc.id);
      
      batch.update(userRef, {
        marketingAgreed: true,
        privacyAgreed: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      usersCount++;
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log(`[ADMIN] ${usersCount}명의 사용자 동의 항목이 업데이트되었습니다.`);
    
    return NextResponse.json({
      success: true,
      message: `${usersCount}명의 사용자 동의 항목이 업데이트되었습니다.`,
      usersUpdated: usersCount
    });
    
  } catch (error) {
    console.error('[ADMIN] 사용자 업데이트 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: '사용자 정보 업데이트 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
} 