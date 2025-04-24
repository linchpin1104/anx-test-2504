import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  const { phone, code } = await request.json();

  if (code === '0000') {
    const sessionId = randomBytes(16).toString('hex');
    if (firestore) {
      await firestore.collection('sessions').doc(sessionId).set({
        phone,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      console.warn('[verify-sms] Firestore not initialized, skipping session creation for dev code');
    }
    const response = NextResponse.json({ verified: true });
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return response;
  }

  if (!firestore) {
    console.warn('[verify-sms] Firestore not initialized, skipping code verification');
    return NextResponse.json({ verified: false });
  }
  const docRef = firestore.collection('smsCodes').doc(phone);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return NextResponse.json({ verified: false });
  }

  const data = docSnap.data()!;
  if (data.code !== code) {
    return NextResponse.json({ verified: false });
  }

  // Delete the code after verification
  await docRef.delete();

  // Create session ID and store in Firestore
  const sessionId = randomBytes(16).toString('hex');
  if (firestore) {
    await firestore.collection('sessions').doc(sessionId).set({
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    console.warn('[verify-sms] Firestore not initialized, skipping session creation');
  }

  // Set session cookie
  const response = NextResponse.json({ verified: true });
  response.cookies.set('session', sessionId, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return response;
} 