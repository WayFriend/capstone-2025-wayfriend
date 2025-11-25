import React, { useEffect, useMemo, useState } from 'react';
import { RouteStep } from './RouteCalculator';
import { getStaticMapImage } from '../utils/naverMapApi';

interface RouteDetailModalProps {
  route: {
    id: number;
    title: string;
    start: string;
    end: string;
    savedDate: string;
    imageUrl: string;
    mode?: 'walking' | 'wheelchair';
    filter?: 'safest' | 'no-stairs' | 'recommended';
    routeInfo?: {
      totalDistance: string;
      totalDuration: string;
      steps: RouteStep[];
    };
    routePoints?: [number, number][];
    distanceM?: number;
    avoided?: string[];
    startLocation?: { lat: number; lng: number; name: string };
    endLocation?: { lat: number; lng: number; name: string };
  };
  onClose: () => void;
  onViewRoute?: () => void;
  onDelete?: () => void;
}

// 두 좌표 사이 거리 계산 (미터) - 컴포넌트 외부로 이동
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

// 방위각 계산 (도) - 컴포넌트 외부로 이동
const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

// 방향 아이콘 반환 - 컴포넌트 외부로 이동
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

// 방향 지시사항 생성 - 컴포넌트 외부로 이동
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

const RouteDetailModal: React.FC<RouteDetailModalProps> = ({
  route,
  onClose,
  onViewRoute,
  onDelete
}) => {
  const [mapImageUrl, setMapImageUrl] = useState<string>(route.imageUrl || '');

  // 지도 이미지가 없으면 생성
  useEffect(() => {
    if (!mapImageUrl && route.routePoints && route.routePoints.length > 0 && route.startLocation && route.endLocation) {
      const generateMapImage = async () => {
        try {
          const center = {
            lat: (route.startLocation!.lat + route.endLocation!.lat) / 2,
            lng: (route.startLocation!.lng + route.endLocation!.lng) / 2
          };
          const imageUrl = await getStaticMapImage(
            center,
            15,
            800,
            400,
            route.routePoints,
            { lat: route.startLocation!.lat, lng: route.startLocation!.lng },
            { lat: route.endLocation!.lat, lng: route.endLocation!.lng }
          );
          setMapImageUrl(imageUrl);
        } catch (err) {
          console.error('지도 이미지 생성 실패:', err);
        }
      };
      generateMapImage();
    }
  }, [mapImageUrl, route.routePoints, route.startLocation, route.endLocation]);

  // 저장된 경로의 실제 데이터로부터 경로 정보 계산
  const routeInfo = useMemo(() => {
    // routeInfo가 이미 있으면 사용
    if (route.routeInfo) {
      return route.routeInfo;
    }

    // routePoints가 있으면 실제 경로 데이터로 계산
    if (route.routePoints && route.routePoints.length > 0) {
      const distanceM = route.distanceM || 0;
      const mode = route.mode || 'walking';
      const speedKmh = mode === 'wheelchair' ? 3 : 4;

      // 거리 포맷팅
      const distanceKm = (distanceM / 1000).toFixed(2);
      const totalDistance = distanceM < 1000 ? `${Math.round(distanceM)}m` : `${distanceKm}km`;

      // 예상 시간 계산
      const durationMinutes = Math.round((distanceM / 1000) / speedKmh * 60);
      const totalDuration = `${durationMinutes}분`;

      // 경로 좌표를 단계로 변환
      const steps: RouteStep[] = [];
      const routePoints = route.routePoints;

      if (routePoints.length > 0) {
        // 경로를 여러 구간으로 나누어 단계 생성
        const numSteps = Math.min(routePoints.length - 1, 5); // 최대 5단계
        const stepSize = Math.max(1, Math.floor((routePoints.length - 1) / numSteps));

        for (let i = 0; i < routePoints.length - 1; i += stepSize) {
          const current = routePoints[i];
          const next = routePoints[Math.min(i + stepSize, routePoints.length - 1)];

          // 두 점 사이 거리 계산
          const stepDistance = calculateDistance(current[0], current[1], next[0], next[1]);
          const stepDistanceStr = stepDistance < 1000
            ? `${Math.round(stepDistance)}m`
            : `${(stepDistance / 1000).toFixed(2)}km`;
          const stepDuration = Math.round((stepDistance / 1000) / speedKmh * 60);

          // 방향 계산
          const bearing = calculateBearing(current[0], current[1], next[0], next[1]);
          const icon = getDirectionIcon(bearing);
          const instruction = getDirectionInstruction(bearing, i === 0);

          steps.push({
            instruction,
            distance: stepDistanceStr,
            duration: `${stepDuration}분`,
            icon
          });
        }
      }

      // 단계가 없으면 기본 단계 추가
      if (steps.length === 0) {
        steps.push({
          instruction: '출발지에서 도착지로 이동',
          distance: totalDistance,
          duration: totalDuration,
          icon: '→'
        });
      }

      return {
        totalDistance,
        totalDuration,
        steps
      };
    }

    // 기본값 (데이터가 없는 경우)
    return {
      totalDistance: route.distanceM ? (route.distanceM < 1000 ? `${Math.round(route.distanceM)}m` : `${(route.distanceM / 1000).toFixed(2)}km`) : '0m',
      totalDuration: route.distanceM ? `${Math.round((route.distanceM / 1000) / 4 * 60)}분` : '0분',
      steps: [{
        instruction: '출발지에서 도착지로 이동',
        distance: route.distanceM ? (route.distanceM < 1000 ? `${Math.round(route.distanceM)}m` : `${(route.distanceM / 1000).toFixed(2)}km`) : '0m',
        duration: route.distanceM ? `${Math.round((route.distanceM / 1000) / 4 * 60)}분` : '0분',
        icon: '→'
      }]
    };
  }, [route]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // 스크롤 방지
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // 배경 클릭 시 닫기
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">{route.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto">
          {/* 지도 이미지 */}
          <div className="w-full h-64 bg-gray-100 relative flex items-center justify-center">
            {mapImageUrl ? (
              <img
                src={mapImageUrl}
                alt={route.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-sm">지도 이미지 로딩 중...</p>
              </div>
            )}
            <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md text-sm font-medium text-gray-700">
              저장일: {route.savedDate}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* 경로 요약 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-gray-500">출발지</p>
                    <p className="text-gray-900 font-medium">{route.start}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-gray-500">도착지</p>
                    <p className="text-gray-900 font-medium">{route.end}</p>
                  </div>
                </div>
              </div>

              {/* 거리 및 시간 정보 */}
              <div className="flex gap-6 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">총 거리</p>
                  <p className="text-lg font-bold text-gray-900">{routeInfo.totalDistance}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">예상 시간</p>
                  <p className="text-lg font-bold text-gray-900">{routeInfo.totalDuration}</p>
                </div>
                {route.mode && (
                  <div>
                    <p className="text-sm text-gray-500">이동 방식</p>
                    <p className="text-lg font-bold text-gray-900">
                      {route.mode === 'walking' ? '도보' : '휠체어'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 경로 상세 단계 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">경로 상세</h3>
              <div className="space-y-3">
                {routeInfo.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-[var(--primary-color)] font-bold text-sm">{step.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-gray-900 font-medium">{step.instruction}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm text-gray-600">{step.distance}</span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{step.duration}</span>
                        </div>
                      </div>
                      {step.warning && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            step.warningType === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
                          }`}>
                            {step.warningType === 'danger' ? (
                              <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className={`text-sm ${
                            step.warningType === 'danger' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {step.warning}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 - 액션 버튼들 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium transition-colors"
          >
            삭제
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors"
            >
              닫기
            </button>
            {onViewRoute && (
              <button
                onClick={onViewRoute}
                className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                경로 다시 보기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetailModal;

