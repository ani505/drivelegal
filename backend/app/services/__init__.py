from .ai_service import ai_service, AIService
from .ocr_service import ocr_service, OCRService
from .geo_service import geo_service, GeoService
from .translation_service import translation_service, TranslationService
from .risk_service import risk_service, RiskService
from .blockchain_service import blockchain_service, BlockchainService
from .cv_service import cv_service, CVService
from .gamification_service import gamification_service, GamificationService

__all__ = [
    "ai_service", "AIService",
    "ocr_service", "OCRService",
    "geo_service", "GeoService",
    "translation_service", "TranslationService",
    "risk_service", "RiskService",
    "blockchain_service", "BlockchainService",
    "cv_service", "CVService",
    "gamification_service", "GamificationService",
]
