from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
import os

from detect import detect_room_objects
from suggest import analyze_room

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "runs", "custom_detect"))

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")


@app.get("/")
def home():
    return {"message": "Room Optimizer API is running"}


@app.post("/analyze-room")
async def analyze_room_api(file: UploadFile = File(...)):
    safe_name = file.filename.replace(" ", "_")
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    detections = detect_room_objects(file_path)
    analysis = analyze_room(detections)

    output_image_url = f"http://127.0.0.1:8000/outputs/room_test/{safe_name}"

    return JSONResponse(
        {
            "filename": safe_name,
            "detections": detections,
            "room_score": analysis["score"],
            "suggestions": analysis["suggestions"],
            "image_output_url": output_image_url,
        }
    )