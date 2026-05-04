"""
DriveLegal — SQLAlchemy ORM Models
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, Enum, JSON, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum


# ─────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────

class ViolationSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    LAWYER = "lawyer"


# ─────────────────────────────────────────────
# User
# ─────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER)
    preferred_language: Mapped[str] = mapped_column(String(10), default="en")
    country_code: Mapped[Optional[str]] = mapped_column(String(10))
    state_code: Mapped[Optional[str]] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    violations: Mapped[list["UserViolation"]] = relationship(back_populates="user")
    chat_sessions: Mapped[list["ChatSession"]] = relationship(back_populates="user")
    uploaded_documents: Mapped[list["UploadedDocument"]] = relationship(back_populates="user")
    driving_profile: Mapped[Optional["DrivingProfile"]] = relationship(back_populates="user", uselist=False)


# ─────────────────────────────────────────────
# Geography / Jurisdiction
# ─────────────────────────────────────────────

class Country(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(5), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    language_codes: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    has_idp: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    states: Mapped[list["State"]] = relationship(back_populates="country")
    violations: Mapped[list["ViolationType"]] = relationship(back_populates="country")


class State(Base):
    __tablename__ = "states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.id"), index=True)
    code: Mapped[str] = mapped_column(String(20), index=True)
    name: Mapped[str] = mapped_column(String(100))
    capital: Mapped[Optional[str]] = mapped_column(String(100))
    enforcement_level: Mapped[str] = mapped_column(String(20), default="standard")

    country: Mapped["Country"] = relationship(back_populates="states")
    violations: Mapped[list["ViolationType"]] = relationship(back_populates="state")
    enforcement_zones: Mapped[list["EnforcementZone"]] = relationship(back_populates="state")

    __table_args__ = (Index("ix_state_country_code", "country_id", "code"),)


# ─────────────────────────────────────────────
# Traffic Laws & Violations
# ─────────────────────────────────────────────

class ViolationCategory(Base):
    __tablename__ = "violation_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    icon: Mapped[Optional[str]] = mapped_column(String(50))

    violation_types: Mapped[list["ViolationType"]] = relationship(back_populates="category")


class ViolationType(Base):
    __tablename__ = "violation_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("violation_categories.id"))
    country_id: Mapped[Optional[int]] = mapped_column(ForeignKey("countries.id"), index=True)
    state_id: Mapped[Optional[int]] = mapped_column(ForeignKey("states.id"), index=True)

    code: Mapped[str] = mapped_column(String(50), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    severity: Mapped[ViolationSeverity] = mapped_column(Enum(ViolationSeverity), default=ViolationSeverity.MEDIUM)

    # Fine details
    fine_min: Mapped[Optional[float]] = mapped_column(Float)
    fine_max: Mapped[Optional[float]] = mapped_column(Float)
    fine_base: Mapped[Optional[float]] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(10), default="INR")

    # License points
    license_points: Mapped[int] = mapped_column(Integer, default=0)
    suspension_days: Mapped[int] = mapped_column(Integer, default=0)

    # Legal references
    legal_section: Mapped[Optional[str]] = mapped_column(String(100))
    act_name: Mapped[Optional[str]] = mapped_column(String(255))
    is_cognizable: Mapped[bool] = mapped_column(Boolean, default=False)
    is_bailable: Mapped[bool] = mapped_column(Boolean, default=True)

    # Appeal info
    appeal_window_days: Mapped[int] = mapped_column(Integer, default=30)
    appeal_authority: Mapped[Optional[str]] = mapped_column(String(255))

    # Translations (stored as JSON: {"hi": "...", "ta": "..."})
    name_translations: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    description_translations: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category: Mapped[Optional["ViolationCategory"]] = relationship(back_populates="violation_types")
    country: Mapped[Optional["Country"]] = relationship(back_populates="violations")
    state: Mapped[Optional["State"]] = relationship(back_populates="violations")
    user_violations: Mapped[list["UserViolation"]] = relationship(back_populates="violation_type")


# ─────────────────────────────────────────────
# User Violations (personal records)
# ─────────────────────────────────────────────

class UserViolation(Base):
    __tablename__ = "user_violations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    violation_type_id: Mapped[Optional[int]] = mapped_column(ForeignKey("violation_types.id"))

    # Incident details
    incident_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    location_lat: Mapped[Optional[float]] = mapped_column(Float)
    location_lng: Mapped[Optional[float]] = mapped_column(Float)
    location_description: Mapped[Optional[str]] = mapped_column(String(500))

    # Fine details
    fine_amount: Mapped[Optional[float]] = mapped_column(Float)
    fine_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    fine_paid_date: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # Status
    is_contested: Mapped[bool] = mapped_column(Boolean, default=False)
    contest_outcome: Mapped[Optional[str]] = mapped_column(String(50))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Source document
    document_id: Mapped[Optional[int]] = mapped_column(ForeignKey("uploaded_documents.id"))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="violations")
    violation_type: Mapped[Optional["ViolationType"]] = relationship(back_populates="user_violations")
    document: Mapped[Optional["UploadedDocument"]] = relationship()


# ─────────────────────────────────────────────
# Enforcement Zones (speed traps, checkpoints)
# ─────────────────────────────────────────────

class EnforcementZone(Base):
    __tablename__ = "enforcement_zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    state_id: Mapped[Optional[int]] = mapped_column(ForeignKey("states.id"), index=True)

    name: Mapped[str] = mapped_column(String(255))
    zone_type: Mapped[str] = mapped_column(String(50))  # speed_trap, checkpoint, school_zone, etc.
    description: Mapped[Optional[str]] = mapped_column(Text)

    # Location
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    radius_meters: Mapped[int] = mapped_column(Integer, default=500)

    # Enforcement details
    speed_limit_kmh: Mapped[Optional[int]] = mapped_column(Integer)
    active_hours: Mapped[Optional[dict]] = mapped_column(JSON)  # {"mon": "06:00-22:00", ...}
    enforcement_level: Mapped[str] = mapped_column(String(20), default="standard")

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    report_count: Mapped[int] = mapped_column(Integer, default=1)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    state: Mapped[Optional["State"]] = relationship(back_populates="enforcement_zones")

    __table_args__ = (Index("ix_zone_location", "lat", "lng"),)


# ─────────────────────────────────────────────
# Chat Sessions & Messages
# ─────────────────────────────────────────────

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True)
    session_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)

    # Context
    country_code: Mapped[Optional[str]] = mapped_column(String(10))
    state_code: Mapped[Optional[str]] = mapped_column(String(20))
    language: Mapped[str] = mapped_column(String(10), default="en")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_active: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[Optional["User"]] = relationship(back_populates="chat_sessions")
    messages: Mapped[list["ChatMessage"]] = relationship(back_populates="session", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("chat_sessions.id"), index=True)

    role: Mapped[str] = mapped_column(String(20))  # user | assistant | system
    content: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(10), default="en")

    # Metadata
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer)
    sources: Mapped[Optional[list]] = mapped_column(JSON)  # referenced legal sources

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["ChatSession"] = relationship(back_populates="messages")


# ─────────────────────────────────────────────
# Document Upload & OCR
# ─────────────────────────────────────────────

class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True)

    filename: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(500))
    file_type: Mapped[str] = mapped_column(String(50))  # pdf, image/jpeg, etc.
    file_size: Mapped[int] = mapped_column(Integer)

    status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus), default=DocumentStatus.PENDING)

    # OCR Results
    raw_text: Mapped[Optional[str]] = mapped_column(Text)
    detected_language: Mapped[Optional[str]] = mapped_column(String(10))
    extracted_data: Mapped[Optional[dict]] = mapped_column(JSON)  # structured violation data

    # Processing metadata
    ocr_confidence: Mapped[Optional[float]] = mapped_column(Float)
    processing_time_ms: Mapped[Optional[int]] = mapped_column(Integer)
    error_message: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    user: Mapped[Optional["User"]] = relationship(back_populates="uploaded_documents")


# ─────────────────────────────────────────────
# Driving Profile (risk scoring)
# ─────────────────────────────────────────────

class DrivingProfile(Base):
    __tablename__ = "driving_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)

    # License info
    license_number: Mapped[Optional[str]] = mapped_column(String(50))
    license_country: Mapped[Optional[str]] = mapped_column(String(10))
    license_state: Mapped[Optional[str]] = mapped_column(String(20))
    license_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # Points/Demerit system
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    points_limit: Mapped[int] = mapped_column(Integer, default=12)
    suspension_count: Mapped[int] = mapped_column(Integer, default=0)

    # Risk scoring
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)  # 0-100
    risk_level: Mapped[str] = mapped_column(String(20), default="low")  # low, medium, high, critical
    compliance_score: Mapped[float] = mapped_column(Float, default=100.0)  # 0-100

    # Stats
    total_violations: Mapped[int] = mapped_column(Integer, default=0)
    violations_last_year: Mapped[int] = mapped_column(Integer, default=0)
    total_fines_paid: Mapped[float] = mapped_column(Float, default=0.0)

    last_calculated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="driving_profile")


# ─────────────────────────────────────────────
# Lawyer Directory (feature/ai-legal-assistant)
# ─────────────────────────────────────────────

class Lawyer(Base):
    __tablename__ = "lawyers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20))

    specialization: Mapped[str] = mapped_column(String(100), default="traffic_law")
    bar_number: Mapped[Optional[str]] = mapped_column(String(50))
    country_id: Mapped[Optional[int]] = mapped_column(ForeignKey("countries.id"))
    state_id: Mapped[Optional[int]] = mapped_column(ForeignKey("states.id"))

    rating: Mapped[float] = mapped_column(Float, default=0.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    consultation_fee: Mapped[Optional[float]] = mapped_column(Float)
    languages: Mapped[Optional[list]] = mapped_column(JSON, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────
# Blockchain Records
# ─────────────────────────────────────────────

class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    id:             Mapped[int]            = mapped_column(Integer, primary_key=True)
    user_id:        Mapped[Optional[int]]  = mapped_column(ForeignKey("users.id"), index=True)
    violation_id:   Mapped[Optional[int]]  = mapped_column(ForeignKey("user_violations.id"), index=True)
    record_id_hash: Mapped[str]            = mapped_column(String(128), unique=True, index=True)  # on-chain record ID
    tx_hash:        Mapped[Optional[str]]  = mapped_column(String(128))
    driver_did:     Mapped[str]            = mapped_column(String(255))
    violation_code: Mapped[str]            = mapped_column(String(64))
    country_code:   Mapped[str]            = mapped_column(String(10))
    data_hash:      Mapped[str]            = mapped_column(String(128))   # keccak-256 hex
    block_number:   Mapped[Optional[int]]  = mapped_column(Integer)
    is_mock:        Mapped[bool]           = mapped_column(Boolean, default=True)
    created_at:     Mapped[datetime]       = mapped_column(DateTime, default=datetime.utcnow)
