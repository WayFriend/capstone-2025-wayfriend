// 백엔드 API를 통한 네이버 지도 서비스

import { API_BASE_URL, getApiUrl } from './apiConfig';

// Window 타입 확장
declare global {
  interface Window {
    naver: any;
  }
}

// Geocoding 결과 타입 정의
export interface GeocodeResult {
  lat: number;
  lng: number;
  name: string;
  address: string;
  category: string;
}

// Naver Client ID를 백엔드에서 가져오는 함수 (백엔드 실패 시 환경 변수 fallback)
export const getNaverClientId = async (): Promise<string | null> => {
  try {
    const response = await fetch(getApiUrl('/api/config'));
    if (!response.ok) {
      throw new Error('Config API 오류');
    }
    const data = await response.json();
    return data.naverClientId || null;
  } catch (error) {
    console.warn('[WARN] 백엔드에서 Client ID를 가져올 수 없습니다. 환경 변수에서 시도합니다.', error);

    // 백엔드 연결 실패 시 환경 변수에서 직접 가져오기
    const envClientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    if (envClientId) {
      console.log('[INFO] 환경 변수에서 Client ID를 사용합니다.');
      return envClientId;
    }

    console.error('[ERROR] Client ID를 가져올 수 없습니다. (백엔드 연결 실패, 환경 변수 없음)');
    return null;
  }
};

// Geocoding (주소/장소 → 좌표) - JavaScript SDK 우선, 실패 시 백엔드 API
export const geocode = async (address: string): Promise<GeocodeResult[]> => {
  // JavaScript SDK geocoder를 사용하여 장소 검색 시도
  if (window.naver && window.naver.maps && window.naver.maps.Service) {
    try {
      console.log('[geocode] JavaScript SDK geocoder 사용하여 검색:', address);

      return new Promise((resolve, reject) => {
        window.naver.maps.Service.geocode(
          {
            query: address,
            count: 10, // 최대 10개 결과
          },
          (status: number, response: any) => {
            console.log('[geocode] SDK 응답 status:', status);
            console.log('[geocode] SDK 응답:', response);

            if (status === window.naver.maps.Service.Status.OK && response.v2) {
              const addresses = response.v2.addresses || [];
              console.log('[geocode] SDK 검색 결과 개수:', addresses.length);

              if (addresses.length > 0) {
                const results: GeocodeResult[] = addresses.map((addr: any) => {
                  // 이름: 건물명 > 도로명주소 > 지번주소 > 검색어
                  const name = addr.buildingName || addr.roadAddress || addr.jibunAddress || address;
                  // 주소: 도로명주소 > 지번주소 > 검색어
                  const addrText = addr.roadAddress || addr.jibunAddress || address;

                  // 카테고리 결정
                  let category = '일반';
                  if (addr.buildingName) {
                    const building = addr.buildingName;
                    if (building.includes('학교') || building.includes('대학')) {
                      category = '학교';
                    } else if (building.includes('공항') || building.includes('터미널')) {
                      category = '공항';
                    } else if (building.includes('역')) {
                      category = '역사';
                    } else if (building.includes('시청') || building.includes('구청') || building.includes('동사무소')) {
                      category = '관공서';
                    } else if (building.includes('병원') || building.includes('의원')) {
                      category = '병원';
                    } else if (building.includes('은행')) {
                      category = '은행';
                    } else if (building.includes('마트') || building.includes('백화점')) {
                      category = '쇼핑';
                    }
                  }

                  return {
                    lat: parseFloat(addr.y),
                    lng: parseFloat(addr.x),
                    name: name,
                    address: addrText,
                    category: category,
                  };
                });

                console.log('[geocode] SDK 검색 성공:', results.length, '개 결과');
                resolve(results);
                return;
              }
            }

            // SDK로 결과가 없거나 실패한 경우 백엔드 API로 fallback
            console.log('[geocode] SDK 검색 결과 없음 또는 실패, 백엔드 API로 시도');
            fetch(getApiUrl('/api/geocode'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query: address }),
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error(`Geocoding API 오류: ${response.status}`);
                }
                return response.json();
              })
              .then((data) => {
                console.log('[geocode] 백엔드 API 검색 성공:', data.length, '개 결과');
                resolve(data);
              })
              .catch((error) => {
                console.error('[geocode] 백엔드 API 오류:', error);
                reject(error);
              });
          }
        );
      });
    } catch (error) {
      console.warn('[geocode] SDK geocoder 사용 실패, 백엔드 API로 시도:', error);
      // SDK 사용 실패 시 백엔드로 fallback
    }
  }

  // SDK가 없거나 실패한 경우 백엔드 API 사용
  try {
    console.log('[geocode] 백엔드 API 사용하여 검색:', address);
    const response = await fetch(getApiUrl('/api/geocode'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: address }),
    });

    if (!response.ok) {
      throw new Error(`Geocoding API 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log('[geocode] 백엔드 API 검색 성공:', data.length, '개 결과');
    return data; // 배열로 반환
  } catch (error) {
    console.error('❌ 지오코딩 오류:', error);
    throw error;
  }
};

// Directions API (경로 찾기) - 백엔드 API 사용
export const getDirections = async (
  start: { lat: number; lng: number },
  goal: { lat: number; lng: number },
  option: 'trafast' | 'tracomfort' | 'traoptimal' = 'trafast'
): Promise<any> => {
  try {
    const response = await fetch(getApiUrl('/api/directions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: { lat: start.lat, lng: start.lng },
        goal: { lat: goal.lat, lng: goal.lng },
        option: option
      }),
    });

    if (!response.ok) {
      throw new Error(`Directions API 오류: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
      console.error('길찾기 API 오류:', error);
    throw error;
  }
};

