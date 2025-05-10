'use client';

import React, { useEffect, useState } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import ErrorMessage from '../components/ErrorMessage';
import SurveySelectionModal from '../components/SurveySelectionModal';
import { 
  ErrorType, 
  handleError, 
  handleApiError, 
  safeGetItem, 
  safeSetItem 
} from '../utils/errorHandler';

interface Question {
  category: string;
  id: string;
  text: string;
}

// 주석 처리: 전체 결과 페이지로 데이터가 이동되어 여기서는 불필요함
// interface CategoryResult {
//   mean: number;
//   label: string;
//   description: string;
// }

// interface BaiResult {
//   sum: number;
//   label: string;
//   description: string;
// }

interface HistoryResult {
  id: string;
  timestamp: string;
  globalResult?: {
    label: string;
    mean: number;
  };
}

type FormValues = Record<string, string>;

// 에러 타입 정의
type AppError = {
  type: ErrorType;
  message: string;
  status?: number;
};

export default function SurveyPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [generalScale, setGeneralScale] = useState<{ value: string; label: string }[]>([]);
  const [baiScale, setBaiScale] = useState<{ value: string; label: string }[]>([]);
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    phone?: string;
    childAge?: string;
    childGender?: string;
    parentAgeGroup?: string;
    caregiverType?: string;
    region?: string;
    marketingAgreed: boolean;
    privacyAgreed: boolean;
  }>({ marketingAgreed: false, privacyAgreed: false });
  const [historyResults, setHistoryResults] = useState<HistoryResult[]>([]);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    console.log('설문조사 페이지 로드됨');
    
    // 로컬 스토리지에서 사용자 정보 확인
    const userInfoStr = localStorage.getItem('userInfo');
    console.log('로컬 스토리지 userInfo:', userInfoStr);
    
    if (userInfoStr) {
      try {
        const savedUserInfo = JSON.parse(userInfoStr);
        setUserInfo(savedUserInfo);
        console.log('사용자 정보 로드됨:', savedUserInfo);
        
        // 추가: 사용자 정보가 완전한지 확인
        // region, childAge, childGender, parentAgeGroup, caregiverType 중 하나라도 없으면 정보 미완성
        const requiredBasicInfo = ['childAge', 'childGender', 'parentAgeGroup', 'caregiverType', 'region'];
        const hasIncompleteInfo = requiredBasicInfo.some(field => !safeGetItem(field));
        
        if (hasIncompleteInfo) {
          console.log('사용자 정보 불완전, 기본 정보 입력 페이지로 리디렉션', {
            childAge: safeGetItem('childAge'),
            childGender: safeGetItem('childGender'),
            parentAgeGroup: safeGetItem('parentAgeGroup'),
            caregiverType: safeGetItem('caregiverType'),
            region: safeGetItem('region')
          });
          
          // 기본 정보가 불완전한 경우 기본 정보 입력 페이지로 리디렉션
          router.replace('/register/basic-info');
          return;
        }
        
        // 테스트를 위해 임시 결과 이력 생성 (01052995980용)
        if (savedUserInfo.phone && savedUserInfo.phone.includes('01052995980')) {
          console.log('테스트 사용자(01052995980) 감지! 테스트 이력 데이터 생성');
          
          // 테스트 결과 ID 생성
          const testResultId = 'test-result-id-' + Date.now();
          const testHistory = [testResultId];
          localStorage.setItem('surveyResultHistory', JSON.stringify(testHistory));
          console.log('테스트 이력 저장됨:', testHistory);
          
          // 테스트 결과 목록 설정
          const mockHistory: HistoryResult[] = [{
            id: testResultId,
            timestamp: new Date().toISOString(),
            globalResult: {
              label: "좋음",
              mean: 3.5
            }
          }];
          
          setHistoryResults(mockHistory);
          
          // 강제로 약간 지연시킨 후 모달 표시
          setTimeout(() => {
            setShowSelectionModal(true);
            console.log('테스트 이력 데이터 생성 및 모달 표시 설정됨 (타임아웃 후)');
          }, 500);
          
          console.log('테스트 이력 데이터 생성 및 모달 표시 설정됨');
        }
        // 일반적인 사용자의 경우 이력 로드
        else if (savedUserInfo.phone) {
          loadUserHistory(savedUserInfo.phone);
        }
      } catch (e) {
        console.error('사용자 정보 파싱 오류:', e);
      }
    } else {
      console.log('사용자 정보가 없음, 로그인 페이지로 리디렉션 필요');
    }
    
    // 질문 데이터 불러오기
    fetchQuestions();
  }, []);
  
  // 사용자 검사 이력 불러오기
  const loadUserHistory = async (phone: string) => {
    try {
      console.log('loadUserHistory 호출됨:', phone);
      
      // 개발 환경에서 로컬 스토리지에서 이력 가져오기
      if (process.env.NODE_ENV === 'development') {
        const historyJson = localStorage.getItem('surveyResultHistory') || '[]';
        console.log('로컬 스토리지 이력 데이터:', historyJson);
        
        const historyIds = JSON.parse(historyJson) as string[];
        
        // 테스트용 이력 데이터 추가 (이력이 없을 경우)
        if (historyIds.length === 0) {
          console.log('이력이 없어 테스트 데이터 생성');
          const testId = 'test-result-' + Date.now();
          const testHistory = [testId];
          localStorage.setItem('surveyResultHistory', JSON.stringify(testHistory));
          
          const mockHistory: HistoryResult[] = [{
            id: testId,
            timestamp: new Date().toISOString(),
          }];
          
          setHistoryResults(mockHistory);
          setShowSelectionModal(true);
          console.log('테스트 데이터로 모달 표시 설정');
          return;
        }
        
        if (historyIds.length > 0) {
          // 로컬 스토리지에서 결과가 있으면 모달 표시 준비
          const mockHistory: HistoryResult[] = historyIds.map((id, index) => ({
            id,
            timestamp: new Date(Date.now() - index * 86400000).toISOString(), // 하루씩 이전 날짜
          }));
          
          setHistoryResults(mockHistory);
          console.log('이력 데이터 설정:', mockHistory);
          
          // 이력이 있으면 모달 표시 (이전 결과가 없어도 이력이 있으면 표시)
          setShowSelectionModal(true);
          console.log('모달 표시 설정됨: true');
        }
        return;
      }
      
      // 프로덕션 환경에서 서버에서 이력 가져오기
      const response = await fetch(`/api/result/user-history?userId=${encodeURIComponent(phone)}`);
      const data = await response.json();
      console.log('API 응답 데이터:', data);
      
      if (data.success) {
        if (data.useLocalStorage) {
          // 개발 환경 처리 위와 동일
          console.log('개발 환경: 로컬 스토리지의 이력 데이터 사용');
          return;
        }
        
        if (data.results && data.results.length > 0) {
          // 결과 이력 저장
          setHistoryResults(data.results);
          console.log('API 이력 데이터 설정:', data.results);
          
          // 이력이 있으면 모달 표시 (이전 결과가 없어도 이력이 있으면 표시)
          setShowSelectionModal(true);
          console.log('모달 표시 설정됨: true (API)');
        }
      }
    } catch (error) {
      console.error('검사 이력 불러오기 오류:', error);
    }
  };

  // 이전 검사 결과 불러오기
  const loadPreviousResult = async (resultId: string) => {
    try {
      console.log('이전 결과 불러오기 시도:', resultId);
      
      // 테스트 ID인 경우 목업 데이터 생성
      if (resultId.startsWith('test-result-')) {
        console.log('테스트 결과 ID 감지, 목업 데이터 생성');
        
        // 목업 결과 데이터 생성
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
          registrationTime: new Date().toISOString()
        };
        
        // 로컬 스토리지에 저장
        localStorage.setItem('surveyResult', JSON.stringify(mockResult));
        console.log('목업 결과 데이터 생성 완료', mockResult);
        return;
      }
      
      // 이미 로컬 스토리지에 결과가 있는 경우 사용
      const storedResult = localStorage.getItem('surveyResult');
      if (storedResult) {
        const result = JSON.parse(storedResult);
        if (result.resultId === resultId) {
          console.log('이미 동일한 결과가 로드되어 있음:', resultId);
          return; // 이미 해당 결과가 로드되어 있음
        }
      }
      
      // 개발 환경에서는 목업 데이터 사용
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경: 이전 결과를 로컬 스토리지에서 찾을 수 없음, 새 결과 생성');
        // 실제로는 여기서 Firestore에서 해당 ID로 검색해야 하지만, 개발환경은 그냥 진행
        return;
      }
      
      // 프로덕션에서는 API 호출로 결과 가져오기
      const response = await fetch(`/api/result/${resultId}`);
      const data = await response.json();
      
      if (data.success) {
        // 서버에서 받은 결과 데이터 저장
        const resultWithUserInfo = {
          ...data,
          name: userInfo.name || '',
          peerReview: [],  // 빈 데이터로 초기화
          selfReview: [],  // 빈 데이터로 초기화
          registrationTime: data.createdAt || new Date().toISOString(),
          userInfo
        };
        
        // 로컬 스토리지에 결과 저장
        localStorage.setItem('surveyResult', JSON.stringify(resultWithUserInfo));
        console.log('이전 검사 결과를 불러왔습니다:', resultId);
      }
    } catch (error) {
      console.error('이전 결과 불러오기 오류:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setQuestionsLoading(true);
      
      const response = await fetch('/api/questions');
      if (!response.ok) {
        throw { 
          type: ErrorType.SERVER,
          status: response.status,
          message: `서버 오류: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json();
      if (!data.success) {
        throw { 
          type: ErrorType.SERVER,
          message: data.message || '질문을 불러오는데 실패했습니다.'
        };
      }
      
      setQuestions(data.questions);
      
      // 일반 문항용 스케일
      setGeneralScale([
        { value: '1', label: '전혀 아니다' },
        { value: '2', label: '아니다' },
        { value: '3', label: '보통이다' },
        { value: '4', label: '그렇다' },
        { value: '5', label: '매우 그렇다' }
      ]);
      
      // BAI 문항용 스케일
      setBaiScale([
        { value: '0', label: '전혀' },
        { value: '1', label: '조금' },
        { value: '2', label: '상당히' },
        { value: '3', label: '심하게' }
      ]);
      
    } catch (err) {
      console.error('질문 로드 오류:', err);
      const appError = handleError(err);
      setError(appError);
    } finally {
      setQuestionsLoading(false);
    }
  };

  // 폼 제출 처리
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      // 로컬 스토리지에서 사용자 정보 가져오기
      const userInfo = {
        name: safeGetItem('registerName'),
        phone: safeGetItem('registerPhone'),
        childAge: safeGetItem('childAge'),
        childGender: safeGetItem('childGender'),
        parentAgeGroup: safeGetItem('parentAgeGroup'),
        caregiverType: safeGetItem('caregiverType'),
        region: safeGetItem('region'),
        marketingAgreed: localStorage.getItem('userInfo') ? 
          JSON.parse(localStorage.getItem('userInfo') || '{}').marketingAgreed || false : 
          false,
        privacyAgreed: localStorage.getItem('userInfo') ? 
          JSON.parse(localStorage.getItem('userInfo') || '{}').privacyAgreed || false : 
          false
      };
      
      // 필수 사용자 정보 확인
      if (!userInfo.name || !userInfo.phone) {
        throw { 
          type: ErrorType.VALIDATION, 
          message: '사용자 정보가 없습니다. 다시 로그인해주세요.' 
        };
      }

      // API 요청
      const res = await fetch('/api/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers: data,
          userInfo: userInfo
        }),
      });
      
      if (!res.ok) {
        throw await handleApiError(res);
      }
      
      const json = await res.json();
      
      if (!json.success) {
        throw { 
          type: ErrorType.SERVER, 
          message: json.message || '결과 처리 중 오류가 발생했습니다.' 
        };
      }
      
      // 결과 저장 및 페이지 이동
      if (typeof window !== 'undefined') {
        // 사용자 정보와 결과 ID를 포함하여 저장
        const resultWithUserInfo = {
          ...json,
          userInfo: userInfo
        };
        
        // 현재 결과 저장
        const saved = safeSetItem('surveyResult', JSON.stringify(resultWithUserInfo));
        if (!saved) {
          throw { 
            type: ErrorType.STORAGE, 
            message: '결과를 저장하는데 실패했습니다. 브라우저 설정을 확인해주세요.' 
          };
        }
        
        // 결과 이력 저장하기
        try {
          // 기존 이력 불러오기
          const historyJson = localStorage.getItem('surveyResultHistory') || '[]';
          const history = JSON.parse(historyJson) as string[];
          
          // 새 결과 ID 추가
          if (json.resultId) {
            history.unshift(json.resultId); // 최신 결과를 맨 앞에 추가
            
            // 중복 제거 및 최대 10개만 유지
            const uniqueHistory = [...new Set(history)].slice(0, 10);
            localStorage.setItem('surveyResultHistory', JSON.stringify(uniqueHistory));
          }
        } catch (historyError) {
          console.error('결과 이력 저장 오류:', historyError);
          // 이력 저장 실패는 치명적이지 않으므로 진행
        }
      }
      
      router.push('/survey/result');
      
    } catch (err) {
      console.error('제출 오류:', err);
      const appError = handleError(err);
      setError(appError);
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

  // 모달 관련 함수들
  const handleCloseModal = () => {
    setShowSelectionModal(false);
  };
  
  const handleSelectExisting = (resultId: string) => {
    // 이전 결과 불러오기
    loadPreviousResult(resultId).then(() => {
      // 결과 페이지로 이동
      router.push('/survey/result');
    }).catch(err => {
      console.error('이전 결과 불러오기 실패:', err);
      setError({
        type: ErrorType.UNKNOWN,
        message: '이전 결과를 불러오는데 실패했습니다. 새로운 검사를 시작해주세요.'
      });
    });
  };
  
  const handleStartNewSurvey = () => {
    // 새 검사 시작 위해 결과 지우고 모달 닫기
    localStorage.removeItem('surveyResult');
    setShowSelectionModal(false);
  };

  // 에러 메시지 표시 시 아래와 같이 수정
  const renderErrorMessage = () => {
    if (!error) return null;
    
    return (
      <ErrorMessage 
        type={error.type}
        message={error.message}
        onRetry={() => setError(null)}
      />
    );
  };

  if (questionsLoading) {
    return (
      <div className="w-full max-w-md mx-auto p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-sky-500 border-solid rounded-full animate-spin"></div>
        <p className="text-lg mt-4 text-gray-700">질문을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        {renderErrorMessage()}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <ErrorMessage 
          type={ErrorType.SERVER}
          message="질문 데이터를 찾을 수 없습니다. 관리자에게 문의하세요."
        />
      </div>
    );
  }

  // If result exists, show result UI - DISABLE THIS FOR NOW
  /* 주석 처리하여 이 코드를 무시하게 함
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
  */

  const formValues = watch();
  const hasAnswers = Object.keys(formValues).length > 0;

  // 모달 렌더링 추가
  return (
    <div className="w-full max-w-md mx-auto bg-white flex flex-col min-h-screen">
      {/* 선택 모달 */}
      {showSelectionModal && (
        <SurveySelectionModal 
          results={historyResults}
          onClose={handleCloseModal}
          onSelectExisting={handleSelectExisting}
          onStartNew={handleStartNewSurvey}
        />
      )}
      
      {/* Content container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Title container */}
        <div className="w-full px-5 pt-8 pb-5 flex flex-col justify-start items-start gap-3">
          <div className="self-stretch justify-start text-black text-xl md:text-2xl font-bold font-['Pretendard_Variable'] leading-loose">양육불안도 검사 (총 47문항)</div>
          <div className="self-stretch justify-start text-zinc-600 text-sm md:text-base font-normal font-['Pretendard_Variable'] leading-snug">양육불안검사는 부모가 양육과정에서 경험하는 불안수준을 측정하는 검사입니다. 불안수준을 확인하고 나에게 필요한 가이드를 받아보세요!</div>
        </div>

        {/* Alert box */}
        <div className="w-full px-5 pb-3 flex flex-col justify-start items-start gap-6">
          <div className="self-stretch px-4 py-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col justify-start items-start gap-2">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="size-4 relative">
                <div className="size-3.5 left-[1.33px] top-[1.33px] absolute bg-amber-500" />
              </div>
              <div className="justify-center text-amber-500 text-xs font-semibold font-['Pretendard_Variable'] leading-3">주의사항</div>
            </div>
            <div className="self-stretch justify-center text-zinc-600 text-xs font-normal font-['Pretendard_Variable'] leading-tight">모든 질문에 빠짐없이 응답해주세요. 제출 후에는 수정이 어렵습니다.</div>
          </div>
        </div>

        {/* 에러 메시지 표시 */}
        {error && (
          <div className="w-full px-5 mb-3">
            {renderErrorMessage()}
          </div>
        )}

        {/* Survey form */}
        <form onSubmit={handleSubmit(onSubmit, onError)} className="w-full flex-1 flex flex-col">
          <div className="w-full px-5 pt-5 pb-4 flex-1 flex flex-col justify-start items-start gap-8 overflow-y-auto">
            {questions.map((q, idx) => (
              <div key={q.id} className="self-stretch flex flex-col justify-start items-start gap-3 w-full">
                {idx === 26 && (
                  <div className="self-stretch px-4 py-4 bg-sky-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-sky-100 flex flex-col justify-start items-start gap-2 mb-6">
                    <div className="self-stretch text-sky-800 text-sm font-medium font-['Pretendard_Variable'] leading-normal">
                      다음의 문항을 읽으시고 현재 상태에 해당하는 것을 0~3점으로 표시해주세요. 지난 1주일간 겪었던 일반적인 불안 증상을 떠올리며 편한 마음으로 답변하시면 됩니다.
                    </div>
                  </div>
                )}
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
      </div>
    </div>
  );
} 