"""
DriveLegal — Gamification API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.models.gamification import LeaderboardPeriod
from app.services.gamification_service import gamification_service

router = APIRouter(prefix="/gamification", tags=["Gamification"])


@router.get("/badges", summary="List all available badges")
async def list_badges(db: AsyncSession = Depends(get_db)):
    """Return all active badge definitions with criteria."""
    return await gamification_service.get_all_badges(db)


@router.get("/my-badges", summary="Get badges earned by the current user")
async def my_badges(
    user_id: int = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db),
):
    """Return badges earned by the specified user."""
    return await gamification_service.get_user_badges(user_id, db)


@router.post("/check-badges", summary="Evaluate and award new badges for a user")
async def check_badges(
    user_id: int = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Re-evaluate badge criteria for the user.
    Returns any newly awarded badges so the frontend can show a toast/notification.
    """
    try:
        newly_awarded = await gamification_service.check_and_award_badges(user_id, db)
        return {
            "user_id":       user_id,
            "newly_awarded": newly_awarded,
            "count":         len(newly_awarded),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/leaderboard", summary="Regional / national driver rankings")
async def leaderboard(
    region: str = Query("GLOBAL", description="Region key: GLOBAL, IN, IN-MH, etc."),
    period: LeaderboardPeriod = Query(LeaderboardPeriod.MONTHLY),
    limit:  int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Return the top drivers leaderboard for a region and time period."""
    return await gamification_service.get_leaderboard(db, region_key=region, period=period, limit=limit)


@router.get("/insurance-deals", summary="Partner insurance discounts for safe drivers")
async def insurance_deals(
    user_id:  int   = Query(...),
    score:    float = Query(..., ge=0, le=100, description="User compliance score"),
    country:  Optional[str] = Query(None, description="ISO-3166 alpha-2 country code"),
    db: AsyncSession = Depends(get_db),
):
    """Return insurance partner deals the user is eligible for based on their compliance score."""
    deals = await gamification_service.get_insurance_deals(db, score, country)
    return {
        "user_id":    user_id,
        "score":      score,
        "eligible_deals": deals,
        "total":      len(deals),
    }


@router.post("/seed", summary="Seed default badges and insurance partners (admin)")
async def seed_data(db: AsyncSession = Depends(get_db)):
    """Seed default badge definitions and insurance partner records."""
    badges_seeded = await gamification_service.seed_badges(db)
    partners_seeded = await gamification_service.seed_insurance_partners(db)
    return {
        "badges_seeded":   badges_seeded,
        "partners_seeded": partners_seeded,
    }
