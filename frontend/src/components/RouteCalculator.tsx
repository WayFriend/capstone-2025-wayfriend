import React, { useState, useEffect } from 'react';
import { getToken } from '../services/authService';

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
  routePoints?: [number, number][]; // 백엔드에서 받은 원본 경로 좌표
  distanceM?: number; // 미터 단위 거리
}

interface RouteCalculatorProps {
  startLocation: { lat: number; lng: number; name: string } | null;
  endLocation: { lat: number; lng: number; name: string } | null;
  mode: 'walking' | 'wheelchair';
  filter: 'safest' | 'no-stairs' | 'recommended';
  avoidObstacles?: string[];
  onRouteCalculated: (route: RouteInfo | null) => void;
}

const RouteCalculator: React.FC<RouteCalculatorProps> = ({
  startLocation,
  endLocation,
  mode,
  filter,
  avoidObstacles = [],
  onRouteCalculated
}) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 출발지나 도착지가 변경되면 경로 정보 초기화
  useEffect(() => {
    if (!startLocation || !endLocation) {
      onRouteCalculated(null);
    }
  }, [startLocation, endLocation]);

  const calculateRoute = async () => {
    if (!startLocation || !endLocation) return;

    setIsCalculating(true);
    setError(null);

    try {
      console.log('🗺️ 경로 계산 시작:', { startLocation, endLocation, mode, filter, avoidObstacles });

      // 백엔드 API 호출
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://34.239.248.132:8000';
      const token = getToken();

      // 장애물 타입을 백엔드 형식으로 변환
      const avoidTypes = avoidObstacles || [];

      // 패널티 값 설정 (장애물 타입별)
      const penalties: Record<string, number> = {
        crosswalk: 1000,
        curb: 1500,
        bollard: 2000,
        stairs: 3000,
        ramp: 500
      };

      // 반경 설정 (미터)
      const radiusM = 50; // 50미터 반경 내 장애물 회피

      const response = await fetch(`${apiUrl}/route/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          start_lat: startLocation.lat,
          start_lng: startLocation.lng,
          end_lat: endLocation.lat,
          end_lng: endLocation.lng,
          avoid_types: avoidTypes,
          radius_m: radiusM,
          penalties: penalties
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const backendResponse = await response.json();
      console.log('✅ 백엔드 응답:', backendResponse);

      // 백엔드 응답을 프론트엔드 형식으로 변환
      const routeInfo = transformBackendResponse(
        backendResponse,
        startLocation,
        endLocation,
        mode
      );

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

  // 백엔드 응답을 프론트엔드 형식으로 변환
  const transformBackendResponse = (
    backendData: {
      route: [number, number][];
      distance_m: number;
      risk_factors: string[];
      avoided_final: string[];
    },
    startLoc: { lat: number; lng: number; name: string },
    endLoc: { lat: number; lng: number; name: string },
    mode: 'walking' | 'wheelchair'
  ): RouteInfo => {
    const route = backendData.route || [];
    const distanceM = backendData.distance_m || 0;
    const riskFactors = backendData.risk_factors || [];

    // 거리를 km로 변환
    const distanceKm = (distanceM / 1000).toFixed(2);
    const totalDistance = distanceM < 1000 ? `${Math.round(distanceM)}m` : `${distanceKm}km`;

    // 예상 시간 계산 (도보: 4km/h, 휠체어: 3km/h)
    const speedKmh = mode === 'wheelchair' ? 3 : 4;
    const durationMinutes = Math.round((distanceM / 1000) / speedKmh * 60);
    const totalDuration = `${durationMinutes}분`;

    // 경로 좌표를 단계로 변환
    const steps: RouteStep[] = [];
    if (route.length > 0) {
      // 경로를 여러 구간으로 나누어 단계 생성
      const numSteps = Math.min(route.length - 1, 5); // 최대 5단계
      const stepSize = Math.max(1, Math.floor((route.length - 1) / numSteps));

      for (let i = 0; i < route.length - 1; i += stepSize) {
        const current = route[i];
        const next = route[Math.min(i + stepSize, route.length - 1)];

        // 두 점 사이 거리 계산
        const stepDistance = calculateDistance(current[0], current[1], next[0], next[1]);
        const stepDistanceStr = stepDistance < 1000 ? `${Math.round(stepDistance)}m` : `${(stepDistance / 1000).toFixed(2)}km`;
        const stepDuration = Math.round((stepDistance / 1000) / speedKmh * 60);

        // 방향 계산
        const bearing = calculateBearing(current[0], current[1], next[0], next[1]);
        const icon = getDirectionIcon(bearing);
        const instruction = getDirectionInstruction(bearing, i === 0);

        // 위험 요소가 있는 경우 경고 추가
        let warning: string | undefined;
        let warningType: 'caution' | 'danger' | undefined;
        if (riskFactors.length > 0 && i === Math.floor(route.length / 2)) {
          warning = `회피 불가능한 장애물: ${riskFactors.join(', ')}`;
          warningType = 'danger';
        }

        steps.push({
          instruction,
          distance: stepDistanceStr,
          duration: `${stepDuration}분`,
          icon,
          warning,
          warningType
        });
      }
    }

    // 단계가 없으면 기본 단계 추가
    if (steps.length === 0) {
      steps.push({
        instruction: '출발지에서 도착지로 이동',
        distance: totalDistance,
        duration: totalDuration,
        icon: '→',
        ...(riskFactors.length > 0 && {
          warning: `회피 불가능한 장애물: ${riskFactors.join(', ')}`,
          warningType: 'danger' as const
        })
      });
    }

    return {
      totalDistance,
      totalDuration,
      steps,
      startLocation: startLoc,
      endLocation: endLoc,
      routePoints: route, // 백엔드에서 받은 원본 경로 좌표
      distanceM: distanceM // 미터 단위 거리
    };
  };

  // 두 좌표 사이 거리 계산 (미터)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 방위각 계산 (도)
  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // 방향 아이콘 반환
  const getDirectionIcon = (bearing: number): string => {
    if (bearing >= 337.5 || bearing < 22.5) return '↑'; // 북
    if (bearing >= 22.5 && bearing < 67.5) return '↗'; // 북동
    if (bearing >= 67.5 && bearing < 112.5) return '→'; // 동
    if (bearing >= 112.5 && bearing < 157.5) return '↘'; // 남동
    if (bearing >= 157.5 && bearing < 202.5) return '↓'; // 남
    if (bearing >= 202.5 && bearing < 247.5) return '↙'; // 남서
    if (bearing >= 247.5 && bearing < 292.5) return '←'; // 서
    return '↖'; // 북서
  };

  // 방향 지시사항 생성
  const getDirectionInstruction = (bearing: number, isFirst: boolean): string => {
    if (isFirst) {
      if (bearing >= 337.5 || bearing < 22.5) return '북쪽으로 출발';
      if (bearing >= 22.5 && bearing < 67.5) return '북동쪽으로 출발';
      if (bearing >= 67.5 && bearing < 112.5) return '동쪽으로 출발';
      if (bearing >= 112.5 && bearing < 157.5) return '남동쪽으로 출발';
      if (bearing >= 157.5 && bearing < 202.5) return '남쪽으로 출발';
      if (bearing >= 202.5 && bearing < 247.5) return '남서쪽으로 출발';
      if (bearing >= 247.5 && bearing < 292.5) return '서쪽으로 출발';
      return '북서쪽으로 출발';
    } else {
      if (bearing >= 337.5 || bearing < 22.5) return '북쪽으로 계속 직진';
      if (bearing >= 22.5 && bearing < 67.5) return '북동쪽으로 계속 직진';
      if (bearing >= 67.5 && bearing < 112.5) return '동쪽으로 계속 직진';
      if (bearing >= 112.5 && bearing < 157.5) return '남동쪽으로 계속 직진';
      if (bearing >= 157.5 && bearing < 202.5) return '남쪽으로 계속 직진';
      if (bearing >= 202.5 && bearing < 247.5) return '남서쪽으로 계속 직진';
      if (bearing >= 247.5 && bearing < 292.5) return '서쪽으로 계속 직진';
      return '북서쪽으로 계속 직진';
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



  const canCalculate = startLocation && endLocation && !isCalculating;

  return (
    <div className="mb-4">
      {/* 경로 찾기 버튼 */}
      <button
        onClick={calculateRoute}
        disabled={!canCalculate}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
          canCalculate
            ? 'bg-brand-blue hover:bg-blue-700 active:bg-blue-800'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {isCalculating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>경로 계산 중...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>경로 찾기</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
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
