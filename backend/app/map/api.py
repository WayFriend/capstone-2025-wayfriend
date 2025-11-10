# backend/app/map/api.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import httpx
import os
import math
from typing import Dict, Any, List
from pydantic import BaseModel
from dotenv import load_dotenv
from pyproj import Transformer

# .env 파일 로드
load_dotenv()

router = APIRouter()

# 네이버 지도 API 설정
# - 브라우저용 JS SDK 클라이언트 아이디 (oapi.map.naver.com용)
NAVER_MAPS_JS_CLIENT_ID = os.getenv("NAVER_MAPS_JS_CLIENT_ID")

# - 서버측 APIGW 키 (maps.apigw.ntruss.com용)
#   하위 호환을 위해 기존 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET도 읽어옵니다
NAVER_APIGW_KEY_ID = os.getenv("NAVER_APIGW_KEY_ID") or os.getenv("NAVER_CLIENT_ID")
NAVER_APIGW_KEY = os.getenv("NAVER_APIGW_KEY") or os.getenv("NAVER_CLIENT_SECRET")

# 네이버 검색 API (장소 검색용) - 네이버 개발자 센터에서 발급
NAVER_SEARCH_CLIENT_ID = os.getenv("NAVER_SEARCH_CLIENT_ID")
NAVER_SEARCH_CLIENT_SECRET = os.getenv("NAVER_SEARCH_CLIENT_SECRET")

# 네이버 지도 API 헤더
def get_naver_headers():
    headers = {
        "X-NCP-APIGW-API-KEY-ID": NAVER_APIGW_KEY_ID,
    }
    if NAVER_APIGW_KEY:
        headers["X-NCP-APIGW-API-KEY"] = NAVER_APIGW_KEY
    return headers

class GeocodeRequest(BaseModel):
    query: str

class GeocodeResponse(BaseModel):
    lat: float
    lng: float
    name: str

class GeocodeResult(BaseModel):
    lat: float
    lng: float
    name: str
    address: str
    category: str

class DirectionsRequest(BaseModel):
    start: Dict[str, float]
    goal: Dict[str, float]
    option: str = "trafast"

class RouteStep(BaseModel):
    instruction: str
    distance: str
    duration: str
    icon: str
    warning: str = ""

class RouteInfo(BaseModel):
    distance: str
    duration: str
    steps: List[RouteStep]

class StaticMapRequest(BaseModel):
    center: Dict[str, float]
    zoom: int
    width: int
    height: int

class ReverseGeocodeRequest(BaseModel):
    lat: float
    lng: float

@router.get("/api/config")
async def get_config():
    """클라이언트용 설정 반환"""
    return {
        # 프론트(JS SDK) 전용 클라이언트 아이디
        "naverClientId": NAVER_MAPS_JS_CLIENT_ID,
    }

