'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import ErrorMessage from '../../components/ErrorMessage';
import { 
  ErrorType, 
  handleError, 
  safeGetItem, 
  safeSetItem, 
  getUserFriendlyErrorMessage 
} from '../../utils/errorHandler';

interface FormValues {
  caregiverType: string;
  parentAgeGroup: string;
  childAge: string;
  childGender: string;
  region: string;
}

export default function BasicInfoPage() {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ type?: ErrorType; message: string } | null>(null);

  // 선택된 값들 관찰
  const caregiverType = watch('caregiverType');
  const parentAgeGroup = watch('parentAgeGroup');
  const childGender = watch('childGender');

  useEffect(() => {
    // 로컬 스토리지에서 이름과 전화번호 불러오기
    try {
      const name = safeGetItem('registerName');
      const phone = safeGetItem('registerPhone');
      
      if (!name || !phone) {
        // 이름이나 전화번호가 없으면 첫 단계로 리다이렉트
        router.replace('/register');
        return;
      }
    } catch (err) {
      const appError = handleError(err);
      setError({
        type: appError.type,
        message: '사용자 정보를 가져오는데 실패했습니다. 다시 시도해주세요.'
      });
      
      // 3초 후 로그인 페이지로 리다이렉트
      setTimeout(() => {
        router.replace('/register');
      }, 3000);
    }
  }, [router]);

  const onSubmit = async (data: FormValues) => {
    console.log('폼 제출 시작', data);
    setSaving(true);
    setError(null);
    
    try {
      // 로컬 스토리지에 모든 정보 저장
      console.log('로컬 스토리지에 정보 저장 시작');
      
      // 모든 저장 작업을 Promise로 래핑하여 한번에 처리
      const storagePromises = [
        safeSetItem('childAge', data.childAge),
        safeSetItem('childGender', data.childGender),
        safeSetItem('parentAgeGroup', data.parentAgeGroup),
        safeSetItem('caregiverType', data.caregiverType),
        safeSetItem('region', data.region)
      ];
      
      // 모든 저장 작업이 성공했는지 확인
      const storageResults = await Promise.all(storagePromises);
      
      if (storageResults.some(result => !result)) {
        throw new Error('일부 정보를 저장하는데 실패했습니다.');
      }
      
      console.log('로컬 스토리지에 정보 저장 완료');
      
      // 사용자 기본 정보 가져오기
      const name = safeGetItem('registerName');
      const phone = safeGetItem('registerPhone');
      
      // 마케팅 수신 동의 정보 가져오기
      let marketingAgreed = false;
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          marketingAgreed = userInfo.marketingAgreed || false;
        }
      } catch (e) {
        console.error('마케팅 수신 동의 정보 가져오기 실패:', e);
      }
      
      // API로 서버에 데이터 저장
      const res = await fetch('/api/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          childAge: data.childAge,
          childGender: data.childGender,
          parentAgeGroup: data.parentAgeGroup,
          caregiverType: data.caregiverType,
          marketingAgreed
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '서버 오류가 발생했습니다.');
      }
      
      // 페이지 이동
      console.log('다음 페이지로 이동 시작');
      router.push('/survey');
      
    } catch (err) {
      console.error('오류 발생:', err);
      const appError = handleError(err);
      setError({
        type: appError.type,
        message: getUserFriendlyErrorMessage(err)
      });
    } finally {
      setSaving(false);
    }
  };

  // 칩 버튼 클릭 핸들러
  const handleChipClick = (field: keyof FormValues, value: string) => {
    setValue(field, value);
  };

  // 폼 재시도 핸들러
  const handleRetry = () => {
    setError(null);
  };

  return (
    <div className="bg-white flex flex-col">
      {/* 타이틀 */}
      <div className="w-full px-5 py-8 bg-white flex flex-col justify-start items-start gap-5 overflow-hidden">
        <div className="self-stretch text-center justify-end text-neutral-800 text-xl font-bold leading-7">
          검사자의 기본정보를<br/>알려주세요
        </div>
      </div>
      
      {/* 에러 메시지 표시 */}
      {error && (
        <div className="px-5">
          <ErrorMessage 
            type={error.type}
            message={error.message}
            onRetry={handleRetry}
          />
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 양육자 정보 */}
        <div className="w-full p-5 bg-white flex flex-col justify-start items-start gap-3 overflow-hidden">
          <div className="self-stretch justify-start">
            <span className="text-neutral-800 text-lg font-bold leading-relaxed">양육자 정보</span>
            <span className="text-red-500 text-lg font-bold leading-relaxed">*</span>
          </div>
          <div className="self-stretch inline-flex justify-start items-start gap-2">
            <button
              type="button"
              onClick={() => handleChipClick('caregiverType', 'mother')}
              className={`flex-1 h-12 px-4 py-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-100 flex justify-center items-center gap-1.5 ${caregiverType === 'mother' ? 'bg-sky-500 text-white' : 'bg-white text-zinc-600'}`}
            >
              <span className="text-center text-base font-medium leading-none">엄마</span>
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('caregiverType', 'father')}
              className={`flex-1 h-12 px-4 py-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-100 flex justify-center items-center gap-1.5 ${caregiverType === 'father' ? 'bg-sky-500 text-white' : 'bg-white text-zinc-600'}`}
            >
              <span className="text-center text-base font-medium leading-none">아빠</span>
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('caregiverType', 'grandparent')}
              className={`flex-1 h-12 px-4 py-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-100 flex justify-center items-center gap-1.5 ${caregiverType === 'grandparent' ? 'bg-sky-500 text-white' : 'bg-white text-zinc-600'}`}
            >
              <span className="text-center text-base font-medium leading-none">조부모</span>
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('caregiverType', 'other')}
              className={`flex-1 h-12 px-4 py-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-100 flex justify-center items-center gap-1.5 ${caregiverType === 'other' ? 'bg-sky-500 text-white' : 'bg-white text-zinc-600'}`}
            >
              <span className="text-center text-base font-medium leading-none">기타</span>
            </button>
            <input {...register('caregiverType', { required: true })} type="hidden" />
          </div>
          {errors.caregiverType && (
            <p className="text-red-600 text-sm mt-1">양육자 정보를 선택해주세요</p>
          )}
        </div>
        
        {/* 연령대 (칩 버튼 스타일) */}
        <div className="w-full p-5 bg-white flex flex-col justify-start items-start gap-3 overflow-hidden">
          <div className="self-stretch justify-start">
            <span className="text-neutral-800 text-lg font-bold leading-relaxed">연령대</span>
            <span className="text-red-500 text-lg font-bold leading-relaxed">*</span>
          </div>
          <div className="self-stretch inline-flex justify-start items-start gap-2">
            <button
              type="button"
              onClick={() => handleChipClick('parentAgeGroup', '20대')}
              className={`flex-1 h-12 px-4 py-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-100 flex justify-center items-center gap-1.5 ${parentAgeGroup === '20대' ? 'bg-sky-500 text-white' : 'bg-white text-zinc-600'}`}
            >
              <span className="text-center text-base font-medium leading-none">20대</span>
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('parentAgeGroup', '30대')}
              className={`flex-1 h-12 px-4 py-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-100 flex justify-center items-center gap-1.5 ${parentAgeGroup === '30대' ? 'bg-sky-500 text-white' : 'bg-white text-zinc-600'}`}
            >
              <span className="text-center text-base font-medium leading-none">30대</span>
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('parentAgeGroup', '40대')}
              className={`flex-1 h-12 px-4 py-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-100 flex justify-center items-center gap-1.5 ${parentAgeGroup === '40대' ? 'bg-sky-500 text-white' : 'bg-white text-zinc-600'}`}
            >
              <span className="text-center text-base font-medium leading-none">40대</span>
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('parentAgeGroup', '50대 이상')}
              className={`flex-1 h-12 px-4 py-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-100 flex justify-center items-center gap-1.5 ${parentAgeGroup === '50대 이상' ? 'bg-sky-500 text-white' : 'bg-white text-zinc-600'}`}
            >
              <span className="text-center text-base font-medium leading-none">50대 이상</span>
            </button>
            <input {...register('parentAgeGroup', { required: true })} type="hidden" />
          </div>
          {errors.parentAgeGroup && (
            <p className="text-red-600 text-sm mt-1">연령대를 선택해주세요</p>
          )}
        </div>
        
        {/* 아이 연령 (숫자값) */}
        <div className="w-full p-5 bg-white flex flex-col justify-start items-start gap-3 overflow-hidden">
          <div className="self-stretch justify-start">
            <span className="text-neutral-800 text-lg font-bold leading-relaxed">아이의 연령</span>
            <span className="text-red-500 text-lg font-bold leading-relaxed">*</span>
          </div>
          <div className="w-full flex flex-col justify-start items-start gap-1">
            <input
              type="number"
              {...register('childAge', { required: true })}
              className="w-full h-12 px-4 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200 text-black"
              min="0"
              placeholder="만나이를 입력"
            />
            {errors.childAge && (
              <p className="text-red-600 text-sm mt-1">아이 연령을 입력해주세요</p>
            )}
          </div>
        </div>
        
        {/* 아이 성별 (칩 버튼 스타일) */}
        <div className="w-full p-5 bg-white flex flex-col justify-start items-start gap-3 overflow-hidden">
          <div className="self-stretch justify-start">
            <span className="text-neutral-800 text-lg font-bold leading-relaxed">아이의 성별</span>
            <span className="text-red-500 text-lg font-bold leading-relaxed">*</span>
          </div>
          <div className="self-stretch inline-flex justify-start items-start gap-2">
            <button
              type="button"
              onClick={() => handleChipClick('childGender', 'female')}
              className={`flex-1 h-12 px-4 py-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-100 flex justify-center items-center gap-1.5 ${childGender === 'female' ? 'bg-sky-500 text-white' : 'bg-white text-zinc-600'}`}
            >
              <span className="text-center text-base font-medium leading-none">여성</span>
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('childGender', 'male')}
              className={`flex-1 h-12 px-4 py-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-100 flex justify-center items-center gap-1.5 ${childGender === 'male' ? 'bg-sky-500 text-white' : 'bg-white text-zinc-600'}`}
            >
              <span className="text-center text-base font-medium leading-none">남성</span>
            </button>
            <input {...register('childGender', { required: true })} type="hidden" />
          </div>
          {errors.childGender && (
            <p className="text-red-600 text-sm mt-1">아이 성별을 선택해주세요</p>
          )}
        </div>
        
        {/* 지역 입력 필드 (새로 추가) */}
        <div className="w-full p-5 bg-white flex flex-col justify-start items-start gap-3 overflow-hidden">
          <div className="self-stretch justify-start">
            <span className="text-neutral-800 text-lg font-bold leading-relaxed">지역</span>
            <span className="text-red-500 text-lg font-bold leading-relaxed">*</span>
          </div>
          <div className="w-full flex flex-col justify-start items-start gap-1">
            <input
              type="text"
              {...register('region', { required: true })}
              className="w-full h-12 px-4 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200 text-black"
              placeholder="거주하고 있는 지역 ㅇㅇ시 ㅇㅇ구까지 입력"
            />
            {errors.region && (
              <p className="text-red-600 text-sm mt-1">지역을 입력해주세요</p>
            )}
          </div>
        </div>
        
        {/* 버튼 */}
        <div className="w-full h-28 px-5 flex flex-col justify-start items-center gap-5 mt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-4 bg-sky-500 rounded-2xl inline-flex justify-center items-center gap-2 disabled:opacity-50 text-white text-lg font-semibold"
          >
            {saving ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                저장중...
              </span>
            ) : '다음으로'}
          </button>
        </div>
      </form>
    </div>
  );
} 