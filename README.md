# SpaceCraft — Room Optimizer AI

SpaceCraft is an interior layout analysis tool that evaluates room photos using computer vision and rule-based spatial heuristics. It detects furniture and architectural elements, calculates a room score from 0 to 100, and provides practical layout recommendations to improve flow, open pathways, and balance space.

---

## Overview

Arranging furniture in bedrooms and living spaces often comes down to trial and error. SpaceCraft helps users evaluate room layouts before physically moving heavy furniture around. 

Upload a room photo to get:
- Object detection for furniture, windows, and doors
- Proximity and placement evaluation (e.g. wall alignment vs. center congestion)
- A room layout score (0–100)
- Concrete suggestions to optimize walkways and functionality

---

## Key Features

- **Object Detection**: Identifies beds, chairs, tables, sofas, doors, windows, storage units, nightstands, and lighting using a custom-trained YOLOv8 model.
- **Spatial Geometry Engine**: Evaluates geometric relationships between bounding boxes (e.g. nightstands beside beds, or objects blocking doors).
- **Room Scoring (0–100)**: Evaluates clutter, doorway clearance, perimeter placement, and functional groupings.
- **Layout Feedback**: Offers targeted suggestions, such as moving center-placed beds toward walls or clearing entryways.
- **Web Interface**: Clean React and Vite dashboard with dark mode styling and Firebase authentication.

---

## Pipeline & How It Works

1. **Image Input**: The user uploads an image through the frontend dashboard or REST API.
2. **YOLOv8 Detection**: The image is processed with custom confidence (0.28) and IoU (0.45) thresholds to recognize interior objects.
3. **IoU Deduplication**: Overlapping bounding boxes with matching class labels are filtered out so items are not counted twice.
4. **Spatial Analysis Engine**: Relative box centers, distances, wall proximity, and central clustering are calculated.
5. **Score & Feedback Generation**: Starts at a base score of 50 and dynamically adjusts based on layout rules before clamping to 0–100.

---

## Core Code Highlights

### 1. Bounding-Box Deduplication (`backend/detect.py`)
Filters overlapping bounding boxes of the same class to avoid duplicate counts on large furniture:

```python
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
                if calculate_iou(det["bbox"], kept["bbox"]) > iou_threshold:
                    should_keep = False
                    break
        if should_keep:
            filtered.append(det)

    return filtered
```

---

### 2. Spatial Geometry Engine (`backend/suggest.py`)
Computes object centers, proximity, wall margins, and center zone bounds:

```python
def get_center(bbox):
    x1, y1, x2, y2 = bbox
    return ((x1 + x2) / 2, (y1 + y2) / 2)

def is_near(obj1, obj2, threshold=180):
    c1 = get_center(obj1["bbox"])
    c2 = get_center(obj2["bbox"])
    distance = ((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2) ** 0.5
    return distance < threshold

def is_in_center(obj, image_width=1000, image_height=1000):
    cx, cy = get_center(obj["bbox"])
    return (
        image_width * 0.3 <= cx <= image_width * 0.7
        and image_height * 0.3 <= cy <= image_height * 0.7
    )

def is_near_wall(obj, image_width=1000, image_height=1000, margin=120):
    x1, y1, x2, y2 = obj["bbox"]
    return (
        x1 < margin
        or y1 < margin
        or x2 > image_width - margin
        or y2 > image_height - margin
    )
```

---

### 3. Layout Scoring & Suggestions (`backend/suggest.py`)
Applies ergonomic and spatial rules to adjust the layout score:

```python
def analyze_room(detections):
    suggestions = []
    score = 50

    beds = [d for d in detections if d["label"] == "Bed"]
    storage_items = [d for d in detections if d["label"] in ["Shelf", "Cabinet", "Closet"]]
    doors = [d for d in detections if d["label"] == "Door"]

    for item in storage_items:
        if is_near_wall(item):
            suggestions.append("Storage positioned against walls keeps central floor space open.")
            score += 6
            break

    for door in doors:
        for item in beds + storage_items:
            if is_near(door, item, threshold=140):
                suggestions.append("Clear pathways around doorways to maintain unobstructed entry.")
                score -= 8
                break

    for bed in beds:
        if is_in_center(bed):
            suggestions.append("The bed appears close to the room center. Shifting it towards a wall improves flow.")
            score -= 6

    return {"score": max(0, min(100, score)), "suggestions": suggestions}
```

---

### 4. REST API Endpoint (`backend/app.py`)
```python
@app.post("/analyze-room")
async def analyze_room_api(request: Request, file: UploadFile = File(...)):
    safe_name = file.filename.replace(" ", "_")
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    detections = detect_room_objects(file_path)
    analysis = analyze_room(detections)

    return JSONResponse({
        "filename": safe_name,
        "detections": detections,
        "room_score": analysis["score"],
        "suggestions": analysis["suggestions"],
        "image_output_url": f"{request.base_url}outputs/room_test/{safe_name}",
    })
```

---

## Tech Stack

| Domain | Technologies |
|---|---|
| **AI / Computer Vision** | Ultralytics YOLOv8s, PyTorch, OpenCV, NumPy |
| **Backend API** | FastAPI, Uvicorn, Python 3.10+ |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Authentication** | Firebase Auth |

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Nishtha-1111/SpaceCraft.git
cd SpaceCraft
```

### 2. Backend Setup
```powershell
venv\Scripts\activate
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```
The API will run locally at `http://127.0.0.1:8000` (interactive documentation at `/docs`).

### 3. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
The client application will run at `http://localhost:5173`.

---

## Project Structure

```text
SpaceCraft/
├── backend/                 # FastAPI REST application
│   ├── model/               # Trained model weights (best.pt)
│   ├── app.py               # API endpoints & routing
│   ├── detect.py            # YOLOv8 inference & IoU deduplication
│   ├── suggest.py           # Spatial geometry & scoring heuristics
│   └── requirements.txt
├── frontend/                # React (Vite) client
│   ├── src/                 # Components, hooks & views
│   └── package.json
├── training/                # YOLOv8 custom training scripts
│   └── train.py
├── data/                    # Dataset configs & raw labels
├── PROJECT_SUMMARY.md       # Full architecture documentation
└── README.md                # Project documentation
```

---

## License
This project is licensed under the MIT License.
