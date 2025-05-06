'use client';

import React from 'react';
import { ErrorType } from '../utils/errorHandler';

interface ErrorMessageProps {
  type?: ErrorType;
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * 에러 메시지를 표시하는 컴포넌트
 * 에러 타입에 따라 다른 스타일과 아이콘을 표시합니다.
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  type,
  message,
  onRetry,
  className = '',
}) => {
  // 타입별 색상 및 아이콘 설정
  let bgColor = 'bg-red-50';
  let textColor = 'text-red-700';
  let borderColor = 'border-red-200';
  let iconPath = (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  );

  if (type) {
    switch (type) {
      case ErrorType.NETWORK:
        bgColor = 'bg-orange-50';
        textColor = 'text-orange-700';
        borderColor = 'border-orange-200';
        iconPath = (
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l8.735 8.735m0 0a.374.374 0 11.53.53m-.53-.53l.53.53m0 0L21 21M14.652 9.348a3.75 3.75 0 010 5.304m2.121-7.425a6.75 6.75 0 010 9.546m2.121-11.667c3.808 3.807 3.808 9.98 0 13.788m-9.546-4.242a3.733 3.733 0 01-1.06-2.122m-1.061 4.243a6.75 6.75 0 01-1.625-6.929m-.496 9.05c-3.068-3.067-3.664-7.67-1.79-11.334M12 12h.008v.008H12z" />
        );
        break;
      case ErrorType.VALIDATION:
        bgColor = 'bg-yellow-50';
        textColor = 'text-yellow-700';
        borderColor = 'border-yellow-200';
        iconPath = (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.401 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        );
        break;
      case ErrorType.AUTHENTICATION:
        bgColor = 'bg-purple-50';
        textColor = 'text-purple-700';
        borderColor = 'border-purple-200';
        iconPath = (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        );
        break;
      case ErrorType.STORAGE:
        bgColor = 'bg-blue-50';
        textColor = 'text-blue-700';
        borderColor = 'border-blue-200';
        iconPath = (
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        );
        break;
      case ErrorType.SERVER:
        bgColor = 'bg-red-50';
        textColor = 'text-red-700';
        borderColor = 'border-red-200';
        iconPath = (
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
        );
        break;
      default:
        // 기본 에러 스타일 유지
        break;
    }
  }

  return (
    <div className={`p-4 mb-4 border rounded-lg ${bgColor} ${borderColor} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className={`w-5 h-5 ${textColor}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {iconPath}
          </svg>
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        </div>
      </div>
      
      {onRetry && (
        <div className="mt-2 text-right">
          <button
            onClick={onRetry}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border ${textColor} border-current hover:bg-opacity-10 hover:bg-current`}
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage; 