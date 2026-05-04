"""
DriveLegal — Pydantic Schemas (Request/Response)
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime
from app.models.models import ViolationSeverity, DocumentStatus, UserRole


# ─────────────────────────────────────────────
# Auth Schemas
# ─────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None
    country_code: Optional[str] = None
    preferred_language: str = "en"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    email: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: UserRole
    preferred_language: str
    country_code: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Violation Schemas
# ─────────────────────────────────────────────

class ViolationSearch(BaseModel):
    query: Optional[str] = None
    country_code: Optional[str] = None
    state_code: Optional[str] = None
    category_id: Optional[int] = None
    severity: Optional[ViolationSeverity] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class ViolationOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str]
    severity: ViolationSeverity
    fine_min: Optional[float]
    fine_max: Optional[float]
    fine_base: Optional[float]
    currency: str
    license_points: int
    suspension_days: int
    legal_section: Optional[str]
    act_name: Optional[str]
    is_cognizable: bool
    is_bailable: bool
    appeal_window_days: int
    appeal_authority: Optional[str]

    model_config = {"from_attributes": True}


class FineEstimateRequest(BaseModel):
    violation_code: str
    country_code: str
    state_code: Optional[str] = None
    circumstances: Optional[str] = None  # aggravating/mitigating factors


class FineEstimateResponse(BaseModel):
    violation_code: str
    violation_name: str
    estimated_fine_min: float
    estimated_fine_max: float
    most_likely_fine: float
    currency: str
    license_points: int
    legal_section: Optional[str]
    notes: str


# ─────────────────────────────────────────────
# Chat / AI Assistant Schemas
# ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_token: Optional[str] = None
    country_code: Optional[str] = None
    state_code: Optional[str] = None
    language: str = "en"


class ChatMessageOut(BaseModel):
    role: str
    content: str
    sources: Optional[List[dict]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    session_token: str
    message: ChatMessageOut
    suggested_questions: Optional[List[str]] = None


# ─────────────────────────────────────────────
# Document / OCR Schemas
# ─────────────────────────────────────────────

class DocumentUploadResponse(BaseModel):
    document_id: int
    filename: str
    status: DocumentStatus
    message: str


class DocumentProcessResult(BaseModel):
    id: int
    status: DocumentStatus
    raw_text: Optional[str]
    detected_language: Optional[str]
    extracted_data: Optional[dict]
    ocr_confidence: Optional[float]
    processing_time_ms: Optional[int]
    error_message: Optional[str]

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Geo / Location Schemas
# ─────────────────────────────────────────────

class LocationRequest(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    radius_km: float = Field(default=5.0, ge=0.1, le=50.0)


class EnforcementZoneOut(BaseModel):
    id: int
    name: str
    zone_type: str
    description: Optional[str]
    lat: float
    lng: float
    radius_meters: int
    speed_limit_kmh: Optional[int]
    enforcement_level: str
    is_verified: bool
    distance_km: Optional[float] = None

    model_config = {"from_attributes": True}


class ZoneReportRequest(BaseModel):
    zone_type: str
    lat: float
    lng: float
    description: Optional[str] = None
    speed_limit_kmh: Optional[int] = None


# ─────────────────────────────────────────────
# Driving Profile / Risk Schemas
# ─────────────────────────────────────────────

class DrivingProfileOut(BaseModel):
    user_id: int
    license_country: Optional[str]
    license_state: Optional[str]
    total_points: int
    points_limit: int
    risk_score: float
    risk_level: str
    compliance_score: float
    total_violations: int
    violations_last_year: int
    total_fines_paid: float
    last_calculated: datetime

    model_config = {"from_attributes": True}


class RiskAssessmentResponse(BaseModel):
    risk_score: float
    risk_level: str
    compliance_score: float
    top_risk_factors: List[str]
    recommendations: List[str]
    estimated_insurance_impact: str


# ─────────────────────────────────────────────
# Translation Schema
# ─────────────────────────────────────────────

class TranslationRequest(BaseModel):
    text: str
    source_language: str = "auto"
    target_language: str


class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str


# ─────────────────────────────────────────────
# Lawyer Directory Schemas
# ─────────────────────────────────────────────

class LawyerSearch(BaseModel):
    country_code: Optional[str] = None
    state_code: Optional[str] = None
    language: Optional[str] = None
    page: int = 1
    page_size: int = 10


class LawyerOut(BaseModel):
    id: int
    name: str
    specialization: str
    specializations: Optional[List[str]] = None  # alias for frontend compat
    rating: float
    review_count: int
    is_verified: bool
    consultation_fee: Optional[float]
    languages: Optional[List[str]]
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    country_code: Optional[str] = None
    state_code: Optional[str] = None

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# RoadWatch & RoadSOS Schemas
# ─────────────────────────────────────────────

class RoadProjectOut(BaseModel):
    id: int
    name: str
    road_type: str
    contractor_name: str
    last_repair_date: Optional[datetime]
    next_planned_repair: Optional[datetime]
    budget_sanctioned: float
    budget_spent: float
    status: str
    authority_email: Optional[str]
    lat: float
    lng: float

    model_config = {"from_attributes": True}


class EmergencyFacilityOut(BaseModel):
    id: int
    name: str
    facility_type: str
    phone: str
    address: Optional[str]
    lat: float
    lng: float
    is_open_24h: bool
    rating: float

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Generic Response Wrappers
# ─────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageResponse(BaseModel):
    message: str
    success: bool = True
