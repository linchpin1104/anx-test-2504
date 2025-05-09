'use client';

import React, { useEffect, useState, ReactElement } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

// Interfaces 정의
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
  userInfo?: {
    name: string;
    childAge: string;
    childGender: string;
    parentAgeGroup: string;
  };
  createdAt?: { seconds: number; nanoseconds: number };
}

interface PolarAngleAxisTickProps {
  x: number;
  y: number;
  payload: {
    value: string;
  };
}

export default function SharedResultPage() {
  const router = useRouter();
  const params = useParams();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedResult() {
      try {
        if (!params.id) {
          setError('유효하지 않은 공유 링크입니다.');
          setLoading(false);
          return;
        }

        const shareId = params.id;
        const response = await fetch(`/api/share/${shareId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '결과를 불러올 수 없습니다.');
        }
        
        const data = await response.json();
        setResultData(data.result);
      } catch (err) {
        console.error('공유 결과 로드 오류:', err);
        setError('결과를 불러오는데 실패했습니다. 링크가 만료되었거나 유효하지 않습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchSharedResult();
  }, [params.id]);

  // 상태별 색상 가져오기
  const getStatusColor = (label: string) => {
    if (label.includes('좋음') || label.includes('정상') || label.includes('낮음')) {
      return {
        bg: 'bg-emerald-200',
        text: 'text-green-600',
        badge: 'bg-green-100 text-green-600'
      };
    } else if (label.includes('가벼운') || label.includes('경미한')) {
      return {
        bg: 'bg-yellow-200',
        text: 'text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-600'
      };
    } else if (label.includes('중간') || label.includes('평균')) {
      return {
        bg: 'bg-sky-200',
        text: 'text-sky-600',
        badge: 'bg-sky-100 text-sky-600'
      };
    } else if (label.includes('심한') || label.includes('높은')) {
      return {
        bg: 'bg-orange-200',
        text: 'text-orange-600',
        badge: 'bg-orange-100 text-orange-600'
      };
    } else {
      return {
        bg: 'bg-rose-200',
        text: 'text-red-600',
        badge: 'bg-rose-100 text-red-600'
      };
    }
  };

  // Tailwind 색상을 차트용 색상으로 변환
  const getTailwindColor = (): string => {
    return '#0ea5e9'; // sky-500 color
  };

  // 범례에 대한 커스텀 컴포넌트
  const CustomTick = ({ x, y, payload }: PolarAngleAxisTickProps): ReactElement<SVGGElement> => {
    const lines = payload.value.split('\n');
    const isPerfect = payload.value.includes('완벽주의');
    const isParentRole = payload.value.includes('역할효능감');
    const isAttachment = payload.value.includes('자녀애착');
    const isChild = payload.value.includes('자녀염려');
    const isSocial = payload.value.includes('사회적지지');
    
    return (
      <g transform={`translate(${x},${y})`}>
        {/* 배경 제거 (투명하게) */}
        {lines.map((line: string, i: number) => (
          <text
            key={i}
            x={isPerfect ? 0 : 
               isAttachment ? (20 - 5) : 
               isParentRole ? 0 : 
               isSocial ? 0 : 
               -10}
            y={isParentRole ? (i * 11 * 1.3) - 10 : 
               (isChild || isAttachment) ? (i * 11 * 1.3) + 10 + 10 - 5 : 
               isSocial ? (i * 11 * 1.3) - 10 : 
               isPerfect ? (i * 11 * 1.3) - 10 :
               i * 11 * 1.3}
            textAnchor="middle"
            fill="#71717a"
            fontSize={11}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-sky-500 border-solid rounded-full animate-spin"></div>
        <p className="text-lg mt-4 text-gray-700">결과를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center mb-4">
          <div className="text-red-500 text-lg mb-2">오류</div>
          <p className="text-gray-600">{error}</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg"
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="w-full max-w-md mx-auto p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center mb-4">
          <div className="text-yellow-500 text-lg mb-2">결과 없음</div>
          <p className="text-gray-600">공유된 결과를 찾을 수 없습니다.</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg"
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  // 결과 페이지 렌더링
  const { globalResult, categoryResults, baiResult } = resultData;

  return (
    <div className="w-full max-w-md mx-auto bg-white flex flex-col min-h-screen">
      {/* Title container */}
      <div className="w-full px-5 pt-8 pb-5 flex flex-col justify-start items-start gap-3">
        <div className="self-stretch justify-start text-black text-xl md:text-2xl font-bold font-['Pretendard_Variable'] leading-relaxed">
          양육불안지수 보고서
          <div className="text-sm font-normal text-gray-500 mt-1">
            공유된 결과입니다
          </div>
        </div>
      </div>

      {/* Alert box */}
      <div className="w-full px-5 pb-3 flex flex-col justify-start items-start gap-6">
        <div className="self-stretch px-4 py-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col justify-start items-start gap-2">
          <div className="inline-flex justify-start items-center gap-1">
            <div className="size-4 relative">
              <div className="size-3.5 left-[1.33px] top-[1.33px] absolute bg-amber-500" />
            </div>
            <div className="justify-center text-amber-500 text-sm font-semibold font-['Pretendard_Variable'] leading-6" style={{ fontSize: '13px' }}>
              안내
            </div>
          </div>
          <div className="self-stretch justify-center text-zinc-600 text-sm font-normal font-['Pretendard_Variable'] leading-6" style={{ fontSize: '13px' }}>
            이 결과는 검사 당시의 상태를 기반으로 합니다. 점수는 참고용이며 정확한 판단은 전문가와 상담하세요.
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-white" />

      {/* Overall result section */}
      <div className="size-full px-5 py-10 bg-white flex flex-col justify-start items-start gap-5">
        <div className="self-stretch h-9 inline-flex justify-start items-start">
          <div className="w-full justify-start text-neutral-800 text-xl font-bold font-['Pretendard_Variable'] leading-relaxed">
            양육불안 총평
          </div>
        </div>
        
        <div className="w-full flex flex-col justify-center items-center gap-2.5">
          <div className="self-stretch h-auto px-5 py-3 relative flex flex-col justify-start items-start gap-2.5">
            <div className="w-full pl-7 pr-2.5 bg-neutral-50 rounded-2xl inline-flex justify-start items-center py-3">
              <div className="w-full relative overflow-hidden">
                <div className="w-full inline-flex flex-col justify-center items-start">
                  <div className="w-full flex flex-col justify-center items-start gap-4">
                    <div className="w-full justify-start text-zinc-600 text-base font-bold font-['Pretendard_Variable'] leading-6">
                      양육불안지수 : <span className={getStatusColor(globalResult.label).text}>{globalResult.label}</span> ({globalResult.mean.toFixed(1)}점)
                    </div>
                  </div>
                  <div className="w-full flex flex-col justify-center items-start gap-4 mt-4">
                    <div className="w-full justify-start text-zinc-600 text-base font-normal font-['Pretendard_Variable'] leading-6">
                      {globalResult.description}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Radar chart section */}
      <div className="w-full px-5 py-8 bg-neutral-50 rounded-2xl flex flex-col justify-start items-start gap-5 overflow-hidden">
        <div className="w-full text-center justify-center text-neutral-800 text-base font-bold font-['Pretendard_Variable'] leading-relaxed">자세히 살펴보기</div>
        
        <div className="w-full py-4 rounded-3xl flex flex-col justify-center items-center">
          {/* Radar chart wrapper */}
          <div className="w-full h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart 
                data={Object.entries(categoryResults)
                  .filter(([cat]) => cat !== 'BAI 불안척도')
                  .map(([cat, { mean }]) => {
                    let formattedCategory = cat;
                    if (cat === '부모역할 효능감으로 인한 불안') {
                      formattedCategory = '역할효능감\n불안';
                    } else if (cat === '사회적 지지에 대한 염려') {
                      formattedCategory = '사회적지지\n불안';
                    } else if (cat === '자녀에 대한 염려') {
                      formattedCategory = '자녀염려\n불안';
                    } else if (cat === '자녀와의 애착에 대한 불안') {
                      formattedCategory = '자녀애착\n불안';
                    } else if (cat === '완벽주의로 인한 불안') {
                      formattedCategory = '완벽주의\n불안';
                    }
                    return { 
                      category: formattedCategory, 
                      value: mean 
                    };
                  })}
                cx="50%" 
                cy="50%" 
                outerRadius="85%"
              >
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis 
                  dataKey="category" 
                  tickLine={false}
                  tick={CustomTick}
                />
                <PolarRadiusAxis 
                  domain={[0, 5]} 
                  tickCount={6} 
                  axisLine={true} 
                  tick={{ fontSize: 13 }}
                />
                {Object.entries(categoryResults)
                  .filter(([cat]) => cat !== 'BAI 불안척도')
                  .map(([category]) => (
                    <Radar 
                      key={category}
                      name={category} 
                      dataKey="value" 
                      stroke={getTailwindColor()}
                      fill={getTailwindColor()}
                      fillOpacity={0.1}
                      isAnimationActive={true}
                      dot
                    />
                  ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Individual category results */}
      {Object.entries(categoryResults)
        .filter(([cat]) => cat !== 'BAI 불안척도')
        .map(([category, { mean, label, description }]) => (
          <div key={category} className="size-full px-5 py-10 bg-white flex flex-col justify-start items-start gap-5">
            <div className="w-full flex flex-col justify-start items-start gap-2.5">
              <div className={`self-stretch px-2 py-2 ${getStatusColor(label).bg} rounded-md inline-flex justify-center items-center gap-1`}>
                <div className={`text-center justify-start ${getStatusColor(label).text} text-base font-bold font-['Pretendard_Variable'] leading-6`}>
                  {category}
                </div>
              </div>
            </div>
            
            <div className="w-full flex flex-col justify-center items-center gap-2.5">
              <div className="self-stretch h-auto px-5 py-3 relative flex flex-col justify-start items-start gap-2.5">
                <div className="w-full pl-7 pr-2.5 bg-neutral-50 rounded-2xl inline-flex justify-start items-center py-3">
                  <div className="w-full relative overflow-hidden">
                    <div className="w-full inline-flex flex-col justify-center items-start">
                      <div className="w-full flex flex-col justify-center items-start gap-2">
                        <div className="w-full justify-start text-zinc-600 text-base font-bold font-['Pretendard_Variable'] leading-6">
                          {category}지수 : <span className={getStatusColor(label).text}>{label}</span>
                        </div>
                        <div className="w-full justify-start text-zinc-600 text-base font-normal font-['Pretendard_Variable'] leading-6 mt-4">
                          점수 : {mean.toFixed(1)} 점
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full justify-start text-zinc-600 text-base font-normal font-['Pretendard_Variable'] leading-6 mt-4">
              {description}
            </div>
          </div>
        ))}

      {/* BAI result section */}
      <div className="size-full px-5 py-10 bg-white flex flex-col justify-start items-start gap-5">
        <div className="self-stretch h-9 inline-flex justify-start items-start">
          <div className="w-full justify-start text-neutral-800 text-xl font-bold font-['Pretendard_Variable'] leading-relaxed">
            BAI 불안척도 결과
          </div>
        </div>
        
        <div className="w-full flex flex-col justify-center items-center gap-2.5">
          <div className="self-stretch h-auto px-5 py-3 relative flex flex-col justify-start items-start gap-2.5">
            <div className="w-full pl-7 pr-2.5 bg-neutral-50 rounded-2xl inline-flex justify-start items-center py-3">
              <div className="w-full relative overflow-hidden">
                <div className="w-full inline-flex flex-col justify-center items-start">
                  <div className="w-full flex flex-col justify-center items-start gap-4">
                    <div className="w-full justify-start text-zinc-600 text-base font-bold font-['Pretendard_Variable'] leading-6">
                      BAI 불안척도 지수 : <span className={getStatusColor(baiResult.label).text}>{baiResult.label}</span> ({baiResult.sum}점)
                    </div>
                  </div>
                  <div className="w-full flex flex-col justify-center items-start gap-4 mt-4">
                    <div className="w-full justify-start text-zinc-600 text-base font-normal font-['Pretendard_Variable'] leading-6">
                      {baiResult.description}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full bg-white flex flex-col justify-start items-center mt-auto">
        <div className="self-stretch h-px bg-zinc-100" />
        <div className="self-stretch px-5 py-4 inline-flex justify-between items-start gap-3">
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-4 bg-sky-500 rounded-2xl flex justify-center items-center gap-2"
          >
            <div className="text-center justify-center text-white text-base font-semibold font-['Pretendard_Variable'] leading-6">
              검사 참여하기
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 