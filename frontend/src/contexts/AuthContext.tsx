import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, logout as logoutService } from '../services/authService';
import { getEmailFromToken } from '../utils/helpers';

interface AuthContextType {
  isLoggedIn: boolean;
  userEmail: string | null;
  checkLoginStatus: () => void;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const checkLoginStatus = useCallback(() => {
    const token = getToken();
    if (token) {
      setIsLoggedIn(true);
      const email = getEmailFromToken(token);
      setUserEmail(email);
    } else {
      setIsLoggedIn(false);
      setUserEmail(null);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutService();
      setIsLoggedIn(false);
      setUserEmail(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  }, []);

  useEffect(() => {
    // 초기 로그인 상태 확인
    checkLoginStatus();

    // storage 이벤트 리스너 추가 (다른 탭에서 로그인/로그아웃 시)
    window.addEventListener('storage', checkLoginStatus);

    // 커스텀 이벤트 리스너 추가 (같은 탭에서 로그인/로그아웃 시)
    // storage 이벤트는 다른 탭에서만 발생하므로, 같은 탭에서는 커스텀 이벤트 사용
    const handleAuthChange = () => {
      checkLoginStatus();
    };
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [checkLoginStatus]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userEmail,
        checkLoginStatus,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