@router.post("/api/geocode")
async def geocode(request: GeocodeRequest):
    """주소를 좌표로 변환 (여러 결과 반환)"""
    print(f"[DEBUG] Geocoding request: {request.query}")
    print(f"[DEBUG] APIGW key available: {NAVER_APIGW_KEY_ID is not None}")
    print(f"[DEBUG] Using Naver API: {bool(NAVER_APIGW_KEY_ID)}")

    if not NAVER_APIGW_KEY_ID:
        print("[WARN] Naver API key not set. Using mock data")
        return generate_mock_geocode_results(request.query)

    try:
        async with httpx.AsyncClient() as client:
            url = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode"
            # coordinate 파라미터 제거 - 전국 범위 검색
            params = {
                "query": request.query,
                "count": 10  # 최대 10개 결과
            }

            print(f"[DEBUG] Naver API call: {url}")
            print(f"[DEBUG] Request params: {params}")

            response = await client.get(url, params=params, headers=get_naver_headers())
            print(f"[DEBUG] Response status: {response.status_code}")

            response.raise_for_status()
            data = response.json()
            print(f"[DEBUG] Naver API response keys: {data.keys() if isinstance(data, dict) else 'Not a dict'}")
            print(f"[DEBUG] Full API response: {data}")

            # status와 errorMessage 확인
            if isinstance(data, dict):
                status = data.get('status', '')
                error_message = data.get('errorMessage', '')
                meta = data.get('meta', {})
                total_count = meta.get('totalCount', 0) if isinstance(meta, dict) else 0

                print(f"[DEBUG] Naver API response status: {status}")
                print(f"[DEBUG] Naver API totalCount: {total_count}")
                print(f"[DEBUG] Naver API error message: {error_message}")
                print(f"[DEBUG] Naver API addresses count: {len(data.get('addresses', [])) if isinstance(data, dict) else 0}")

                if status and status != 'OK':
                    print(f"[WARN] Naver API returned non-OK status: {status}")
                    if error_message:
                        print(f"[WARN] Error message: {error_message}")

            if isinstance(data, dict) and data.get('addresses'):
                print(f"[DEBUG] First address structure: {data['addresses'][0].keys() if data['addresses'] else 'No addresses'}")
                if data['addresses']:
                    print(f"[DEBUG] Sample address: {data['addresses'][0]}")

            results = []

            if "addresses" in data and data["addresses"] and len(data["addresses"]) > 0:
                for addr in data["addresses"]:
                    # 네이버 API 응답 구조에 맞게 파싱
                    road_address = addr.get("roadAddress", "")
                    jibun_address = addr.get("jibunAddress", "")
                    building_name = addr.get("buildingName", "")

                    # 이름 우선순위: 건물명 > 도로명주소 > 지번주소 > 검색어
                    name = building_name if building_name else (road_address if road_address else (jibun_address if jibun_address else request.query))

                    # 주소 정보: 도로명주소 우선, 없으면 지번주소, 둘 다 없으면 검색어 사용
                    address = road_address if road_address else (jibun_address if jibun_address else request.query)

                    # 카테고리 결정
                    category = "일반"
                    if building_name:
                        if any(keyword in building_name for keyword in ["대학교", "대학", "학교"]):
                            category = "학교"
                        elif any(keyword in building_name for keyword in ["공항", "터미널"]):
                            category = "공항"
                        elif any(keyword in building_name for keyword in ["역", "역사"]):
                            category = "역사"
                        elif any(keyword in building_name for keyword in ["시청", "구청", "동사무소", "관공서"]):
                            category = "관공서"

                    result = GeocodeResult(
                        lat=float(addr["y"]),
                        lng=float(addr["x"]),
                        name=name if name else request.query,
                        address=address if address else request.query,
                        category=category
                    )
                    results.append(result)

            if results:
                print(f"[SUCCESS] Geocoding success: {len(results)} results")
                return results
            else:
                # Geocoding API 결과가 없으면 네이버 검색 API로 장소 검색 시도
                print(f"[INFO] Geocoding API 결과 없음, 네이버 검색 API로 장소 검색 시도: '{request.query}'")
                search_results = await search_places_using_naver_search(request.query)
                if search_results:
                    print(f"[SUCCESS] 네이버 검색 API에서 검색 성공: {len(search_results)}개")
                    return search_results

                # 검색 API에도 없으면 장소 데이터베이스에서 검색 시도 (fallback)
                print(f"[INFO] 네이버 검색 API 결과 없음, 장소 데이터베이스에서 검색 시도: '{request.query}'")
                place_results = search_place_database(request.query)
                if place_results:
                    print(f"[SUCCESS] 장소 데이터베이스에서 검색 성공: {len(place_results)}개")
                    return place_results

                # 모두 실패하면 빈 배열 반환
                print(f"[INFO] No results found for query: '{request.query}'")
                return []

    except httpx.HTTPStatusError as e:
        error_msg = f"Naver API HTTP error: {e.response.status_code}"
        print(f"[ERROR] {error_msg} - {e.response.text}")
        import traceback
        traceback.print_exc()
        # HTTP 오류는 클라이언트에 명확히 전달
        raise HTTPException(
            status_code=e.response.status_code if e.response.status_code >= 400 else 502,
            detail=f"외부 API 호출 실패: {error_msg}"
        )
    except httpx.RequestError as e:
        error_msg = f"Network error while calling Naver API: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=503,
            detail="네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        )
    except Exception as e:
        error_msg = f"Unexpected server error: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        # 예상치 못한 서버 오류는 500으로 반환
        raise HTTPException(
            status_code=500,
            detail="서버 오류가 발생했습니다. 관리자에게 문의해주세요."
        )

