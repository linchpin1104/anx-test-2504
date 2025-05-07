// 인증 코드 저장소 (실제로는 Redis 또는 다른 데이터베이스를 사용해야 함)
// key: 전화번호, value: {code: 인증코드, expires: 만료시간}
interface VerificationData {
  code: string;
  expiresAt: Date;
}

const verificationCodes = new Map<string, VerificationData>();

export function setVerificationCode(phone: string, code: string, expiresAt: Date): void {
  verificationCodes.set(phone, { code, expiresAt });
}

export function getVerificationCode(phone: string): VerificationData | undefined {
  return verificationCodes.get(phone);
}

export function deleteVerificationCode(phone: string): boolean {
  return verificationCodes.delete(phone);
} 