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
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const router = useRouter();

  // Define scale labels for general and BAI questions
  const generalScale = [
    { value: 1, label: '전혀 그렇지 않다' },
    { value: 2, label: '대체로 그렇지 않다' },
    { value: 3, label: '보통이다' },
    { value: 4, label: '대체로 그렇다' },
    { value: 5, label: '매우 그렇다' },
  ];
  const baiScale = [
    { value: 0, label: '전혀 그렇지 않다' },
    { value: 1, label: '조금 그렇다' },
    { value: 2, label: '대체로 그렇다' },
    { value: 3, label: '심각하게 그렇다' },
  ];

  useEffect(() => {
    fetch('/api/questions')
      .then((res) => res.json())
      .then((data: Question[]) => {
        setQuestions(data);
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
        // Handle API error without throwing to avoid overlay
        const errorBody = await res.json().catch(() => ({}));
        const msg = errorBody?.message || '제출 중 오류가 발생했습니다. 다시 시도해주세요.';
        setError(msg);
        return;
      }
      const json: ResultData = await res.json();
      // Save result and navigate to result page
      if (typeof window !== 'undefined') {
        localStorage.setItem('surveyResult', JSON.stringify(json));
      }
      router.push('/survey/result');
      return;
    } catch (e) {
      console.error(e);
      setError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Alert for first unanswered question
  const onError = (errorsFields: FieldErrors<FormValues>) => {
    // Implementation of onError function
  };

  if (questions.length === 0) {
    return <div className="p-4 text-center">Loading questions...</div>;
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">양육불안 검사</h1>
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        {questions.map((q, idx) => (
          <div key={q.id} className="mb-6">
            {/* Question number */}
            <p className="font-medium mb-2">{idx + 1}. {q.text}</p>
            {/* Validation error message */}
            {errors[q.id] && (
              <p className="text-red-600 text-sm mb-2">이 질문에 답변해주세요.</p>
            )}
            {/* Endpoint labels with line break */}
            {(() => {
              const scale = q.category === 'BAI 불안척도' ? baiScale : generalScale;
              return (
                <div className="mb-2 flex justify-between text-sm text-gray-600">
                  <span className="text-center">
                    {scale[0].label.split(' ')[0]}<br />{scale[0].label.split(' ').slice(1).join(' ')}
                  </span>
                  <span className="text-center">
                    {scale[scale.length - 1].label.split(' ')[0]}<br />{scale[scale.length - 1].label.split(' ').slice(1).join(' ')}
                  </span>
                </div>
              );
            })()}
            {/* Scale selector with numeric labels */}
            {(() => {
              const scale = q.category === 'BAI 불안척도' ? baiScale : generalScale;
              return (
                <div className="flex justify-between items-center">
                  {scale.map(({ value }) => (
                    <label key={value} className="flex flex-col items-center cursor-pointer">
                      <input
                        type="radio"
                        value={value}
                        {...register(q.id, { required: true })}
                        className="sr-only peer"
                      />
                      <div className="w-6 h-6 border-2 border-blue-600 rounded-full peer-checked:bg-blue-600"></div>
                      <span className="mt-1 text-sm text-gray-700">{value}</span>
                    </label>
                  ))}
                </div>
              );
            })()}
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? '제출중...' : '제출'}
        </button>
        {error && <p className="mt-2 text-red-600">{error}</p>}
      </form>
    </div>
  );
} 