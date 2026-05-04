"""
DriveLegal — Gamification Models
Badges, achievements, leaderboard, and insurance discount partners.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, Enum, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum


class BadgeTier(str, enum.Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD   = "gold"
    PLATINUM = "platinum"


class LeaderboardPeriod(str, enum.Enum):
    WEEKLY  = "weekly"
    MONTHLY = "monthly"
    YEARLY  = "yearly"
    ALL_TIME = "all_time"


class Badge(Base):
    __tablename__ = "badges"

    id:          Mapped[int]            = mapped_column(Integer, primary_key=True)
    key:         Mapped[str]            = mapped_column(String(64), unique=True, index=True)
    name:        Mapped[str]            = mapped_column(String(128))
    description: Mapped[str]            = mapped_column(Text)
    icon:        Mapped[str]            = mapped_column(String(8))    # emoji or icon key
    tier:        Mapped[BadgeTier]      = mapped_column(Enum(BadgeTier), default=BadgeTier.BRONZE)
    points:      Mapped[int]            = mapped_column(Integer, default=10)
    criteria:    Mapped[dict]           = mapped_column(JSON)          # e.g. {"violation_free_days": 365}
    is_active:   Mapped[bool]           = mapped_column(Boolean, default=True)
    created_at:  Mapped[datetime]       = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user_badges: Mapped[list["UserBadge"]] = relationship(back_populates="badge")


class UserBadge(Base):
    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),)

    id:        Mapped[int]      = mapped_column(Integer, primary_key=True)
    user_id:   Mapped[int]      = mapped_column(ForeignKey("users.id"), index=True)
    badge_id:  Mapped[int]      = mapped_column(ForeignKey("badges.id"), index=True)
    earned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notified:  Mapped[bool]     = mapped_column(Boolean, default=False)

    # Relationships
    badge: Mapped["Badge"] = relationship(back_populates="user_badges")


class Leaderboard(Base):
    __tablename__ = "leaderboard"
    __table_args__ = (
        UniqueConstraint("user_id", "period", "region_key", name="uq_leaderboard_entry"),
        Index("ix_leaderboard_score", "period", "score"),
    )

    id:         Mapped[int]               = mapped_column(Integer, primary_key=True)
    user_id:    Mapped[int]               = mapped_column(ForeignKey("users.id"), index=True)
    period:     Mapped[LeaderboardPeriod] = mapped_column(Enum(LeaderboardPeriod))
    region_key: Mapped[str]               = mapped_column(String(20), index=True)  # e.g. "IN", "IN-MH"
    score:      Mapped[float]             = mapped_column(Float, default=0.0)
    rank:       Mapped[Optional[int]]     = mapped_column(Integer, nullable=True)
    violations_count: Mapped[int]         = mapped_column(Integer, default=0)
    badge_count:      Mapped[int]         = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime]          = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InsurancePartner(Base):
    __tablename__ = "insurance_partners"

    id:              Mapped[int]           = mapped_column(Integer, primary_key=True)
    name:            Mapped[str]           = mapped_column(String(128))
    logo_url:        Mapped[Optional[str]] = mapped_column(String(512))
    discount_pct:    Mapped[float]         = mapped_column(Float)          # e.g. 15.0 for 15%
    min_score:       Mapped[float]         = mapped_column(Float, default=70.0)  # min compliance score
    description:     Mapped[str]           = mapped_column(Text)
    affiliate_url:   Mapped[Optional[str]] = mapped_column(String(512))
    country_codes:   Mapped[list]          = mapped_column(JSON, default=list)
    is_active:       Mapped[bool]          = mapped_column(Boolean, default=True)
    created_at:      Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow)
