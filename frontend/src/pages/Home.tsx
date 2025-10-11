import React, { useState } from 'react';
import Button from '../components/Button';

const Home: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            프론트엔드 프로젝트에 오신 것을 환영합니다!
          </h1>

          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              카운터 예제
            </h2>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Button
                onClick={() => setCount(count - 1)}
                variant="secondary"
              >
                -
              </Button>
              <span className="text-3xl font-bold text-blue-600 min-w-[60px]">
                {count}
              </span>
              <Button
                onClick={() => setCount(count + 1)}
                variant="primary"
              >
                +
              </Button>
            </div>
            <Button
              onClick={() => setCount(0)}
              variant="secondary"
            >
              리셋
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              프로젝트 정보
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              React + TypeScript + Vite로 구축된 현대적인 프론트엔드 프로젝트입니다.
              <br />
              컴포넌트 기반 아키텍처와 타입 안전성을 제공합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;



