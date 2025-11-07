import React, { useEffect } from 'react';
import { RouteStep } from './RouteCalculator';

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
  };
  onClose: () => void;
  onViewRoute?: () => void;
  onDelete?: () => void;
}

const RouteDetailModal: React.FC<RouteDetailModalProps> = ({
  route,
  onClose,
  onViewRoute,
  onDelete
}) => {
  // 더미 경로 정보 (실제 API 연동 시 route.routeInfo 사용)
  const routeInfo = route.routeInfo || {
    totalDistance: '1.2km',
    totalDuration: '13분',
    steps: [
      {
        instruction: '메인 스트리트를 동쪽으로 직진',
        distance: '150m',
        duration: '2분',
        icon: '→',
        warning: route.mode === 'wheelchair' ? '가파른 오르막길 주의' : undefined,
        warningType: route.mode === 'wheelchair' ? 'caution' : undefined
      },
      {
        instruction: '브로드웨이로 좌회전',
        distance: '400m',
        duration: '5분',
        icon: '←',
        warning: route.filter === 'no-stairs' ? '계단 구간 회피' : undefined,
        warningType: route.filter === 'no-stairs' ? 'caution' : undefined
      },
      {
        instruction: '파크 애비뉴로 계속 직진',
        distance: '500m',
        duration: '6분',
        icon: '↑',
        warning: '공사 구간, 주의해서 통행',
        warningType: 'danger'
      }
    ]
  };

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
          <div className="w-full h-64 bg-gray-100 relative">
            <img
              src={route.imageUrl}
              alt={route.title}
              className="w-full h-full object-cover"
            />
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

