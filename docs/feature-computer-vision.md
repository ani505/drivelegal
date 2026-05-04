# Feature: Computer Vision Integration

**Branch:** `feature/computer-vision`  
**Status:** 🔲 Planned — Phase 2

## Overview
Real-time traffic sign recognition, speed limit detection, and lane monitoring.

## Planned Implementation

### Tech Stack
- OpenCV + Python
- YOLOv8 / TensorFlow for object detection
- ONNX for model serving
- WebRTC for live video feed

### Models to Train / Use
- Traffic sign classifier (speed limits, warning signs, stop signs)
- Traffic light state detector (red/amber/green)
- Lane boundary detector

### Files to Create
- `app/services/cv_service.py` — OpenCV + YOLO inference
- `app/api/routes/vision.py` — Image analysis endpoints
- `models/` — Trained model weights (`.pt`, `.onnx`)

### API Endpoints to Add
```
POST /api/v1/vision/analyze-sign        — Identify traffic sign from image
POST /api/v1/vision/detect-speed-limit  — Extract speed limit from road image
POST /api/v1/vision/analyze-vehicle     — Check vehicle condition violations
```

### Dependencies to Add to requirements.txt
```
opencv-python==4.9.0
ultralytics==8.2.0
onnxruntime==1.18.0
```

## Resources
- [YOLOv8 Traffic Sign Detection](https://github.com/ultralytics/ultralytics)
- [Indian Traffic Sign Dataset (ITSD)](https://www.aiindia.in/)
