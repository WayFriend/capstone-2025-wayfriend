#!/usr/bin/env python3
"""이미지 파일들의 EXIF 데이터 확인 스크립트"""

import os
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

BASE_DIR = Path(__file__).parent
IMAGES_DIR = str(BASE_DIR / "images")
GPS_INFO_TAG = 34853

def check_exif(img_path):
    """이미지 파일의 EXIF 데이터 확인"""
    try:
        img = Image.open(img_path)
        filename = os.path.basename(img_path)
        
        # _getexif()로 확인
        exif_old = None
        try:
            exif_old = img._getexif()
        except:
            pass
        
        # getexif()로 확인
        exif_new = None
        try:
            if hasattr(img, 'getexif'):
                exif_new = img.getexif()
        except:
            pass
        
        has_exif = exif_old is not None or exif_new is not None
        has_gps = False
        gps_method = None
        
        # GPSInfo 찾기
        gps_ifd = None
        
        # 방법 1: _getexif()에서 찾기
        if exif_old:
            for key, val in exif_old.items():
                tag_name = TAGS.get(key, key)
                if tag_name == "GPSInfo" or key == GPS_INFO_TAG:
                    gps_ifd = val
                    has_gps = True
                    gps_method = "_getexif()"
                    break
        
        # 방법 2: getexif()에서 찾기
        if not has_gps and exif_new:
            try:
                if GPS_INFO_TAG in exif_new:
                    gps_ifd = exif_new[GPS_INFO_TAG]
                    has_gps = True
                    gps_method = "getexif() - direct"
                elif hasattr(exif_new, 'get'):
                    gps_ifd = exif_new.get(GPS_INFO_TAG)
                    if gps_ifd:
                        has_gps = True
                        gps_method = "getexif() - get()"
            except:
                pass
        
        # GPSInfo 파싱 시도 (태그 ID를 태그 이름으로 변환)
        gps_info = {}
        gps_lat = None
        gps_lon = None
        if gps_ifd:
            try:
                # GPSInfo 블록 내부의 태그들은 숫자 ID로 저장되어 있음
                if isinstance(gps_ifd, dict):
                    for tag_id, value in gps_ifd.items():
                        tag_name = GPSTAGS.get(tag_id, tag_id)
                        gps_info[tag_name] = value
                elif hasattr(gps_ifd, 'items'):
                    for tag_id, value in gps_ifd.items():
                        tag_name = GPSTAGS.get(tag_id, tag_id)
                        gps_info[tag_name] = value
                
                # GPS 좌표를 도(degrees)로 변환
                def convert_to_degrees(value):
                    """GPS 좌표를 도(degrees)로 변환. IFDRational 객체도 처리"""
                    if value is None:
                        return None
                    try:
                        # value가 이미 float 또는 int인 경우
                        if isinstance(value, (float, int)):
                            return float(value)
                        
                        # 튜플/리스트 형태: (도, 분, 초) 또는 (분자, 분모)
                        if isinstance(value, (list, tuple)):
                            if len(value) == 2:
                                # 분수 형태 (분자, 분모)
                                if hasattr(value[0], 'numerator'):
                                    return float(value[0].numerator) / float(value[0].denominator)
                                return float(value[0]) / float(value[1])
                            elif len(value) == 3:
                                # (도, 분, 초) 형태
                                d, m, s = value
                                
                                def to_float(rational):
                                    if hasattr(rational, 'numerator') and hasattr(rational, 'denominator'):
                                        return float(rational.numerator) / float(rational.denominator)
                                    elif isinstance(rational, tuple) and len(rational) == 2:
                                        return float(rational[0]) / float(rational[1])
                                    return float(rational)
                                
                                d_deg = to_float(d)
                                m_deg = to_float(m) / 60.0
                                s_deg = to_float(s) / 3600.0
                                return d_deg + m_deg + s_deg
                        
                        # IFDRational 객체 처리
                        if hasattr(value, 'numerator') and hasattr(value, 'denominator'):
                            return float(value.numerator) / float(value.denominator)
                        
                        return None
                    except (TypeError, ValueError, ZeroDivisionError):
                        return None
                
                # 위도/경도 추출 및 변환
                lat_raw = gps_info.get("GPSLatitude")
                lon_raw = gps_info.get("GPSLongitude")
                
                if lat_raw and lon_raw:
                    lat = convert_to_degrees(lat_raw)
                    lon = convert_to_degrees(lon_raw)
                    
                    # 남반구/서반구 보정
                    if gps_info.get("GPSLatitudeRef") == "S" and lat:
                        lat = -lat
                    if gps_info.get("GPSLongitudeRef") == "W" and lon:
                        lon = -lon
                    
                    gps_lat = lat
                    gps_lon = lon
            except Exception as e:
                pass
        
        return {
            "filename": filename,
            "has_exif": has_exif,
            "has_gps": has_gps,
            "gps_method": gps_method,
            "gps_lat": gps_lat,
            "gps_lon": gps_lon,
            "gps_info": gps_info,
            "exif_keys_old": list(exif_old.keys())[:10] if exif_old else [],
            "exif_keys_new": list(exif_new.keys())[:10] if exif_new and hasattr(exif_new, 'keys') else []
        }
    except Exception as e:
        return {
            "filename": os.path.basename(img_path),
            "error": str(e)
        }

