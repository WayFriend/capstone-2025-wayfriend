import React, { useState, useEffect, useRef } from 'react';
import RevealElement from '../components/RevealElement';
import Footer from '../components/Footer';
import { getToken } from '../services/authService';
import { getEmailFromToken } from '../utils/helpers';
import heroImage from '../images/main.png';
import step1Image from '../images/step1.png';
import step2Image from '../images/step2.png';
import step3Image from '../images/step3.png';

const Home: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const prevLoggedInRef = useRef(false);

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = getToken();
      const currentlyLoggedIn = !!token;

      if (currentlyLoggedIn) {
        const email = getEmailFromToken(token);
        setUserEmail(email);

        // 로그인 상태가 false에서 true로 변경되었을 때만 메시지 표시
        if (!prevLoggedInRef.current && currentlyLoggedIn) {
          setShowWelcomeMessage(true);
        }
        setIsLoggedIn(true);
        prevLoggedInRef.current = true;
      } else {
        setIsLoggedIn(false);
        setUserEmail(null);
        prevLoggedInRef.current = false;
        setShowWelcomeMessage(false);
      }
    };

    checkLoginStatus();
    // 로그인 상태 변경을 감지하기 위해 주기적으로 확인
    const interval = setInterval(checkLoginStatus, 1000);

    // storage 이벤트 리스너 추가 (다른 탭에서 로그인/로그아웃 시)
    window.addEventListener('storage', checkLoginStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-dark-gray">
      {/* 로그인 환영 메시지 */}
      {isLoggedIn && showWelcomeMessage && (
        <div className="bg-brand-blue text-white py-4 px-6 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <p className="text-lg font-medium">
              {userEmail ? (
                <>
                  환영합니다, <span className="font-bold">{userEmail}</span>님! 로그인되었습니다.
                </>
              ) : (
                '로그인되었습니다.'
              )}
            </p>
            <button
              onClick={() => setShowWelcomeMessage(false)}
              className="ml-4 text-white hover:text-gray-200 transition-colors"
              aria-label="메시지 닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-bg">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-20 md:py-32 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <RevealElement className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
              세상의 모든 길을<br/>
              <span className="text-brand-blue">당신의 편</span>으로 만듭니다
            </h1>
            <p className="text-lg text-medium-gray mb-10">
              객체 탐지 기술과 사용자 참여로 만드는 가장 안전하고 정확한 보행 경로를 지금 바로 찾아보세요.
            </p>
            <a href="#" className="inline-block bg-brand-blue text-white font-bold py-4 px-10 rounded-xl text-lg hover:bg-opacity-90 transition-transform hover:scale-105 transform">
              길찾기 시작하기
            </a>
          </RevealElement>
          <RevealElement delay={200}>
            <div className="rounded-2xl overflow-hidden relative bg-[#F0F5FF] p-8">
            <img
                src={heroImage}
                className="w-full h-auto"
              alt="휠체어를 탄 사람과 시민들이 함께하는 도시 일러스트"
                style={{
                  filter: 'contrast(1.1) brightness(0.98)'
                }}
            />
            </div>
          </RevealElement>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-pale-blue pt-24 pb-12">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
          <RevealElement className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Way Friends가 특별한 이유</h2>
            <p className="text-lg text-medium-gray mt-4 max-w-2xl mx-auto">
              단순한 길안내를 넘어, 모두가 안심하고 걸을 수 있는 환경을 함께 만들어갑니다.
            </p>
          </RevealElement>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1: Smart Obstacle Avoidance */}
            <RevealElement delay={100}>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 soft-shadow text-center transition-transform hover:-translate-y-2">
                <div className="bg-blue-100 text-brand-blue rounded-full p-4 mb-6 inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">스마트한 장애물 회피</h3>
                <p className="text-medium-gray">
                  AI가 계단, 공사구간 등 보행 약자의 이동을 방해하는 요소를 실시간으로 파악하여 안전한 길로만 안내합니다.
                </p>
              </div>
            </RevealElement>

            {/* Feature 2: User-Participation Map */}
            <RevealElement delay={200}>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 soft-shadow text-center transition-transform hover:-translate-y-2">
                <div className="bg-blue-100 text-brand-blue rounded-full p-4 mb-6 inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">사용자 참여형 지도</h3>
                <p className="text-medium-gray">
                  사용자가 직접 위험 요소를 신고하고 정보를 공유하며, 함께 더 정확하고 안전한 지도를 만들어갑니다.
                </p>
              </div>
            </RevealElement>

            {/* Feature 3: Personalized Routes */}
            <RevealElement delay={300}>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 soft-shadow text-center transition-transform hover:-translate-y-2">
                <div className="bg-blue-100 text-brand-blue rounded-full p-4 mb-6 inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    <path d="m15 5 3 3"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">개인 맞춤 경로</h3>
                <p className="text-medium-gray">
                  도보, 휠체어 등 나의 이동 수단과 선호도(최단 경로, 계단 회피 등)에 맞춰 최적의 경로를 제공합니다.
                </p>
              </div>
            </RevealElement>
          </div>
        </div>
      </section>

      {/* SVG Wave Divider */}
      <div className="leading-none" style={{backgroundColor: '#F0F5FF'}}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#ffffff" fillOpacity="1" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,133.3C960,107,1056,85,1152,96C1248,107,1344,149,1392,170.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* How it Works Section */}
      <section className="bg-white pt-12 pb-12">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 space-y-20">
          <RevealElement className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold">간단한 3단계 길찾기</h2>
          </RevealElement>

          {/* Step 1 */}
          <RevealElement>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="bg-pale-blue rounded-2xl p-8">
                <img
                  src={step1Image}
                  className="rounded-xl soft-shadow w-full"
                  alt="출발지와 도착지를 입력하는 화면"
                />
              </div>
              <div>
                <span className="font-bold text-brand-blue">STEP 1</span>
                <h3 className="text-3xl font-bold my-3">목적지 설정</h3>
                <p className="text-lg text-medium-gray">
                  가고 싶은 곳을 입력하고, 이동 수단(도보, 휠체어)과 원하는 경로 옵션을 선택하세요.
                </p>
              </div>
            </div>
          </RevealElement>

          {/* Step 2 */}
          <RevealElement>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="md:order-2 bg-pale-blue rounded-2xl p-8">
                <img
                  src={step2Image}
                  className="rounded-xl soft-shadow w-full"
                  alt="안전한 경로가 표시된 지도"
                />
              </div>
              <div className="md:order-1 md:text-right">
                <span className="font-bold text-brand-blue">STEP 2</span>
                <h3 className="text-3xl font-bold my-3">안전한 경로 확인</h3>
                <p className="text-lg text-medium-gray">
                  Way Friends가 실시간 위험 요소를 피해 가장 안전하고 편안한 경로를 찾아드립니다.
                </p>
              </div>
            </div>
          </RevealElement>

          {/* Step 3 */}
          <RevealElement>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="bg-pale-blue rounded-2xl p-8">
                <img
                  src={step3Image}
                  className="rounded-xl soft-shadow w-full"
                  alt="사용자가 지도 위 장애물을 신고하는 모습"
                />
              </div>
              <div>
                <span className="font-bold text-brand-blue">STEP 3</span>
                <h3 className="text-3xl font-bold my-3">함께 지도 만들기</h3>
                <p className="text-lg text-medium-gray">
                  지도에 없던 장애물을 발견했나요? 사진과 함께 간단히 신고하여 모두의 길을 더 안전하게 만들어주세요.
                </p>
              </div>
            </div>
          </RevealElement>
        </div>
      </section>

      {/* Another SVG Wave Divider */}
      <div className="leading-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#3A86FF" fillOpacity="1" d="M0,224L48,208C96,192,192,160,288,170.7C384,181,480,235,576,234.7C672,235,768,181,864,176C960,171,1056,213,1152,224C1248,235,1344,213,1392,202.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
      <section className="bg-brand-blue">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 pt-12 pb-24 text-center text-white">
          <RevealElement>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">지금 바로 당신의 안전한 길을 찾아보세요</h2>
          </RevealElement>
          <RevealElement delay={100}>
            <p className="text-lg text-blue-200 mb-8 max-w-xl mx-auto">
              Way Friends와 함께라면 어떤 길이든 안심하고 걸을 수 있습니다.
            </p>
          </RevealElement>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
