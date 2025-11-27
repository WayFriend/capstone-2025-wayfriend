# app/route/detect_service.py

import os
from pathlib import Path
from sqlalchemy.orm import Session
from app.route.models import Obstacle
from datetime import datetime
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS, GPSIFD

# 현재 파일의 디렉토리를 기준으로 경로 설정 (도커 컨테이너 내부 경로 고려)
BASE_DIR = Path(__file__).parent
MODEL_PATH = str(BASE_DIR / "model" / "wayfriend_yolov8.pt")
IMAGES_DIR = str(BASE_DIR / "images")  # 인천대 이미지

# 모델은 함수 호출 시 로드 (지연 로딩)
model = None

def get_model():
    """모델을 지연 로딩 (필요할 때만 로드) - YOLO import도 지연"""
    global model
    if model is None:
        # YOLO import를 함수 내부로 이동하여 서버 시작 시 OpenCV 로드 방지
        from ultralytics import YOLO
        
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"YOLO 모델 파일을 찾을 수 없습니다: {MODEL_PATH}\n"
                f"현재 작업 디렉토리: {os.getcwd()}\n"
                f"파일 기준 디렉토리: {BASE_DIR}"
            )
        try:
            model = YOLO(MODEL_PATH)
        except Exception as e:
            raise RuntimeError(f"YOLO 모델 로드 실패: {str(e)}") from e
    return model

# -------------------------------------------------------------
# GPS 추출 함수
# -------------------------------------------------------------
def get_gps_from_image(img_path):
    """이미지에서 GPS 좌표 추출 (최신 Pillow 버전 호환)"""
    try:
        img = Image.open(img_path)
        
        # GPSInfo 태그 ID는 34853
        GPS_INFO_TAG = 34853
        gps_info = {}
        gps_ifd = None
        
        # 방법 1: _getexif() 사용 (GPSInfo 접근에 더 적합)
        try:
            exif_data = img._getexif()
            if exif_data:
                # 메인 EXIF에서 GPSInfo 찾기
                for key, val in exif_data.items():
                    tag_name = TAGS.get(key, key)
                    if tag_name == "GPSInfo" or key == GPS_INFO_TAG:
                        gps_ifd = val
                        break
        except Exception:
            pass
        
        # 방법 2: getexif() + get_ifd() 사용 (신버전 Pillow)
        if gps_ifd is None and hasattr(img, 'getexif'):
            try:
                exif = img.getexif()
                if exif and hasattr(exif, 'get_ifd'):
                    # GPS IFD 직접 접근 (34853은 IFD 타입이 아니라 태그 ID)
                    # get_ifd()는 IFD 타입을 받지만, GPS는 별도 IFD이므로 다른 방법 필요
                    # 대신 exif.get()으로 직접 접근 시도
                    try:
                        gps_ifd = exif.get(GPS_INFO_TAG)
                    except:
                        pass
            except Exception:
                pass
        
        # 디버그: GPS를 못 찾았을 때 EXIF 데이터 확인 (첫 번째 이미지만)
        if gps_ifd is None:
            # 첫 번째 이미지 파일에 대해서만 상세 로그 출력
            if "20250914_113434" in img_path or "KakaoTalk_20250915_161901366_01" in img_path:
                try:
                    # _getexif()로 확인
                    exif_debug = img._getexif()
                    if exif_debug:
                        print(f"🔍 [{os.path.basename(img_path)}] EXIF 태그: {list(exif_debug.keys())[:10]}")
                        for key in list(exif_debug.keys())[:15]:
                            tag_name = TAGS.get(key, key)
                            if "GPS" in tag_name.upper() or key == GPS_INFO_TAG:
                                print(f"🔍 GPS 관련 태그 발견: {key} = {tag_name}, value type: {type(exif_debug[key])}")
                    
                    # getexif()로도 확인
                    if hasattr(img, 'getexif'):
                        exif_new = img.getexif()
                        if exif_new:
                            print(f"🔍 [{os.path.basename(img_path)}] getexif() 태그: {list(exif_new.keys())[:10] if hasattr(exif_new, 'keys') else 'N/A'}")
                except Exception as e:
                    print(f"🔍 디버그 실패: {e}")
            return None
        
        # GPSInfo 데이터 파싱
        try:
            # dict인 경우
            if isinstance(gps_ifd, dict):
                for tag_id, value in gps_ifd.items():
                    tag_name = GPSTAGS.get(tag_id, tag_id)
                    gps_info[tag_name] = value
            # dict-like 객체인 경우
            elif hasattr(gps_ifd, 'items'):
                for tag_id, value in gps_ifd.items():
                    tag_name = GPSTAGS.get(tag_id, tag_id)
                    gps_info[tag_name] = value
        except Exception as e:
            print(f"⚠️ GPSInfo 파싱 실패: {e}, type: {type(gps_ifd)}")
            return None

        if not gps_info or "GPSLatitude" not in gps_info or "GPSLongitude" not in gps_info:
            return None
    except Exception as e:
        print(f"⚠️ 이미지 로드/EXIF 읽기 실패 ({img_path}): {e}")
        return None

    def convert_to_degrees(value):
        """GPS 좌표를 도(degrees)로 변환. IFDRational 객체도 처리"""
        try:
            d, m, s = value
            
            # IFDRational 객체 처리 (Pillow 최신 버전)
            def to_float(rational):
                if hasattr(rational, 'numerator') and hasattr(rational, 'denominator'):
                    return float(rational.numerator) / float(rational.denominator)
                elif isinstance(rational, tuple) and len(rational) == 2:
                    return float(rational[0]) / float(rational[1])
                else:
                    return float(rational)
            
            d_deg = to_float(d)
            m_deg = to_float(m) / 60.0
            s_deg = to_float(s) / 3600.0
            
            return d_deg + m_deg + s_deg
        except (TypeError, ValueError, ZeroDivisionError) as e:
            print(f"⚠️ GPS 좌표 변환 실패: {e}, value: {value}")
            return None

    lat = convert_to_degrees(gps_info.get("GPSLatitude"))
    lon = convert_to_degrees(gps_info.get("GPSLongitude"))
    
    if lat is None or lon is None:
        return None

    if gps_info.get("GPSLatitudeRef") == "S":
        lat = -lat
    if gps_info.get("GPSLongitudeRef") == "W":
        lon = -lon

    return lat, lon


