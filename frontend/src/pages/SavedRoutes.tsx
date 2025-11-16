import React, { useState, useEffect } from 'react';
import RouteDetailModal from '../components/RouteDetailModal';

// 저장된 경로 데이터 타입 정의
interface SavedRoute {
  id: number;
  title: string;
  start: string;
  end: string;
  savedDate: string;
  imageUrl: string;
}

interface SavedRoutesProps {
  onNavigateToRoute?: (route: {
    start: string;
    end: string;
    startLocation?: { lat: number; lng: number; name: string };
    endLocation?: { lat: number; lng: number; name: string };
    mode?: 'walking' | 'wheelchair';
    filter?: 'safest' | 'no-stairs' | 'recommended';
  }) => void;
}

// API Base URL (백엔드 API 연동 시 사용 예정)
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 더미 데이터 (API가 없을 때 사용)
const MOCK_ROUTES: SavedRoute[] = [
  {
    id: 1,
    title: "서울역에서 명동까지",
    start: "서울특별시 중구 한강대로 405",
    end: "서울특별시 중구 명동길 26",
    savedDate: "2024년 7월 15일",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQoV1nh8ivongGNWSWm7Q0JfUn6U0MCybDU68qUuNl175DUzru26WptsF8l4IryBgSlqTI1OaXKsMOKg1NHwHsCuL0oGxtC8ONd7z3CIK99-lWa47ekBqeIOeAeGwLZwsVfK77fM3s0TBb1O3-u3wJlPUEG9LgyFZgxJprb7OYdmo8PpIVLm3kR1fvgwYP3Oa4V_H-9-lSbLkyFoB9210SkFc9tnLy8wemVQvrx8peHpgMX6r0DUmGcv6QHzMISzwCjDGecdYPuy0"
  },
  {
    id: 2,
    title: "강남역에서 코엑스까지",
    start: "서울특별시 강남구 강남대로 396",
    end: "서울특별시 강남구 영동대로 513",
    savedDate: "2024년 6월 22일",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCauqO13P0wmlGl1Gmv_5VsR0IhNisBl5c2TgPrkui103K9S6My9XsHsqe6_tro5T7DuGOGND65GvVbwW97K7VivKEgTDUotZEjJQo5MKPwIXpKvRdrKF8f0tMhX_03AOpxQecmLOhN1ERufGjwS99IbwTY3egZq96BaF1iGEylFIeQSTHACjWlZ5-RtGtfIClyLUf0QlhHPbJEDKL_DlMSe_nqMR38exykuCsZ-PbCQdet1qUVpd0MKR-XNbIUQOlgZruS4lmG1dk"
  },
  {
    id: 3,
    title: "홍대입구역에서 이대앞까지",
    start: "서울특별시 마포구 양화로 188",
    end: "서울특별시 마포구 이화여대길 52",
    savedDate: "2024년 5월 10일",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLJPsTxWOjXpCoQpetcXDLJN88PmHRjAKJYTGEWu5yIJ0LWOwHXuoS6bLGUpol1TkPxplRewTolAWfKi9svJxff_FcJw1g7TNAf0YWea2zC9zdC92Ss9UujMn1l-4tSYBV3vv5_B4T9lgoeYH3nMLbuUqUwbZHYPxZsD1LjF6ZNfSJlaI6TJcpVtu0ptxrPkmARyvVHHWwKXvObatNiewaFQFml73dGk4xCISx8GMv_WcjpyvNBQRDLs08VuY3d_9WrJEh0Wv47hw"
  },
  {
    id: 4,
    title: "잠실역에서 롯데월드타워까지",
    start: "서울특별시 송파구 올림픽로 240",
    end: "서울특별시 송파구 올림픽로 300",
    savedDate: "2024년 4월 5일",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnvgrwOQe1l0E0aR4aULQDD83suxYE9bcQPxZv4OoWBPpr1lmInpz-GxNdkDYg7qja6Si0WX97HllnZP6vKrAByirus5O1ZZLoTkL6YPZ4oGkTXa-sKI9nkHdeVLoamLXGjj1YyfV_tfFA32NIhP8UEO-ina_CaKd9H5Umc2T6AvMUMY9T-RrRLdG7JujC_4wdvFG7ANWPBBnJ5lTfc9if-hkOhn1MxNZmmYUdg2Hg17GAhCTbV72SucO7YIyNTW22YnRWz5E-jPw"
  },
  {
    id: 5,
    title: "을지로입구역에서 동대문디자인플라자까지",
    start: "서울특별시 중구 을지로 281",
    end: "서울특별시 중구 을지로6가 281",
    savedDate: "2024년 3월 1일",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnsdHIDxpNmBtj3mEkkxbm14oumelQ2f3kn0HIs76rpDHeK0J2MdIkjajswYK08L9h3wNZSYE8Z2--x-mVkr2c2_iCaQe6kZ2zyt0jmCluEtpNpeOD_pMJP9w0uU7kRdCUPVPVTUjpo-bk1W8Z_v6ytLqSHJHfCAlMwbUDtRfZXOXsjKPgwnaZg2qVVcf0B3O29GFEffKqw6VmQuSSRlxEJGtG_AiqeZtr72-YijBAcN_p9AoHM-R245A5E3zPjc91ZBHR_ZjDVkk"
  }
];

