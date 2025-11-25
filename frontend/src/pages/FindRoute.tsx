import React, { useState, useEffect } from 'react';
import NaverMap from '../components/NaverMap';
import LocationSearch from '../components/LocationSearch';
import RouteCalculator, { RouteInfo } from '../components/RouteCalculator';
import { geocode } from '../utils/naverMapApi';
import { getToken } from '../services/authService';

interface SavedRouteForNavigation {
  start: string;
  end: string;
  startLocation?: { lat: number; lng: number; name: string };
  endLocation?: { lat: number; lng: number; name: string };
  mode?: 'walking' | 'wheelchair';
  filter?: 'safest' | 'no-stairs' | 'recommended';
}

interface FindRouteProps {
  savedRoute?: SavedRouteForNavigation | null;
  onRouteLoaded?: () => void;
}

type ObstacleType = 'crosswalk' | 'curb' | 'bollard' | 'stairs' | 'ramp';

const FindRoute: React.FC<FindRouteProps> = ({ savedRoute, onRouteLoaded }) => {
  const [mode, setMode] = useState<'walking' | 'wheelchair'>('walking');
  // 경로 필터 (주석 처리 - 장애물 선택 기능으로 대체)
  // const [filter, setFilter] = useState<'safest' | 'no-stairs' | 'recommended'>('safest');
  const filter: 'safest' | 'no-stairs' | 'recommended' = 'safest'; // 기본값으로 고정
  const [fromLocationText, setFromLocationText] = useState('현재 위치');
  const [toLocationText, setToLocationText] = useState('서울시청');
  const [fromLocation, setFromLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [toLocation, setToLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoadingSavedRoute, setIsLoadingSavedRoute] = useState(false);
  const [selectedObstacles, setSelectedObstacles] = useState<Set<ObstacleType>>(new Set());
  const [saveNotification, setSaveNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFromLocationSelect = (location: { name: string; lat: number; lng: number }) => {
    setFromLocationText(location.name);
    setFromLocation(location);
  };

  const handleToLocationSelect = (location: { name: string; lat: number; lng: number }) => {
    setToLocationText(location.name);
    setToLocation(location);
  };

  const handleRouteCalculated = (route: RouteInfo | null) => {
    setRouteInfo(route);
  };

  const handleSaveRoute = async () => {
    if (!routeInfo || !fromLocation || !toLocation) {
      setSaveNotification({ type: 'error', message: '저장할 경로 정보가 없습니다.' });
      setTimeout(() => setSaveNotification(null), 3000);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://34.239.248.132:8000';
      const token = getToken();

      // routeInfo에서 route_points와 distance_m 추출
      const routePoints: [number, number][] = routeInfo.routePoints || [
        [fromLocation.lat, fromLocation.lng],
        [toLocation.lat, toLocation.lng]
      ];

      // distance_m 사용 (routeInfo에 있으면 사용, 없으면 계산)
      const distanceM = routeInfo.distanceM || (() => {
        const distanceStr = routeInfo.totalDistance;
        return distanceStr.includes('km')
          ? parseFloat(distanceStr.replace('km', '')) * 1000
          : parseFloat(distanceStr.replace('m', ''));
      })();

      const requestBody = {
        start_lat: fromLocation.lat,
        start_lng: fromLocation.lng,
        end_lat: toLocation.lat,
        end_lng: toLocation.lng,
        route_points: routePoints,
        distance_m: Math.round(distanceM),
        avoided: Array.from(selectedObstacles)
      };

      const response = await fetch(`${apiUrl}/route/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `저장 실패: ${response.status}`);
      }

      const savedRoute = await response.json();
      console.log('✅ 경로 저장 완료:', savedRoute);

      setSaveNotification({ type: 'success', message: '경로가 저장되었습니다!' });

      // 3초 후 알림 자동 제거
      setTimeout(() => setSaveNotification(null), 3000);

    } catch (err) {
      console.error('❌ 경로 저장 실패:', err);
      setSaveNotification({
        type: 'error',
        message: `경로 저장에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
      });
      setTimeout(() => setSaveNotification(null), 3000);
    }
  };

  const toggleObstacle = (obstacle: ObstacleType) => {
    setSelectedObstacles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(obstacle)) {
        newSet.delete(obstacle);
      } else {
        newSet.add(obstacle);
      }
      return newSet;
    });
  };

  const obstacleLabels: Record<ObstacleType, string> = {
    crosswalk: '횡단보도',
    curb: '턱',
    bollard: '볼라드',
    stairs: '계단',
    ramp: '경사로'
  };

  // 장애물 타입을 한글로 변환 (영문 타입도 처리)
  const getObstacleLabel = (type: string): string => {
    return obstacleLabels[type as ObstacleType] || type;
  };

  // 저장된 경로 로드
  useEffect(() => {
    if (!savedRoute) {
      return;
    }

    const loadSavedRoute = async () => {
      setIsLoadingSavedRoute(true);

      try {
        // 출발지/도착지 텍스트 설정
        setFromLocationText(savedRoute.start);
        setToLocationText(savedRoute.end);

        // 모드/필터 설정 (있는 경우)
        if (savedRoute.mode) {
          setMode(savedRoute.mode);
        }
        // 필터 설정 (주석 처리)
        // if (savedRoute.filter) {
        //   setFilter(savedRoute.filter);
        // }

        // 좌표가 이미 있는 경우
        if (savedRoute.startLocation && savedRoute.endLocation) {
          setFromLocation(savedRoute.startLocation);
          setToLocation(savedRoute.endLocation);
          setIsLoadingSavedRoute(false);
          onRouteLoaded?.();
          return;
        }

        // 좌표가 없는 경우 주소로 검색
        const [startResults, endResults] = await Promise.all([
          geocode(savedRoute.start),
          geocode(savedRoute.end)
        ]);

        if (startResults && startResults.length > 0) {
          const startLoc = startResults[0];
          setFromLocation({
            lat: startLoc.lat,
            lng: startLoc.lng,
            name: startLoc.name || savedRoute.start
          });
        }

        if (endResults && endResults.length > 0) {
          const endLoc = endResults[0];
          setToLocation({
            lat: endLoc.lat,
            lng: endLoc.lng,
            name: endLoc.name || savedRoute.end
          });
        }

        onRouteLoaded?.();
      } catch (error) {
        console.error('저장된 경로 로드 실패:', error);
      } finally {
        setIsLoadingSavedRoute(false);
      }
    };

    loadSavedRoute();
  }, [savedRoute, onRouteLoaded]);

  return (
    <div className="flex flex-1 w-full h-full bg-pale-blue overflow-hidden min-h-0">
      {/* Left Panel - Route Finder */}
      <div className="w-96 bg-white shadow-lg flex flex-col flex-shrink-0" style={{ position: 'relative', overflowY: 'auto', overflowX: 'visible' }}>

        {/* Find Route Section */}
        <div className="p-6 flex-1" style={{ overflow: 'visible' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">길찾기</h2>

          {/* 저장된 경로 로딩 중 */}
          {isLoadingSavedRoute && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">저장된 경로를 불러오는 중...</p>
            </div>
          )}

          {/* Mode Selection */}
          <div className="mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('walking')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'walking'
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                도보
              </button>
              <button
                onClick={() => setMode('wheelchair')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'wheelchair'
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                휠체어
              </button>
            </div>
          </div>

          {/* Location Inputs */}
          <div className="mb-6 space-y-3" style={{ position: 'relative' }}>
            <LocationSearch
              placeholder="출발지"
              value={fromLocationText}
              onChange={setFromLocationText}
              onLocationSelect={handleFromLocationSelect}
              icon={<div className="w-4 h-4 bg-brand-blue rounded-full"></div>}
            />
            <LocationSearch
              placeholder="도착지"
              value={toLocationText}
              onChange={setToLocationText}
              onLocationSelect={handleToLocationSelect}
              icon={
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>

          {/* Route Filters - 주석 처리 (장애물 선택 기능으로 대체) */}
          {/* <div className="mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('safest')}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'safest'
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                가장 안전
              </button>
              <button
                onClick={() => setFilter('no-stairs')}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'no-stairs'
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                계단 회피
              </button>
              <button
                onClick={() => setFilter('recommended')}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'recommended'
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                추천 경로
              </button>
            </div>
          </div> */}

          {/* Obstacle Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">회피할 장애물 선택</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(obstacleLabels) as ObstacleType[]).map((obstacle) => (
                <button
                  key={obstacle}
                  onClick={() => toggleObstacle(obstacle)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedObstacles.has(obstacle)
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedObstacles.has(obstacle)
                      ? 'bg-white border-white'
                      : 'border-gray-400'
                  }`}>
                    {selectedObstacles.has(obstacle) && (
                      <svg className="w-3 h-3 text-brand-blue" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {obstacleLabels[obstacle]}
                </button>
              ))}
            </div>
          </div>

          {/* Route Calculator */}
          <RouteCalculator
            startLocation={fromLocation}
            endLocation={toLocation}
            mode={mode}
            filter={filter}
            avoidObstacles={Array.from(selectedObstacles)}
            onRouteCalculated={handleRouteCalculated}
          />

          {/* Route Summary */}
          {routeInfo && (
            <div className="mb-6">
              <div className="p-4 bg-gray-50 rounded-lg mb-3">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-600">예상 시간</p>
                    <p className="text-lg font-bold text-gray-900">{routeInfo.totalDuration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">거리</p>
                    <p className="text-lg font-bold text-gray-900">{routeInfo.totalDistance}</p>
                  </div>
                </div>

                {/* 장애물 회피 정보 */}
                {selectedObstacles.size > 0 ? (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">장애물 회피 현황</h4>

                    {/* 전체 통계 */}
                    {(() => {
                      // obstacle_stats가 있으면 실제 장애물 개수 사용, 없으면 타입 개수 사용
                      const obstacleStats = routeInfo.obstacleStats || {};
                      let totalObstacles = 0;
                      let successObstacles = 0;
                      let failedObstacles = 0;

                      if (Object.keys(obstacleStats).length > 0) {
                        // 실제 장애물 개수 통계
                        Object.values(obstacleStats).forEach((stats) => {
                          totalObstacles += stats.total;
                          successObstacles += stats.success;
                          failedObstacles += stats.failed;
                        });
                      } else {
                        // fallback: 타입 개수 기준
                        const totalSelected = selectedObstacles.size;
                        const successCount = routeInfo.avoidedFinal?.length || 0;
                        const failedCount = routeInfo.riskFactors?.length || 0;
                        totalObstacles = totalSelected;
                        successObstacles = successCount;
                        failedObstacles = failedCount;
                      }

                      const successRate = totalObstacles > 0 ? Math.round((successObstacles / totalObstacles) * 100) : 0;

                      return (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">전체 장애물</span>
                            <span className="text-sm font-bold text-gray-900">{totalObstacles}개</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-700">회피 성공</span>
                            <span className="text-sm font-bold text-green-700">{successObstacles}개</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-red-700">회피 실패</span>
                            <span className="text-sm font-bold text-red-700">{failedObstacles}개</span>
                          </div>
                          {totalObstacles > 0 && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">회피 성공률</span>
                                <span className="text-sm font-bold text-blue-700">{successRate}%</span>
                              </div>
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${successRate}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 회피 성공한 장애물 */}
                    {routeInfo.avoidedFinal && routeInfo.avoidedFinal.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs font-medium text-green-700">
                            회피 성공 ({routeInfo.avoidedFinal.length}개)
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {routeInfo.avoidedFinal.map((type, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-md"
                            >
                              {getObstacleLabel(type)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 회피 실패한 장애물 */}
                    {routeInfo.riskFactors && routeInfo.riskFactors.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs font-medium text-red-700">
                            회피 실패 ({routeInfo.riskFactors.length}개)
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {routeInfo.riskFactors.map((type, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-md"
                            >
                              {getObstacleLabel(type)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-gray-600">회피할 장애물을 선택하지 않았습니다.</p>
                    </div>
                  </div>
                )}
              </div>
              {/* 경로 저장 버튼 */}
              <button
                onClick={handleSaveRoute}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600 active:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>경로 저장</span>
              </button>
              {/* 저장 알림 */}
              {saveNotification && (
                <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                  saveNotification.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {saveNotification.type === 'success' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">{saveNotification.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Route Details */}
          {routeInfo && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">경로 상세</h3>
              <div className="space-y-3">
                {routeInfo.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-blue font-bold text-sm">{step.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-900 font-medium">{step.instruction}</p>
                        <span className="text-sm text-gray-600">{step.distance}</span>
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
          )}
        </div>
      </div>

      {/* Right Panel - Naver Map */}
      <div className="flex-1 relative overflow-hidden" style={{ minWidth: 0, minHeight: 0 }}>
        <NaverMap
          width="100%"
          height="100%"
          center={
            routeInfo
              ? {
                  lat: (routeInfo.startLocation.lat + routeInfo.endLocation.lat) / 2,
                  lng: (routeInfo.startLocation.lng + routeInfo.endLocation.lng) / 2
                }
              : fromLocation && toLocation
              ? {
                  lat: (fromLocation.lat + toLocation.lat) / 2,
                  lng: (fromLocation.lng + toLocation.lng) / 2
                }
              : fromLocation
              ? { lat: fromLocation.lat, lng: fromLocation.lng }
              : toLocation
              ? { lat: toLocation.lat, lng: toLocation.lng }
              : { lat: 37.5665, lng: 126.9780 }
          }
          zoom={routeInfo ? 14 : fromLocation && toLocation ? 14 : 15}
          startLocation={fromLocation}
          endLocation={toLocation}
          routePoints={routeInfo?.routePoints}
          showObstacles={true}
          onMapLoad={(map) => {
            console.log('네이버 지도가 로드되었습니다:', map);
          }}
        />
      </div>
    </div>
  );
};

export default FindRoute;
