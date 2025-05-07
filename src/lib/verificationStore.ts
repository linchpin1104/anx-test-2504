import { firestore } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

// 인증 코드 저장소 (실제로는 Redis 또는 다른 데이터베이스를 사용해야 함)
// key: 전화번호, value: {code: 인증코드, expires: 만료시간}
interface VerificationData {
  code: string;
  expiresAt: Date;
  attempts?: number;
}

// 최대 인증 시도 횟수
const MAX_ATTEMPTS = 5;

export async function setVerificationCode(phone: string, code: string, expiresAt: Date): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  try {
    const data = {
      code,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.fromDate(new Date()),
      attempts: 0
    };
    
    console.log('인증번호 저장:', {
      phone,
      code,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    });
    
    await firestore.collection('verifications').doc(phone).set(data);
  } catch (error) {
    console.error('Error saving verification code:', error);
    throw new Error('인증번호 저장 중 오류가 발생했습니다.');
  }
}

export async function getVerificationCode(phone: string): Promise<VerificationData | undefined> {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  try {
    const doc = await firestore.collection('verifications').doc(phone).get();
    if (!doc.exists) {
      console.log('인증번호 없음:', { phone });
      return undefined;
    }

    const data = doc.data();
    if (!data) {
      console.log('인증번호 데이터 없음:', { phone });
      return undefined;
    }

    // 타임스탬프를 Date 객체로 변환 (UTC 기준)
    const expiresAt = data.expiresAt instanceof Timestamp 
      ? new Date(data.expiresAt.toDate().getTime())
      : new Date(data.expiresAt.seconds * 1000);

    const verificationData = {
      code: data.code,
      expiresAt,
      attempts: data.attempts || 0
    };

    console.log('인증번호 조회:', {
      phone,
      code: verificationData.code,
      expiresAt: verificationData.expiresAt.toISOString(),
      currentTime: new Date().toISOString(),
      isExpired: new Date() > expiresAt,
      attempts: verificationData.attempts
    });

    return verificationData;
  } catch (error) {
    console.error('Error getting verification code:', error);
    throw new Error('인증번호 조회 중 오류가 발생했습니다.');
  }
}

export async function incrementAttempts(phone: string): Promise<boolean> {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  try {
    const docRef = firestore.collection('verifications').doc(phone);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return false;
    }

    const data = doc.data();
    const currentAttempts = (data?.attempts || 0) + 1;

    if (currentAttempts >= MAX_ATTEMPTS) {
      // 최대 시도 횟수 초과 시 인증 코드 삭제
      await deleteVerificationCode(phone);
      return false;
    }

    await docRef.update({ attempts: currentAttempts });
    return true;
  } catch (error) {
    console.error('Error incrementing attempts:', error);
    throw new Error('인증 시도 횟수 업데이트 중 오류가 발생했습니다.');
  }
}

export async function deleteVerificationCode(phone: string): Promise<boolean> {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  try {
    console.log('인증번호 삭제:', { phone });
    await firestore.collection('verifications').doc(phone).delete();
    return true;
  } catch (error) {
    console.error('Error deleting verification code:', error);
    throw new Error('인증번호 삭제 중 오류가 발생했습니다.');
  }
} 