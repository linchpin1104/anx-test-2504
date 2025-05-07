import { firestore } from '@/lib/firebaseAdmin';

// 인증 코드 저장소 (실제로는 Redis 또는 다른 데이터베이스를 사용해야 함)
// key: 전화번호, value: {code: 인증코드, expires: 만료시간}
interface VerificationData {
  code: string;
  expiresAt: Date;
}

export async function setVerificationCode(phone: string, code: string, expiresAt: Date): Promise<void> {
  if (!firestore) {
    console.error('Firestore is not initialized');
    return;
  }

  try {
    await firestore.collection('verifications').doc(phone).set({
      code,
      expiresAt: firestore.Timestamp.fromDate(expiresAt),
      createdAt: firestore.Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error saving verification code:', error);
    throw error;
  }
}

export async function getVerificationCode(phone: string): Promise<VerificationData | undefined> {
  if (!firestore) {
    console.error('Firestore is not initialized');
    return undefined;
  }

  try {
    const doc = await firestore.collection('verifications').doc(phone).get();
    if (!doc.exists) {
      return undefined;
    }

    const data = doc.data();
    if (!data) {
      return undefined;
    }

    return {
      code: data.code,
      expiresAt: data.expiresAt.toDate()
    };
  } catch (error) {
    console.error('Error getting verification code:', error);
    return undefined;
  }
}

export async function deleteVerificationCode(phone: string): Promise<boolean> {
  if (!firestore) {
    console.error('Firestore is not initialized');
    return false;
  }

  try {
    await firestore.collection('verifications').doc(phone).delete();
    return true;
  } catch (error) {
    console.error('Error deleting verification code:', error);
    return false;
  }
} 