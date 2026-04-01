from ultralytics import YOLO

def main():
    model = YOLO("yolov8s.pt")

    model.train(
        data="data/raw/data.yaml",
        epochs=20,
        imgsz=640,
        batch=4,
        project="runs/train_advanced",
        name="room_detector_v3",
        patience=4,
        save=True
    )

if __name__ == "__main__":
    main()