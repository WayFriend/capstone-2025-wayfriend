// API URL 설정 유틸리티

/**
 * API Base URL을 가져옵니다.
 * - Vercel 배포: 환경 변수로 EC2 백엔드에 직접 연결
 * - 개발 환경: 환경 변수 또는 기본값(EC2) 사용
 */
export const getApiBaseUrl = (): string => {
  // 브라우저 환경에서만 실행 (SSR 방지)
  if (typeof window === 'undefined') {
    return '/api/proxy';
  }

  // Vercel 도메인 또는 프로덕션 환경 감지
  const hostname = window.location.hostname;
  const isProduction = hostname.includes('vercel.app') ||
                       hostname.includes('vercel.com') ||
                       import.meta.env.PROD ||
                       (hostname !== 'localhost' && hostname !== '127.0.0.1');

  if (isProduction) {
    // Vercel 배포: 환경 변수로 EC2 백엔드 HTTPS에 직접 연결
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    return envUrl || '/api/proxy';
  }

  // 개발 환경: 환경 변수가 있으면 사용, 없으면 EC2 백엔드 기본값 사용
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  // Nginx reverse proxy를 통해 HTTPS 제공 (포트 443)
  return envUrl || 'https://34.239.248.132';  // EC2 백엔드 HTTPS 주소
};

// 기본 API Base URL (런타임에 결정)
export const API_BASE_URL = getApiBaseUrl();

/**
 * API 엔드포인트 URL을 생성합니다.
 * 프록시를 사용하는 경우 /api 접두사를 제거합니다.
 * @param endpoint API 엔드포인트 (예: '/api/config', '/user/login')
 * @returns 완전한 API URL
 */
export const getApiUrl = (endpoint: string): string => {
  // 엔드포인트 정규화 (앞에 /가 없으면 추가)
  let normalizedEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

  // API_BASE_URL이 프록시인 경우 /api 접두사 제거
  // 예: /api/config -> /config, /user/login -> /user/login
  if (API_BASE_URL.startsWith('/api/proxy')) {
    if (normalizedEndpoint.startsWith('/api/')) {
      normalizedEndpoint = normalizedEndpoint.replace('/api/', '/');
    }
    return `${API_BASE_URL}${normalizedEndpoint}`;
  }

  // 직접 연결인 경우 그대로 사용
  return `${API_BASE_URL}${normalizedEndpoint}`;
};

