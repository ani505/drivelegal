"""
DriveLegal — Gamification Service
Badge award logic, leaderboard scoring, and insurance deal eligibility.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.models.gamification import Badge, UserBadge, Leaderboard, InsurancePartner, LeaderboardPeriod
from app.models.models import User, UserViolation, DrivingProfile

logger = logging.getLogger(__name__)

# ─── Default badge definitions ────────────────────────────────────────────────

DEFAULT_BADGES = [
    {
        "key": "clean_slate",
        "name": "Clean Slate",
        "description": "Zero violations for 365 consecutive days",
        "icon": "🏆",
        "tier": "gold",
        "points": 100,
        "criteria": {"violation_free_days": 365},
    },
    {
        "key": "perfect_score",
        "name": "Perfect Score",
        "description": "Achieved a compliance score of 100",
        "icon": "🚀",
        "tier": "platinum",
        "points": 150,
        "criteria": {"min_compliance_score": 100},
    },
    {
        "key": "road_guardian",
        "name": "Road Guardian",
        "description": "Reported 10 enforcement zones to the community",
        "icon": "🗺️",
        "tier": "silver",
        "points": 50,
        "criteria": {"enforcement_reports": 10},
    },
    {
        "key": "law_learner",
        "name": "Law Learner",
        "description": "Completed 5 AI legal Q&A sessions",
        "icon": "📚",
        "tier": "bronze",
        "points": 20,
        "criteria": {"chat_sessions": 5},
    },
    {
        "key": "global_driver",
        "name": "Global Driver",
        "description": "Checked traffic laws in 3 or more countries",
        "icon": "🌍",
        "tier": "silver",
        "points": 40,
        "criteria": {"countries_checked": 3},
    },
    {
        "key": "first_step",
        "name": "First Step",
        "description": "Completed your first violation lookup",
        "icon": "🎯",
        "tier": "bronze",
        "points": 10,
        "criteria": {"violation_lookups": 1},
    },
    {
        "key": "appeal_master",
        "name": "Appeal Master",
        "description": "Successfully used the appeal guidance tool",
        "icon": "⚖️",
        "tier": "bronze",
        "points": 15,
        "criteria": {"appeals_filed": 1},
    },
    {
        "key": "safe_six_months",
        "name": "Half-Year Hero",
        "description": "Zero violations for 180 consecutive days",
        "icon": "🛡️",
        "tier": "silver",
        "points": 60,
        "criteria": {"violation_free_days": 180},
    },
]

DEFAULT_INSURANCE_PARTNERS = [
    {
        "name":         "SafeDrive Insurance",
        "discount_pct": 20.0,
        "min_score":    80.0,
        "description":  "India's leading usage-based insurance partner. Earn up to 20% off your premium.",
        "affiliate_url": "https://example.com/safedrive",
        "country_codes": ["IN"],
    },
    {
        "name":         "GlobalShield Motor",
        "discount_pct": 15.0,
        "min_score":    70.0,
        "description":  "International coverage with safe-driver discounts for DriveLegal verified drivers.",
        "affiliate_url": "https://example.com/globalshield",
        "country_codes": ["IN", "US", "GB", "AU"],
    },
    {
        "name":         "DriveWise Rewards",
        "discount_pct": 10.0,
        "min_score":    60.0,
        "description":  "Entry-level safe-driver discount — available to all DriveLegal members.",
        "affiliate_url": "https://example.com/drivewise",
        "country_codes": [],  # all countries
    },
]


# ─── GamificationService ──────────────────────────────────────────────────────

class GamificationService:

    # ─── Seed helpers ────────────────────────────────────────────────────────

    async def seed_badges(self, db: AsyncSession) -> int:
        """Insert default badges if they don't already exist. Returns count seeded."""
        seeded = 0
        for bd in DEFAULT_BADGES:
            existing = await db.execute(select(Badge).where(Badge.key == bd["key"]))
            if existing.scalar_one_or_none():
                continue
            db.add(Badge(**bd))
            seeded += 1
        await db.commit()
        return seeded

    async def seed_insurance_partners(self, db: AsyncSession) -> int:
        seeded = 0
        for pd in DEFAULT_INSURANCE_PARTNERS:
            existing = await db.execute(
                select(InsurancePartner).where(InsurancePartner.name == pd["name"])
            )
            if existing.scalar_one_or_none():
                continue
            db.add(InsurancePartner(**pd))
            seeded += 1
        await db.commit()
        return seeded

    # ─── Badge logic ─────────────────────────────────────────────────────────

    async def check_and_award_badges(self, user_id: int, db: AsyncSession) -> list[dict]:
        """
        Evaluate all active badges for the user and award any newly earned ones.
        Returns list of newly awarded badge dicts.
        """
        newly_awarded: list[dict] = []

        all_badges_q = await db.execute(select(Badge).where(Badge.is_active == True))
        all_badges = all_badges_q.scalars().all()

        existing_q = await db.execute(
            select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
        )
        existing_ids = {row[0] for row in existing_q.all()}

        user_stats = await self._get_user_stats(user_id, db)

        for badge in all_badges:
            if badge.id in existing_ids:
                continue
            if self._criteria_met(badge.criteria, user_stats):
                ub = UserBadge(user_id=user_id, badge_id=badge.id)
                db.add(ub)
                newly_awarded.append({
                    "key":         badge.key,
                    "name":        badge.name,
                    "icon":        badge.icon,
                    "tier":        badge.tier,
                    "points":      badge.points,
                    "description": badge.description,
                })
                logger.info("Badge '%s' awarded to user %d", badge.key, user_id)

        if newly_awarded:
            await db.commit()
            await self._update_leaderboard_score(user_id, db, newly_awarded)

        return newly_awarded

    async def get_user_badges(self, user_id: int, db: AsyncSession) -> list[dict]:
        q = await db.execute(
            select(UserBadge, Badge)
            .join(Badge, UserBadge.badge_id == Badge.id)
            .where(UserBadge.user_id == user_id)
            .order_by(UserBadge.earned_at.desc())
        )
        return [
            {
                "key":         badge.key,
                "name":        badge.name,
                "icon":        badge.icon,
                "tier":        badge.tier,
                "points":      badge.points,
                "description": badge.description,
                "earned_at":   ub.earned_at.isoformat(),
            }
            for ub, badge in q.all()
        ]

    async def get_all_badges(self, db: AsyncSession) -> list[dict]:
        q = await db.execute(select(Badge).where(Badge.is_active == True).order_by(Badge.points.desc()))
        return [
            {
                "key":         b.key,
                "name":        b.name,
                "icon":        b.icon,
                "tier":        b.tier,
                "points":      b.points,
                "description": b.description,
                "criteria":    b.criteria,
            }
            for b in q.scalars().all()
        ]

    # ─── Leaderboard ─────────────────────────────────────────────────────────

    async def get_leaderboard(
        self,
        db: AsyncSession,
        region_key: str = "GLOBAL",
        period: LeaderboardPeriod = LeaderboardPeriod.MONTHLY,
        limit: int = 20,
    ) -> list[dict]:
        q = await db.execute(
            select(Leaderboard, User)
            .join(User, Leaderboard.user_id == User.id)
            .where(
                Leaderboard.period == period,
                Leaderboard.region_key == region_key,
            )
            .order_by(Leaderboard.score.desc())
            .limit(limit)
        )
        rows = q.all()
        result = []
        for rank, (lb, user) in enumerate(rows, start=1):
            result.append({
                "rank":             rank,
                "user_id":          user.id,
                "display_name":     user.full_name or f"Driver#{user.id}",
                "score":            lb.score,
                "badge_count":      lb.badge_count,
                "violations_count": lb.violations_count,
                "region_key":       lb.region_key,
                "period":           lb.period,
            })
        return result

    async def _update_leaderboard_score(
        self,
        user_id: int,
        db: AsyncSession,
        new_badges: list[dict],
    ):
        points_gained = sum(b["points"] for b in new_badges)
        for period in LeaderboardPeriod:
            lb_q = await db.execute(
                select(Leaderboard).where(
                    Leaderboard.user_id == user_id,
                    Leaderboard.period == period,
                    Leaderboard.region_key == "GLOBAL",
                )
            )
            lb = lb_q.scalar_one_or_none()
            if lb:
                lb.score += points_gained
                lb.badge_count += len(new_badges)
            else:
                db.add(Leaderboard(
                    user_id=user_id,
                    period=period,
                    region_key="GLOBAL",
                    score=float(points_gained),
                    badge_count=len(new_badges),
                ))
        await db.commit()

    # ─── Insurance ───────────────────────────────────────────────────────────

    async def get_insurance_deals(
        self,
        db: AsyncSession,
        user_compliance_score: float,
        country_code: Optional[str] = None,
    ) -> list[dict]:
        q = await db.execute(
            select(InsurancePartner).where(
                InsurancePartner.is_active == True,
                InsurancePartner.min_score <= user_compliance_score,
            )
        )
        partners = q.scalars().all()
        result = []
        for p in partners:
            if country_code and p.country_codes and country_code not in p.country_codes:
                continue
            result.append({
                "name":          p.name,
                "discount_pct":  p.discount_pct,
                "description":   p.description,
                "affiliate_url": p.affiliate_url,
                "country_codes": p.country_codes,
                "eligible":      True,
            })
        return sorted(result, key=lambda x: -x["discount_pct"])

    # ─── Private helpers ─────────────────────────────────────────────────────

    async def _get_user_stats(self, user_id: int, db: AsyncSession) -> dict:
        """Collect all metrics needed to evaluate badge criteria."""
        # Violation-free days
        last_v_q = await db.execute(
            select(func.max(UserViolation.violation_date))
            .where(UserViolation.user_id == user_id)
        )
        last_violation = last_v_q.scalar()
        if last_violation is None:
            # Never had a violation
            user_q = await db.execute(select(User).where(User.id == user_id))
            user = user_q.scalar_one_or_none()
            created = user.created_at if user else datetime.utcnow()
            violation_free_days = (datetime.utcnow() - created).days
        else:
            violation_free_days = (datetime.utcnow() - last_violation).days

        # Total violations
        violations_count_q = await db.execute(
            select(func.count()).where(UserViolation.user_id == user_id)
        )
        violations_count = violations_count_q.scalar() or 0

        # Compliance score from driving profile
        profile_q = await db.execute(
            select(DrivingProfile).where(DrivingProfile.user_id == user_id)
        )
        profile = profile_q.scalar_one_or_none()
        compliance_score = getattr(profile, "compliance_score", 0) or 0

        # Chat sessions
        from app.models.models import ChatSession
        chat_q = await db.execute(
            select(func.count()).where(ChatSession.user_id == user_id)
        )
        chat_sessions = chat_q.scalar() or 0

        return {
            "violation_free_days":    violation_free_days,
            "violations_count":       violations_count,
            "min_compliance_score":   compliance_score,
            "chat_sessions":          chat_sessions,
            "violation_lookups":      violations_count,  # proxy
            "enforcement_reports":    0,   # future: community reports table
            "countries_checked":      1,   # future: query unique country lookups
            "appeals_filed":          0,   # future: track appeals
        }

    @staticmethod
    def _criteria_met(criteria: dict, stats: dict) -> bool:
        for key, threshold in criteria.items():
            value = stats.get(key, 0)
            if value < threshold:
                return False
        return True


# ─── Singleton ────────────────────────────────────────────────────────────────
gamification_service = GamificationService()
