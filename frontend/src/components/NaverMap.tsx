import React, { useEffect, useRef, useState } from 'react';
import { getNaverClientId } from '../utils/naverMapApi';

declare global {
  interface Window {
    naver: any;
  }
}

interface NaverMapProps {
  width?: string;
  height?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  startLocation?: { lat: number; lng: number; name: string } | null;
  endLocation?: { lat: number; lng: number; name: string } | null;
  routePoints?: [number, number][]; // 경로 좌표 배열 [lat, lng][]
  onMapLoad?: (map: any) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onMapIdle?: (center: { lat: number; lng: number }, zoom: number) => void;
}

const NaverMap: React.FC<NaverMapProps> = ({
  width = '100%',
  height = '100%',
  center = { lat: 37.5665, lng: 126.9780 },
  zoom = 15,
  startLocation,
  endLocation,
  routePoints,
  onMapLoad,
  onMapClick,
  onMapIdle,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [naverClientId, setNaverClientId] = useState<string | null>(null);

  useEffect(() => {
    const loadNaverMapSdk = async () => {
      setLoading(true);
      setError(null);
      console.log('[DEBUG] 네이버 지도 SDK 로드 시작');

      try {
        const clientId = await getNaverClientId();
        if (!clientId) {
          throw new Error('Naver Client ID를 가져올 수 없습니다.');
        }

        console.log('[DEBUG] 클라이언트 ID 길이:', clientId.length);
        console.log('[DEBUG] 클라이언트 ID 시작:', clientId.substring(0, 12) + '...');
        setNaverClientId(clientId);

        if (window.naver && window.naver.maps) {
          console.log('[SUCCESS] 네이버 지도 SDK 이미 로드됨');
          setLoading(false);
          return;
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        // cache-busting 파라미터로 브라우저 캐시 무시
        // 신규 NCP Maps API 사용 (ncpKeyId 파라미터 사용 - ncpClientID에서 변경됨)
        // 참고: https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html
        const apiUrl = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}&submodules=geocoder,panorama&ts=${Date.now()}`;
        console.log('[DEBUG] Naver Maps API URL:', apiUrl.replace(clientId, clientId.substring(0, 8) + '...'));
        console.log('[DEBUG] 현재 도메인:', window.location.hostname, '포트:', window.location.port);
        console.log('[DEBUG] 신규 API 파라미터 사용: ncpKeyId (기존 ncpClientID에서 변경)');
        script.src = apiUrl;
        script.async = true;
        script.onload = () => {
          console.log('[SUCCESS] 네이버 지도 SDK 로드 완료');
          setLoading(false);
        };
        script.onerror = (e) => {
          console.error('[ERROR] 네이버 지도 SDK 로드 실패:', e);
          setError('네이버 지도 SDK 로드 실패');
          setLoading(false);
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error('[ERROR] 네이버 지도 SDK 로드 오류:', err);
        setError(`지도 로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
        setLoading(false);
      }
    };

    loadNaverMapSdk();
  }, []);

  useEffect(() => {
    if (!loading && !error && mapRef.current && window.naver && window.naver.maps && naverClientId && !isInitializedRef.current) {
      console.log('[DEBUG] 네이버 동적 지도 초기화 시작');

      try {
        // 컨테이너가 실제로 렌더링될 때까지 대기
        let retryCount = 0;
        const MAX_RETRIES = 50; // 최대 5초 대기 (50 * 100ms)

        const initMap = () => {
          if (!mapRef.current) {
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              setTimeout(initMap, 100);
            } else {
              setError('지도 컨테이너를 찾을 수 없습니다.');
            }
            return;
          }

          // 컨테이너 크기 확인
          const rect = mapRef.current.getBoundingClientRect();
          console.log('[DEBUG] 지도 컨테이너 크기:', { width: rect.width, height: rect.height });

          if (rect.width === 0 || rect.height === 0) {
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.warn(`[WARN] 지도 컨테이너 크기가 0입니다. 재시도 ${retryCount}/${MAX_RETRIES}`);
              setTimeout(initMap, 100);
            } else {
              console.error('[ERROR] 지도 컨테이너 크기를 가져올 수 없습니다.');
              setError('지도 컨테이너가 올바른 크기를 가지지 않습니다. 레이아웃을 확인해주세요.');
            }
            return;
          }

          const mapOptions = {
            center: new window.naver.maps.LatLng(center.lat, center.lng),
            zoom: zoom,
            minZoom: 6,
            maxZoom: 21,
            zoomControl: true,
            zoomControlOptions: {
              position: window.naver.maps.Position.TOP_RIGHT,
            },
            mapTypeControl: true,
            mapTypeControlOptions: {
              position: window.naver.maps.Position.TOP_LEFT,
            },
          };

          console.log('[DEBUG] 지도 생성 전 - 컨테이너:', mapRef.current);
          console.log('[DEBUG] 지도 옵션:', mapOptions);

          const map = new window.naver.maps.Map(mapRef.current, mapOptions);
          mapInstanceRef.current = map;

          console.log('[DEBUG] 지도 객체 생성됨:', {
            isReady: map.isReady,
            mapTypeId: map.mapTypeId,
            getCenter: map.getCenter ? '함수 있음' : '함수 없음'
          });

          // 지도가 준비되면 리사이즈 이벤트 트리거
          window.naver.maps.Event.addListener(map, 'init', () => {
            console.log('[DEBUG] 지도 init 이벤트 발생');
            console.log('[DEBUG] 지도 isReady 상태:', map.isReady);

            // 지도 준비 상태 확인
            if (map.isReady) {
              console.log('[DEBUG] 지도가 준비되었습니다.');
              window.naver.maps.Event.trigger(map, 'resize');
            } else {
              console.warn('[WARN] 지도가 아직 준비되지 않았습니다. 잠시 후 다시 확인합니다.');
              setTimeout(() => {
                console.log('[DEBUG] 2초 후 지도 isReady 상태:', map.isReady);
                if (map.isReady) {
                  window.naver.maps.Event.trigger(map, 'resize');
                } else {
                  console.error('[ERROR] 지도 준비 시간이 초과되었습니다.');
                  console.error('[ERROR] 지도 상태:', {
                    isReady: map.isReady,
                    _pendingOptions: map._pendingOptions,
                    _mapOptions: map._mapOptions
                  });

                  // 도메인 설정 안내 메시지
                  const currentOrigin = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
                  // 개발자용 상세 정보는 콘솔에만 출력
                  console.error('[ERROR] 지도 준비 시간이 초과되었습니다.');
                  console.error('[ERROR] 현재 접속 정보:', currentOrigin);
                  console.error('[ERROR] 가능한 원인:');
                  console.error(`[ERROR] 1. NCP 콘솔에서 클라이언트 ID에 현재 도메인(${currentOrigin})이 등록되어 있는지 확인`);
                  console.error('[ERROR] 2. localhost와 127.0.0.1 모두 등록 필요할 수 있음');
                  console.error('[ERROR] 3. 브라우저 캐시 및 쿠키 삭제 후 재시도');

                  // 사용자에게는 간단한 메시지만 표시
                  setError('지도 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.');
                }
              }, 2000);
            }
          });

          // 인증 실패 전역 콜백 함수 설정 (신규 API 문서 참고)
          (window as any).navermap_authFailure = function() {
            const currentProtocol = window.location.protocol;
            const currentHostname = window.location.hostname;
            const currentPort = window.location.port;
            const currentOrigin = `${currentProtocol}//${currentHostname}${currentPort ? ':' + currentPort : ''}`;

            // 개발자용 상세 정보는 콘솔에만 출력
            console.error('[ERROR] 네이버 지도 인증 실패 콜백 호출됨');
            console.error('[ERROR] 현재 접속 정보:', {
              protocol: currentProtocol,
              hostname: currentHostname,
              port: currentPort,
              fullOrigin: currentOrigin,
              clientId: naverClientId?.substring(0, 8) + '...'
            });
            console.error('[ERROR] 해결 방법:');
            console.error('[ERROR] 1. NCP 콘솔 → Maps → Application → [인증 정보]');
            console.error(`[ERROR] 2. Web 서비스 URL에 다음을 등록 (슬래시 없이!):`);
            console.error(`[ERROR]    • ${currentProtocol}//${currentHostname}`);
            console.error(`[ERROR]    • ${currentProtocol}//127.0.0.1`);
            console.error('[ERROR] 3. 포트 번호 제외, 슬래시(/) 제거 필수');
            console.error('[ERROR] 4. 저장 후 2-3분 대기 후 재시도');
            console.error('[ERROR] 5. 브라우저 캐시 완전 삭제 후 재시도');

            // 사용자에게는 간단한 메시지만 표시
            setError('지도 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.');
          };

          // 지도 오류 이벤트 리스너 추가
          window.naver.maps.Event.addListener(map, 'error', (error: any) => {
            console.error('[ERROR] 지도 오류 발생:', error);
            setError('지도 로드 중 오류가 발생했습니다. 클라이언트 ID를 확인해주세요.');
          });

          // 타일 로딩 상태 확인
          window.naver.maps.Event.addListener(map, 'tilesloaded', () => {
            console.log('[DEBUG] 타일 로드 완료');
          });

          // 지도 타입 변경 시 확인
          window.naver.maps.Event.addListener(map, 'mapType_changed', () => {
            console.log('[DEBUG] 지도 타입 변경됨');
            // 배경 이미지 확인
            const container = mapRef.current;
            if (container) {
              const bgImage = window.getComputedStyle(container).backgroundImage;
              if (bgImage.includes('auth_fail')) {
                const currentOrigin = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;

                // 개발자용 상세 정보는 콘솔에만 출력
                console.error('[ERROR] 인증 실패 배경 이미지 감지됨:', bgImage);
                console.error('[ERROR] 현재 접속 정보:', currentOrigin);
                console.error(`[ERROR] NCP 콘솔에서 클라이언트 ID(${naverClientId?.substring(0, 8)}...)에 다음 도메인을 등록해주세요:`);
                console.error(`[ERROR] - ${currentOrigin}`);
                console.error('[ERROR] - http://localhost');
                console.error('[ERROR] - http://127.0.0.1');
                console.error('[ERROR] 참고: https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html');

                // 사용자에게는 간단한 메시지만 표시
                setError('지도 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.');
              }
            }
          });

          window.naver.maps.Event.addListener(map, 'click', (e: any) => {
            const latlng = e.coord;
            console.log('[DEBUG] 지도 클릭:', { lat: latlng.y, lng: latlng.x });
            onMapClick?.(latlng.y, latlng.x);
          });

          window.naver.maps.Event.addListener(map, 'idle', () => {
            const newCenter = map.getCenter();
            const newZoom = map.getZoom();
            console.log('[DEBUG] 지도 이동/줌 변경:', { lat: newCenter.y, lng: newCenter.x, zoom: newZoom });
            onMapIdle?.({ lat: newCenter.y, lng: newCenter.x }, newZoom);
          });

          // 지도가 준비된 후 리사이즈 호출 및 상태 확인
          setTimeout(() => {
            // 강제로 resize 이벤트를 트리거하여 지도 렌더링 시도
            try {
              window.naver.maps.Event.trigger(map, 'resize');
              console.log('[DEBUG] 지도 리사이즈 트리거 완료 (강제)');
            } catch (e) {
              console.warn('[WARN] 리사이즈 트리거 실패:', e);
            }

            // 배경 이미지 확인 (인증 실패 감지)
            const container = mapRef.current;
            if (container) {
              const bgImage = window.getComputedStyle(container).backgroundImage;
              console.log('[DEBUG] 컨테이너 배경 이미지:', bgImage);

              if (bgImage && bgImage.includes('auth_fail')) {
                // 현재 접속 URL 정보 수집
                const currentProtocol = window.location.protocol; // http: 또는 https:
                const currentHostname = window.location.hostname; // localhost
                const currentPort = window.location.port; // 3000
                const currentOrigin = `${currentProtocol}//${currentHostname}${currentPort ? ':' + currentPort : ''}`;

                // 개발자용 상세 정보는 콘솔에만 출력
                console.error('[ERROR] 인증 실패 배경 이미지가 감지되었습니다!');
                console.error('[ERROR] 현재 접속 정보:', {
                  protocol: currentProtocol,
                  hostname: currentHostname,
                  port: currentPort,
                  fullOrigin: currentOrigin,
                  clientId: naverClientId?.substring(0, 8) + '...'
                });
                console.error('[ERROR] 확인 사항:');
                console.error('[ERROR] 1. NCP 콘솔 → Maps → Application → [인증 정보]');
                console.error('[ERROR] 2. Web 서비스 URL에 다음을 등록 (슬래시 없이!):');
                console.error(`[ERROR]    • ${currentProtocol}//${currentHostname}`);
                console.error(`[ERROR]    • ${currentProtocol}//127.0.0.1`);
                console.error('[ERROR] 3. 포트 번호 제외, 슬래시(/) 제거 필수');
                console.error('[ERROR] 4. 저장 후 2-3분 대기 후 재시도');
                console.error('[ERROR] 5. 브라우저 캐시 완전 삭제 후 재시도');

                // 사용자에게는 간단한 메시지만 표시
                setError('지도 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.');
              } else {
                console.log('[DEBUG] 배경 이미지 정상 - 인증 성공!');
              }
            }

            if (map.isReady) {
              isInitializedRef.current = true;
              console.log('[SUCCESS] 네이버 동적 지도 로드 완료 (isReady: true)', {
                startLocation,
                endLocation,
                routePointsCount: routePoints?.length || 0
              });

              onMapLoad?.(map);

              // 지도가 완전히 로드된 후 마커와 경로 그리기 (강제 실행)
              setTimeout(() => {
                if (startLocation || endLocation || routePoints) {
                  console.log('[NaverMap] 지도 로드 완료 후 마커/경로 강제 그리기 시작', {
                    isInitialized: isInitializedRef.current,
                    hasMapInstance: !!mapInstanceRef.current,
                    startLocation,
                    endLocation,
                    routePointsCount: routePoints?.length || 0
                  });

                  // 리사이즈 이벤트 트리거
                  window.naver.maps.Event.trigger(map, 'resize');

                  // 마커를 직접 그리기 (useEffect가 실행되지 않을 경우 대비)
                  if (isInitializedRef.current && mapInstanceRef.current && window.naver && window.naver.maps) {
                    console.log('[NaverMap] 마커 강제 그리기 시작');

                    // 기존 마커 제거
                    markersRef.current.forEach(marker => {
                      marker.setMap(null);
                    });
                    markersRef.current = [];

                    // 출발지 마커 추가
                    if (startLocation) {
                      console.log('[NaverMap] 출발지 마커 강제 추가:', startLocation);
                      const startMarker = new window.naver.maps.Marker({
                        position: new window.naver.maps.LatLng(startLocation.lat, startLocation.lng),
                        map: mapInstanceRef.current,
                        icon: {
                          content: `
                            <div style="
                              background-color: #3A86FF;
                              width: 32px;
                              height: 32px;
                              border-radius: 50% 50% 50% 0;
                              transform: rotate(-45deg);
                              border: 3px solid white;
                              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                              display: flex;
                              align-items: center;
                              justify-content: center;
                            ">
                              <div style="
                                transform: rotate(45deg);
                                color: white;
                                font-weight: bold;
                                font-size: 14px;
                              ">출</div>
                            </div>
                          `,
                          anchor: new window.naver.maps.Point(16, 16)
                        },
                        title: startLocation.name || '출발지'
                      });
                      markersRef.current.push(startMarker);
                    }

                    // 도착지 마커 추가
                    if (endLocation) {
                      console.log('[NaverMap] 도착지 마커 강제 추가:', endLocation);
                      const endMarker = new window.naver.maps.Marker({
                        position: new window.naver.maps.LatLng(endLocation.lat, endLocation.lng),
                        map: mapInstanceRef.current,
                        icon: {
                          content: `
                            <div style="
                              background-color: #EF4444;
                              width: 32px;
                              height: 32px;
                              border-radius: 50% 50% 50% 0;
                              transform: rotate(-45deg);
                              border: 3px solid white;
                              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                              display: flex;
                              align-items: center;
                              justify-content: center;
                            ">
                              <div style="
                                transform: rotate(45deg);
                                color: white;
                                font-weight: bold;
                                font-size: 14px;
                              ">도</div>
                            </div>
                          `,
                          anchor: new window.naver.maps.Point(16, 16)
                        },
                        title: endLocation.name || '도착지'
                      });
                      markersRef.current.push(endMarker);
                    }

                    // 경로선 그리기
                    if (routePoints && routePoints.length > 0) {
                      console.log('[NaverMap] 경로선 강제 추가:', routePoints.length, '개 좌표');
                      if (polylineRef.current) {
                        polylineRef.current.setMap(null);
                      }

                      const path = routePoints.map(point => {
                        const lat = point[0];
                        const lng = point[1];
                        return new window.naver.maps.LatLng(lat, lng);
                      });

                      const polyline = new window.naver.maps.Polyline({
                        path: path,
                        strokeColor: '#3A86FF',
                        strokeWeight: 5,
                        strokeOpacity: 0.8,
                        strokeStyle: 'solid',
                        map: mapInstanceRef.current
                      });

                      polylineRef.current = polyline;

                      // 경로를 포함하도록 지도 범위 조정
                      const bounds = new window.naver.maps.LatLngBounds();
                      path.forEach(latlng => bounds.extend(latlng));
                      mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
                    } else if (startLocation && endLocation) {
                      // 경로가 없으면 출발지와 도착지만으로 범위 조정
                      const bounds = new window.naver.maps.LatLngBounds();
                      bounds.extend(new window.naver.maps.LatLng(startLocation.lat, startLocation.lng));
                      bounds.extend(new window.naver.maps.LatLng(endLocation.lat, endLocation.lng));
                      mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
                    }

                    console.log('[NaverMap] 마커/경로 강제 그리기 완료');
                  }
                } else {
                  console.log('[NaverMap] 마커/경로 데이터 없음 - 그리기 스킵');
                }
              }, 500);

              // 추가 확인: 약간의 지연 후 다시 배경 이미지 확인
              setTimeout(() => {
                if (container) {
                  const bgImage = window.getComputedStyle(container).backgroundImage;
                  if (bgImage && bgImage.includes('auth_fail')) {
                    console.error('[ERROR] 지도 로드 후 인증 실패 감지 (1초 후 재확인)');
                    // 에러는 이미 위에서 설정되었으므로 로그만 출력
                  } else {
                    console.log('[DEBUG] ✅ 배경 이미지 정상 (인증 성공)');
                    // 인증 성공 시 에러 메시지 제거
                    setError(null);
                  }
                }
              }, 1000);
            } else {
              // 지도가 아직 준비되지 않은 경우, 추가 대기
              console.warn('[WARN] 지도가 아직 준비되지 않았습니다. 추가 대기 중...');

              // 일단 지도는 초기화된 것으로 표시 (isReady가 false여도 렌더링될 수 있음)
              isInitializedRef.current = true;
              onMapLoad?.(map);

              const startTime = Date.now();
              const timeoutMs = 5000; // 5초 타임아웃

              const checkReady = setInterval(() => {
                if (map.isReady) {
                  clearInterval(checkReady);
                  window.naver.maps.Event.trigger(map, 'resize');
                  console.log('[DEBUG] 지도 리사이즈 트리거 완료 (지연됨, isReady: true)');
                  console.log('[SUCCESS] 네이버 동적 지도 준비 완료');
                } else {
                  // 타임아웃 확인
                  if (Date.now() - startTime > timeoutMs) {
                    clearInterval(checkReady);
                    console.error('[ERROR] 지도 준비 시간이 초과되었습니다.');
                    console.error('[ERROR] isReady가 false인 상태에서 타임아웃');

                    // 도메인 설정 안내 메시지
                    const currentOrigin = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;

                    // 개발자용 상세 정보는 콘솔에만 출력
                    console.error('[ERROR] isReady가 false인 상태에서 타임아웃');
                    console.error('[ERROR] 현재 접속 정보:', currentOrigin);
                    console.error('[ERROR] 가능한 원인:');
                    console.error(`[ERROR] 1. NCP 콘솔에서 클라이언트 ID에 현재 도메인(${currentOrigin})이 등록되어 있는지 확인`);
                    console.error('[ERROR] 2. localhost와 127.0.0.1 모두 등록 필요할 수 있음');
                    console.error('[ERROR] 3. 브라우저 캐시 및 쿠키 삭제 후 재시도');
                    console.error('[ERROR] 참고: https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html');

                    // 사용자에게는 간단한 메시지만 표시
                    setError('지도 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.');
                  } else {
                    // 주기적으로 resize 트리거 시도
                    try {
                      window.naver.maps.Event.trigger(map, 'resize');
                    } catch (e) {
                      // 무시
                    }
                  }
                }
              }, 500);
            }
          }, 200); // 초기 지연 시간을 200ms로 증가
        };

        // 다음 프레임에서 초기화 (DOM이 완전히 렌더링된 후)
        requestAnimationFrame(() => {
          // 약간의 지연을 주어 레이아웃이 완전히 계산되도록 함
          setTimeout(initMap, 50);
        });
      } catch (err) {
        console.error('[ERROR] 네이버 동적 지도 초기화 오류:', err);
        setError(`지도 초기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      }
    }
  }, [loading, error, naverClientId, center, zoom, onMapLoad, onMapClick, onMapIdle]);

  useEffect(() => {
    if (isInitializedRef.current && mapInstanceRef.current && window.naver && window.naver.maps) {
      try {
        const currentCenter = mapInstanceRef.current.getCenter();
        const currentZoom = mapInstanceRef.current.getZoom();

        if (currentCenter && (currentCenter.y !== center.lat || currentCenter.x !== center.lng)) {
          mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(center.lat, center.lng));
        }
        if (currentZoom !== zoom) {
          mapInstanceRef.current.setZoom(zoom);
        }
      } catch (err) {
        console.error('[ERROR] Map update error:', err);
      }
    }
  }, [center, zoom]);

  // 마커 업데이트
  useEffect(() => {
    console.log('[NaverMap] 마커/경로 useEffect 실행:', {
      isInitialized: isInitializedRef.current,
      hasMapInstance: !!mapInstanceRef.current,
      hasNaver: !!(window.naver && window.naver.maps),
      startLocation,
      endLocation,
      routePointsCount: routePoints?.length || 0
    });

    if (!isInitializedRef.current || !mapInstanceRef.current || !window.naver || !window.naver.maps) {
      console.log('[NaverMap] 지도가 아직 초기화되지 않음 - 마커 그리기 스킵:', {
        isInitialized: isInitializedRef.current,
        mapInstance: !!mapInstanceRef.current,
        naver: !!window.naver,
        maps: !!(window.naver && window.naver.maps)
      });
      return;
    }

    console.log('[NaverMap] 마커/경로 업데이트 시작:', {
      startLocation,
      endLocation,
      routePointsCount: routePoints?.length || 0
    });

    // 기존 마커 제거
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 출발지 마커 추가
    if (startLocation) {
      console.log('[NaverMap] 출발지 마커 추가:', startLocation);
      const startMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(startLocation.lat, startLocation.lng),
        map: mapInstanceRef.current,
        icon: {
          content: `
            <div style="
              background-color: #3A86FF;
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                transform: rotate(45deg);
                color: white;
                font-weight: bold;
                font-size: 14px;
              ">출</div>
            </div>
          `,
          anchor: new window.naver.maps.Point(16, 16)
        },
        title: startLocation.name || '출발지'
      });
      markersRef.current.push(startMarker);

      // 출발지 정보창
      if (startLocation.name) {
        const startInfoWindow = new window.naver.maps.InfoWindow({
          content: `<div style="padding: 8px; font-size: 14px; font-weight: bold; color: #3A86FF;">출발지: ${startLocation.name}</div>`
        });

        window.naver.maps.Event.addListener(startMarker, 'click', () => {
          startInfoWindow.open(mapInstanceRef.current, startMarker);
        });
      }
    }

    // 도착지 마커 추가
    if (endLocation) {
      console.log('[NaverMap] 도착지 마커 추가:', endLocation);
      const endMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(endLocation.lat, endLocation.lng),
        map: mapInstanceRef.current,
        icon: {
          content: `
            <div style="
              background-color: #EF4444;
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                transform: rotate(45deg);
                color: white;
                font-weight: bold;
                font-size: 14px;
              ">도</div>
            </div>
          `,
          anchor: new window.naver.maps.Point(16, 16)
        },
        title: endLocation.name || '도착지'
      });
      markersRef.current.push(endMarker);

      // 도착지 정보창
      if (endLocation.name) {
        const endInfoWindow = new window.naver.maps.InfoWindow({
          content: `<div style="padding: 8px; font-size: 14px; font-weight: bold; color: #EF4444;">도착지: ${endLocation.name}</div>`
        });

        window.naver.maps.Event.addListener(endMarker, 'click', () => {
          endInfoWindow.open(mapInstanceRef.current, endMarker);
        });
      }
    }

    // 기존 경로선 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // 경로선 그리기
    if (routePoints && routePoints.length > 0) {
      console.log('[NaverMap] 경로 표시 시작:', routePoints.length, '개 좌표');

      const path = routePoints.map(point => {
        // point는 [lat, lng] 형식
        const lat = point[0];
        const lng = point[1];
        return new window.naver.maps.LatLng(lat, lng);
      });

      console.log('[NaverMap] 경로 첫 좌표:', path[0]?.y, path[0]?.x);
      console.log('[NaverMap] 경로 마지막 좌표:', path[path.length - 1]?.y, path[path.length - 1]?.x);

      const polyline = new window.naver.maps.Polyline({
        path: path,
        strokeColor: '#3A86FF',
        strokeWeight: 5,
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
        map: mapInstanceRef.current
      });

      polylineRef.current = polyline;
      console.log('[NaverMap] 경로선 생성 완료');

      // 경로를 포함하도록 지도 범위 조정
      const bounds = new window.naver.maps.LatLngBounds();
      path.forEach(latlng => bounds.extend(latlng));
      mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
      console.log('[NaverMap] 지도 범위 조정 완료');
    } else {
      // 경로가 없으면 출발지와 도착지만으로 범위 조정
      if (startLocation && endLocation) {
        const bounds = new window.naver.maps.LatLngBounds();
        bounds.extend(new window.naver.maps.LatLng(startLocation.lat, startLocation.lng));
        bounds.extend(new window.naver.maps.LatLng(endLocation.lat, endLocation.lng));
        mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
      } else if (startLocation) {
        mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(startLocation.lat, startLocation.lng));
        mapInstanceRef.current.setZoom(16);
      } else if (endLocation) {
        mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(endLocation.lat, endLocation.lng));
        mapInstanceRef.current.setZoom(16);
      }
    }

    return () => {
      // 컴포넌트 언마운트 시 마커 및 경로선 제거
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = [];

      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [startLocation, endLocation, routePoints]);

  // 윈도우 리사이즈 시 지도 리사이즈
  useEffect(() => {
    if (!isInitializedRef.current || !mapInstanceRef.current || !window.naver || !window.naver.maps) {
      return;
    }

    const handleResize = () => {
      if (mapInstanceRef.current) {
        try {
          window.naver.maps.Event.trigger(mapInstanceRef.current, 'resize');
        } catch (err) {
          console.error('[ERROR] Map resize error:', err);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // ResizeObserver를 사용하여 컨테이너 크기 변경 감지
    let resizeObserver: ResizeObserver | null = null;
    if (mapRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver && mapRef.current) {
        resizeObserver.unobserve(mapRef.current);
      }
    };
  }, [loading, error]); // 지도가 초기화된 후에만 실행

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        minWidth: '100%',
        position: 'relative'
      }}
      className="naver-map-container"
    >
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10"
          style={{ pointerEvents: 'none' }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">지도 로딩 중...</div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10"
        >
          <div className="text-center text-gray-600">
            <div className="text-lg mb-2">지도</div>
            <div className="text-sm mb-2">지도 준비 중</div>
            <div className="text-xs text-gray-500">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NaverMap;
