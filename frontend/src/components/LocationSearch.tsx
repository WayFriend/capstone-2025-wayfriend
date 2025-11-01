import React, { useState, useRef, useEffect, useCallback } from 'react';
import { geocode, GeocodeResult } from '../utils/naverMapApi';

interface LocationSearchProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: { name: string; lat: number; lng: number }) => void;
  icon?: React.ReactNode;
  className?: string;
}

interface SearchResult extends GeocodeResult {
  // GeocodeResult를 확장하여 사용
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  placeholder,
  value,
  onChange,
  onLocationSelect,
  icon,
  className = ''
}) => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      return;
    }

    setIsSearching(true);
    try {
      // 백엔드 API를 사용하여 주소 검색 (여러 결과 반환)
      const results = await geocode(query);

      console.log(`[LocationSearch] 검색 결과 개수: ${results?.length || 0}`);

      if (!results || !Array.isArray(results)) {
        console.log('[LocationSearch] 검색 결과가 유효하지 않음 - 초기화');
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      // 검색 결과가 비어있으면 드롭다운 표시 안 함
      if (results.length === 0) {
        console.log('[LocationSearch] 검색 결과 없음 - 빈 결과 표시');
        setSearchResults([]);
        setShowResults(true); // "검색 결과가 없습니다" 메시지를 표시하기 위해
        return;
      }

      // 검색 결과를 SearchResult 형태로 변환
      const searchResults: SearchResult[] = results.map(result => ({
        lat: result.lat,
        lng: result.lng,
        name: result.name,
        address: result.address,
        category: result.category
      }));

      console.log(`[LocationSearch] 변환된 검색 결과 ${searchResults.length}개:`, searchResults);
      console.log('[LocationSearch] 검색 결과 설정 및 드롭다운 표시');
      setSearchResults(searchResults);
      setShowResults(true);

      // 상태 설정 후 확인
      setTimeout(() => {
        console.log('[LocationSearch] 상태 확인 - showResults:', true, 'searchResults.length:', searchResults.length);
      }, 100);
    } catch (error) {
      console.error('❌ 주소 검색 오류:', error);
      console.error('[LocationSearch] 에러 상세:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      // 오류 발생 시에도 기본 결과 제공
      const fallbackResult: SearchResult = {
        name: query,
        lat: 37.5665, // 서울시청 좌표
        lng: 126.9780,
        address: "주소 정보 없음",
        category: "일반"
      };
      setSearchResults([fallbackResult]);
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 검색어가 변경될 때마다 지연된 검색 실행
  useEffect(() => {
    // 사용자가 실제로 입력하기 전까지는 검색하지 않음
    if (!hasUserInteracted) {
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (value.trim().length < 2) {
      console.log('[LocationSearch] 검색어가 너무 짧음 - 결과 초기화');
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    console.log(`[LocationSearch] 검색 시작 예정: "${value}" (300ms 후)`);
    const timeout = setTimeout(async () => {
      console.log(`[LocationSearch] 검색 실행: "${value}"`);
      await performSearch(value.trim());
    }, 300); // 300ms 지연

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
      console.log('[LocationSearch] 이전 검색 타임아웃 취소됨');
    };
  }, [value, hasUserInteracted, performSearch]);

  // 외부 클릭 시 결과 숨기기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    onChange(result.name);
    onLocationSelect(result);
    setShowResults(false);
    setSearchResults([]); // 검색 결과 초기화
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasUserInteracted(true); // 사용자가 입력하기 시작함
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    // 포커스 시에는 드롭다운을 자동으로 열지 않음
    // 검색 결과가 있으면 표시
    if (searchResults.length > 0 && hasUserInteracted) {
      setShowResults(true);
    }
  };

  return (
    <div className={`relative ${className}`} style={{ position: 'relative', zIndex: 'auto' }}>
      <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {icon}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="flex-1 outline-none text-gray-700 placeholder-gray-400"
          placeholder={placeholder}
        />
        {isSearching && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {(() => {
        const shouldShow = showResults && searchResults.length > 0;
        if (shouldShow) {
          console.log('[LocationSearch] 드롭다운 렌더링 조건 충족:', { showResults, searchResultsLength: searchResults.length });
        }
        return shouldShow;
      })() && (
        <div
          ref={resultsRef}
          className="absolute left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          style={{
            zIndex: 1000,
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            width: '100%',
            marginTop: '8px',
            backgroundColor: 'white',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {searchResults.map((result, index) => (
            <div
              key={index}
              onClick={() => handleResultClick(result)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                {/* 위치 아이콘 */}
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium truncate">{result.name}</p>
                  <p className="text-sm text-gray-600 truncate">{result.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {result.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 검색 결과가 없을 때 */}
      {(() => {
        const shouldShow = showResults && searchResults.length === 0 && !isSearching && value.trim().length >= 2;
        if (shouldShow) {
          console.log('[LocationSearch] "검색 결과 없음" 메시지 렌더링 조건 충족:', {
            showResults,
            searchResultsLength: searchResults.length,
            isSearching,
            valueLength: value.trim().length
          });
        }
        return shouldShow;
      })() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 text-center text-gray-500">
            <p className="text-sm">검색 결과가 없습니다</p>
            <p className="text-xs mt-1">다른 키워드로 검색해보세요</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
