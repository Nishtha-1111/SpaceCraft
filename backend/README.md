---
title: Room Optimizer AI Backend
emoji: 🏠
colorFrom: purple
colorTo: indigo
sdk: docker
pinned: false
---

# Room Optimizer AI — FastAPI Backend

This is the backend API for Room Optimizer AI. It uses YOLOv8 to detect objects in room images and provides a room score and suggestions.

## API Endpoints

- `GET /` — Health check
- `POST /analyze-room` — Upload a room image for analysis
