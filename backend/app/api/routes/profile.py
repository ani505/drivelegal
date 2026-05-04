"""
Profile Routes — /api/v1/profile
Driving profile, risk scoring, and violation history.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional

from app.core import get_db, get_current_user_id
from app.models import User, DrivingProfile, UserViolation
from app.schemas import DrivingProfileOut, RiskAssessmentResponse, MessageResponse, UserOut
from app.services import risk_service

router = APIRouter(prefix="/profile", tags=["Driving Profile & Risk"])


# ── /me — get current user ────────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
async def get_me(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get the currently authenticated user's profile."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ── /risk-score (frontend alias) ──────────────────────────────────────────────
@router.get("/risk-score", response_model=RiskAssessmentResponse)
async def get_risk_score(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get personalized risk score (frontend-compatible endpoint)."""
    return await _compute_risk(user_id, db)


# ── /risk (original) ─────────────────────────────────────────────────────────
@router.get("/risk", response_model=RiskAssessmentResponse)
async def get_risk_assessment(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get personalized risk assessment based on violation history."""
    return await _compute_risk(user_id, db)


async def _compute_risk(user_id: int, db: AsyncSession) -> RiskAssessmentResponse:
    violations_result = await db.execute(
        select(UserViolation).where(UserViolation.user_id == user_id)
    )
    violations = violations_result.scalars().all()

    profile_result = await db.execute(
        select(DrivingProfile).where(DrivingProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()

    total_points = profile.total_points if profile else 0
    points_limit = profile.points_limit if profile else 12
    suspension_count = profile.suspension_count if profile else 0

    assessment = risk_service.calculate_risk_score(violations, total_points, points_limit, suspension_count)

    if profile:
        profile.risk_score = assessment["risk_score"]
        profile.risk_level = assessment["risk_level"]
        profile.compliance_score = assessment["compliance_score"]
        profile.total_violations = assessment["violations_analyzed"]
        profile.last_calculated = datetime.utcnow()

    return RiskAssessmentResponse(
        risk_score=assessment["risk_score"],
        risk_level=assessment["risk_level"],
        compliance_score=assessment["compliance_score"],
        top_risk_factors=assessment["top_risk_factors"],
        recommendations=assessment["recommendations"],
        estimated_insurance_impact=assessment["estimated_insurance_impact"],
    )


# ── /driving-profile ─────────────────────────────────────────────────────────
@router.get("/driving-profile", response_model=DrivingProfileOut)
async def get_driving_profile(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's driving profile and license point tracking."""
    result = await db.execute(select(DrivingProfile).where(DrivingProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Driving profile not found.")
    return profile


# ── /violations ───────────────────────────────────────────────────────────────
@router.get("/violations")
async def get_my_violations(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get all violations recorded for the authenticated user."""
    result = await db.execute(
        select(UserViolation).where(UserViolation.user_id == user_id)
        .order_by(UserViolation.created_at.desc())
    )
    violations = result.scalars().all()
    return [
        {
            "id": v.id,
            "incident_date": v.incident_date.isoformat() if v.incident_date else None,
            "location_description": v.location_description,
            "fine_amount": v.fine_amount,
            "fine_paid": v.fine_paid,
            "is_contested": v.is_contested,
            "contest_outcome": v.contest_outcome,
            "notes": v.notes,
            "created_at": v.created_at.isoformat(),
        }
        for v in violations
    ]


@router.post("/violations", status_code=201)
async def add_violation(
    violation_type_id: int,
    fine_amount: Optional[float] = None,
    incident_date: Optional[str] = None,
    location_description: Optional[str] = None,
    notes: Optional[str] = None,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Manually add a violation to the user's driving record."""
    incident = None
    if incident_date:
        try:
            incident = datetime.fromisoformat(incident_date)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid date format. Use ISO 8601.")

    violation = UserViolation(
        user_id=user_id,
        violation_type_id=violation_type_id,
        fine_amount=fine_amount,
        incident_date=incident,
        location_description=location_description,
        notes=notes,
    )
    db.add(violation)
    return MessageResponse(message="Violation added to your record")
