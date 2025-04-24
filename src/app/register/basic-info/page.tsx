'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

interface FormValues {
  caregiverType: string;
  parentAgeGroup: string;
  childAge: string;
  childGender: string;
}

export default function BasicInfoPage() {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
  });

  // 선택된 값들 관찰
  const caregiverType = watch('caregiverType');
  const parentAgeGroup = watch('parentAgeGroup');
  const childGender = watch('childGender');

  useEffect(() => {
    // 로컬 스토리지에서 이름과 전화번호 불러오기
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('registerName') || '';
      const phone = localStorage.getItem('registerPhone') || '';
      
      if (!name || !phone) {
        // 이름이나 전화번호가 없으면 첫 단계로 리다이렉트
        router.replace('/register');
        return;
      }
      
      setUserData({ name, phone });
    }
  }, [router]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    setSaveError('');
    
    try {
      // 개발 환경에서는 Firebase 저장 과정 생략
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV] 개발 모드에서 Firebase 저장 생략, 다음 페이지로 이동합니다.');
        console.log('사용자 데이터:', {
          ...userData,
          ...data
        });
        
        // 설문조사 페이지로 바로 이동
        router.push('/survey');
        return;
      }
      
      // 프로덕션 환경에서만 Firebase에 저장 시도
      const memberRes = await fetch('/api/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          childAge: data.childAge,
          childGender: data.childGender,
          parentAgeGroup: data.parentAgeGroup,
          caregiverType: data.caregiverType,
        }),
      });
      
      if (!memberRes.ok) {
        const errorData = await memberRes.json().catch(() => ({}));
        throw new Error(errorData?.message || '정보 저장 중 오류가 발생했습니다.');
      }
      
      // 설문조사 페이지로 이동
      router.push('/survey');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '오류가 발생했습니다. 다시 시도해주세요.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // 칩 버튼 클릭 핸들러
  const handleChipClick = (field: keyof FormValues, value: string) => {
    setValue(field, value);
  };

  return (
    <div className="bg-white flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="w-full h-24 relative overflow-hidden">
        <div className="py-6 bg-white inline-flex flex-col justify-start items-end overflow-hidden">
          <div className="w-full px-5 py-4 inline-flex justify-end items-center gap-3" />
        </div>
      </div>
      
      {/* 타이틀 */}
      <div className="w-full px-5 py-8 bg-white flex flex-col justify-start items-start gap-5 overflow-hidden">
        <div className="self-stretch text-center justify-end text-neutral-800 text-xl font-bold leading-7">
          검사자의 기본정보를<br/>알려주세요
        </div>
      </div>
      
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
              className="w-full h-12 px-4 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200"
              min="0"
              placeholder="개월 수 입력"
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
          {saveError && (
            <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-medium">저장 오류</p>
              <p>{saveError}</p>
            </div>
          )}
        </div>
      </form>
      
      {/* 푸터 */}
      <div className="w-full px-5 py-8 bg-neutral-100 flex flex-col justify-start items-start gap-4 mt-auto">
        <div className="text-zinc-600 text-xs font-semibold">사단법인 STAMP</div>
        <div className="flex flex-col justify-start items-start gap-1">
          <div className="text-zinc-600 text-xs">대표</div>
          <div className="text-zinc-600 text-xs">개인정보보호책임자</div>
          <div className="text-zinc-600 text-xs">사업자등록번호</div>
          <div className="text-zinc-600 text-xs">통신판매업신고</div>
          <div className="text-zinc-600 text-xs">고객 센터</div>
          <div className="text-zinc-600 text-xs">서울특별시</div>
          <div className="inline-flex justify-start items-center gap-3 mt-2">
            <div className="text-zinc-600 text-xs font-semibold">서비스 소개</div>
            <div className="w-px h-3 bg-zinc-600" />
            <div className="text-zinc-600 text-xs font-semibold">서비스이용약관</div>
            <div className="w-px h-3 bg-zinc-600" />
            <div className="text-zinc-600 text-xs font-semibold">개인정보처리방침</div>
          </div>
        </div>
        <div className="inline-flex justify-start items-center gap-2 mt-2">
          <div className="size-8 rounded-full outline outline-1 outline-neutral-200 flex justify-center items-center">
            <div className="w-4 h-3.5 bg-neutral-400" />
          </div>
          <div className="size-8 rounded-full outline outline-1 outline-neutral-200 flex justify-center items-center">
            <div className="w-4 h-2.5 bg-neutral-400" />
          </div>
          <div className="size-8 rounded-full outline outline-1 outline-neutral-200 flex justify-center items-center">
            <div className="w-3.5 h-3.5 bg-neutral-400" />
          </div>
          <button className="px-3 py-2.5 rounded-lg outline outline-1 outline-neutral-200 flex justify-center items-center gap-1 text-zinc-600 text-sm font-semibold">
            1:1 문의하기
          </button>
        </div>
      </div>
    </div>
  );
} 