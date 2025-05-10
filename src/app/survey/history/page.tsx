'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CategoryResult {
  mean: number;
  label: string;
  description: string;
}

interface HistoryResult {
  id: string;
  timestamp: string | null;
  globalResult?: {
    label: string;
    mean: number;
  };
}

export default function HistoryPage() {
  const router = useRouter();
  const [historyResults, setHistoryResults] = useState<HistoryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    phone?: string;
  }>({});

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 확인
    const userInfoStr = localStorage.getItem('userInfo');
    if (!userInfoStr) {
      router.push('/register');
      return;
    }

    try {
      const savedUserInfo = JSON.parse(userInfoStr);
      setUserInfo(savedUserInfo);
      
      // 사용자 이력 불러오기
      loadUserHistory(savedUserInfo.phone);
    } catch (e) {
      console.error('사용자 정보 파싱 오류:', e);
      setError('사용자 정보를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  }, [router]);

  // 사용자 검사 이력 불러오기
  const loadUserHistory = async (phone: string) => {
    if (!phone) {
      setError('유효한 사용자 정보가 없습니다');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 개발 환경에서 로컬 스토리지에서 이력 가져오기
      if (process.env.NODE_ENV === 'development') {
        const historyJson = localStorage.getItem('surveyResultHistory') || '[]';
        const historyIds = JSON.parse(historyJson) as string[];
        
        if (historyIds.length === 0) {
          setHistoryResults([]);
          setLoading(false);
          return;
        }
        
        // 로컬 스토리지에서 결과가 있으면 목록 표시 준비
        const mockHistory: HistoryResult[] = historyIds.map((id, index) => ({
          id,
          timestamp: new Date(Date.now() - index * 86400000).toISOString(), // 하루씩 이전 날짜
          globalResult: {
            label: index % 2 === 0 ? "양호" : "보통",
            mean: 3.0 - index * 0.2,
          }
        }));
        
        setHistoryResults(mockHistory);
        setLoading(false);
        return;
      }
      
      // 프로덕션 환경에서 서버에서 이력 가져오기
      const response = await fetch(`/api/result/user-history?userId=${encodeURIComponent(phone)}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.useLocalStorage) {
          // 개발 환경 처리 위와 동일
          const historyJson = localStorage.getItem('surveyResultHistory') || '[]';
          const historyIds = JSON.parse(historyJson) as string[];
          
          const mockHistory: HistoryResult[] = historyIds.map((id, index) => ({
            id,
            timestamp: new Date(Date.now() - index * 86400000).toISOString(),
            globalResult: {
              label: index % 2 === 0 ? "양호" : "보통",
              mean: 3.0 - index * 0.2,
            }
          }));
          
          setHistoryResults(mockHistory);
        } else if (data.results && data.results.length > 0) {
          // 결과 이력 저장
          setHistoryResults(data.results);
        } else {
          setHistoryResults([]);
        }
      } else {
        setError(data.message || '검사 이력을 불러오는데 실패했습니다');
      }
    } catch (error) {
      console.error('검사 이력 불러오기 오류:', error);
      setError('검사 이력을 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '날짜 정보 없음';
    
    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return dateString;
    }
  };

  // 상태 색상 가져오기
  const getStatusColor = (label?: string) => {
    if (!label) return {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-600'
    };
    
    if (label.includes('좋음') || label.includes('정상') || label.includes('낮음') || label.includes('양호')) {
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
    } else if (label.includes('중간') || label.includes('평균') || label.includes('보통')) {
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

  // 특정 결과 보기
  const viewResult = async (resultId: string) => {
    try {
      // 프로덕션 환경에서는 API를 통해 특정 결과 불러오기
      if (process.env.NODE_ENV !== 'development') {
        const response = await fetch(`/api/result?resultId=${encodeURIComponent(resultId)}`);
        const data = await response.json();
        
        if (data.success) {
          localStorage.setItem('surveyResult', JSON.stringify(data));
          router.push('/survey/result');
          return;
        } else {
          alert(data.message || '결과를 불러오는데 실패했습니다');
          return;
        }
      }
      
      // 개발 환경에서는 로컬 스토리지에 간이 결과 생성
      const mockResult = {
        success: true,
        resultId: resultId,
        categoryResults: {
          '완벽주의로 인한 불안': { mean: 3.2, label: '보통', description: '완벽주의와 관련된 불안 수준이 평균적입니다.' },
          '부모역할 효능감으로 인한 불안': { mean: 2.8, label: '양호', description: '부모 역할에 대한 불안이 비교적 낮은 수준입니다.' },
          '자녀와의 애착에 대한 불안': { mean: 2.5, label: '양호', description: '자녀와의 애착 관계에 대한 불안이 낮은 편입니다.' },
          '자녀에 대한 염려': { mean: 3.5, label: '약간 높음', description: '자녀에 대한 걱정이 다소 높은 수준입니다.' },
          '사회적 지지에 대한 염려': { mean: 2.9, label: '보통', description: '주변의 지원에 대한 불안이 평균적입니다.' }
        },
        globalResult: { mean: 3.0, label: '보통', description: '전반적인 양육 불안 수준이 평균적입니다. 일상적인 양육 스트레스를 경험하고 있지만, 건강한 범위 내에 있습니다.' },
        baiResult: { sum: 15, label: '경미한 불안', description: '일반적인 불안 수준이 경미한 상태입니다.' },
        userInfo: userInfo,
        name: userInfo.name || '',
        peerReview: [],
        selfReview: [],
        registrationTime: new Date().toISOString(),
        isHistory: true
      };
      
      localStorage.setItem('surveyResult', JSON.stringify(mockResult));
      router.push('/survey/result');
    } catch (error) {
      console.error('결과 불러오기 오류:', error);
      alert('결과를 불러오는 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white flex flex-col min-h-screen">
      {/* Title container */}
      <div className="w-full px-5 pt-8 pb-5 flex flex-col justify-start items-start gap-3">
        <div className="self-stretch justify-start text-black text-xl md:text-2xl font-bold font-['Pretendard_Variable'] leading-loose">검사 이력</div>
        <div className="self-stretch justify-start text-zinc-600 text-sm md:text-base font-normal font-['Pretendard_Variable'] leading-snug">
          {userInfo.name ? `${userInfo.name}님의 ` : ''}이전 검사 결과 목록입니다. 확인하려는 결과를 선택하세요.
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 w-full px-5 pb-6">
        {loading ? (
          <div className="py-10 text-center text-gray-600">검사 이력을 불러오는 중...</div>
        ) : error ? (
          <div className="py-10 text-center text-red-500">{error}</div>
        ) : historyResults.length === 0 ? (
          <div className="py-10 text-center text-gray-600">
            <p className="mb-5">검사 이력이 없습니다.</p>
            <Link 
              href="/survey"
              className="px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition"
            >
              검사 시작하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {historyResults.map((result) => (
              <div
                key={result.id}
                onClick={() => viewResult(result.id)}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-sky-300 hover:bg-sky-50 transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-gray-800">{formatDate(result.timestamp)}</div>
                  {result.globalResult && (
                    <div className={`${getStatusColor(result.globalResult.label).badge} px-2 py-1 rounded-full text-xs font-medium`}>
                      {result.globalResult.label} ({result.globalResult.mean.toFixed(1)}점)
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  클릭하여 상세 결과 보기
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Bottom buttons */}
      <div className="w-full px-5 pb-10">
        <Link 
          href="/survey"
          className="w-full px-4 py-3 bg-white border border-sky-500 text-sky-500 font-semibold rounded-lg hover:bg-sky-50 transition flex justify-center items-center"
        >
          <div className="text-center justify-center text-sky-500 text-base font-semibold font-['Pretendard_Variable'] leading-6">
            새 검사 시작하기
          </div>
        </Link>
      </div>
    </div>
  );
} 