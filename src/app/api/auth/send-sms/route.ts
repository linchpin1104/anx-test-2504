import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import { SolapiMessageService } from 'solapi';

// Initialize Solapi with API key/secret from environment
const solapi = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

export async function POST(request: Request) {
  const { phone } = await request.json();

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store code in Firestore with timestamp, if Firestore is initialized
  if (firestore) {
    const docRef = firestore.collection('smsCodes').doc(phone);
    await docRef.set({
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    console.warn('[send-sms] Firestore not initialized, skipping saving verification code');
  }

  // Send SMS via Solapi
  await solapi.send({
    to: phone,
    from: process.env.SOLAPI_SENDER!,
    text: `인증번호: ${code}`,
    type: 'SMS',
  });

  return NextResponse.json({ success: true });
} 