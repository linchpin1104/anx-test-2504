'use client';

import React, { useState, useEffect } from 'react';

interface SurveyResult {
  id: string;
  timestamp: string;
}

interface SurveySelectionModalProps {
  results: SurveyResult[];
  onClose: () => void;
  onSelectExisting: (resultId: string) => void;
  onStartNew: () => void;
}

export default function SurveySelectionModal({
  results,
  onClose,
  onSelectExisting,
  onStartNew
}: SurveySelectionModalProps) {
  const [showResultsList, setShowResultsList] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(
    results.length > 0 ? results[0].id : null
  );

  useEffect(() => {
    console.log('SurveySelectionModal 마운트됨:', { results, showResultsList });
    
    // 모달이 제대로 표시되도록 body 스크롤 방지
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [results, showResultsList]);

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return dateString;
    }
  };

  const handleExistingClick = () => {
    if (results.length === 1 || selectedResultId) {
      // 결과가 하나거나 이미 선택된 결과가 있으면 바로 처리
      onSelectExisting(selectedResultId || results[0].id);
    } else {
      // 결과가 여러 개이면 목록 표시
      setShowResultsList(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">검사 옵션</h2>
        <p className="text-gray-600 mb-6">이전에 완료한 검사 결과가 있습니다. 어떤 작업을 진행하시겠습니까?</p>
        
        {!showResultsList ? (
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleExistingClick}
              className="w-full py-3 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition"
            >
              기존 검사 결과 보기
            </button>
            <button
              onClick={onStartNew}
              className="w-full py-3 bg-white border border-sky-500 text-sky-500 font-semibold rounded-lg hover:bg-sky-50 transition"
            >
              새로운 검사 진행하기
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-gray-500 font-semibold hover:text-gray-700 transition"
            >
              취소
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">검사 결과 선택</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => setSelectedResultId(result.id)}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedResultId === result.id ? 'border-sky-500 bg-sky-50' : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium">{formatDate(result.timestamp)}</div>
                </div>
              ))}
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => onSelectExisting(selectedResultId || results[0].id)}
                disabled={!selectedResultId}
                className="flex-1 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition disabled:bg-gray-300"
              >
                선택
              </button>
              <button
                onClick={() => setShowResultsList(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                뒤로
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 