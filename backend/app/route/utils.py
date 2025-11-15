# app/route/utils.py

"""
경로 탐색 유틸 함수 모음.
나중에 osmnx, networkx, haversine 등을 이곳에 구현할 예정.
"""

def compute_distance(point1: tuple, point2: tuple) -> float:
    """
    두 GPS 좌표 간의 단순 유클리드 거리 계산 (임시).
    추후 haversine 또는 osmnx 기반으로 교체 예정.
    """
    lat1, lon1 = point1
    lat2, lon2 = point2
    return ((lat1 - lat2)**2 + (lon1 - lon2)**2) ** 0.5
