import React, { useState } from 'react';
import NaverMap from '../components/NaverMap';
import LocationSearch from '../components/LocationSearch';
import RouteCalculator, { RouteInfo } from '../components/RouteCalculator';

const FindRoute: React.FC = () => {
  const [mode, setMode] = useState<'walking' | 'wheelchair'>('walking');
  const [filter, setFilter] = useState<'safest' | 'no-stairs' | 'recommended'>('safest');
  const [fromLocationText, setFromLocationText] = useState('현재 위치');
  const [toLocationText, setToLocationText] = useState('서울시청');
  const [fromLocation, setFromLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [toLocation, setToLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

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

  return (
    <div className="flex flex-1 w-full h-full bg-pale-blue overflow-hidden min-h-0">
      {/* Left Panel - Route Finder */}
      <div className="w-96 bg-white shadow-lg flex flex-col flex-shrink-0" style={{ position: 'relative', overflowY: 'auto', overflowX: 'visible' }}>

        {/* Find Route Section */}
        <div className="p-6 flex-1" style={{ overflow: 'visible' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">길찾기</h2>

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

          {/* Route Calculator */}
          <RouteCalculator
            startLocation={fromLocation}
            endLocation={toLocation}
            mode={mode}
            filter={filter}
            onRouteCalculated={handleRouteCalculated}
          />

          {/* Route Filters */}
          <div className="mb-6">
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
          </div>

          {/* Route Summary */}
          {routeInfo && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">예상 시간</p>
                  <p className="text-lg font-bold text-gray-900">{routeInfo.totalDuration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">거리</p>
                  <p className="text-lg font-bold text-gray-900">{routeInfo.totalDistance}</p>
                </div>
              </div>
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
              : { lat: 37.5665, lng: 126.9780 }
          }
          zoom={routeInfo ? 14 : 15}
          onMapLoad={(map) => {
            console.log('네이버 지도가 로드되었습니다:', map);
          }}
        />
      </div>
    </div>
  );
};

export default FindRoute;
