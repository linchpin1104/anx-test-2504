import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  const { phone, code } = await request.json();

  // Dev shortcut: accept '0000' code without SMS verification
  if (code === '0000') {
    const sessionId = randomBytes(16).toString('hex');
    await firestore.collection('sessions').doc(sessionId).set({
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const response = NextResponse.json({ verified: true });
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return response;
  }

  // Retrieve stored code from Firestore
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
  await firestore.collection('sessions').doc(sessionId).set({
    phone,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Set session cookie
  const response = NextResponse.json({ verified: true });
  response.cookies.set('session', sessionId, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return response;
} 