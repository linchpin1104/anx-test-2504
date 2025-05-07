import { NextResponse } from 'next/server';
import { setVerificationCode } from '@/lib/verificationStore';
import crypto from 'crypto';

// 전화번호 형식 정규화
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// HMAC-SHA256 서명 생성
function generateSignature(apiSecret: string, date: string, salt: string): string {
  const message = `date=${date}\nsalt=${salt}`;
  return crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('base64');
}

// SMS 메시지 타입 정의
interface Message {
  to: string;
  from: string;
  text: string;
}

export async function POST(request: Request) {
  try {
    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
      console.log('요청 본문:', body);
    } catch (parseError) {
      console.error('요청 본문 파싱 오류:', parseError);
      return NextResponse.json(
        { success: false, message: '잘못된 요청 형식입니다.' },
        { status: 400 }
      );
    }

    const { phoneNumber } = body;
    
    // 필수 값 확인
    if (!phoneNumber) {
      console.error('전화번호 누락:', body);
      return NextResponse.json(
        { success: false, message: '전화번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // 전화번호 정규화
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log('전화번호 정규화:', { 
      original: phoneNumber, 
      normalized: normalizedPhone,
      timestamp: new Date().toISOString()
    });

    // 전화번호 유효성 검사
    if (!/^01[0-9]{8,9}$/.test(normalizedPhone)) {
      console.error('유효하지 않은 전화번호:', normalizedPhone);
      return NextResponse.json(
        { success: false, message: '유효하지 않은 전화번호입니다.' },
        { status: 400 }
      );
    }

    // 환경 변수 확인
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    const senderNumber = process.env.SOLAPI_SENDER_NUMBER;

    if (!apiKey || !apiSecret || !senderNumber) {
      console.error('SMS 서비스 설정 누락:', {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasSenderNumber: !!senderNumber,
        env: process.env.NODE_ENV
      });
      return NextResponse.json(
        { success: false, message: 'SMS 서비스 설정이 누락되었습니다.' },
        { status: 500 }
      );
    }

    // 6자리 랜덤 인증 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('인증번호 생성:', {
      phone: normalizedPhone,
      code,
      timestamp: new Date().toISOString()
    });

    try {
      // 인증 코드 저장 (3분 후 만료)
      const expiresAt = new Date(Date.now() + 3 * 60 * 1000);
      await setVerificationCode(normalizedPhone, code, expiresAt);
      console.log('인증번호 저장 완료:', {
        phone: normalizedPhone,
        code,
        expiresAt: expiresAt.toISOString()
      });
    } catch (storeError) {
      console.error('인증번호 저장 오류:', storeError);
      return NextResponse.json(
        { success: false, message: '인증번호 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // SMS 발송
    const message: Message = {
      to: normalizedPhone,
      from: senderNumber,
      text: `[더나일] 인증번호는 [${code}] 입니다.`
    };

    console.log('SMS 발송 시도:', {
      phone: normalizedPhone,
      code,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    });

    // 개발 환경에서는 실제 SMS 발송을 건너뛰고 성공 응답
    if (process.env.NODE_ENV === 'development') {
      console.log('개발 환경: SMS 발송 건너뜀');
      return NextResponse.json({
        success: true,
        message: '인증번호가 발송되었습니다.',
        code // 개발 환경에서만 코드 반환
      });
    }

    try {
      // 프로덕션 환경에서는 실제 SMS 발송
      const date = new Date().toISOString();
      const salt = Math.random().toString(36).substring(7);
      const signature = generateSignature(apiSecret, date, salt);

      const requestBody = {
        message: {
          to: normalizedPhone,
          from: senderNumber,
          text: `[더나일] 인증번호는 [${code}] 입니다.`
        }
      };

      console.log('SMS API 요청 준비:', {
        url: 'https://api.solapi.com/messages/v4/send',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
        },
        body: requestBody
      });

      const response = await fetch('https://api.solapi.com/messages/v4/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('SMS 발송 결과:', {
        phone: normalizedPhone,
        code,
        result,
        timestamp: new Date().toISOString()
      });

      if (result.status === 'success') {
        return NextResponse.json({
          success: true,
          message: '인증번호가 발송되었습니다.'
        });
      } else {
        throw new Error(result.errorMessage || 'SMS 발송에 실패했습니다.');
      }
    } catch (smsError) {
      console.error('SMS 발송 오류:', {
        error: smsError instanceof Error ? smsError.message : '알 수 없는 오류',
        stack: smsError instanceof Error ? smsError.stack : undefined,
        phone: normalizedPhone,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { success: false, message: 'SMS 발송 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('예상치 못한 오류:', {
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { success: false, message: '인증번호 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 