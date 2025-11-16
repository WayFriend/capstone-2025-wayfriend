# app/route/detect_service.py

import os
from ultralytics import YOLO
from sqlalchemy.orm import Session
from app.route.models import Obstacle
from datetime import datetime
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

MODEL_PATH = "app/route/model/wayfriend_yolov8.pt"
IMAGES_DIR = "app/route/images"  # 인천대 이미지
model = YOLO(MODEL_PATH)

# -------------------------------------------------------------
# GPS 추출 함수
# -------------------------------------------------------------
def get_gps_from_image(img_path):
    img = Image.open(img_path)
    exif_data = img._getexif()
    if not exif_data:
        return None

    gps_info = {}
    for key, val in exif_data.items():
        if TAGS.get(key) == "GPSInfo":
            for t in val:
                gps_info[GPSTAGS.get(t)] = val[t]

    if not gps_info:
        return None

    def convert_to_degrees(value):
        d, m, s = value
        return d[0] / d[1] + m[0] / (m[1] * 60) + s[0] / (s[1] * 3600)

    lat = convert_to_degrees(gps_info["GPSLatitude"])
    lon = convert_to_degrees(gps_info["GPSLongitude"])

    if gps_info["GPSLatitudeRef"] == "S":
        lat = -lat
    if gps_info["GPSLongitudeRef"] == "W":
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
    count_total, count_success = 0, 0
    total_saved = 0  # 전체 저장된 장애물 개수

    for filename in os.listdir(IMAGES_DIR):
        if not filename.lower().endswith(".jpg"):
            continue

        img_path = os.path.join(IMAGES_DIR, filename)
        count_total += 1

        gps = get_gps_from_image(img_path)
        if gps is None:
            print(f"❌ GPS 없음: {filename}")
            continue

        results = model(img_path)
        saved = 0

        for r in results:
            boxes = r.boxes.xyxy
            confs = r.boxes.conf
            labels = r.boxes.cls

            for i in range(len(boxes)):
                label = model.names[int(labels[i])]
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

    # 전체 for-loop 끝난 뒤 1회 commit 실행
    db.commit()

    print(f"🎉 전체 완료: {count_success}/{count_total}개 처리됨, 총 {total_saved}개 장애물 저장됨")

    return {"total": count_total, "processed": count_success, "saved": total_saved}

