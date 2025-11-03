import React, { useState, useEffect } from 'react';

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  icon: string;
  warning?: string;
  warningType?: 'caution' | 'danger';
}

export interface RouteInfo {
  totalDistance: string;
  totalDuration: string;
  steps: RouteStep[];
  startLocation: { lat: number; lng: number; name: string };
  endLocation: { lat: number; lng: number; name: string };
}

interface RouteCalculatorProps {
  startLocation: { lat: number; lng: number; name: string } | null;
  endLocation: { lat: number; lng: number; name: string } | null;
  mode: 'walking' | 'wheelchair';
  filter: 'safest' | 'no-stairs' | 'recommended';
  onRouteCalculated: (route: RouteInfo | null) => void;
}

const RouteCalculator: React.FC<RouteCalculatorProps> = ({
  startLocation,
  endLocation,
  mode,
  filter,
  onRouteCalculated
}) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startLocation && endLocation) {
      calculateRoute();
    } else {
      onRouteCalculated(null);
    }
  }, [startLocation, endLocation, mode, filter]);

  const calculateRoute = async () => {
    if (!startLocation || !endLocation) return;

    setIsCalculating(true);
    setError(null);

    try {
      console.log('🗺️ 경로 계산 시작:', { startLocation, endLocation, mode, filter });

      // 백엔드 API 호출
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/route/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startLocation: {
            lat: startLocation.lat,
            lng: startLocation.lng,
            name: startLocation.name
          },
          endLocation: {
            lat: endLocation.lat,
            lng: endLocation.lng,
            name: endLocation.name
          },
          mode,
          filter
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const routeInfo: RouteInfo = await response.json();

      // 응답 데이터 유효성 검사
      if (!routeInfo || !routeInfo.steps || !Array.isArray(routeInfo.steps)) {
        throw new Error('Invalid route data received from server');
      }

      onRouteCalculated(routeInfo);
      console.log('✅ 경로 계산 완료:', routeInfo);

    } catch (err) {
      console.error('❌ 경로 계산 오류:', err);
      setError(`경로 계산 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);

      // 오류 발생 시 모의 데이터 사용
      const mockRoute = generateMockRoute(startLocation, endLocation, mode, filter);
      onRouteCalculated(mockRoute);
    } finally {
      setIsCalculating(false);
    }
  };


  const generateMockRoute = (
    start: { lat: number; lng: number; name: string },
    end: { lat: number; lng: number; name: string },
    mode: 'walking' | 'wheelchair',
    filter: 'safest' | 'no-stairs' | 'recommended'
  ): RouteInfo => {
    const baseSteps: RouteStep[] = [
      {
        instruction: '메인 스트리트를 동쪽으로 직진',
        distance: '150m',
        duration: '2분',
        icon: '→',
        warning: mode === 'wheelchair' ? '가파른 오르막길 주의' : undefined,
        warningType: mode === 'wheelchair' ? 'caution' : undefined
      },
      {
        instruction: '브로드웨이로 좌회전',
        distance: '400m',
        duration: '5분',
        icon: '←',
        warning: filter === 'no-stairs' ? '계단 구간 회피' : undefined,
        warningType: filter === 'no-stairs' ? 'caution' : undefined
      },
      {
        instruction: '파크 애비뉴로 계속 직진',
        distance: '500m',
        duration: '6분',
        icon: '↑',
        warning: '공사 구간, 주의해서 통행',
        warningType: 'danger'
      }
    ];

    // 필터에 따라 경로 조정
    let adjustedSteps = [...baseSteps];
    if (filter === 'no-stairs') {
      adjustedSteps = adjustedSteps.map(step => ({
        ...step,
        warning: step.warning || '계단 회피 경로',
        warningType: step.warningType || 'caution'
      }));
    }

    return {
      totalDistance: '1.2km',
      totalDuration: '13분',
      steps: adjustedSteps,
      startLocation: start,
      endLocation: end
    };
  };



  return (
    <div className="mb-4">
      {isCalculating && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-sm text-gray-600">경로 계산 중...</span>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteCalculator;
