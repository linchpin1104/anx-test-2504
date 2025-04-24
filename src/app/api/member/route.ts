import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  const { name, phone, childAge, childGender, parentAgeGroup } = await request.json();

  // Save user info in Firestore
  const userRef = firestore.collection('users').doc(phone);
  await userRef.set({
    name,
    phone,
    childAge,
    childGender,
    parentAgeGroup,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ success: true });
} 