"""
DriveLegal — Computer Vision Service
Traffic sign detection and speed-limit extraction using OpenCV + YOLOv8.
Falls back to rule-based OCR when ultralytics is not installed.
"""
from __future__ import annotations

import io
import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Optional imports ─────────────────────────────────────────────────────────

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("opencv-python not installed — CV service in basic mode")

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("ultralytics not installed — using rule-based sign detection")

try:
    from PIL import Image
    import pytesseract
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    logger.warning("pytesseract / Pillow not available")


# ─── Sign catalogue ───────────────────────────────────────────────────────────

SIGN_CATALOGUE = {
    "speed_limit_30":  {"label": "Speed Limit 30",  "type": "regulatory", "value": 30,  "unit": "km/h"},
    "speed_limit_50":  {"label": "Speed Limit 50",  "type": "regulatory", "value": 50,  "unit": "km/h"},
    "speed_limit_60":  {"label": "Speed Limit 60",  "type": "regulatory", "value": 60,  "unit": "km/h"},
    "speed_limit_80":  {"label": "Speed Limit 80",  "type": "regulatory", "value": 80,  "unit": "km/h"},
    "speed_limit_100": {"label": "Speed Limit 100", "type": "regulatory", "value": 100, "unit": "km/h"},
    "speed_limit_120": {"label": "Speed Limit 120", "type": "regulatory", "value": 120, "unit": "km/h"},
    "stop":            {"label": "Stop Sign",        "type": "regulatory", "value": None, "unit": None},
    "give_way":        {"label": "Give Way",          "type": "regulatory", "value": None, "unit": None},
    "no_entry":        {"label": "No Entry",          "type": "regulatory", "value": None, "unit": None},
    "no_overtaking":   {"label": "No Overtaking",    "type": "regulatory", "value": None, "unit": None},
    "pedestrian":      {"label": "Pedestrian Crossing","type": "warning",   "value": None, "unit": None},
    "school_zone":     {"label": "School Zone",       "type": "warning",   "value": None, "unit": None},
    "sharp_curve":     {"label": "Sharp Curve Ahead","type": "warning",    "value": None, "unit": None},
}

LEGAL_IMPLICATIONS: dict[str, str] = {
    "speed_limit_30":  "Exceeding this in India is punishable under MV Act Section 183; fine ₹1000–₹4000.",
    "speed_limit_50":  "Standard urban speed limit. Violation: ₹1000–₹4000.",
    "speed_limit_80":  "Highway speed limit. Violation: ₹2000–₹4000.",
    "speed_limit_100": "Expressway limit. Exceeding risks ₹4000 fine and licence suspension.",
    "stop":            "Failure to stop at STOP sign: ₹500–₹1000 (MV Act Sec. 119).",
    "no_entry":        "Entering a No-Entry zone: ₹500–₹2000.",
    "no_overtaking":   "Overtaking in a restricted zone: ₹500 (Sec. 120).",
    "school_zone":     "Speed must be ≤25 km/h in school zones during school hours.",
}


# ─── CVService ────────────────────────────────────────────────────────────────

