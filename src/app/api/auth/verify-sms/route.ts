import { NextResponse } from 'next/server';
import { getVerificationCode, deleteVerificationCode } from '@/lib/verificationStore';

// 참조: send-sms 라우트와 동일한 인증 코드 저장소 사용
// 이 구현은 서버 재시작 시 코드가 초기화되므로 실제로는 공유 저장소(Redis 등)를 사용해야 함
// 이 예시에서는 API 경로가 다른 인스턴스에서 실행될 수 있으므로 외부에서 저장소를 임포트하는 것이 좋음

export async function POST(request: Request) {
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
    
    // 인증 코드 확인
    const verification = await getVerificationCode(phone);
    
    // 인증 코드가 없거나 만료된 경우
    if (!verification) {
      return NextResponse.json({ 
        success: false, 
        verified: false, 
        message: '인증번호가 발급되지 않았거나 만료되었습니다. 다시 요청해주세요.' 
      });
    }
    
    // 현재 시간 확인
    const now = new Date();
    
    // 만료 확인
    if (now > verification.expiresAt) {
      // 만료된 코드 삭제
      await deleteVerificationCode(phone);
      return NextResponse.json({ 
        success: false, 
        verified: false, 
        message: '인증번호가 만료되었습니다. 다시 요청해주세요.' 
      });
    }
    
    // 코드 일치 여부 확인
    if (verification.code !== code) {
      console.log('인증번호 불일치:', {
        received: code,
        expected: verification.code
      });
      return NextResponse.json({ 
        success: false, 
        verified: false, 
        message: '인증번호가 일치하지 않습니다.' 
      });
    }
    
    // 검증 성공 - 사용된 인증 코드 삭제
    await deleteVerificationCode(phone);
    
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