const SavedRoutes: React.FC<SavedRoutesProps> = ({ onNavigateToRoute }) => {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<SavedRoute | null>(null);

  // 저장된 경로 목록 가져오기
  const fetchSavedRoutes = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: 백엔드 API가 준비되면 아래 주석을 해제하고 API 호출 사용
      // const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      // const token = localStorage.getItem('token'); // 인증 토큰 (필요시)
      // const response = await fetch(`${API_BASE_URL}/api/routes/saved`, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     ...(token && { Authorization: `Bearer ${token}` })
      //   }
      // });

      // if (!response.ok) {
      //   throw new Error(`API 오류: ${response.status}`);
      // }

      // const data = await response.json();
      // setSavedRoutes(data.routes || []);

      // 현재는 API가 없으므로 더미 데이터 사용
      console.log('[SavedRoutes] API 미구현 상태 - 더미 데이터 사용');
      setSavedRoutes(MOCK_ROUTES);

    } catch (err) {
      console.error('[SavedRoutes] API 호출 실패, 더미 데이터 사용:', err);
      // API 호출 실패 시에도 더미 데이터로 표시
      setSavedRoutes(MOCK_ROUTES);
      // setError('저장된 경로를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모달에서 경로 삭제
  const handleDeleteFromModal = () => {
    if (selectedRoute) {
      handleDeleteRoute(selectedRoute.id);
      setSelectedRoute(null);
    }
  };

  // 경로 다시 보기 (FindRoute 페이지로 이동)
  const handleViewRoute = () => {
    if (!selectedRoute || !onNavigateToRoute) {
      return;
    }

    // 저장된 경로 정보를 FindRoute로 전달
    // TODO: 실제 API 연동 시 좌표 정보도 함께 전달
    onNavigateToRoute({
      start: selectedRoute.start,
      end: selectedRoute.end,
      // 실제 구현 시 저장된 경로의 좌표 정보를 사용
      // startLocation: { lat: ..., lng: ..., name: selectedRoute.start },
      // endLocation: { lat: ..., lng: ..., name: selectedRoute.end },
      mode: 'walking', // 기본값, 실제로는 저장된 값 사용
      filter: 'safest' // 기본값, 실제로는 저장된 값 사용
    });

    // 모달 닫기
    setSelectedRoute(null);
  };

  // 경로 삭제
  const handleDeleteRoute = async (routeId: number) => {
    if (!confirm('이 경로를 삭제하시겠습니까?')) {
      return;
    }

    try {
      // TODO: 백엔드 API가 준비되면 아래 주석을 해제하고 API 호출 사용
      // const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      // const token = localStorage.getItem('token');
      // const response = await fetch(`${API_BASE_URL}/api/routes/${routeId}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     ...(token && { Authorization: `Bearer ${token}` })
      //   }
      // });

      // if (!response.ok) {
      //   throw new Error(`삭제 실패: ${response.status}`);
      // }

      // API 호출 성공 후 목록 다시 불러오기
      // await fetchSavedRoutes();

      // 현재는 로컬 상태만 업데이트
      setSavedRoutes(savedRoutes.filter(route => route.id !== routeId));
      console.log(`[SavedRoutes] 경로 ${routeId} 삭제됨 (로컬 상태)`);

    } catch (err) {
      console.error('[SavedRoutes] 삭제 실패:', err);
      alert('경로 삭제에 실패했습니다.');
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchSavedRoutes();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">저장된 경로</h2>
          <div className="text-center py-12">
            <p className="text-gray-500">저장된 경로를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">저장된 경로</h2>
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchSavedRoutes}
              className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">저장된 경로</h2>
      {savedRoutes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">저장된 경로가 없습니다.</p>
          <button
            onClick={() => {/* TODO: 경로 찾기 페이지로 이동 */}}
            className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            경로 찾기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {savedRoutes.map((route) => (
          <div
            key={route.id}
            className="group relative flex items-center gap-4 bg-white p-4 rounded-md border border-gray-200 hover:shadow-md hover:border-[var(--primary-color)] transition-all duration-300"
          >
            <div className="flex-shrink-0">
              <div
                className="bg-center bg-no-repeat aspect-video bg-cover rounded-md h-24 w-40"
                style={{ backgroundImage: `url("${route.imageUrl}")` }}
              ></div>
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">{route.title}</p>
              <p className="text-sm text-gray-500 mt-1">출발: {route.start}, 도착: {route.end}</p>
              <p className="text-xs text-gray-400 mt-2">저장일: {route.savedDate}</p>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={() => setSelectedRoute(route)}
                className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                상세 보기
              </button>
              <button
                onClick={() => handleDeleteRoute(route.id)}
                className="p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                title="경로 삭제"
              >
                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
                </svg>
              </button>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* 경로 상세 모달 */}
      {selectedRoute && (
        <RouteDetailModal
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
          onViewRoute={handleViewRoute}
          onDelete={handleDeleteFromModal}
        />
      )}
      </div>
    </div>
  );
};

export default SavedRoutes;
