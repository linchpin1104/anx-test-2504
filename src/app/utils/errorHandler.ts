// 에러 타입 정의
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  SERVER = 'SERVER_ERROR',
  CLIENT = 'CLIENT_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
  STORAGE = 'STORAGE_ERROR',
}

// 구조화된 에러 인터페이스
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string | number;
  originalError?: unknown;
}

/**
 * 표준화된 애플리케이션 에러를 생성합니다.
 */
export function createAppError(
  type: ErrorType,
  message: string,
  code?: string | number,
  originalError?: unknown
): AppError {
  return {
    type,
    message,
    code,
    originalError,
  };
}

/**
 * 기본 에러를 애플리케이션 에러로 변환합니다.
 */
export function handleError(error: unknown): AppError {
  console.error('에러 발생:', error);
  
  // 이미 AppError 형태인 경우
  if (typeof error === 'object' && error !== null && 'type' in error && 'message' in error) {
    return error as AppError;
  }
  
  // Error 인스턴스인 경우
  if (error instanceof Error) {
    // 네트워크 에러 처리
    if (error.name === 'NetworkError' || error.message.includes('network') || error.message.includes('fetch')) {
      return createAppError(
        ErrorType.NETWORK,
        '네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인해주세요.',
        undefined,
        error
      );
    }
    
    // 그 외 일반 에러
    return createAppError(
      ErrorType.UNKNOWN,
      error.message || '알 수 없는 오류가 발생했습니다.',
      undefined,
      error
    );
  }
  
  // 문자열 에러
  if (typeof error === 'string') {
    return createAppError(
      ErrorType.UNKNOWN,
      error,
      undefined,
      error
    );
  }
  
  // 기타 타입의 에러
  return createAppError(
    ErrorType.UNKNOWN,
    '알 수 없는 오류가 발생했습니다.',
    undefined,
    error
  );
}

/**
 * API 응답 에러 처리
 */
export async function handleApiError(response: Response): Promise<AppError> {
  try {
    const errorData = await response.json();
    
    const statusCode = response.status;
    let errorType = ErrorType.UNKNOWN;
    let message = errorData?.message || '서버 오류가 발생했습니다.';
    
    // HTTP 상태 코드에 따른 에러 타입 분류
    if (statusCode >= 400 && statusCode < 500) {
      if (statusCode === 401 || statusCode === 403) {
        errorType = ErrorType.AUTHENTICATION;
        message = '인증에 실패했습니다. 다시 로그인해주세요.';
      } else if (statusCode === 422 || statusCode === 400) {
        errorType = ErrorType.VALIDATION;
        message = errorData?.message || '입력 데이터가 유효하지 않습니다.';
      } else {
        errorType = ErrorType.CLIENT;
      }
    } else if (statusCode >= 500) {
      errorType = ErrorType.SERVER;
      message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    
    return createAppError(errorType, message, statusCode, errorData);
  } catch (error) {
    // JSON 파싱 실패 시
    return createAppError(
      ErrorType.SERVER,
      '서버 응답을 처리하는 중 오류가 발생했습니다.',
      response.status,
      error
    );
  }
}

/**
 * 로컬 스토리지 에러 처리
 */
export function handleStorageError(operation: string, key: string, error: unknown): AppError {
  const message = `${operation} 작업 중 로컬 스토리지에 문제가 발생했습니다.`;
  console.error(`로컬 스토리지 에러 (${key}):`, error);
  
  return createAppError(
    ErrorType.STORAGE,
    message,
    undefined,
    error
  );
}

/**
 * 안전한 로컬 스토리지 읽기
 */
export function safeGetItem(key: string, defaultValue: string = ''): string {
  try {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    handleStorageError('읽기', key, error);
    return defaultValue;
  }
}

/**
 * 안전한 로컬 스토리지 쓰기
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    handleStorageError('쓰기', key, error);
    return false;
  }
}

/**
 * 안전한 로컬 스토리지 삭제
 */
export function safeRemoveItem(key: string): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    handleStorageError('삭제', key, error);
    return false;
  }
}

/**
 * 사용자 친화적 에러 메시지 표시
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const appError = handleError(error);
  
  switch (appError.type) {
    case ErrorType.NETWORK:
      return '네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인해주세요.';
    case ErrorType.VALIDATION:
      return appError.message || '입력한 정보가 유효하지 않습니다. 다시 확인해주세요.';
    case ErrorType.AUTHENTICATION:
      return '로그인이 필요하거나 권한이 없습니다.';
    case ErrorType.SERVER:
      return '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
    case ErrorType.STORAGE:
      return '브라우저 저장소에 문제가 발생했습니다. 개인정보 보호 설정을 확인해주세요.';
    default:
      return appError.message || '예상치 못한 오류가 발생했습니다. 다시 시도해주세요.';
  }
} 