async def search_places_using_naver_search(query: str) -> List[GeocodeResult]:
    """네이버 검색 API를 사용하여 장소 검색"""
    if not NAVER_SEARCH_CLIENT_ID or not NAVER_SEARCH_CLIENT_SECRET:
        print("[INFO] 네이버 검색 API 키가 설정되지 않음, 검색 API 사용 불가")
        return []

    try:
        async with httpx.AsyncClient() as client:
            # 네이버 지역 검색 API 사용
            url = "https://openapi.naver.com/v1/search/local.json"
            headers = {
                "X-Naver-Client-Id": NAVER_SEARCH_CLIENT_ID,
                "X-Naver-Client-Secret": NAVER_SEARCH_CLIENT_SECRET,
            }
            params = {
                "query": query,
                "display": 5,  # 한 번에 표시할 검색 결과 개수 (기본값: 1, 최댓값: 5)
                "start": 1,    # 검색 시작 위치 (기본값: 1)
                "sort": "random"  # random: 정확도순 (기본값), comment: 리뷰 개수순
            }

            print(f"[DEBUG] 네이버 검색 API 호출: {url}")
            print(f"[DEBUG] 검색 쿼리: {query}")

            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()

            print(f"[DEBUG] 네이버 검색 API 응답: {data.get('total', 0)}개 검색 결과")
            print(f"[DEBUG] 네이버 검색 API 응답 상세: {data}")

            results = []
            items = data.get("items", [])

            for item in items:
                print(f"[DEBUG] 검색 결과 아이템: {item}")

                # 네이버 검색 API 응답에서 정보 추출
                place_name = item.get("title", "").replace("<b>", "").replace("</b>", "")
                address = item.get("address", "").replace("<b>", "").replace("</b>", "")
                road_address = item.get("roadAddress", "").replace("<b>", "").replace("</b>", "")
                category = item.get("category", "")
                mapx = item.get("mapx")  # 네이버 지도 좌표계 (x축)
                mapy = item.get("mapy")  # 네이버 지도 좌표계 (y축)

                print(f"[DEBUG] 장소명: {place_name}, 주소: {address}, mapx: {mapx}, mapy: {mapy}")

                # 카테고리 매핑
                category_mapped = "일반"
                if "지하철역" in category or "역" in category:
                    category_mapped = "역사"
                elif "공항" in category:
                    category_mapped = "공항"
                elif "대학교" in category or "학교" in category:
                    category_mapped = "학교"
                elif "관공서" in category or "시청" in category or "구청" in category:
                    category_mapped = "관공서"
                elif "병원" in category:
                    category_mapped = "병원"
                elif "은행" in category:
                    category_mapped = "은행"
                elif "쇼핑" in category or "마트" in category or "백화점" in category:
                    category_mapped = "쇼핑"

                # mapx, mapy가 있으면 네이버 좌표계를 WGS84로 변환하여 사용
                lat = None
                lng = None

                if mapx and mapy:
                    try:
                        # 네이버 지역 검색 API의 mapx, mapy는 정수형 좌표 값입니다
                        # 네이버 검색 API 문서에 따르면 mapx, mapy를 10000000으로 나누면 위도/경도가 됩니다
                        mapx_int = int(mapx)
                        mapy_int = int(mapy)

                        # 네이버 검색 API의 mapx, mapy는 10000000으로 나누면 위도/경도가 됩니다
                        # mapx: 경도(longitude), mapy: 위도(latitude)
                        try:
                            lng = mapx_int / 10000000.0
                            lat = mapy_int / 10000000.0

                            # inf, nan 값 즉시 체크 (변환 직후)
                            if math.isinf(lat) or math.isinf(lng) or math.isnan(lat) or math.isnan(lng):
                                print(f"[WARN] 좌표 변환 결과가 유효하지 않음 (inf/nan): lat={lat}, lng={lng}, mapx={mapx_int}, mapy={mapy_int}")
                                lat = None
                                lng = None
                            # 유효한 좌표 범위 체크 (한국 범위: 위도 33-43, 경도 124-132)
                            elif not (33.0 <= lat <= 43.0 and 124.0 <= lng <= 132.0):
                                print(f"[WARN] 좌표가 한국 범위를 벗어남: lat={lat}, lng={lng}, mapx={mapx_int}, mapy={mapy_int}")
                                lat = None
                                lng = None
                            else:
                                print(f"[DEBUG] 네이버 좌표 변환: mapx={mapx_int}, mapy={mapy_int} -> lat={lat}, lng={lng}")
                        except (OverflowError, ZeroDivisionError) as e:
                            print(f"[WARN] 좌표 변환 중 오버플로우 발생: {e}, mapx={mapx_int}, mapy={mapy_int}")
                            lat = None
                            lng = None
                    except (ValueError, TypeError, ZeroDivisionError) as e:
                        print(f"[WARN] 좌표 변환 실패: {e}, mapx={mapx}, mapy={mapy}")
                        lat = None
                        lng = None

                # 좌표가 변환되었고 유효한 값이면 바로 사용
                # inf, nan 값 최종 체크 및 유효 범위 체크
                if (lat is not None and lng is not None and
                    not (math.isinf(lat) or math.isinf(lng) or math.isnan(lat) or math.isnan(lng)) and
                    33.0 <= lat <= 43.0 and 124.0 <= lng <= 132.0):
                    final_address = road_address if road_address else (address if address else place_name)
                    results.append(GeocodeResult(
                        lat=float(lat),
                        lng=float(lng),
                        name=place_name,
                        address=final_address,
                        category=category_mapped
                    ))
                    print(f"[SUCCESS] 장소 '{place_name}' 좌표 사용 (네이버 검색 API): lat={lat}, lng={lng}")
                    continue
                else:
                    if lat is not None and lng is not None:
                        print(f"[WARN] 장소 '{place_name}' 좌표가 유효하지 않아 건너뜀: lat={lat}, lng={lng}")

                # 좌표가 없으면 장소명으로 Geocoding 시도
                geocode_query = place_name
                if road_address:
                    geocode_query = f"{place_name} {road_address}"
                elif address:
                    geocode_query = f"{place_name} {address}"

                try:
                    geocode_url = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode"
                    geocode_params = {"query": geocode_query, "count": 1}

                    async with httpx.AsyncClient() as geocode_client:
                        geocode_response = await geocode_client.get(
                            geocode_url,
                            params=geocode_params,
                            headers=get_naver_headers(),
                            timeout=5.0
                        )

                        print(f"[DEBUG] Geocoding 응답 상태: {geocode_response.status_code}")

                        if geocode_response.status_code == 200:
                            geocode_data = geocode_response.json()
                            print(f"[DEBUG] Geocoding 응답: {geocode_data}")

                            if geocode_data.get("addresses") and len(geocode_data["addresses"]) > 0:
                                addr = geocode_data["addresses"][0]

                                # 최종 주소 결정
                                final_address = road_address if road_address else (address if address else addr.get("roadAddress", "") or addr.get("jibunAddress", ""))

                                results.append(GeocodeResult(
                                    lat=float(addr["y"]),
                                    lng=float(addr["x"]),
                                    name=place_name,
                                    address=final_address,
                                    category=category_mapped
                                ))
                                print(f"[SUCCESS] 장소 '{place_name}' Geocoding 성공")
                                continue
                            else:
                                print(f"[WARN] 장소 '{place_name}' Geocoding 결과 없음")
                        else:
                            print(f"[WARN] 장소 '{place_name}' Geocoding HTTP 오류: {geocode_response.status_code}")

                except Exception as e:
                    print(f"[WARN] 장소 '{place_name}' Geocoding 실패: {e}")
                    import traceback
                    traceback.print_exc()

            print(f"[DEBUG] 네이버 검색 API 최종 결과: {len(results)}개")
            return results

    except httpx.HTTPStatusError as e:
        print(f"[ERROR] 네이버 검색 API HTTP 오류: {e.response.status_code} - {e.response.text}")
        return []
    except Exception as e:
        print(f"[ERROR] 네이버 검색 API 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

# 주요 장소 데이터베이스 (장소명 검색용 - 네이버 검색 API 실패 시 fallback)
PLACE_DATABASE = {
    # 지하철역
    "광화문역": {"lat": 37.5715, "lng": 126.9769, "address": "서울특별시 종로구 세종대로 지하 172", "category": "역사"},
    "서울역": {"lat": 37.5553, "lng": 126.9708, "address": "서울특별시 중구 한강대로 지하 405", "category": "역사"},
    "강남역": {"lat": 37.4981, "lng": 127.0276, "address": "서울특별시 강남구 테헤란로 지하 132", "category": "역사"},
    "홍대입구역": {"lat": 37.5568, "lng": 126.9230, "address": "서울특별시 마포구 양화로 지하 188", "category": "역사"},
    "명동역": {"lat": 37.5636, "lng": 126.9830, "address": "서울특별시 중구 명동길 26", "category": "역사"},
    "을지로입구역": {"lat": 37.5660, "lng": 126.9826, "address": "서울특별시 중구 을지로 38", "category": "역사"},
    "시청역": {"lat": 37.5647, "lng": 126.9771, "address": "서울특별시 중구 세종대로 지하 110", "category": "역사"},
    "종각역": {"lat": 37.5701, "lng": 126.9829, "address": "서울특별시 종로구 종로 지하 2", "category": "역사"},
    "이태원역": {"lat": 37.5346, "lng": 126.9947, "address": "서울특별시 용산구 이태원로 지하 186", "category": "역사"},
    "잠실역": {"lat": 37.5133, "lng": 127.1002, "address": "서울특별시 송파구 올림픽로 지하 240", "category": "역사"},

    # 주요 명소
    "경복궁": {"lat": 37.5796, "lng": 126.9770, "address": "서울특별시 종로구 사직로 161", "category": "관광지"},
    "남산타워": {"lat": 37.5512, "lng": 126.9882, "address": "서울특별시 용산구 남산공원길 105", "category": "관광지"},
    "롯데월드": {"lat": 37.5111, "lng": 127.0982, "address": "서울특별시 송파구 올림픽로 240", "category": "관광지"},
    "명동": {"lat": 37.5636, "lng": 126.9826, "address": "서울특별시 중구 명동", "category": "쇼핑"},
    "인사동": {"lat": 37.5716, "lng": 126.9856, "address": "서울특별시 종로구 인사동길", "category": "쇼핑"},
    "서울시청": {"lat": 37.5663, "lng": 126.9779, "address": "서울특별시 중구 세종대로 110", "category": "관공서"},

    # 공항
    "인천공항": {"lat": 37.4602, "lng": 126.4407, "address": "인천광역시 중구 공항로 272", "category": "공항"},
    "김포공항": {"lat": 37.5583, "lng": 126.7912, "address": "서울특별시 강서구 하늘길 112", "category": "공항"},
}

def search_place_database(query: str) -> List[GeocodeResult]:
    """장소명 데이터베이스에서 검색"""
    results = []
    query_lower = query.lower().strip()

    # 정확한 매칭
    if query in PLACE_DATABASE:
        place = PLACE_DATABASE[query]
        results.append(GeocodeResult(
            lat=place["lat"],
            lng=place["lng"],
            name=query,
            address=place["address"],
            category=place["category"]
        ))
        return results

    # 부분 매칭 (역, 공항 등)
    for place_name, place_data in PLACE_DATABASE.items():
        if query_lower in place_name.lower() or place_name.lower() in query_lower:
            results.append(GeocodeResult(
                lat=place_data["lat"],
                lng=place_data["lng"],
                name=place_name,
                address=place_data["address"],
                category=place_data["category"]
            ))

    return results

def generate_mock_geocode_results(query: str) -> List[GeocodeResult]:
    """모의 Geocoding 결과 생성 (네이버 API 사용 불가 시 fallback)"""
    # 장소 데이터베이스에서 먼저 검색 시도
    place_results = search_place_database(query)
    if place_results:
        print(f"[INFO] 장소 데이터베이스에서 '{query}' 검색 성공: {len(place_results)}개")
        return place_results

    # 데이터베이스에 없으면 기본 mock 데이터 반환
    return [
        GeocodeResult(
            lat=37.5665, lng=126.9780,
            name=query,
            address=query,
            category="일반"
        )
    ]

@router.post("/api/directions")
async def get_directions(request: DirectionsRequest):
    """경로 찾기"""
    print(f"[DEBUG] Directions request: {request.start} -> {request.goal}")

    if not NAVER_APIGW_KEY_ID:
        print(f"[WARN] Naver API key not set. Returning empty result")
        return RouteInfo(distance="0m", duration="0분", steps=[])

    try:
        async with httpx.AsyncClient() as client:
            url = "https://maps.apigw.ntruss.com/map-direction/v1/driving"
            params = {
                "start": f"{request.start['lng']},{request.start['lat']}",
                "goal": f"{request.goal['lng']},{request.goal['lat']}",
                "option": request.option
            }

            print(f"[DEBUG] Naver Directions API call: {url}")
            print(f"[DEBUG] Request params: {params}")

            response = await client.get(url, params=params, headers=get_naver_headers())
            print(f"[DEBUG] Response status: {response.status_code}")

            response.raise_for_status()
            data = response.json()
            print(f"[DEBUG] Naver Directions API response: {data}")

            # 응답 파싱
            route_info = RouteInfo(
                distance=format_distance(data.get("distance", 0)),
                duration=format_duration(data.get("duration", 0)),
                steps=[]
            )

            if "path" in data and data["path"]:
                for i, step in enumerate(data["path"]):
                    route_step = RouteStep(
                        instruction=step.get("instruction", f"Step {i+1}"),
                        distance=format_distance(step.get("distance", 0)),
                        duration=format_duration(step.get("duration", 0)),
                        icon=get_direction_icon(step.get("instruction", "")),
                        warning=get_warning_for_step(step.get("instruction", ""))
                    )
                    route_info.steps.append(route_step)

            print(f"[SUCCESS] Directions success: {len(route_info.steps)} steps")
            return route_info

    except httpx.HTTPStatusError as e:
        error_msg = f"Naver API HTTP error: {e.response.status_code}"
        print(f"[ERROR] {error_msg} - {e.response.text}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=e.response.status_code if e.response.status_code >= 400 else 502,
            detail=f"경로 찾기 API 호출 실패: {error_msg}"
        )
    except httpx.RequestError as e:
        error_msg = f"Network error while calling Naver API: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=503,
            detail="네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        )
    except Exception as e:
        error_msg = f"Unexpected server error: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="서버 오류가 발생했습니다. 관리자에게 문의해주세요."
        )

