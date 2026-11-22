# Room Optimizer - Project Summary

## **Project Overview**
The Room Optimizer is an AI-powered full-stack application designed to evaluate interior room layouts. Users can upload an image of a room, and the application detects the existing furniture and architectural elements. Finally, it calculates a holistic "Room Score" and provides actionable suggestions to improve the layout, spatial flow, and aesthetic balance (e.g., clearing entry pathways or repositioning center-heavy furniture towards walls).

---

## **Deep Dive into the Model Architecture**

### **Algorithm Used**
The primary algorithm used in this project is **YOLOv8 (You Only Look Once, version 8)**. YOLOv8 is a state-of-the-art **Convolutional Neural Network (CNN)** designed for high-speed, real-time object detection. The YOLO algorithm works by framing object detection as a single regression problem, directly predicting bounding box coordinates and class probabilities from full images in one evaluation. 

The core AI brain of the project relies on a custom-trained version of this YOLOv8 model, combined with an intelligent rule-based spatial-heuristic engine to evaluate layouts.

Here is exactly how the modeling pipeline works:

### 1. **Model Architecture & Training (`training/train.py`)**
*   **Base Model:** The project uses Ultralytics `YOLOv8s` (Small) as the pre-trained foundation, balancing inference speed and accuracy. 
*   **Custom Fine-Tuning:** It is fine-tuned on a custom interior design and furniture dataset (`data/raw/data.yaml`).
*   **Training Parameters:** The script trains the model for 20 epochs with an image size of `640x640`, a batch size of `4`, and an early stopping patience of 4 epochs. The successful custom weights are outputted and saved to the backend (`backend/model/best.pt`).

### 2. **Inference & Detection Pipeline (`backend/detect.py`)**
When an image is passed to the FastAPI backend, the inference logic processes it:
*   **Thresholding:** The YOLO model runs with specialized thresholds: a confidence score of `0.28` (to ensure smaller or partially obscured furniture is still picked up) and an NMS IoU of `0.45`.
*   **Custom Duplicate Filtering:** The pipeline employs a custom bounding-box overlapping logic (`calculate_iou` and `remove_duplicates`). If two bounding boxes of the *exact same label* overlap heavily (IoU > 0.5), it filters out the duplicate with the lower confidence. This prevents the system from double-counting furniture like beds or sofas.
*   **Target Classes:** The model is trained to recognize specific interior features: Beds, Chairs, Tables, Sofas, Lamps, Doors, Windows, Curtains, Storage items (Cabinets, Shelves), Carpets, and Nightstands.

### 3. **Spatial Analysis & Scoring Engine (`backend/suggest.py`)**
The raw bounding boxes are converted into spatial intelligence. This rule-based "post-processing model" evaluates the physical coordinates detected by YOLO:
*   **Geometric Calculations:** It calculates bounding box centers and evaluates proximity. Custom helper functions (`is_near`, `is_near_wall`, `is_in_center`) determine how objects relate to one another and the boundaries of the image.
*   **Heuristic Logic & Suggestions:**
    *   **Positive Layouts (+ points):** E.g., Chairs near a Table (+8), Nightstands near a Bed (+6), Storage placed cleanly against walls (+6).
    *   **Negative Layouts (- points):** E.g., Large furniture blocking a detected Door (-8), Sofas or Beds awkwardly clogging the central zone of the room (-6), or visual clutter (detecting > 7 large items). 
*   **Room Score Calculation:** The base score starts at `50` out of 100. Based on the spatial logic checks, the score dynamically increases or decreases depending on the detected room constraints, always staying clamped between `0` and `100`.

---

## **How to Run the Application**

The application is split into a Python FastAPI backend and a React (Vite) frontend. You need to run both concurrently in separate terminal windows.

### **1. Running the Backend (FastAPI)**

Open your first terminal and navigate to the project directory:

```powershell
# 1. Activate the virtual environment
venv\Scripts\activate

# 2. Navigate to the backend folder
cd backend

# 3. Install the required python dependencies (if not already installed)
pip install -r requirements.txt

# 4. Start the FastAPI server using Uvicorn
uvicorn app:app --reload
```
*The backend will now be running on `http://127.0.0.1:8000`*

### **2. Running the Frontend (React + Vite)**

Open a second separate terminal and navigate to the project directory:

```powershell
# 1. Navigate to the frontend folder
cd frontend

# 2. Install Node dependencies (if not already installed)
npm install

# 3. Start the Vite development server
npm run dev
```
*The frontend terminal will output a localhost URL (usually `http://localhost:5173`). Open that link in your web browser to view the application.*
