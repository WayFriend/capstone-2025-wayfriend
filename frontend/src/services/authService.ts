// 인증 API 서비스

import { getApiUrl } from '../utils/apiConfig';

export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface SignupResponse {
  msg: string;
}

// 토큰 저장
export const saveToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

// 토큰 가져오기
export const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// 토큰 삭제
export const removeToken = (): void => {
  localStorage.removeItem('access_token');
};

// 인증 헤더 가져오기
export const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// 회원가입
export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await fetch(getApiUrl('/user/signup'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // 세션/쿠키 사용시 필요
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `회원가입 실패: ${response.status}`);
  }

  return await response.json();
};

// 로그인
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(getApiUrl('/user/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // 세션/쿠키 사용시 필요
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `로그인 실패: ${response.status}`);
  }

  const result = await response.json();
  // 토큰 저장
  if (result.access_token) {
    saveToken(result.access_token);
    // 인증 상태 변경 이벤트 발생 (같은 탭에서 로그인 시)
    window.dispatchEvent(new Event('authChange'));
  }
  return result;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  try {
    await fetch(getApiUrl('/user/logout'), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',  // 세션/쿠키 사용시 필요
    });
  } catch (error) {
    console.error('로그아웃 API 호출 실패:', error);
  } finally {
    // 클라이언트 측 토큰 삭제
    removeToken();
    // 인증 상태 변경 이벤트 발생 (같은 탭에서 로그아웃 시)
    window.dispatchEvent(new Event('authChange'));
  }
};

// 현재 사용자 정보 가져오기 (필요시)
export const getCurrentUser = async () => {
  const token = getToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(getApiUrl('/user/me'), {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',  // 세션/쿠키 사용시 필요
  });

  if (!response.ok) {
    throw new Error('사용자 정보를 가져올 수 없습니다.');
  }

  return await response.json();
};

