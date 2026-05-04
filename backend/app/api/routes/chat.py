"""
Chat Routes — /api/v1/chat
AI-powered legal assistant with session management.
"""
import secrets
from fastapi import APIRouter, Depends, Request, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional, List

from app.core import get_db
from app.models import ChatSession, ChatMessage
from app.schemas import ChatRequest, ChatResponse, ChatMessageOut
from app.services import ai_service

router = APIRouter(prefix="/chat", tags=["AI Legal Assistant"])


async def _get_or_create_session(
    db: AsyncSession,
    session_token: str | None,
    country_code: str | None,
    state_code: str | None,
    language: str,
    user_id: int | None = None,
) -> ChatSession:
    if session_token:
        result = await db.execute(
            select(ChatSession).where(ChatSession.session_token == session_token)
        )
        session = result.scalar_one_or_none()
        if session:
            session.last_active = datetime.utcnow()
            return session

    new_token = secrets.token_urlsafe(32)
    session = ChatSession(
        session_token=new_token,
        country_code=country_code,
        state_code=state_code,
        language=language,
        user_id=user_id,
    )
    db.add(session)
    await db.flush()
    return session


async def _load_history(db: AsyncSession, session_id: int, limit: int = 10) -> list[dict]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()
    return [
        {"role": m.role, "content": m.content}
        for m in reversed(messages)
        if m.role in ("user", "assistant")
    ]


async def _handle_chat(payload: ChatRequest, request: Request, db: AsyncSession) -> ChatResponse:
    country_code = payload.country_code
    if not country_code:
        client_ip = request.client.host if request.client else "127.0.0.1"
        if client_ip not in ("127.0.0.1", "::1"):
            from app.services import geo_service
            geo = await geo_service.get_location_from_ip(client_ip)
            country_code = geo.get("country_code")

    session = await _get_or_create_session(
        db, payload.session_token, country_code, payload.state_code, payload.language,
    )
    history = await _load_history(db, session.id)

    user_msg = ChatMessage(
        session_id=session.id, role="user", content=payload.message, language=payload.language,
    )
    db.add(user_msg)
    await db.flush()

    response_text, sources = await ai_service.chat(
        message=payload.message,
        conversation_history=history,
        country_code=country_code or session.country_code,
        state_code=payload.state_code or session.state_code,
        language=payload.language,
    )

    assistant_msg = ChatMessage(
        session_id=session.id, role="assistant", content=response_text,
        language=payload.language, sources=sources if sources else None,
    )
    db.add(assistant_msg)

    suggested = ai_service.get_suggested_questions(country_code)
    msg_out = ChatMessageOut(role="assistant", content=response_text, sources=sources or None, created_at=datetime.utcnow())
    return ChatResponse(session_token=session.session_token, message=msg_out, suggested_questions=suggested)


# ── Primary endpoint (legacy path) ──────────────────────────────────────────
@router.post("/", response_model=ChatResponse)
async def chat(payload: ChatRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Send a message to the DriveLegal AI legal assistant."""
    return await _handle_chat(payload, request, db)


# ── Frontend-compatible endpoint ─────────────────────────────────────────────
@router.post("/message", response_model=ChatResponse)
async def chat_message(payload: ChatRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Frontend-compatible chat endpoint (POST /chat/message)."""
    return await _handle_chat(payload, request, db)


# ── Suggested questions ───────────────────────────────────────────────────────
@router.get("/suggested-questions")
async def suggested_questions(country_code: Optional[str] = Query(None)):
    """Return suggested questions for a given jurisdiction."""
    return ai_service.get_suggested_questions(country_code)


# ── Session history ──────────────────────────────────────────────────────────
@router.get("/session/{session_token}/history")
async def get_session_history(session_token: str, limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatSession).where(ChatSession.session_token == session_token))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    msgs_result = await db.execute(
        select(ChatMessage).where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at).limit(limit)
    )
    messages = msgs_result.scalars().all()
    return {
        "session_token": session_token,
        "country_code": session.country_code,
        "language": session.language,
        "messages": [
            {"role": m.role, "content": m.content, "sources": m.sources, "created_at": m.created_at.isoformat()}
            for m in messages
        ],
    }


@router.delete("/session/{session_token}")
async def delete_session(session_token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatSession).where(ChatSession.session_token == session_token))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    return {"message": "Session deleted successfully"}
