import { NextResponse } from 'next/server';
import { SolapiMessageService } from 'solapi';
import { setVerificationCode } from '@/lib/verificationStore';

// 6자리 랜덤 인증번호 생성
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 전화번호 형식 정규화
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export async function POST(request: Request) {
  try {
    // 요청 데이터 파싱 및 유효성 검사
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      console.error('요청 데이터 파싱 실패:', error);
      return NextResponse.json(
        { success: false, message: '잘못된 요청 형식입니다.' },
        { status: 400 }
      );
    }

    const { phoneNumber } = requestData;

    // 전화번호 유효성 검사
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      console.error('전화번호 누락 또는 잘못된 형식:', { phoneNumber });
      return NextResponse.json(
        { success: false, message: '유효한 전화번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // 전화번호 정규화
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log('전화번호 정규화:', { original: phoneNumber, normalized: normalizedPhone });

    // 인증번호 생성 및 저장
    const verificationCode = generateVerificationCode();
    const message = `[더나일] 인증번호는 [${verificationCode}] 입니다.`;
    
    // 인증 코드 저장 (5분 유효)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    console.log('인증번호 저장 시도:', {
      phone: normalizedPhone,
      code: verificationCode,
      expiresAt: expiresAt.toISOString()
    });
    
    await setVerificationCode(normalizedPhone, verificationCode, expiresAt);
    
    // 환경 변수 확인
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    const senderNumber = process.env.SOLAPI_SENDER_NUMBER;
    
    if (!apiKey || !apiSecret || !senderNumber) {
      console.error('Solapi 설정이 완료되지 않았습니다.', {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasSenderNumber: !!senderNumber
      });
      return NextResponse.json(
        { success: false, message: 'SMS 서비스 구성이 완료되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    // Solapi 메시지 서비스 초기화
    const messageService = new SolapiMessageService(apiKey, apiSecret);
    
    // SMS 메시지 발송
    console.log('SMS 발송 시도:', {
      to: normalizedPhone,
      from: senderNumber,
      messageLength: message.length
    });
    
    const result = await messageService.sendOne({
      to: normalizedPhone,
      from: senderNumber,
      text: message
    });
    
    // 메시지 발송 결과 확인
    if (result && result.statusCode === '2000') {
      console.log('SMS 발송 성공:', {
        messageId: result.messageId,
        statusCode: result.statusCode,
        phone: normalizedPhone
      });
      return NextResponse.json({
        success: true,
        message: '인증번호가 발송되었습니다.'
      });
    } else {
      console.error('SMS 발송 실패:', {
        result,
        statusCode: result?.statusCode,
        messageId: result?.messageId,
        phone: normalizedPhone
      });
      return NextResponse.json(
        { 
          success: false, 
          message: '인증번호 발송에 실패했습니다.',
          error: `상태 코드: ${result?.statusCode || '알 수 없음'}`
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('SMS 발송 중 오류 발생:', {
      error,
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        success: false, 
        message: '인증번호 발송 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
} 