"""
Translation Routes — /api/v1/translate
Multi-language support for legal text.
"""
from fastapi import APIRouter, HTTPException
from app.schemas import TranslationRequest, TranslationResponse
from app.services import translation_service

router = APIRouter(prefix="/translate", tags=["Translation"])


@router.post("/", response_model=TranslationResponse)
async def translate_text(payload: TranslationRequest):
    """
    Translate legal text between languages.
    Supports 25+ languages including all major Indian languages.
    """
    if payload.target_language not in translation_service.get_supported_languages():
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported target language: '{payload.target_language}'. "
                   f"Supported: {list(translation_service.get_supported_languages().keys())}",
        )

    result = translation_service.translate(
        text=payload.text,
        target_language=payload.target_language,
        source_language=payload.source_language,
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=503,
            detail=f"Translation service error: {result.get('error', 'Unknown error')}",
        )

    return TranslationResponse(
        original_text=result["original_text"],
        translated_text=result["translated_text"],
        source_language=result["source_language"],
        target_language=result["target_language"],
    )


@router.get("/languages")
async def list_supported_languages():
    """List all supported languages for translation."""
    return {
        "languages": translation_service.get_supported_languages(),
        "total": len(translation_service.get_supported_languages()),
    }


@router.post("/detect")
async def detect_language(text: str):
    """Detect the language of a text string."""
    lang = translation_service.detect_language(text)
    all_langs = translation_service.get_supported_languages()
    return {
        "text_preview": text[:100],
        "detected_language": lang,
        "language_name": all_langs.get(lang, "Unknown"),
    }
