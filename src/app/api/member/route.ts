import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  const { name, phone, childAge, childGender, parentAgeGroup } = await request.json();

  // Save user info in Firestore
  if (firestore) {
    const userRef = firestore.collection('users').doc(phone);
    await userRef.set({
      name,
      phone,
      childAge,
      childGender,
      parentAgeGroup,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    console.warn('[member] Firestore not initialized, skipping saving user info');
  }

  return NextResponse.json({ success: true });
} 