if __name__ == "__main__":
    if not os.path.exists(IMAGES_DIR):
        print(f"❌ 이미지 디렉토리를 찾을 수 없습니다: {IMAGES_DIR}")
        exit(1)
    
    image_files = [
        f for f in os.listdir(IMAGES_DIR)
        if f.lower().endswith((".jpg", ".jpeg")) and os.path.isfile(os.path.join(IMAGES_DIR, f))
    ]
    
    print(f"📸 총 {len(image_files)}개 이미지 파일 확인 중...\n")
    
    results = []
    for filename in sorted(image_files)[:20]:  # 처음 20개만 확인
        img_path = os.path.join(IMAGES_DIR, filename)
        result = check_exif(img_path)
        results.append(result)
    
    # 결과 출력
    print("=" * 80)
    print(f"{'파일명':<40} {'EXIF':<8} {'GPS':<8} {'방법':<20} {'위도':<6} {'경도':<6}")
    print("=" * 80)
    
    gps_count = 0
    exif_count = 0
    
    for r in results:
        if "error" in r:
            print(f"{r['filename']:<40} {'ERROR':<8} {r['error']}")
        else:
            exif_str = "✅" if r['has_exif'] else "❌"
            gps_str = "✅" if r['has_gps'] else "❌"
            method = r['gps_method'] or "-"
            lat_str = "✅" if r['gps_lat'] is not None else "❌"
            lon_str = "✅" if r['gps_lon'] is not None else "❌"
            
            print(f"{r['filename']:<40} {exif_str:<8} {gps_str:<8} {method:<20} {lat_str:<6} {lon_str:<6}")
            
            if r['has_exif']:
                exif_count += 1
            if r['has_gps']:
                gps_count += 1
                # GPS가 있는 경우 상세 정보 출력
                if r['gps_lat'] is not None and r['gps_lon'] is not None:
                    print(f"  └─ GPS 좌표: Lat={r['gps_lat']}, Lon={r['gps_lon']}")
                    if 'gps_info' in r and r['gps_info']:
                        print(f"  └─ GPSInfo 태그: {list(r['gps_info'].keys())}")
                else:
                    print(f"  └─ GPSInfo 블록은 있지만 위도/경도 추출 실패")
                    if 'gps_info' in r and r['gps_info']:
                        print(f"  └─ GPSInfo 태그: {list(r['gps_info'].keys())}")
    
    print("=" * 80)
    print(f"\n📊 요약:")
    print(f"  - EXIF 데이터 있는 파일: {exif_count}/{len(results)}개")
    print(f"  - GPS 정보 있는 파일: {gps_count}/{len(results)}개")

