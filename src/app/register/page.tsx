'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

interface FormValues {
  name: string;
  phone: string;
  code: string;
}

// 전화번호 형식 정규화
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>();
  const router = useRouter();
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendError, setSendError] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  const onSendCode = async (data: FormValues) => {
    setSending(true);
    setSendError('');
    
    try {
      // 전화번호 정규화
      const normalizedPhone = normalizePhoneNumber(data.phone);
      console.log('인증번호 요청:', { 
        original: data.phone, 
        normalized: normalizedPhone,
        timestamp: new Date().toISOString()
      });

      // 프로덕션 모드에서는 실제 API 호출
      const smsRes = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      
      // 응답 파싱 시도
      let smsData;
      try {
        smsData = await smsRes.json();
        console.log('인증번호 요청 응답:', smsData);
      } catch (parseError) {
        console.error('API 응답 파싱 오류:', parseError);
        throw new Error('서버 응답 처리 중 오류가 발생했습니다.');
      }
      
      if (!smsData.success) {
        throw new Error(smsData.message || '인증번호 발송에 실패했습니다.');
      }
      
      // 개발 환경에서 인증번호가 응답에 포함된 경우 자동으로 입력
      if (smsData.code) {
        setDevCode(smsData.code);
        setValue('code', smsData.code);
      }
      
      // 로컬 스토리지에 이름과 전화번호 저장 (다음 단계를 위해)
      if (typeof window !== 'undefined') {
        localStorage.setItem('registerName', data.name);
        localStorage.setItem('registerPhone', normalizedPhone);
      }
      
      setCodeSent(true);
    } catch (error) {
      console.error('인증번호 요청 오류:', error);
      setSendError(error instanceof Error ? error.message : '오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  };

  const onVerify = async (data: FormValues) => {
    setVerifying(true);
    setVerifyError('');
    
    try {
      // 전화번호 정규화
      const normalizedPhone = normalizePhoneNumber(data.phone);
      console.log('인증번호 확인:', { 
        original: data.phone, 
        normalized: normalizedPhone,
        code: data.code,
        timestamp: new Date().toISOString()
      });

      const res = await fetch('/api/auth/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: normalizedPhone, 
          code: data.code 
        }),
      });
      
      // 응답 파싱 시도
      let json;
      try {
        json = await res.json();
        console.log('인증번호 확인 응답:', json);
      } catch (parseError) {
        console.error('API 응답 파싱 오류:', parseError);
        throw new Error('서버 응답 처리 중 오류가 발생했습니다.');
      }
      
      if (!res.ok) {
        throw new Error(json.message || '인증 확인 중 오류가 발생했습니다.');
      }
      
      if (json.verified) {
        // 인증 성공 시 기본정보 페이지로 이동
        router.push('/register/basic-info');
      } else {
        setVerifyError(json.message || '인증번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('인증 확인 오류:', error);
      setVerifyError(error instanceof Error ? error.message : '오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-white flex flex-col">
      {/* 상단 상태바는 생략 (모바일 브라우저에서 자동 표시됨) */}
      
      {/* 타이틀 */}
      <div className="w-full px-5 py-8 bg-white flex flex-col justify-start items-start gap-5 overflow-hidden">
        <div className="self-stretch text-center justify-end text-neutral-800 text-xl font-bold leading-7">
          더나일의 양육불안 검사를<br/>소개합니다
        </div>
        <div className="self-stretch text-center text-neutral-600 text-[15px] leading-6 mt-3">
          자녀를 양육하면서 느끼는 정서, 능력, 관계에 대한 양육불안과 우울감을 통합적으로 측정합니다. 낮은 양육불안은 양육에 대한 자신감이 높으며, 자녀와 관계를 맺고 정서를 다루는 것에 대한 안정감이 있음을 의미할 수 있지요.
        </div>
      </div>
      
      <form onSubmit={handleSubmit(codeSent ? onVerify : onSendCode)}>
        {/* 이름 입력 필드 */}
        <div className="w-full p-5 bg-white flex flex-col justify-start items-start gap-3 overflow-hidden">
          <div className="self-stretch justify-start">
            <span className="text-neutral-800 text-lg font-bold leading-relaxed">이름을 알려주세요</span>
            <span className="text-red-500 text-lg font-bold leading-relaxed">*</span>
          </div>
          <div className="w-full flex flex-col justify-start items-start gap-1">
            <input
              type="text"
              {...register('name', { required: true })}
              className="w-full h-12 px-4 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200"
              placeholder=""
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">이름을 입력해주세요</p>
            )}
          </div>
        </div>
        
        {/* 휴대폰 번호 입력 필드 */}
        <div className="w-full p-5 bg-white flex flex-col justify-start items-start gap-3 overflow-hidden">
          <div className="self-stretch justify-start">
            <span className="text-neutral-800 text-lg font-bold leading-relaxed">휴대폰 번호를 알려주세요</span>
            <span className="text-red-500 text-lg font-bold leading-relaxed">*</span>
          </div>
          <div className="w-full flex flex-col justify-start items-start gap-1">
            <input
              type="tel"
              {...register('phone', { required: true })}
              className="w-full h-12 px-4 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200"
              placeholder="01012345678"
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">휴대폰 번호를 입력해주세요</p>
            )}
          </div>
        </div>
        
        {/* 인증번호 입력 필드 (조건부 렌더링) */}
        {codeSent && (
          <div className="w-full p-5 bg-white flex flex-col justify-start items-start gap-3 overflow-hidden">
            <div className="self-stretch justify-start">
              <span className="text-neutral-800 text-lg font-bold leading-relaxed">인증번호 입력</span>
              <span className="text-red-500 text-lg font-bold leading-relaxed">*</span>
            </div>
            <div className="w-full flex flex-col justify-start items-start gap-1">
              <input
                type="text"
                {...register('code', { required: true })}
                className="w-full h-12 px-4 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200"
                placeholder="6자리 코드"
              />
              {devCode && (
                <p className="text-green-600 text-sm mt-1">개발 모드: 인증번호 {devCode}이 자동입력되었습니다</p>
              )}
              {errors.code && (
                <p className="text-red-600 text-sm mt-1">인증번호를 입력해주세요</p>
              )}
            </div>
          </div>
        )}
        
        {/* 버튼 */}
        <div className="w-full h-28 px-5 flex flex-col justify-start items-center gap-5 mt-4">
          {!codeSent ? (
            <>
              <button
                type="submit"
                disabled={sending}
                className="w-full px-4 py-4 bg-sky-500 rounded-2xl inline-flex justify-center items-center gap-2 disabled:opacity-50 text-white text-lg font-semibold"
              >
                {sending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    요청중...
                  </span>
                ) : '인증번호 요청'}
              </button>
              {sendError && (
                <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <p className="font-medium">요청 오류</p>
                  <p>{sendError}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <button
                type="submit"
                disabled={verifying}
                className="w-full px-4 py-4 bg-green-600 rounded-2xl inline-flex justify-center items-center gap-2 disabled:opacity-50 text-white text-lg font-semibold"
              >
                {verifying ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    확인중...
                  </span>
                ) : '인증번호 확인'}
              </button>
              {verifyError && (
                <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <p className="font-medium">인증 오류</p>
                  <p>{verifyError}</p>
                </div>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
} 