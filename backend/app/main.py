"""
DriveLegal — FastAPI Application Entry Point
Road Safety Hackathon 2026 | IIT Madras
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import (
    auth_router,
    violations_router,
    chat_router,
    documents_router,
    geo_router,
    profile_router,
    translate_router,
    lawyers_router,
    appeal_router,
    blockchain_router,
    vision_router,
    gamification_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Create all tables on startup (use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ DriveLegal API started")
    yield
    await engine.dispose()
    print("🛑 DriveLegal API shutdown")


app = FastAPI(
    title="DriveLegal API",
    description=(
        "AI-powered traffic law assistant — location-specific violations, "
        "fines, OCR document processing, and multilingual legal Q&A.\n\n"
        "**Road Safety Hackathon 2026 | CoERS, RBG Labs, IIT Madras**"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ───────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request Timing Middleware ────────────────────────────────────────────────

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.time() - start) * 1000:.1f}ms"
    return response


# ─── Global Exception Handler ────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "Please try again later",
        },
    )


# ─── API Routes ──────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(violations_router, prefix=API_PREFIX)
app.include_router(chat_router, prefix=API_PREFIX)
app.include_router(documents_router, prefix=API_PREFIX)
app.include_router(geo_router, prefix=API_PREFIX)
app.include_router(profile_router, prefix=API_PREFIX)
app.include_router(translate_router, prefix=API_PREFIX)
app.include_router(lawyers_router, prefix=API_PREFIX)
app.include_router(appeal_router, prefix=API_PREFIX)
app.include_router(blockchain_router, prefix=API_PREFIX)
app.include_router(vision_router, prefix=API_PREFIX)
app.include_router(gamification_router, prefix=API_PREFIX)


# ─── Health & Root ────────────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "DriveLegal API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "hackathon": "Road Safety Hackathon 2026 — IIT Madras",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "llm_provider": settings.LLM_PROVIDER,
        "features": {
            "blockchain": settings.ENABLE_BLOCKCHAIN,
            "computer_vision": settings.ENABLE_COMPUTER_VISION,
            "gamification": settings.ENABLE_GAMIFICATION,
        },
    }


@app.get("/api/v1/endpoints", tags=["Root"])
async def list_endpoints():
    """List all available API endpoints."""
    return {
        "endpoints": [
            {"path": "/api/v1/auth", "description": "User registration & login"},
            {"path": "/api/v1/violations", "description": "Traffic law & fine lookup"},
            {"path": "/api/v1/chat", "description": "AI legal assistant chatbot"},
            {"path": "/api/v1/documents", "description": "OCR citation processing"},
            {"path": "/api/v1/geo", "description": "Enforcement zones & location"},
            {"path": "/api/v1/profile", "description": "Driving profile & risk score"},
            {"path": "/api/v1/translate", "description": "Multilingual legal text"},
            {"path": "/api/v1/lawyers", "description": "Traffic attorney directory"},
            {"path": "/api/v1/appeal", "description": "Violation appeal guidance"},
            {"path": "/api/v1/blockchain", "description": "Immutable on-chain violation records"},
            {"path": "/api/v1/vision",     "description": "Traffic sign & speed limit detection"},
            {"path": "/api/v1/gamification", "description": "Badges, leaderboard & insurance deals"},
        ]
    }