class CVService:
    def __init__(self):
        self.yolo_model: Optional[object] = None
        self._load_yolo()

    def _load_yolo(self):
        if not YOLO_AVAILABLE:
            return
        try:
            # Use pretrained nano model; swap for a fine-tuned traffic-sign model
            self.yolo_model = YOLO("yolov8n.pt")
            logger.info("YOLOv8 model loaded")
        except Exception as exc:
            logger.warning("YOLO load failed: %s — falling back to rule-based", exc)

    # ─── Public API ──────────────────────────────────────────────────────────

    async def analyze_sign(self, image_bytes: bytes) -> dict:
        """
        Identify traffic signs in an image.
        Returns detected signs with confidence, type, and legal implications.
        """
        if CV2_AVAILABLE and self.yolo_model:
            return await self._yolo_analyze(image_bytes)
        return self._rule_based_analyze(image_bytes)

    async def detect_speed_limit(self, image_bytes: bytes) -> dict:
        """
        Extract a speed limit value from a road image via OCR + shape detection.
        """
        if not CV2_AVAILABLE or not OCR_AVAILABLE:
            return self._mock_speed_limit()

        try:
            img = self._bytes_to_cv2(image_bytes)
            circles = self._detect_circular_signs(img)
            speed_values = []

            for x, y, r in circles:
                roi = img[max(0, y - r): y + r, max(0, x - r): x + r]
                text = self._ocr_roi(roi)
                nums = re.findall(r"\b(\d{2,3})\b", text)
                for n in nums:
                    v = int(n)
                    if 10 <= v <= 140:
                        speed_values.append(v)

            if speed_values:
                detected = max(set(speed_values), key=speed_values.count)
                key = f"speed_limit_{detected}"
                return {
                    "detected":         True,
                    "speed_limit":      detected,
                    "unit":             "km/h",
                    "confidence":       0.82,
                    "legal_implication": LEGAL_IMPLICATIONS.get(key, ""),
                    "raw_candidates":   speed_values,
                }

            # Fall back to full-image OCR
            full_text = self._ocr_roi(img)
            nums = re.findall(r"\b(\d{2,3})\b", full_text)
            for n in nums:
                v = int(n)
                if 10 <= v <= 140:
                    return {
                        "detected":    True,
                        "speed_limit": v,
                        "unit":        "km/h",
                        "confidence":  0.55,
                        "legal_implication": LEGAL_IMPLICATIONS.get(f"speed_limit_{v}", ""),
                        "raw_candidates": [v],
                    }

            return {"detected": False, "speed_limit": None, "confidence": 0.0}

        except Exception as exc:
            logger.error("detect_speed_limit error: %s", exc)
            return {"detected": False, "error": str(exc)}

    async def analyze_vehicle(self, image_bytes: bytes) -> dict:
        """
        Check a vehicle image for visible condition violations
        (e.g., missing number plate, broken lights).
        """
        if not CV2_AVAILABLE:
            return self._mock_vehicle_analysis()

        try:
            img = self._bytes_to_cv2(image_bytes)
            issues = []

            # Brightness / night visibility proxy
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            mean_brightness = float(gray.mean())
            if mean_brightness < 40:
                issues.append({
                    "issue":    "Poor image quality / low visibility",
                    "severity": "warning",
                    "note":     "Cannot reliably assess vehicle condition",
                })

            # Naive plate detection via contour area
            edges = cv2.Canny(gray, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            plate_like = [
                c for c in contours
                if 500 < cv2.contourArea(c) < 50_000
                and self._is_rectangular(c)
            ]
            if not plate_like:
                issues.append({
                    "issue":    "Number plate not clearly visible",
                    "severity": "high",
                    "violation": "MV Act Sec. 39 — display of registration marks",
                })

            return {
                "issues_found":  len(issues) > 0,
                "issue_count":   len(issues),
                "issues":        issues,
                "image_quality": "low" if mean_brightness < 40 else "acceptable",
                "mock":          False,
            }
        except Exception as exc:
            logger.error("analyze_vehicle error: %s", exc)
            return {"issues_found": False, "error": str(exc)}

    # ─── Internal helpers ─────────────────────────────────────────────────

    async def _yolo_analyze(self, image_bytes: bytes) -> dict:
        try:
            img = self._bytes_to_cv2(image_bytes)
            results = self.yolo_model(img, verbose=False)
            detections = []
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    label = self.yolo_model.names[cls_id]
                    # Map YOLO class name → our catalogue key
                    key = self._map_yolo_label(label)
                    sign_info = SIGN_CATALOGUE.get(key, {"label": label, "type": "unknown"})
                    detections.append({
                        "sign_key":         key,
                        "label":            sign_info.get("label", label),
                        "type":             sign_info.get("type", "unknown"),
                        "confidence":       round(conf, 3),
                        "legal_implication": LEGAL_IMPLICATIONS.get(key, ""),
                    })

            return {
                "detected":   len(detections) > 0,
                "signs":      detections,
                "model":      "YOLOv8n",
                "mock":       False,
            }
        except Exception as exc:
            logger.error("YOLO analyze failed: %s", exc)
            return self._rule_based_analyze(image_bytes)

    def _rule_based_analyze(self, image_bytes: bytes) -> dict:
        """Colour + shape heuristics when YOLO is unavailable."""
        if not CV2_AVAILABLE:
            return self._mock_sign_analysis()

        try:
            img = self._bytes_to_cv2(image_bytes)
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            detected = []

            # Red sign detection (stop / no-entry / speed limit)
            red_mask = (
                cv2.inRange(hsv, np.array([0, 120, 70]),  np.array([10, 255, 255])) |
                cv2.inRange(hsv, np.array([170, 120, 70]), np.array([180, 255, 255]))
            )
            red_pixels = int(red_mask.sum() // 255)
            if red_pixels > 500:
                detected.append({
                    "sign_key":         "regulatory_red",
                    "label":            "Regulatory Sign (Red)",
                    "type":             "regulatory",
                    "confidence":       min(0.5 + red_pixels / 50_000, 0.9),
                    "legal_implication": "Red signs are regulatory — obey unconditionally.",
                })

            # Blue sign detection (informational)
            blue_mask = cv2.inRange(hsv, np.array([100, 100, 50]), np.array([130, 255, 255]))
            blue_pixels = int(blue_mask.sum() // 255)
            if blue_pixels > 500:
                detected.append({
                    "sign_key":    "informational_blue",
                    "label":       "Informational Sign (Blue)",
                    "type":        "informational",
                    "confidence":  min(0.4 + blue_pixels / 50_000, 0.85),
                    "legal_implication": "",
                })

            return {
                "detected":  len(detected) > 0,
                "signs":     detected,
                "model":     "rule-based (colour/shape)",
                "mock":      False,
            }
        except Exception as exc:
            return self._mock_sign_analysis()

    @staticmethod
    def _bytes_to_cv2(image_bytes: bytes):
        arr = np.frombuffer(image_bytes, np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)

    @staticmethod
    def _detect_circular_signs(img):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)
        circles = cv2.HoughCircles(
            blurred, cv2.HOUGH_GRADIENT, dp=1, minDist=50,
            param1=50, param2=30, minRadius=20, maxRadius=150,
        )
        if circles is None:
            return []
        return [(int(x), int(y), int(r)) for x, y, r in circles[0]]

    @staticmethod
    def _ocr_roi(roi) -> str:
        if not OCR_AVAILABLE:
            return ""
        try:
            pil_img = Image.fromarray(cv2.cvtColor(roi, cv2.COLOR_BGR2RGB))
            return pytesseract.image_to_string(pil_img, config="--psm 7 digits")
        except Exception:
            return ""

    @staticmethod
    def _is_rectangular(contour) -> bool:
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.04 * peri, True)
        return len(approx) == 4

    @staticmethod
    def _map_yolo_label(label: str) -> str:
        label = label.lower().replace(" ", "_")
        for key in SIGN_CATALOGUE:
            if key in label or label in key:
                return key
        return label

    # ─── Mock responses ──────────────────────────────────────────────────────

    @staticmethod
    def _mock_sign_analysis() -> dict:
        return {
            "detected": True,
            "signs": [
                {
                    "sign_key":  "speed_limit_60",
                    "label":     "Speed Limit 60",
                    "type":      "regulatory",
                    "confidence": 0.87,
                    "legal_implication": LEGAL_IMPLICATIONS.get("speed_limit_60", ""),
                }
            ],
            "model": "mock",
            "mock":  True,
        }

    @staticmethod
    def _mock_speed_limit() -> dict:
        return {
            "detected":    True,
            "speed_limit": 60,
            "unit":        "km/h",
            "confidence":  0.90,
            "legal_implication": LEGAL_IMPLICATIONS.get("speed_limit_60", ""),
            "mock":        True,
        }

    @staticmethod
    def _mock_vehicle_analysis() -> dict:
        return {
            "issues_found": False,
            "issue_count":  0,
            "issues":       [],
            "image_quality": "acceptable",
            "mock":         True,
        }


# ─── Singleton ────────────────────────────────────────────────────────────────
cv_service = CVService()