// Static Map 이미지 가져오기 (백엔드 프록시 사용)
export const getStaticMapImage = async (
  center: { lat: number; lng: number },
  zoom: number = 15,
  width: number = 800,
  height: number = 600,
  routePoints?: [number, number][],  // 경로 좌표 리스트 [[lat, lng], ...]
  startPoint?: { lat: number; lng: number },  // 출발지 좌표
  endPoint?: { lat: number; lng: number }  // 도착지 좌표
): Promise<string> => {
  try {
    const requestBody: any = {
      center: { lat: center.lat, lng: center.lng },
      zoom,
      width,
      height
    };

    // 경로 좌표가 있으면 추가
    if (routePoints && routePoints.length > 0) {
      requestBody.route_points = routePoints;
    }

    // 출발지/도착지 좌표 추가
    if (startPoint) {
      requestBody.start_point = { lat: startPoint.lat, lng: startPoint.lng };
    }
    if (endPoint) {
      requestBody.end_point = { lat: endPoint.lat, lng: endPoint.lng };
    }

    const response = await fetch(getApiUrl('/api/static-map'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Static Map API 오류: ${response.status}`);
    }

    const blob = await response.blob();
     console.log('🔍 Blob 정보:', {
      size: blob.size,
      type: blob.type
    });

    // Blob을 Base64로 변환하여 안정적인 이미지 URL 생성
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
         console.log('🔍 Base64 이미지 URL 생성 완료');
         console.log('🔍 이미지 타입:', base64Url.substring(0, 50) + '...');

        // SVG인 경우 올바른 MIME 타입으로 수정
        if (base64Url.includes('PHN2Zy') || base64Url.includes('data:image/svg')) {
          const correctedUrl = base64Url.replace('data:image/png;base64,', 'data:image/svg+xml;base64,');
           console.log('🔍 SVG 타입으로 수정됨');
          resolve(correctedUrl);
        } else {
          resolve(base64Url);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Static Map 오류:', error);
    // 오류 시 플레이스홀더 이미지 반환
     return 'https://placehold.co/800x600/F0F5FF/3A86FF?text=🗺️+지도+준비+중&font=roboto';
  }
};

// Reverse Geocoding (좌표 → 주소) - 백엔드 API 사용
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    console.log(`[역지오코딩] 요청: (${lat}, ${lng})`);
    const response = await fetch(getApiUrl('/api/reverse-geocode'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lat, lng }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[역지오코딩] API 오류 (${response.status}):`, errorText);
      throw new Error(`Reverse Geocoding API 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[역지오코딩] 응답:`, data);
    const address = data.address || '주소를 찾을 수 없습니다.';
    console.log(`[역지오코딩] 최종 주소: "${address}"`);
    return address;
  } catch (error) {
    console.error('[역지오코딩] 오류:', error);
    throw error;
  }
};

// API 키 유효성 검사 (백엔드에서 처리하므로 항상 true 반환)
export const validateApiKeys = (): boolean => {
   console.log('🔍 백엔드 API를 통한 네이버 지도 서비스 사용');
  return true;
};