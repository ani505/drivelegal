"""
DriveLegal — Computer Vision API Routes
"""
from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.cv_service import cv_service
from app.core.config import settings

router = APIRouter(prefix="/vision", tags=["Computer Vision"])

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


async def _read_image(file: UploadFile) -> bytes:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG/WebP)")
    data = await file.read()
    if len(data) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image too large (max 10 MB)")
    return data


@router.post("/analyze-sign", summary="Identify traffic signs in an image")
async def analyze_sign(file: UploadFile = File(...)):
    """
    Upload a road or dashboard image.
    Returns detected traffic signs with confidence scores and legal implications.
    """
    image_bytes = await _read_image(file)
    try:
        result = await cv_service.analyze_sign(image_bytes)
        return {
            "filename":  file.filename,
            "file_size": len(image_bytes),
            **result,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/detect-speed-limit", summary="Extract speed limit from road image")
async def detect_speed_limit(file: UploadFile = File(...)):
    """
    Upload a photo of a road or speed-limit sign.
    Returns the detected speed limit value (km/h) and applicable legal fine info.
    """
    image_bytes = await _read_image(file)
    try:
        return await cv_service.detect_speed_limit(image_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/analyze-vehicle", summary="Check vehicle for visible condition violations")
async def analyze_vehicle(file: UploadFile = File(...)):
    """
    Upload a vehicle photo.
    Checks for missing/obscured number plate, broken lights (heuristic), etc.
    """
    image_bytes = await _read_image(file)
    try:
        return await cv_service.analyze_vehicle(image_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/status", summary="Computer vision module status")
async def cv_status():
    try:
        import cv2
        cv2_ver = cv2.__version__
    except ImportError:
        cv2_ver = None

    yolo_available = False
    try:
        from ultralytics import YOLO
        yolo_available = True
    except ImportError:
        pass

    return {
        "enabled":         settings.ENABLE_COMPUTER_VISION,
        "opencv_version":  cv2_ver,
        "yolo_available":  yolo_available,
        "mock_mode":       cv_service.yolo_model is None,
    }
