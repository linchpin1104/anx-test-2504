'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

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

export default function SurveyResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('surveyResult');
      if (stored) {
        setResult(JSON.parse(stored));
      } else {
        router.push('/survey');
      }
    }
  }, [router]);

  if (!result) {
    return <div className="p-4 text-center">결과를 불러오는 중...</div>;
  }

  const { globalResult, categoryResults, baiResult } = result;

  // Prepare data for spider (radar) chart, excluding BAI
  const radarData = Object.entries(categoryResults)
    .filter(([cat]) => cat !== 'BAI 불안척도')
    .map(([cat, { mean }]) => ({ category: cat, mean }));

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">검사 결과</h1>
      <section className="mb-6">
        <h2 className="text-xl font-semibold">전체 평균 결과</h2>
        <p className="mt-2">{globalResult.label} ({globalResult.mean.toFixed(2)})</p>
        <p className="mt-1 text-sm text-gray-600">{globalResult.description}</p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold">영역별 결과</h2>
        {/* Spider chart for subscales (5 categories) */}
        <div style={{ width: '100%', height: 300 }} className="mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis domain={[0, 5]} />
              <Radar
                name="Score"
                dataKey="mean"
                stroke="#6366F1"
                fill="#6366F1"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {/* Detailed subscale descriptions */}
        {Object.entries(categoryResults)
          .filter(([cat]) => cat !== 'BAI 불안척도')
          .map(([cat, { mean, label, description }]) => (
            <div key={cat} className="mt-4">
              <h3 className="font-medium">{cat}</h3>
              <p className="mt-1">{label} ({mean.toFixed(2)})</p>
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            </div>
          ))}
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold">BAI 불안척도 결과</h2>
        <p className="mt-2">{baiResult.label} (합계: {baiResult.sum})</p>
        <p className="mt-1 text-sm text-gray-600">{baiResult.description}</p>
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