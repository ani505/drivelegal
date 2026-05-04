"""
DriveLegal — Translation Service
Uses deep-translator (free, no API key needed for Google backend)
"""
from deep_translator import GoogleTranslator
from langdetect import detect
from typing import Optional

SUPPORTED_LANGUAGES = {
    "en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu",
    "mr": "Marathi", "bn": "Bengali", "gu": "Gujarati", "kn": "Kannada",
    "ml": "Malayalam", "pa": "Punjabi", "fr": "French", "de": "German",
    "es": "Spanish", "pt": "Portuguese", "ar": "Arabic", "zh-cn": "Chinese (Simplified)",
    "ja": "Japanese", "ko": "Korean", "ru": "Russian", "it": "Italian",
    "nl": "Dutch", "tr": "Turkish", "vi": "Vietnamese", "th": "Thai",
    "id": "Indonesian",
}


class TranslationService:

    def translate(
        self,
        text: str,
        target_language: str,
        source_language: str = "auto",
    ) -> dict:
        """Translate text to target language."""
        try:
            # Detect source language if auto
            detected = source_language
            if source_language == "auto":
                try:
                    detected = detect(text)
                except Exception:
                    detected = "en"

            # No translation needed if same language
            if detected == target_language:
                return {
                    "original_text": text,
                    "translated_text": text,
                    "source_language": detected,
                    "target_language": target_language,
                    "success": True,
                }

            translator = GoogleTranslator(source=source_language, target=target_language)
            translated = translator.translate(text)

            return {
                "original_text": text,
                "translated_text": translated,
                "source_language": detected,
                "target_language": target_language,
                "success": True,
            }
        except Exception as e:
            return {
                "original_text": text,
                "translated_text": text,
                "source_language": source_language,
                "target_language": target_language,
                "success": False,
                "error": str(e),
            }

    def detect_language(self, text: str) -> str:
        """Detect the language of a text string."""
        try:
            return detect(text)
        except Exception:
            return "en"

    def get_supported_languages(self) -> dict:
        return SUPPORTED_LANGUAGES

    def translate_violation(self, violation_dict: dict, target_language: str) -> dict:
        """
        Translate violation name and description to target language.
        Checks pre-stored translations first, falls back to live translation.
        """
        if target_language == "en":
            return violation_dict

        result = violation_dict.copy()

        # Check pre-stored translations
        name_translations = violation_dict.get("name_translations") or {}
        desc_translations = violation_dict.get("description_translations") or {}

        if target_language in name_translations:
            result["name"] = name_translations[target_language]
        elif violation_dict.get("name"):
            translated = self.translate(violation_dict["name"], target_language)
            result["name"] = translated["translated_text"]

        if target_language in desc_translations:
            result["description"] = desc_translations[target_language]
        elif violation_dict.get("description"):
            translated = self.translate(violation_dict["description"], target_language)
            result["description"] = translated["translated_text"]

        return result


translation_service = TranslationService()
