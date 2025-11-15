# backend/app/route/pathfinding.py

from __future__ import annotations

import math
from typing import List, Dict, Tuple

import osmnx as ox
import networkx as nx
from sqlalchemy.orm import Session

from app.route.models import Obstacle


# --- 내부 유틸: 거리 계산 (meter) ---

def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    위도/경도 두 점 사이의 거리(m)를 계산.
    """
    R = 6371000  # 지구 반지름(m)
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


# --- 그래프 로딩 ---

def load_graph_for_route(start: Tuple[float, float],
                         end: Tuple[float, float],
                         network_type: str = "walk"):
    """
    start ~ end 영역을 포함하는 OSM 그래프 로딩.
    한국 OSM 미러(osm.kr) 기반 Overpass 사용.
    """
    lat1, lon1 = start
    lat2, lon2 = end

    # osmnx 기본 설정
    ox.settings.use_cache = True
    ox.settings.log_console = False
    ox.settings.overpass_rate_limit = True
    ox.settings.overpass_endpoint = "https://overpass-api.osm.kr/api/interpreter"

    # start/end 를 모두 포함하는 bounding box (약 1km 마진)
    margin_deg = 0.01  # 위도/경도 ~1.1km 정도
    north = max(lat1, lat2) + margin_deg
    south = min(lat1, lat2) - margin_deg
    east = max(lon1, lon2) + margin_deg
    west = min(lon1, lon2) - margin_deg

    G = ox.graph_from_bbox(
        north=north,
        south=south,
        east=east,
        west=west,
        network_type=network_type,
    )

    # 가장 큰 연결 성분만 사용 (고립된 조각 제거)
    G = ox.utils_graph.get_largest_component(G, strongly=False)
    return G, (south, north, west, east)


# --- 메인: A* + 장애물 패널티 + 회피 실패 판정 ---

def astar_path_with_penalty(
    start: Tuple[float, float],
    end: Tuple[float, float],
    db: Session,
    avoid_types: List[str],
    radius_m: float,
    penalties: Dict[str, float],
):
    """
    - OSM 그래프 기반 A* 경로 탐색
    - YOLO 장애물(Obstacle) 테이블을 반영해 edge weight에 패널티 적용
    - 회피 옵션(avoid_types) 중 실제로 회피하지 못한 타입만 risk_factors에 담아 반환
    """

    # 0. 그래프 로딩
    G, (south, north, west, east) = load_graph_for_route(start, end, network_type="walk")

    # 1. 시작/끝 노드 매핑
    start_lat, start_lng = start
    end_lat, end_lng = end

    start_node = ox.nearest_nodes(G, X=start_lng, Y=start_lat)
    end_node = ox.nearest_nodes(G, X=end_lng, Y=end_lat)

    # 2. 회피 대상 장애물 조회 (체크박스에서 선택한 타입만)
    obstacles: List[Obstacle] = []
    if avoid_types:
        q = (
            db.query(Obstacle)
            .filter(Obstacle.type.in_(avoid_types))
            .filter(Obstacle.lat >= south, Obstacle.lat <= north)
            .filter(Obstacle.lng >= west, Obstacle.lng <= east)
        )
        obstacles = q.all()

    # (lat, lng, type) 형태로 단순화
    obs_list: List[Tuple[float, float, str]] = [
        (o.lat, o.lng, o.type) for o in obstacles
    ]

    # 3. edge weight 계산: 거리 + 장애물 패널티
    for u, v, key, data in G.edges(keys=True, data=True):
        # 기본 길이 (OSM length 사용, 없으면 직접 계산)
        length = data.get("length")
        if length is None:
            y1 = G.nodes[u]["y"]
            x1 = G.nodes[u]["x"]
            y2 = G.nodes[v]["y"]
            x2 = G.nodes[v]["x"]
            length = haversine_m(y1, x1, y2, x2)
            data["length"] = length

        penalty_total = 0.0

        if avoid_types and obs_list:
            # edge 중간 지점 기준으로 장애물까지 거리 계산
            y_mid = (G.nodes[u]["y"] + G.nodes[v]["y"]) / 2
            x_mid = (G.nodes[u]["x"] + G.nodes[v]["x"]) / 2

            for obs_lat, obs_lng, obs_type in obs_list:
                # obs_type 은 이미 avoid_types 안에 있는 것들만 들어옴
                d = haversine_m(y_mid, x_mid, obs_lat, obs_lng)
                if d <= radius_m:
                    penalty_total += penalties.get(obs_type, 0.0)

        data["weight"] = length + penalty_total

    # 4. A* 경로 탐색
    try:
        path_nodes = nx.astar_path(G, start_node, end_node, weight="weight")
    except nx.NetworkXNoPath:
        # 경로 자체가 없으면 직선 + 모든 선택 타입을 실패로 간주 (임시 fallback)
        fallback_distance = haversine_m(start_lat, start_lng, end_lat, end_lng)
        return {
            "route": [start, end],
            "distance_m": fallback_distance,
            "risk_factors": avoid_types,  # 전부 실패
        }

    # 5. 경로 길이 계산 (m)
    total_distance = 0.0
    for u, v in zip(path_nodes[:-1], path_nodes[1:]):
        edges = G.get_edge_data(u, v)
        if not edges:
            continue

        min_len = None
        for _, edata in edges.items():
            l = edata.get("length")
            if l is None:
                y1 = G.nodes[u]["y"]
                x1 = G.nodes[u]["x"]
                y2 = G.nodes[v]["y"]
                x2 = G.nodes[v]["x"]
                l = haversine_m(y1, x1, y2, x2)
            if (min_len is None) or (l < min_len):
                min_len = l
        if min_len:
            total_distance += min_len

    # 6. 경로 좌표 리스트 (lat, lng) 형태로 변환
    route_coords: List[Tuple[float, float]] = [
        (G.nodes[n]["y"], G.nodes[n]["x"]) for n in path_nodes
    ]

    # 7. 실제 경로 위에서 "선택한 타입" 중 어떤 장애물이 남아 있는지 체크
    encountered_types: set[str] = set()

    if avoid_types and obs_list:
        for obs_lat, obs_lng, obs_type in obs_list:
            # obs_type 은 무조건 avoid_types 안에 있음
            for n in path_nodes:
                node_lat = G.nodes[n]["y"]
                node_lng = G.nodes[n]["x"]
                d = haversine_m(node_lat, node_lng, obs_lat, obs_lng)
                if d <= radius_m:
                    encountered_types.add(obs_type)
                    break  # 이 장애물 타입은 이미 경로에 포함되었으므로 다음 장애물로

    # 8. 최종적으로 "체크박스에서 선택했던 타입 중" 회피 실패한 것만 필터링
    failed_avoids: List[str] = [
        t for t in avoid_types if t in encountered_types
    ]

    return {
        "route": route_coords,
        "distance_m": total_distance,
        "risk_factors": failed_avoids,  # 선택했던 것들 중 회피 실패한 타입만
    }
