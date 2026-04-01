from ultralytics import YOLO
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.abspath(
    os.path.join(
        BASE_DIR,
        "..",
        "runs",
        "detect",
        "runs",
        "train_resume",
        "room_detector_v2",
        "weights",
        "best.pt",
    )
)

OUTPUT_PROJECT = os.path.abspath(
    os.path.join(BASE_DIR, "..", "runs", "custom_detect")
)

model = YOLO("runs/detect/room_detector_v2/weights/best.pt")


def calculate_iou(box1, box2):
    x1, y1, x2, y2 = box1
    a1, b1, a2, b2 = box2

    inter_x1 = max(x1, a1)
    inter_y1 = max(y1, b1)
    inter_x2 = min(x2, a2)
    inter_y2 = min(y2, b2)

    inter_w = max(0, inter_x2 - inter_x1)
    inter_h = max(0, inter_y2 - inter_y1)
    inter_area = inter_w * inter_h

    area1 = max(0, x2 - x1) * max(0, y2 - y1)
    area2 = max(0, a2 - a1) * max(0, b2 - b1)

    union = area1 + area2 - inter_area
    return inter_area / union if union > 0 else 0


def remove_duplicates(detections, iou_threshold=0.5):
    detections = sorted(detections, key=lambda x: x["confidence"], reverse=True)
    filtered = []

    for det in detections:
        should_keep = True
        for kept in filtered:
            if det["label"] == kept["label"]:
                iou = calculate_iou(det["bbox"], kept["bbox"])
                if iou > iou_threshold:
                    should_keep = False
                    break
        if should_keep:
            filtered.append(det)

    return filtered


def detect_room_objects(image_path):
    results = model.predict(
        source=image_path,
        conf=0.28,
        iou=0.45,
        imgsz=640,
        save=True,
        project=OUTPUT_PROJECT,
        name="room_test",
        exist_ok=True,
    )

    detections = []

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            label = model.names[cls_id]

            detections.append(
                {
                    "label": label,
                    "confidence": round(conf, 3),
                    "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                }
            )

    detections = remove_duplicates(detections)
    return detections


if __name__ == "__main__":
    image_path = os.path.abspath(
        os.path.join(BASE_DIR, "..", "data", "sample_images", "room1.jpg")
    )

    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
    else:
        detections = detect_room_objects(image_path)

        print("\nDetected objects:")
        for d in detections:
            print(d)

        print("\nOutput image saved in runs/custom_detect/room_test/")