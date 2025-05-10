import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

// Admin endpoint to add createdAt field to users who don't have it
export async function GET(request: NextRequest) {
  try {
    // Security check - using a secret key
    const url = request.nextUrl;
    const adminKey = url.searchParams.get('key');
    
    // Check admin key
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
        message: '개발 환경: 모든 사용자에게 createdAt 필드 추가 시뮬레이션',
        usersUpdated: 0
      });
    }
    
    // Check Firestore
    if (!firestore || typeof firestore.collection !== 'function') {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    
    // Get all users
    const usersRef = firestore.collection('users');
    const usersSnapshot = await usersRef.get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: '업데이트할 사용자가 없습니다.',
        usersUpdated: 0
      });
    }
    
    // Update users without createdAt field
    const batch = firestore.batch();
    let usersUpdated = 0;
    let usersSkipped = 0;
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      // Only update users without createdAt field
      if (!userData.createdAt) {
        const userRef = firestore.collection('users').doc(doc.id);
        batch.update(userRef, {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        usersUpdated++;
      } else {
        usersSkipped++;
      }
    });
    
    // If no users need updating
    if (usersUpdated === 0) {
      return NextResponse.json({
        success: true,
        message: '모든 사용자에게 이미 createdAt 필드가 있습니다.',
        usersUpdated: 0,
        usersSkipped
      });
    }
    
    // Commit the batch
    await batch.commit();
    
    console.log(`[ADMIN] ${usersUpdated}명의 사용자에게 createdAt 필드가 추가되었습니다. (${usersSkipped}명은 이미 있음)`);
    
    return NextResponse.json({
      success: true,
      message: `${usersUpdated}명의 사용자에게 createdAt 필드가 추가되었습니다.`,
      usersUpdated,
      usersSkipped
    });
    
  } catch (error) {
    console.error('[ADMIN] createdAt 필드 추가 오류:', error);
    
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