def format_distance(meters: int) -> str:
    """거리를 포맷팅"""
    if meters < 1000:
        return f"{meters}m"
    else:
        return f"{meters/1000:.1f}km"

def format_duration(seconds: int) -> str:
    """시간을 포맷팅"""
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}분"
    else:
        hours = minutes // 60
        remaining_minutes = minutes % 60
        return f"{hours}시간 {remaining_minutes}분"

def get_direction_icon(instruction: str) -> str:
    """방향 아이콘 반환"""
    if "직진" in instruction:
        return "↑"
    elif "우회전" in instruction:
        return "→"
    elif "좌회전" in instruction:
        return "←"
    elif "유턴" in instruction:
        return "↻"
    else:
        return "📍"

def get_warning_for_step(instruction: str) -> str:
    """단계별 경고 메시지"""
    if "횡단보도" in instruction:
        return "보행자 안전 주의"
    elif "터널" in instruction:
        return "터널 진입 주의"
    elif "고가도로" in instruction:
        return "고가도로 진입"
    else:
        return ""

@router.post("/api/static-map")
async def get_static_map(request: StaticMapRequest):
    """Static Map 이미지 생성"""
    print(f"[DEBUG] Static Map request: {request}")

    if not NAVER_APIGW_KEY_ID:
        print(f"[WARN] Naver API key not set. Using placeholder image")
        return await generate_placeholder_map(request)

    try:
        async with httpx.AsyncClient() as client:
            url = "https://maps.apigw.ntruss.com/map-static/v2/raster"
            params = {
                "w": request.width,
                "h": request.height,
                "center": f"{request.center['lng']},{request.center['lat']}",
                "level": request.zoom,
                "format": "png"
            }

            print(f"[DEBUG] Naver Static Map API call: {url}")
            print(f"[DEBUG] Request params: {params}")

            response = await client.get(url, params=params, headers=get_naver_headers())
            print(f"[DEBUG] Response status: {response.status_code}")

            if response.status_code == 200:
                print(f"[SUCCESS] Static Map success: {len(response.content)} bytes")
                return Response(content=response.content, media_type="image/png")
            else:
                print(f"[WARN] Static Map API error: {response.status_code}")
                return await generate_placeholder_map(request)

    except httpx.HTTPStatusError as e:
        error_msg = f"Naver API HTTP error: {e.response.status_code}"
        print(f"[ERROR] {error_msg} - {e.response.text}")
        import traceback
        traceback.print_exc()
        # Static Map의 경우 오류 발생 시 플레이스홀더 반환 (사용자 경험 고려)
        print("[WARN] Using placeholder map due to API error")
        return await generate_placeholder_map(request)
    except httpx.RequestError as e:
        error_msg = f"Network error while calling Naver API: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        # Static Map의 경우 오류 발생 시 플레이스홀더 반환 (사용자 경험 고려)
        print("[WARN] Using placeholder map due to network error")
        return await generate_placeholder_map(request)
    except Exception as e:
        error_msg = f"Unexpected server error: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        # Static Map의 경우 오류 발생 시 플레이스홀더 반환 (사용자 경험 고려)
        print("[WARN] Using placeholder map due to unexpected error")
        return await generate_placeholder_map(request)

