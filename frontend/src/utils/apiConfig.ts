// API URL 설정 유틸리티

/**
 * API Base URL을 가져옵니다.
 * 프로덕션 환경에서는 프록시 사용, 개발 환경에서는 직접 연결
 */
export const getApiBaseUrl = (): string => {
  // 브라우저 환경에서만 실행 (SSR 방지)
  if (typeof window === 'undefined') {
    return '/api/proxy';
  }

  // Vercel 도메인 또는 프로덕션 환경에서는 항상 프록시 사용
  const hostname = window.location.hostname;
  const isProduction = hostname.includes('vercel.app') ||
                       hostname.includes('vercel.com') ||
                       import.meta.env.PROD ||
                       (hostname !== 'localhost' && hostname !== '127.0.0.1');

  if (isProduction) {
    // 프로덕션에서는 항상 프록시 사용 (환경 변수 무시)
    return '/api/proxy';
  }

  // 개발 환경: 환경 변수가 있으면 사용, 없으면 기본값
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  return envUrl || 'http://34.239.248.132:8000';
};

// 기본 API Base URL (런타임에 결정)
export const API_BASE_URL = getApiBaseUrl();

