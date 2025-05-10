'use client';

import React, { useEffect, useState, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

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
  success?: boolean;
  resultId?: string;
  name: string;
  peerReview: number[];
  selfReview: number[];
  registrationTime: string;
  categoryResults: Record<string, CategoryResult>;
  globalResult: CategoryResult;
  baiResult: BaiResult;
  userInfo?: {
    name: string;
    phone: string;
    childAge: string;
    childGender: string;
    parentAgeGroup: string;
    caregiverType: string;
  };
  isHistory?: boolean;
  timestamp?: string;
}

interface PolarAngleAxisTickProps {
  x: number;
  y: number;
  payload: {
    value: string;
  };
}

export default function SurveyResultPage() {
  const router = useRouter();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('surveyResult');
      if (stored) {
        setResultData(JSON.parse(stored));
      } else {
        router.push('/survey');
      }
    }
  }, [router]);

  if (!resultData) {
    return <div className="p-4 text-center">결과를 불러오는 중...</div>;
  }

  const { globalResult, categoryResults, baiResult } = resultData;

  // Convert Tailwind classes to hex colors for the chart
  const getTailwindColor = (): string => {
    return '#0ea5e9'; // sky-500 color
  };

  // Get anxiety level color and background
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

  return (
    <div className="w-full max-w-md mx-auto bg-white flex flex-col min-h-screen">
      {/* Title container */}
      <div className="w-full px-5 pt-8 pb-5 flex flex-col justify-start items-start gap-3">
        <div className="self-stretch justify-start text-black text-xl md:text-2xl font-bold font-['Pretendard_Variable'] leading-relaxed">나의 양육불안지수 보고서</div>
        {resultData.isHistory && (
          <div className="self-stretch px-2 py-1 bg-sky-100 rounded-md text-sky-700 text-sm font-medium">
            이전 검사 결과 ({new Date(resultData.timestamp || resultData.registrationTime).toLocaleDateString('ko-KR')})
          </div>
        )}
      </div>

      {/* Alert box */}
      <div className="w-full px-5 pb-3 flex flex-col justify-start items-start gap-6">
        <div className="self-stretch px-4 py-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col justify-start items-start gap-2">
          <div className="inline-flex justify-start items-center gap-1">
            <div className="size-4 relative">
              <div className="size-3.5 left-[1.33px] top-[1.33px] absolute bg-amber-500" />
            </div>
            <div className="justify-center text-amber-500 text-sm font-semibold font-['Pretendard_Variable'] leading-6" style={{ fontSize: '13px' }}>참고해주세요</div>
          </div>
          <div className="self-stretch justify-center text-zinc-600 text-sm font-normal font-['Pretendard_Variable'] leading-6" style={{ fontSize: '13px' }}>
            아래 결과는 해당 검사에 체크하신 내용을 기반으로 심리전문가들이 분석하여 제공합니다. 보다 자세한 검사 및 상담은 전문센터를 통해 확인하시길 권해드립니다.
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-white" />

      {/* Overall result section */}
      <div className="size-full px-5 py-10 bg-white flex flex-col justify-start items-start gap-5">
        <div className="self-stretch h-9 inline-flex justify-start items-start">
          <div className="w-full justify-start text-neutral-800 text-xl font-bold font-['Pretendard_Variable'] leading-relaxed">나의 양육불안 총평</div>
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
                outerRadius="80%"
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
              {category === '부모역할 효능감으로 인한 불안' && (
                <div className="w-full justify-start text-zinc-600 text-base font-bold font-['Pretendard_Variable'] leading-6 mt-2">
                  부모가 자신의 양육 능력을 스스로 어떻게 느끼는지에 대한 불안을 의미합니다
                </div>
              )}
              {category === '자녀와의 애착에 대한 불안' && (
                <div className="w-full justify-start text-zinc-600 text-base font-bold font-['Pretendard_Variable'] leading-6 mt-2">
                  부모가 자녀와 정서적으로 친밀한 관계를 유지하고 싶은 마음이 강하지만, 아이와 멀어질까 봐 드는 불안을 의미합니다
                </div>
              )}
              {category === '자녀에 대한 염려' && (
                <div className="w-full justify-start text-zinc-600 text-base font-bold font-['Pretendard_Variable'] leading-6 mt-2">
                  자녀에게 작은 문제가 생겨도 크게 걱정하고 불안해지는 것을 의미합니다
                </div>
              )}
              {category === '사회적 지지에 대한 염려' && (
                <div className="w-full justify-start text-zinc-600 text-base font-bold font-['Pretendard_Variable'] leading-6 mt-2">
                  부모가 아이를 키우는 과정에서 주변 사람들부터 충분한 도움과 응원을 받지 못한다고 느끼며 외로움과 부담감을 크게 느끼는 상태를 의미합니다
                </div>
              )}
              {category === '완벽주의로 인한 불안' && (
                <div className="w-full justify-start text-zinc-600 text-base font-bold font-['Pretendard_Variable'] leading-6 mt-2">
                  부모가 스스로 완벽한 부모여야 한다는 압박감을 느끼면서, 작은 실수에도 크게 불안해하고 자신을 탓하는 마음을 의미합니다
                </div>
              )}
            </div>
            
            <div className="w-full flex flex-col justify-center items-center gap-2.5">
              <div className="self-stretch h-auto px-5 py-3 relative flex flex-col justify-start items-start gap-2.5">
                <div className="w-full pl-7 pr-2.5 bg-neutral-50 rounded-2xl inline-flex justify-start items-center py-3">
                  <div className="w-full relative overflow-hidden">
                    <div className="w-full inline-flex flex-col justify-center items-start">
                      <div className="w-full flex flex-col justify-center items-start gap-2">
                        <div className="w-full justify-start text-zinc-600 text-base font-bold font-['Pretendard_Variable'] leading-6">
                          {category}지수 : <span className={getStatusColor(label).text}>{label}</span> ({mean.toFixed(1)}점)
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
            나의 BAI 불안척도 결과
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
            onClick={() => {
              localStorage.removeItem('surveyResult');
              router.push('/survey');
            }}
            className="flex-1 px-4 py-4 bg-neutral-100 rounded-2xl flex justify-center items-center gap-2"
          >
            <div className="text-center justify-center text-zinc-600 text-base font-semibold font-['Pretendard_Variable'] leading-6">
              다시하기
            </div>
          </button>
          <button
            onClick={async () => {
              if (isSharing) return;
              
              setIsSharing(true);
              try {
                // 결과 데이터를 API로 전송
                const response = await fetch('/api/share', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(resultData),
                });
                
                const data = await response.json();
                
                if (!data.success) {
                  throw new Error(data.message || '공유 링크 생성에 실패했습니다.');
                }
                
                // 공유 URL 생성
                const shareUrl = `${window.location.origin}${data.shareUrl}`;
                
                // 클립보드에 복사 (크로스 브라우저 지원)
                try {
                  // 기본 Clipboard API 사용 시도
                  await navigator.clipboard.writeText(shareUrl);
                  alert('링크가 클립보드에 복사되었습니다.\n이 링크를 공유하여 검사 결과를 다른 사람들과 공유할 수 있습니다.');
                } catch (error) {
                  console.error('Clipboard API failed:', error);
                  // 대체 방법: 임시 텍스트 필드 생성하여 복사
                  const textArea = document.createElement('textarea');
                  textArea.value = shareUrl;
                  
                  // 화면 밖으로 숨김
                  textArea.style.position = 'fixed';
                  textArea.style.left = '-999999px';
                  textArea.style.top = '-999999px';
                  document.body.appendChild(textArea);
                  
                  // 모바일에서도 작동하도록 focus 및 select
                  textArea.focus();
                  textArea.select();
                  
                  let copied = false;
                  try {
                    // execCommand는 deprecated되었지만 일부 모바일 브라우저에서는 여전히 필요
                    copied = document.execCommand('copy');
                  } catch (e) {
                    console.error('클립보드 복사 실패:', e);
                  }
                  
                  document.body.removeChild(textArea);
                  
                  if (copied) {
                    alert('링크가 클립보드에 복사되었습니다.\n이 링크를 공유하여 검사 결과를 다른 사람들과 공유할 수 있습니다.');
                  } else {
                    // 모든 방법 실패 시 사용자에게 URL 보여주기
                    prompt('아래 링크를 복사하여 공유하세요:', shareUrl);
                  }
                }
              } catch (error) {
                console.error('결과 공유 중 오류 발생:', error);
                alert('결과 공유 중 오류가 발생했습니다. 다시 시도해주세요.');
              } finally {
                setIsSharing(false);
              }
            }}
            disabled={isSharing}
            className={`flex-1 px-4 py-4 ${isSharing ? 'bg-gray-100 border-gray-300' : 'bg-white border-sky-500'} border rounded-2xl flex justify-center items-center gap-2`}
          >
            <div className={`text-center justify-center ${isSharing ? 'text-gray-400' : 'text-sky-500'} text-base font-semibold font-['Pretendard_Variable'] leading-6`}>
              {isSharing ? '처리중...' : '결과공유'}
            </div>
          </button>
        </div>
        
        {/* 이전 검사 결과 조회 버튼 */}
        <div className="self-stretch px-5 pb-4">
          <Link 
            href="/survey/history"
            className="w-full px-4 py-3 bg-white border border-sky-100 rounded-2xl flex justify-center items-center gap-2 text-sky-500"
          >
            <div className="text-center justify-center text-sky-500 text-sm font-semibold font-['Pretendard_Variable'] leading-6">
              이전 검사 결과 보기
            </div>
          </Link>
        </div>
        
        {/* 후원하기 버튼 */}
        <div className="self-stretch px-5 pb-6">
          <button 
            onClick={() => {
              window.open('https://www.thenile.kr/pacer', '_blank');
            }}
            className="w-full px-4 py-3 bg-sky-500 rounded-2xl flex justify-center items-center gap-2"
          >
            <div className="text-center justify-center text-white text-base font-bold font-['Pretendard_Variable'] leading-6">
              더나일 알아보기
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 