async def generate_placeholder_map(request: StaticMapRequest):
    """플레이스홀더 지도 이미지 생성"""
    center_text = f"위치: {request.center['lat']:.4f}, {request.center['lng']:.4f}"
    zoom_text = f"줌: {request.zoom}"
    placeholder_url = f"https://placehold.co/{request.width}x{request.height}/F0F5FF/3A86FF?text=Map+Loading%0A{center_text}%0A{zoom_text}&font=roboto"

    async with httpx.AsyncClient() as client:
        response = await client.get(placeholder_url)
        print(f"[DEBUG] Placeholder image size: {len(response.content)} bytes")
        return Response(content=response.content, media_type="image/png")

@router.post("/api/reverse-geocode")
async def reverse_geocode(request: ReverseGeocodeRequest):
    """좌표를 주소로 변환"""
    try:
        async with httpx.AsyncClient() as client:
            url = "https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc"
            params = {
                "coords": f"{request.lng},{request.lat}",
                "orders": "addr",
                "output": "json"
            }

            response = await client.get(url, params=params, headers=get_naver_headers())
            response.raise_for_status()

            data = response.json()
            if "results" in data and len(data["results"]) > 0:
                result = data["results"][0]
                return {"address": result.get("formatted_address", "주소를 찾을 수 없습니다.")}
            else:
                return {"address": "주소를 찾을 수 없습니다."}

    except httpx.HTTPStatusError as e:
        error_msg = f"Naver API HTTP error: {e.response.status_code}"
        print(f"[ERROR] {error_msg} - {e.response.text}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=e.response.status_code if e.response.status_code >= 400 else 502,
            detail=f"역지오코딩 API 호출 실패: {error_msg}"
        )
    except httpx.RequestError as e:
        error_msg = f"Network error while calling Naver API: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=503,
            detail="네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        )
    except Exception as e:
        error_msg = f"Unexpected server error: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="서버 오류가 발생했습니다. 관리자에게 문의해주세요."
        )

