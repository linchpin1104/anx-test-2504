import { NextRequest, NextResponse } from 'next/server';
import { getVerificationCode, deleteVerificationCode, incrementAttempts } from '@/lib/verificationStore';

// 참조: send-sms 라우트와 동일한 인증 코드 저장소 사용
// 이 구현은 서버 재시작 시 코드가 초기화되므로 실제로는 공유 저장소(Redis 등)를 사용해야 함
// 이 예시에서는 API 경로가 다른 인스턴스에서 실행될 수 있으므로 외부에서 저장소를 임포트하는 것이 좋음

// 전화번호 형식 정규화 - 이제 +로 시작하는 국제번호 형식 유지
function normalizePhoneNumber(phone: string): string {
  if (phone.startsWith('+')) {
    // 국제 전화번호 형식 (+로 시작)
    // + 이후의 숫자만 유지, 다른 특수문자 제거
    return '+' + phone.substring(1).replace(/[^0-9]/g, '');
  } else {
    // 국내 전화번호 형식이거나 이미 국가코드가 없는 경우
    return phone.replace(/[^0-9]/g, '');
  }
}

export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 전화번호와 코드 추출
    const { phone, code } = await request.json();
    
    // 필수 값 확인
    if (!phone || !code) {
      return NextResponse.json(
        { success: false, verified: false, message: '전화번호와 인증번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // 전화번호 정규화
    const normalizedPhone = normalizePhoneNumber(phone);
    console.log('전화번호 정규화:', { original: phone, normalized: normalizedPhone });
    
    // 인증 시도 횟수 증가
    const canAttempt = await incrementAttempts(normalizedPhone);
    if (!canAttempt) {
      return NextResponse.json({ 
        success: false, 
        verified: false, 
        message: '인증번호가 발급되지 않았습니다. 먼저 인증번호를 요청해주세요.' 
      });
    }
    
    // 인증 코드 확인
    const verification = await getVerificationCode(normalizedPhone);
    
    // 인증 코드가 없거나 만료된 경우
    if (!verification) {
      console.log('인증번호 없음 또는 만료:', {
        phone: normalizedPhone,
        receivedCode: code,
        currentTime: new Date().toISOString()
      });
      return NextResponse.json({ 
        success: false, 
        verified: false, 
        message: '인증번호가 발급되지 않았거나 만료되었습니다. 다시 요청해주세요.' 
      });
    }
    
    // 현재 시간 확인 (UTC 기준)
    const now = new Date();
    
    // 만료 확인
    if (now > verification.expiresAt) {
      console.log('인증번호 만료:', {
        phone: normalizedPhone,
        receivedCode: code,
        expectedCode: verification.code,
        expiresAt: verification.expiresAt.toISOString(),
        currentTime: now.toISOString(),
        timeDiff: now.getTime() - verification.expiresAt.getTime()
      });
      // 만료된 코드 삭제
      await deleteVerificationCode(normalizedPhone);
      return NextResponse.json({ 
        success: false, 
        verified: false, 
        message: '인증번호가 만료되었습니다. 다시 요청해주세요.' 
      });
    }
    
    // 코드 일치 여부 확인
    // 개발 환경에서는 "0000"도 항상 허용
    if (process.env.NODE_ENV === 'development' && code === "0000") {
      console.log('개발 환경에서 테스트 코드 "0000" 허용:', {
        phone: normalizedPhone,
        receivedCode: code,
        isDev: true
      });
      
      // 기존 코드가 있다면 삭제
      await deleteVerificationCode(normalizedPhone);
      
      // 성공 응답 반환
      return NextResponse.json({
        success: true,
        verified: true,
        message: '인증이 완료되었습니다. (개발 환경)'
      });
    }
    
    if (verification.code !== code) {
      console.log('인증번호 불일치:', {
        phone: normalizedPhone,
        receivedCode: code,
        expectedCode: verification.code,
        expiresAt: verification.expiresAt.toISOString(),
        currentTime: now.toISOString(),
        isExpired: now > verification.expiresAt,
        attempts: verification.attempts
      });
      return NextResponse.json({ 
        success: false, 
        verified: false, 
        message: '인증번호가 일치하지 않습니다.' 
      });
    }
    
    // 검증 성공 - 사용된 인증 코드 삭제
    await deleteVerificationCode(normalizedPhone);
    
    // 성공 응답 반환
    return NextResponse.json({
      success: true,
      verified: true,
      message: '인증이 완료되었습니다.'
    });
    
  } catch (error) {
    console.error('인증 검증 오류:', error);
    return NextResponse.json(
      { success: false, verified: false, message: '인증 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 