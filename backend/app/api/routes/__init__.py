from .auth import router as auth_router
from .violations import router as violations_router
from .chat import router as chat_router
from .documents import router as documents_router
from .geo import router as geo_router
from .profile import router as profile_router
from .translate import router as translate_router
from .lawyers import router as lawyers_router
from .appeal import router as appeal_router
from .blockchain import router as blockchain_router
from .vision import router as vision_router
from .gamification import router as gamification_router

__all__ = [
    "auth_router",
    "violations_router",
    "chat_router",
    "documents_router",
    "geo_router",
    "profile_router",
    "translate_router",
    "lawyers_router",
    "appeal_router",
    "blockchain_router",
    "vision_router",
    "gamification_router",
]
