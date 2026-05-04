"""
DriveLegal — OCR & Document Processing Service
"""
import os
import time
import io
from pathlib import Path
from typing import Optional
from PIL import Image
import pytesseract
from langdetect import detect
from app.core.config import settings


# Configure tesseract path
if settings.TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

SUPPORTED_LANGUAGES = {
    "en": "eng", "hi": "hin", "ta": "tam", "te": "tel",
    "mr": "mar", "bn": "ben", "gu": "guj", "kn": "kan",
    "ml": "mal", "pa": "pan", "fr": "fra", "de": "deu",
    "es": "spa", "ar": "ara", "zh": "chi_sim",
}

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


class OCRService:
    """Handles OCR extraction from images and PDFs."""

    def extract_text_from_image(
        self, image_path: str, language: str = "en"
    ) -> dict:
        """
        Extract text from an image file using Tesseract OCR.
        Returns dict with text, confidence, and detected language.
        """
        start = time.time()
        try:
            img = Image.open(image_path)
            img = self._preprocess_image(img)

            tesseract_lang = SUPPORTED_LANGUAGES.get(language, "eng")

            # Get text with confidence data
            data = pytesseract.image_to_data(
                img,
                lang=tesseract_lang,
                output_type=pytesseract.Output.DICT,
            )

            # Calculate average confidence (exclude -1 values)
            confidences = [int(c) for c in data["conf"] if int(c) != -1]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            # Extract full text
            raw_text = pytesseract.image_to_string(img, lang=tesseract_lang)

            # Detect language of extracted text
            detected_lang = "en"
            try:
                if raw_text.strip():
                    detected_lang = detect(raw_text)
            except Exception:
                pass

            processing_time = int((time.time() - start) * 1000)

            return {
                "raw_text": raw_text.strip(),
                "confidence": round(avg_confidence, 2),
                "detected_language": detected_lang,
                "processing_time_ms": processing_time,
                "success": True,
                "error": None,
            }
        except Exception as e:
            return {
                "raw_text": None,
                "confidence": 0.0,
                "detected_language": None,
                "processing_time_ms": int((time.time() - start) * 1000),
                "success": False,
                "error": str(e),
            }

    def extract_text_from_pdf(self, pdf_path: str) -> dict:
        """
        Extract text from a PDF using PyPDF2 (text-based) or
        pdf2image + tesseract (scanned PDFs).
        """
        start = time.time()
        try:
            import PyPDF2
            raw_text = ""
            with open(pdf_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        raw_text += page_text + "\n"

            # If no text extracted, it's a scanned PDF — use OCR
            if not raw_text.strip():
                return self._ocr_scanned_pdf(pdf_path, start)

            detected_lang = "en"
            try:
                detected_lang = detect(raw_text)
            except Exception:
                pass

            return {
                "raw_text": raw_text.strip(),
                "confidence": 95.0,  # text-based PDF is high confidence
                "detected_language": detected_lang,
                "processing_time_ms": int((time.time() - start) * 1000),
                "success": True,
                "error": None,
            }
        except Exception as e:
            return {
                "raw_text": None,
                "confidence": 0.0,
                "detected_language": None,
                "processing_time_ms": int((time.time() - start) * 1000),
                "success": False,
                "error": str(e),
            }

    def _ocr_scanned_pdf(self, pdf_path: str, start: float) -> dict:
        """OCR each page of a scanned PDF."""
        try:
            from pdf2image import convert_from_path
            images = convert_from_path(pdf_path, dpi=300)
            all_text = ""
            confidences = []

            for img in images:
                result = self.extract_text_from_image_object(img)
                all_text += result.get("raw_text", "") + "\n"
                if result.get("confidence"):
                    confidences.append(result["confidence"])

            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            detected_lang = "en"
            try:
                detected_lang = detect(all_text)
            except Exception:
                pass

            return {
                "raw_text": all_text.strip(),
                "confidence": round(avg_conf, 2),
                "detected_language": detected_lang,
                "processing_time_ms": int((time.time() - start) * 1000),
                "success": True,
                "error": None,
            }
        except Exception as e:
            return {
                "raw_text": None,
                "confidence": 0.0,
                "detected_language": None,
                "processing_time_ms": int((time.time() - start) * 1000),
                "success": False,
                "error": str(e),
            }

    def extract_text_from_image_object(self, img: Image.Image, language: str = "eng") -> dict:
        """Extract text from a PIL Image object directly."""
        img = self._preprocess_image(img)
        data = pytesseract.image_to_data(img, lang=language, output_type=pytesseract.Output.DICT)
        confidences = [int(c) for c in data["conf"] if int(c) != -1]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
        raw_text = pytesseract.image_to_string(img, lang=language)
        return {"raw_text": raw_text.strip(), "confidence": round(avg_conf, 2)}

    def _preprocess_image(self, img: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR accuracy:
        - Convert to grayscale
        - Resize if too small
        - Increase contrast
        """
        # Convert to RGB if needed
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")

        # Convert to grayscale
        img = img.convert("L")

        # Resize if small
        width, height = img.size
        if width < 1000:
            scale = 1000 / width
            img = img.resize((int(width * scale), int(height * scale)), Image.LANCZOS)

        return img

    def save_upload(self, file_content: bytes, filename: str, user_id: Optional[int] = None) -> str:
        """Save uploaded file and return the path."""
        suffix = Path(filename).suffix.lower()
        user_dir = UPLOAD_DIR / (str(user_id) if user_id else "anonymous")
        user_dir.mkdir(parents=True, exist_ok=True)
        timestamp = int(time.time())
        safe_name = f"{timestamp}_{Path(filename).stem[:50]}{suffix}"
        file_path = user_dir / safe_name
        file_path.write_bytes(file_content)
        return str(file_path)

    def process_document(self, file_path: str, file_type: str) -> dict:
        """Route to correct extractor based on file type."""
        if "pdf" in file_type:
            return self.extract_text_from_pdf(file_path)
        elif any(t in file_type for t in ["jpeg", "jpg", "png", "webp", "tiff", "bmp"]):
            return self.extract_text_from_image(file_path)
        else:
            return {
                "raw_text": None,
                "confidence": 0.0,
                "detected_language": None,
                "processing_time_ms": 0,
                "success": False,
                "error": f"Unsupported file type: {file_type}",
            }


ocr_service = OCRService()
