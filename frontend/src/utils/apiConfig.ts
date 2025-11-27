// API URL 설정 유틸리티

/**
 * API Base URL을 가져옵니다.
 * 프로덕션 환경에서는 프록시 사용, 개발 환경에서는 직접 연결
 */
export const getApiBaseUrl = (): string => {
  // 환경 변수가 명시적으로 설정되어 있으면 사용
  if (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  }

  // 프로덕션 환경에서는 프록시 사용 (HTTPS에서 HTTP 백엔드 접근)
  if (import.meta.env.PROD) {
    return '/api/proxy';
  }

  // 개발 환경에서는 직접 연결
  return 'http://34.239.248.132:8000';
};

// 기본 API Base URL
export const API_BASE_URL = getApiBaseUrl();

