'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

interface FormValues {
  name: string;
  countryCode: string;
  phone: string;
  code: string;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
}

// 전화번호 형식 정규화
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// 주요 국가 코드 리스트
const countryCodes = [
  { code: '+82', country: '🇰🇷 한국' },
  { code: '+1', country: '🇺🇸 미국/캐나다' },
  { code: '+81', country: '🇯🇵 일본' },
  { code: '+86', country: '🇨🇳 중국' },
  { code: '+44', country: '🇬🇧 영국' },
  { code: '+61', country: '🇦🇺 호주' },
  { code: '+33', country: '🇫🇷 프랑스' },
  { code: '+49', country: '🇩🇪 독일' },
  { code: '+65', country: '🇸🇬 싱가포르' },
  { code: '+91', country: '🇮🇳 인도' },
];

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      countryCode: '+82', // 기본값으로 한국 국가코드 설정
      privacyAgreed: false,
      marketingAgreed: false
    }
  });
  const router = useRouter();
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendError, setSendError] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  // 현재 선택된 국가코드 감시
  const selectedCountryCode = watch('countryCode');

  // 현재 체크박스 값 감시
  const privacyAgreed = watch('privacyAgreed');
  const marketingAgreed = watch('marketingAgreed');

  const onSendCode = async (data: FormValues) => {
    setSending(true);
    setSendError('');
    
    try {
      // 전화번호 정규화
      const normalizedPhone = normalizePhoneNumber(data.phone);
      // 국가코드와 전화번호 결합
      const fullPhoneNumber = `${data.countryCode}${normalizedPhone}`;
      
      console.log('인증번호 요청:', { 
        countryCode: data.countryCode,
        original: data.phone, 
        normalized: normalizedPhone,
        fullPhoneNumber,
        timestamp: new Date().toISOString()
      });

      // 프로덕션 모드에서는 실제 API 호출
      const smsRes = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhoneNumber }),
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
      
      if (!smsRes.ok) {
        throw new Error(smsData.message || '인증번호 발송에 실패했습니다.');
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
        localStorage.setItem('registerPhone', fullPhoneNumber);
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
      // 개인정보 동의 여부 확인
      if (!data.privacyAgreed) {
        setVerifyError('개인정보 수집 및 활용에 동의해주세요.');
        setVerifying(false);
        return;
      }
      
      // 전화번호 정규화
      const normalizedPhone = normalizePhoneNumber(data.phone);
      // 국가코드와 전화번호 결합
      const fullPhoneNumber = `${data.countryCode}${normalizedPhone}`;
      
      console.log('인증번호 확인:', { 
        countryCode: data.countryCode,
        original: data.phone, 
        normalized: normalizedPhone,
        fullPhoneNumber,
        code: data.code,
        privacyAgreed: data.privacyAgreed,
        marketingAgreed: data.marketingAgreed,
        timestamp: new Date().toISOString()
      });

      const res = await fetch('/api/auth/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: fullPhoneNumber, 
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
        // 사용자 정보 저장
        if (typeof window !== 'undefined') {
          // 사용자 정보를 localStorage에 저장
          const userInfo = {
            name: data.name,
            phone: fullPhoneNumber,
            privacyAgreed: data.privacyAgreed,
            marketingAgreed: data.marketingAgreed
          };
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
          
          // 이미 검사 결과가 있는지 확인
          try {
            console.log('기존 검사 결과 확인 시작:', fullPhoneNumber);
            // 개발 환경에서 로컬 스토리지에서 이력 가져오기
            if (process.env.NODE_ENV === 'development') {
              const historyJson = localStorage.getItem('surveyResultHistory') || '[]';
              console.log('로컬 이력 데이터:', historyJson);
              
              if (historyJson && JSON.parse(historyJson).length > 0) {
                console.log('기존 검사 이력 있음! 바로 설문조사 페이지로 이동');
                // 기존 결과가 있으면 설문조사 페이지로 바로 이동
                router.push('/survey');
                return;
              } else {
                console.log('검사 이력 없음, 기본 정보 입력 페이지로 이동 예정');
              }
            } else {
              // 프로덕션에서는 API 호출로 확인
              console.log('프로덕션 환경 - API로 검사 이력 확인 시도');
              const checkHistoryRes = await fetch(`/api/result/user-history?userId=${encodeURIComponent(fullPhoneNumber)}`);
              const historyData = await checkHistoryRes.json();
              console.log('API 이력 응답:', historyData);
              
              if (historyData.success && historyData.results && historyData.results.length > 0) {
                console.log('API에서 검사 이력 확인됨, 설문조사 페이지로 이동');
                // 기존 결과가 있으면 설문조사 페이지로 바로 이동
                router.push('/survey');
                return;
              } else {
                console.log('API에서 검사 이력 없음, 기본 정보 입력 페이지로 이동 예정');
              }
            }
          } catch (historyError) {
            console.error('이력 확인 오류:', historyError);
            // 오류가 발생해도 기본 흐름으로 진행
          }
        }
        
        // 기존 이력이 없는 경우 기본 정보 입력 페이지로 이동
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
        <div className="self-stretch text-center text-neutral-600 text-[15px] leading-6 mt-3 flex flex-col">
          <span className="font-bold">본 검사는 사단법인 더나일에서 양육불안 해소를 위해 배포하는 무료 검사로, 자녀 양육시 느끼는 정서, 능력, 관계에 대한 양육불안과 우울감을 통합적으로 측정합니다.</span>
          <span className="mt-4">낮은 양육불안은 양육에 대한 건강한 자신감과, 자녀와의 관계 및 정서에 대한 안정감이 있음을 의미합니다.</span>
          <span className="mt-4">검사 후 더나일에서 필요한 지원을 받으시거나 페이서로 후원하여 다른 가족의 어려움을 도울수 있습니다.</span>
          <span className="mt-4 font-bold">더나일은 가족의 행복에 집중합니다.</span>
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
              className="w-full h-12 px-4 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200 text-black"
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
            <div className="w-full flex gap-2">
              {/* 국가 코드 선택 드롭다운 */}
              <select
                {...register('countryCode', { required: true })}
                className="h-12 px-2 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200 text-black"
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.country}
                  </option>
                ))}
              </select>
              
              {/* 전화번호 입력 필드 */}
              <input
                type="tel"
                {...register('phone', { required: true })}
                className="flex-1 h-12 px-4 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200 text-black"
                placeholder={selectedCountryCode === '+82' ? "01012345678" : "Phone number"}
              />
            </div>
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">휴대폰 번호를 입력해주세요</p>
            )}
            <p className="text-zinc-500 text-xs mt-1">
              {selectedCountryCode === '+82' ? '"-" 없이 번호만 입력해주세요' : 'Enter number without special characters'}
            </p>
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
                className="w-full h-12 px-4 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200 text-black"
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
        
        {/* 개인정보 수집 및 마케팅 수신 동의 (인증번호 입력 후 표시) */}
        {codeSent && (
          <div className="w-full px-5 bg-white flex flex-col justify-start items-start gap-3 overflow-hidden">
            <div className="w-full flex flex-col space-y-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
              {/* 개인정보 수집 및 활용 동의 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="privacyAgreed"
                  {...register('privacyAgreed', { required: true })}
                  className="h-4 w-4 text-sky-500 focus:ring-sky-400 border-gray-300 rounded"
                />
                <label htmlFor="privacyAgreed" className="ml-2 text-sm font-medium text-gray-900 flex items-center">
                  <span>개인정보 수집 및 활용에 동의합니다</span>
                  <span className="text-red-500 text-sm ml-1">*</span>
                </label>
              </div>
              {errors.privacyAgreed && (
                <p className="text-red-600 text-xs">개인정보 수집 및 활용에 동의해주세요</p>
              )}

              {/* 마케팅 수신 동의 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="marketingAgreed"
                  {...register('marketingAgreed')}
                  className="h-4 w-4 text-sky-500 focus:ring-sky-400 border-gray-300 rounded"
                />
                <label htmlFor="marketingAgreed" className="ml-2 text-sm font-medium text-gray-900">
                  마케팅 정보 수신에 동의합니다 (선택)
                </label>
              </div>
              
              <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded">
                수집된 개인정보는 서비스 제공 및 개선, 새로운 서비스 안내, 이벤트 정보 제공 등을 위해 활용됩니다. 
                개인정보는 회원 탈퇴 시 즉시 파기됩니다.
              </div>
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
                ) : '입장하기'}
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