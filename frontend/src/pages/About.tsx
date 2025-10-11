import React from 'react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            프로젝트 소개
          </h1>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                기술 스택
              </h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>React 18 - 사용자 인터페이스 라이브러리</li>
                <li>TypeScript - 타입 안전성을 위한 정적 타입 언어</li>
                <li>Vite - 빠른 개발 서버와 빌드 도구</li>
                <li>Tailwind CSS - 유틸리티 우선 CSS 프레임워크</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                프로젝트 구조
              </h2>
              <div className="bg-gray-100 rounded-lg p-4">
                <pre className="text-sm text-gray-700">
{`src/
├── components/     # 재사용 가능한 컴포넌트
├── pages/         # 페이지 컴포넌트
├── assets/        # 이미지, 폰트 등 정적 파일
├── styles/        # 전역 스타일
└── utils/         # 유틸리티 함수`}
                </pre>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                개발 시작하기
              </h2>
              <p className="text-gray-600">
                개발을 시작하려면 <code className="bg-gray-200 px-2 py-1 rounded text-sm">src/App.tsx</code> 파일을 수정하거나
                새로운 컴포넌트를 <code className="bg-gray-200 px-2 py-1 rounded text-sm">src/components/</code> 디렉터리에 추가하세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;



