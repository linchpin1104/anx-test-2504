'use client';

import React, { useEffect, useState } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { useRouter } from 'next/navigation';

interface Question {
  category: string;
  id: string;
  text: string;
}

interface CategoryResult {
  mean: number;
  label: string;
  description: string;
}

interface BaiResult {
  sum: number;
  label: string;
  description: string;
}

interface ResultData {
  categoryResults: Record<string, CategoryResult>;
  globalResult: CategoryResult;
  baiResult: BaiResult;
}

type FormValues = Record<string, string>;

export default function SurveyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState('');
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>();
  const router = useRouter();

  // Define scale labels for general and BAI questions
  const generalScale = [
    { value: 1, label: '그렇지 않다' },
    { value: 2, label: '별로 그렇지 않다' },
    { value: 3, label: '약간 그렇다' },
    { value: 4, label: '그렇다' },
    { value: 5, label: '매우 그렇다' },
  ];
  const baiScale = [
    { value: 0, label: '전혀 그렇지 않다' },
    { value: 1, label: '조금 그렇다' },
    { value: 2, label: '대체로 그렇다' },
    { value: 3, label: '심각하게 그렇다' },
  ];

  useEffect(() => {
    setQuestionsLoading(true);
    setQuestionsError('');
    fetch('/api/questions')
      .then((res) => {
        if (!res.ok) {
          throw new Error('질문을 불러오는데 실패했습니다.');
        }
        return res.json();
      })
      .then((data: Question[]) => {
        setQuestions(data);
        setQuestionsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setQuestionsError(err instanceof Error ? err.message : '질문을 불러오는데 오류가 발생했습니다.');
        setQuestionsLoading(false);
      });
  }, []);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: data }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.message || '제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
      
      const json: ResultData = await res.json();
      // Save result and navigate to result page
      if (typeof window !== 'undefined') {
        localStorage.setItem('surveyResult', JSON.stringify(json));
      }
      router.push('/survey/result');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Alert for first unanswered question when submitting
  const onError = (errorsFields: FieldErrors<FormValues>) => {
    const firstKey = Object.keys(errorsFields)[0];
    const qIndex = questions.findIndex((q) => q.id === firstKey);
    if (qIndex >= 0) alert(`${qIndex + 1}번 문항에 응답하지 않으셨습니다`);
  };

  if (questionsLoading) {
    return <div className="p-4 text-center">질문을 불러오는 중입니다...</div>;
  }

  if (questionsError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 mb-4">{questionsError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="p-4 text-center">질문이 없습니다. 관리자에게 문의하세요.</div>;
  }

  // If result exists, show result UI
  if (typeof localStorage !== 'undefined' && localStorage.getItem('surveyResult')) {
    const result = JSON.parse(localStorage.getItem('surveyResult') || '') as ResultData;
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">검사 결과</h1>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">전체 평균 결과</h2>
          <p className="mt-2">{result.globalResult.label} ({result.globalResult.mean.toFixed(2)})</p>
          <p className="mt-1 text-sm text-gray-600">{result.globalResult.description}</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">영역별 결과</h2>
          {Object.entries(result.categoryResults).map(([cat, { mean, label, description }]) => (
            <div key={cat} className="mt-4">
              <h3 className="font-medium">{cat}</h3>
              <p className="mt-1">{label} ({mean.toFixed(2)})</p>
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            </div>
          ))}
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">BAI 불안척도 결과</h2>
          <p className="mt-2">{result.baiResult.label} (합계: {result.baiResult.sum})</p>
          <p className="mt-1 text-sm text-gray-600">{result.baiResult.description}</p>
        </section>
        <button
          onClick={() => {
            localStorage.removeItem('surveyResult');
            router.push('/survey');
          }}
          className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-4 py-2 rounded"
        >
          다시하기
        </button>
      </div>
    );
  }

  const formValues = watch();
  const hasAnswers = Object.keys(formValues).length > 0;

  return (
    <div className="w-full max-w-md mx-auto bg-white flex flex-col min-h-screen">
      {/* Content container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Title container */}
        <div className="w-full px-5 pt-8 pb-5 flex flex-col justify-start items-start gap-3">
          <div className="self-stretch justify-start text-black text-xl md:text-2xl font-bold font-['Pretendard_Variable'] leading-loose">양육불안도 검사 (총 47문항)</div>
          <div className="self-stretch justify-start text-zinc-600 text-sm md:text-base font-normal font-['Pretendard_Variable'] leading-snug">양육불안도 검사는 부모의 양육과정에서 <br/>경험하는 불안 수준을 측정하는 검사입니다</div>
        </div>

        {/* Alert box */}
        <div className="w-full px-5 pb-3 flex flex-col justify-start items-start gap-6">
          <div className="self-stretch px-4 py-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col justify-start items-start gap-2">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="size-4 relative">
                <div className="size-3.5 left-[1.33px] top-[1.33px] absolute bg-amber-500" />
              </div>
              <div className="justify-center text-amber-500 text-xs font-semibold font-['Pretendard_Variable'] leading-3">안내</div>
            </div>
            <div className="self-stretch justify-center text-zinc-600 text-xs font-normal font-['Pretendard_Variable'] leading-tight">모든 질문에 응답해주세요. 제출 후에는 수정이 불가능합니다.</div>
          </div>
        </div>

        {/* Survey form */}
        <form onSubmit={handleSubmit(onSubmit, onError)} className="w-full flex-1 flex flex-col">
          <div className="w-full px-5 pt-5 pb-4 flex-1 flex flex-col justify-start items-start gap-8 overflow-y-auto">
            {questions.map((q, idx) => (
              <div key={q.id} className="self-stretch flex flex-col justify-start items-start gap-3 w-full">
                <div className="self-stretch inline-flex justify-start items-start gap-1">
                  <div className="justify-start text-black text-base font-semibold font-['Pretendard_Variable'] leading-normal">{idx + 1}.</div>
                  <div className="flex-1 justify-start text-black text-base font-semibold font-['Pretendard_Variable'] leading-normal">{q.text}</div>
                </div>
                <div className="self-stretch grid grid-cols-5 gap-2">
                  {(q.category === 'BAI 불안척도' ? baiScale : generalScale).map(({ value, label }) => (
                    <div key={value} className="flex flex-col justify-start items-center gap-1">
                      <label className="size-10 md:size-12 relative rounded-full outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col justify-center items-center cursor-pointer">
                        <input
                          type="radio"
                          value={value}
                          {...register(q.id, { required: true })}
                          className="sr-only peer"
                        />
                        <div className="peer-checked:bg-sky-500 absolute inset-0 rounded-full z-0"></div>
                        <div className="z-10 relative w-full text-center justify-center peer-checked:text-white text-zinc-600 text-sm md:text-base font-medium font-['Pretendard_Variable'] leading-none">{value}</div>
                      </label>
                      <div className="text-center justify-start text-neutral-400 text-xs font-medium font-['Pretendard_Variable'] leading-tight whitespace-pre-line">
                        {label.includes(' ') 
                          ? `${label.split(' ')[0]}\n${label.split(' ').slice(1).join(' ')}`
                          : label}
                      </div>
                    </div>
                  ))}
                </div>
                {errors[q.id] && (
                  <p className="text-red-600 text-sm mb-2 self-start">이 질문에 답변해주세요.</p>
                )}
              </div>
            ))}
          </div>

          {/* Submit button - sticky footer */}
          <div className="w-full sticky bottom-0 bg-white border-t border-zinc-100 mt-auto">
            <div className="px-5 py-4 w-full">
              <button
                type="submit"
                disabled={loading || !hasAnswers}
                className={`w-full px-4 py-3 md:py-4 rounded-2xl flex justify-center items-center gap-2 text-center text-white text-base md:text-lg font-semibold font-['Pretendard_Variable'] leading-none ${
                  loading || !hasAnswers ? 'bg-neutral-200' : 'bg-sky-500 shadow-md'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    제출중...
                  </span>
                ) : '제출하기'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="w-full px-5 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="font-medium">제출 오류</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
} 