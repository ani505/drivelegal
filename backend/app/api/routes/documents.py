"""
Documents Routes — /api/v1/documents
Upload and OCR-process traffic citations, tickets, and legal notices.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core import get_db
from app.models import UploadedDocument, DocumentStatus
from app.schemas import DocumentUploadResponse, DocumentProcessResult, MessageResponse
from app.services import ocr_service, ai_service

router = APIRouter(prefix="/documents", tags=["Document OCR"])

ALLOWED_TYPES = {
    "image/jpeg", "image/jpg", "image/png",
    "image/webp", "image/tiff", "application/pdf"
}
MAX_FILE_SIZE_MB = 20


async def _process_document_bg(document_id: int, db: AsyncSession):
    result = await db.execute(select(UploadedDocument).where(UploadedDocument.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        return

    doc.status = DocumentStatus.PROCESSING
    await db.commit()

    try:
        ocr_result = ocr_service.process_document(doc.file_path, doc.file_type)
        if ocr_result["success"] and ocr_result.get("raw_text"):
            extracted = await ai_service.extract_violation_from_text(ocr_result["raw_text"])
            doc.raw_text = ocr_result["raw_text"]
            doc.detected_language = ocr_result.get("detected_language")
            doc.ocr_confidence = ocr_result.get("confidence")
            doc.processing_time_ms = ocr_result.get("processing_time_ms")
            doc.extracted_data = extracted
            doc.status = DocumentStatus.COMPLETED
        else:
            doc.status = DocumentStatus.FAILED
            doc.error_message = ocr_result.get("error", "OCR processing failed")
    except Exception as e:
        doc.status = DocumentStatus.FAILED
        doc.error_message = str(e)

    doc.processed_at = datetime.utcnow()
    await db.commit()


async def _upload_file(file: UploadFile, background_tasks: BackgroundTasks, db: AsyncSession) -> DocumentUploadResponse:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Allowed: JPEG, PNG, WebP, TIFF, PDF",
        )

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=413, detail=f"File too large ({size_mb:.1f}MB). Max: {MAX_FILE_SIZE_MB}MB")

    file_path = ocr_service.save_upload(content, file.filename or "upload")
    doc = UploadedDocument(
        filename=file.filename or "upload",
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content),
        status=DocumentStatus.PENDING,
    )
    db.add(doc)
    await db.flush()
    background_tasks.add_task(_process_document_bg, doc.id, db)

    return DocumentUploadResponse(
        document_id=doc.id,
        filename=doc.filename,
        status=DocumentStatus.PENDING,
        message="Document uploaded successfully. Processing started in background.",
    )


# ── /upload (original) ────────────────────────────────────────────────────────
@router.post("/upload", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload a traffic citation or legal notice for OCR processing."""
    return await _upload_file(file, background_tasks, db)


# ── /upload-citation (frontend-compatible alias) ─────────────────────────────
@router.post("/upload-citation", response_model=DocumentUploadResponse, status_code=201)
async def upload_citation(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Frontend-compatible upload endpoint (POST /documents/upload-citation)."""
    return await _upload_file(file, background_tasks, db)


@router.get("/{document_id}", response_model=DocumentProcessResult)
async def get_document_result(document_id: int, db: AsyncSession = Depends(get_db)):
    """Get OCR and extraction results for an uploaded document."""
    result = await db.execute(select(UploadedDocument).where(UploadedDocument.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("/{document_id}/reprocess", response_model=MessageResponse)
async def reprocess_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Retry OCR processing for a failed document."""
    result = await db.execute(select(UploadedDocument).where(UploadedDocument.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status == DocumentStatus.PROCESSING:
        raise HTTPException(status_code=409, detail="Document is already being processed")

    doc.status = DocumentStatus.PENDING
    doc.error_message = None
    await db.commit()
    background_tasks.add_task(_process_document_bg, document_id, db)
    return MessageResponse(message="Reprocessing started")
