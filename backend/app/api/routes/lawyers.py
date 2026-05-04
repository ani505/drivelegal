"""
Lawyers Routes — /api/v1/lawyers
Traffic attorney directory.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Optional

from app.core import get_db
from app.models import Lawyer, Country, State
from app.schemas import PaginatedResponse

router = APIRouter(prefix="/lawyers", tags=["Lawyer Directory"])


def _lawyer_to_dict(lawyer: Lawyer, country_code: str = None, state_code: str = None) -> dict:
    """Serialize Lawyer model into a frontend-compatible dict."""
    specializations = [lawyer.specialization] if lawyer.specialization else []
    return {
        "id": lawyer.id,
        "name": lawyer.name,
        "specialization": lawyer.specialization,
        "specializations": specializations,
        "rating": lawyer.rating,
        "review_count": lawyer.review_count,
        "is_verified": lawyer.is_verified,
        "consultation_fee": lawyer.consultation_fee,
        "languages": lawyer.languages or [],
        "contact_email": lawyer.email,
        "contact_phone": lawyer.phone,
        "country_code": country_code,
        "state_code": state_code,
    }


@router.get("/")
async def search_lawyers(
    country_code: Optional[str] = Query(None),
    state_code: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    verified_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Search for traffic attorneys in your jurisdiction."""
    filters = []
    if verified_only:
        filters.append(Lawyer.is_verified == True)

    resolved_country_code = None
    resolved_state_code = None

    if country_code:
        country_result = await db.execute(
            select(Country).where(func.upper(Country.code) == country_code.upper())
        )
        country = country_result.scalar_one_or_none()
        if country:
            filters.append(Lawyer.country_id == country.id)
            resolved_country_code = country.code

    if state_code:
        state_result = await db.execute(
            select(State).where(func.upper(State.code) == state_code.upper())
        )
        state = state_result.scalar_one_or_none()
        if state:
            filters.append(Lawyer.state_id == state.id)
            resolved_state_code = state.code

    count_q = select(func.count()).select_from(Lawyer)
    if filters:
        count_q = count_q.where(and_(*filters))
    total = (await db.execute(count_q)).scalar() or 0

    query = select(Lawyer).order_by(Lawyer.rating.desc())
    if filters:
        query = query.where(and_(*filters))
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    lawyers = result.scalars().all()

    if language:
        lawyers = [l for l in lawyers if l.languages and language in (l.languages or [])]

    items = [_lawyer_to_dict(l, resolved_country_code, resolved_state_code) for l in lawyers]

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{lawyer_id}")
async def get_lawyer(lawyer_id: int, db: AsyncSession = Depends(get_db)):
    """Get detailed info for a specific lawyer."""
    result = await db.execute(select(Lawyer).where(Lawyer.id == lawyer_id))
    lawyer = result.scalar_one_or_none()
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    return _lawyer_to_dict(lawyer)
