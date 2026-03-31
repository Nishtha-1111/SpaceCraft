from detect import detect_room_objects
from suggest import analyze_room
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
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

    analysis = analyze_room(detections)

    print(f"\nRoom Score: {analysis['score']}/100")
    print("\nSuggestions:")
    for i, s in enumerate(analysis["suggestions"], start=1):
        print(f"{i}. {s}")