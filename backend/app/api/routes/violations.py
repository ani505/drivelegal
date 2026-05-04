"""
Violations Routes — /api/v1/violations
Location-specific traffic law lookup with multilingual support.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import Optional

from app.core import get_db
from app.models import ViolationType, ViolationCategory, Country, State
from app.schemas import (
    ViolationOut, ViolationSearch, FineEstimateRequest, FineEstimateResponse,
    PaginatedResponse,
)
from app.services import translation_service

router = APIRouter(prefix="/violations", tags=["Traffic Violations"])


@router.get("/", response_model=PaginatedResponse)
async def list_violations(
    country_code: Optional[str] = Query(None, description="ISO country code e.g. IN, US"),
    state_code: Optional[str] = Query(None, description="State/province code"),
    category_id: Optional[int] = Query(None),
    severity: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Search query"),
    language: str = Query("en", description="Response language code"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Search traffic violations with location and language filters.
    Returns paginated results with fine details.
    """
    filters = []

    if country_code:
        country_result = await db.execute(
            select(Country).where(func.upper(Country.code) == country_code.upper())
        )
        country = country_result.scalar_one_or_none()
        if country:
            filters.append(
                or_(ViolationType.country_id == country.id, ViolationType.country_id.is_(None))
            )

    if state_code:
        state_result = await db.execute(
            select(State).where(func.upper(State.code) == state_code.upper())
        )
        state = state_result.scalar_one_or_none()
        if state:
            filters.append(
                or_(ViolationType.state_id == state.id, ViolationType.state_id.is_(None))
            )

    if category_id:
        filters.append(ViolationType.category_id == category_id)

    if severity:
        filters.append(ViolationType.severity == severity)

    if q:
        filters.append(
            or_(
                ViolationType.name.ilike(f"%{q}%"),
                ViolationType.code.ilike(f"%{q}%"),
                ViolationType.description.ilike(f"%{q}%"),
                ViolationType.legal_section.ilike(f"%{q}%"),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(ViolationType)
    if filters:
        count_query = count_query.where(and_(*filters))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginated query
    query = select(ViolationType)
    if filters:
        query = query.where(and_(*filters))
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    violations = result.scalars().all()

    items = []
    for v in violations:
        v_dict = {
            "id": v.id,
            "code": v.code,
            "name": v.name,
            "description": v.description,
            "severity": v.severity,
            "fine_min": v.fine_min,
            "fine_max": v.fine_max,
            "fine_base": v.fine_base,
            "currency": v.currency,
            "license_points": v.license_points,
            "suspension_days": v.suspension_days,
            "legal_section": v.legal_section,
            "act_name": v.act_name,
            "is_cognizable": v.is_cognizable,
            "is_bailable": v.is_bailable,
            "appeal_window_days": v.appeal_window_days,
            "appeal_authority": v.appeal_authority,
            "name_translations": v.name_translations,
            "description_translations": v.description_translations,
        }
        if language != "en":
            v_dict = translation_service.translate_violation(v_dict, language)
        items.append(v_dict)

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{violation_id}", response_model=ViolationOut)
async def get_violation(
    violation_id: int,
    language: str = Query("en"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single violation by ID."""
    result = await db.execute(select(ViolationType).where(ViolationType.id == violation_id))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Violation not found")
    return v


@router.post("/estimate-fine", response_model=FineEstimateResponse)
async def estimate_fine(
    payload: FineEstimateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Estimate fine amount for a violation in a specific jurisdiction.
    Takes into account location and any special circumstances.
    """
    result = await db.execute(
        select(ViolationType).where(
            func.upper(ViolationType.code) == payload.violation_code.upper()
        )
    )
    violation = result.scalar_one_or_none()

    if not violation:
        raise HTTPException(status_code=404, detail=f"Violation code '{payload.violation_code}' not found")

    # Base fine estimate
    fine_min = violation.fine_min or 0.0
    fine_max = violation.fine_max or (violation.fine_base * 2 if violation.fine_base else 0.0)
    most_likely = violation.fine_base or ((fine_min + fine_max) / 2)

    # Adjust for circumstances (simple heuristic — AI service handles deep analysis)
    notes = f"Fine range based on {payload.country_code} jurisdiction data."
    if payload.circumstances:
        lower = payload.circumstances.lower()
        if any(w in lower for w in ["repeat", "second", "third", "habitual"]):
            most_likely = fine_max
            notes += " Repeat offender — maximum fine likely."
        elif any(w in lower for w in ["first", "minor", "unintentional"]):
            most_likely = fine_min
            notes += " First offense — minimum fine may apply."

    return FineEstimateResponse(
        violation_code=violation.code,
        violation_name=violation.name,
        estimated_fine_min=fine_min,
        estimated_fine_max=fine_max,
        most_likely_fine=most_likely,
        currency=violation.currency,
        license_points=violation.license_points,
        legal_section=violation.legal_section,
        notes=notes,
    )


@router.get("/categories/list")
async def list_categories(db: AsyncSession = Depends(get_db)):
    """List all violation categories."""
    result = await db.execute(select(ViolationCategory))
    categories = result.scalars().all()
    return [{"id": c.id, "name": c.name, "description": c.description, "icon": c.icon} for c in categories]