# -------------------------------------------------------------
# 이미지 폴더 전체 추론 후 DB 저장
# -------------------------------------------------------------
def detect_folder_and_save(db: Session):
    """
    폴더 안의 모든 이미지를 YOLO로 추론 후 DB에 저장.
    commit()은 전체 이미지 처리 후 한 번만 실행해 성능 최적화.
    """
    # 이미지 디렉토리 확인
    if not os.path.exists(IMAGES_DIR):
        raise FileNotFoundError(f"이미지 디렉토리를 찾을 수 없습니다: {IMAGES_DIR}")
    
    print(f"📁 이미지 디렉토리: {IMAGES_DIR}")
    
    # 이미지 파일 목록 미리 확인
    image_files = [
        f for f in os.listdir(IMAGES_DIR)
        if f.lower().endswith((".jpg", ".jpeg")) and os.path.isfile(os.path.join(IMAGES_DIR, f))
    ]
    total_images = len(image_files)
    print(f"📸 발견된 이미지 파일: {total_images}개")
    
    if total_images == 0:
        print("⚠️ 처리할 이미지 파일이 없습니다.")
        return {"total": 0, "processed": 0, "saved": 0}
    
    count_total, count_success = 0, 0
    total_saved = 0  # 전체 저장된 장애물 개수

    for filename in image_files:
        img_path = os.path.join(IMAGES_DIR, filename)
            
        count_total += 1
        # 진행 상황 표시 (10개마다)
        if count_total % 10 == 0:
            print(f"⏳ 진행 중... ({count_total}/{total_images})")

        try:
            # GPS 좌표 추출
            gps = get_gps_from_image(img_path)
            if gps is None:
                print(f"❌ GPS 없음: {filename}")
                continue

            # 모델 로드 (지연 로딩)
            yolo_model = get_model()
            results = yolo_model(img_path)
            saved = 0

            for r in results:
                boxes = r.boxes.xyxy
                confs = r.boxes.conf
                labels = r.boxes.cls

                for i in range(len(boxes)):
                    label = yolo_model.names[int(labels[i])]
                    conf = confs[i].item()

                    db.add(
                        Obstacle(
                            type=label,
                            lat=gps[0],
                            lng=gps[1],
                            confidence=conf,
                            detected_at=datetime.utcnow()
                        )
                    )
                    saved += 1
                    total_saved += 1

            print(f"✅ {filename}: {saved}개 감지 저장 예정")
            count_success += 1
            
        except Exception as e:
            print(f"❌ 이미지 처리 실패 ({filename}): {str(e)}")
            import traceback
            traceback.print_exc()
            continue

    # 전체 for-loop 끝난 뒤 1회 commit 실행 (에러 발생 시 롤백)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"❌ DB 저장 실패: {str(e)}")
        raise

    print(f"🎉 전체 완료: {count_success}/{count_total}개 처리됨, 총 {total_saved}개 장애물 저장됨")

    return {"total": count_total, "processed": count_success, "saved": total_saved}

