"""
Appeal Routes — /api/v1/appeal
AI-powered appeal guidance for traffic violations.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services import ai_service

router = APIRouter(prefix="/appeal", tags=["Appeal Guidance"])


class AppealRequest(BaseModel):
    violation_type: str
    country_code: str
    state_code: Optional[str] = None
    circumstances: Optional[str] = None


class AppealResponse(BaseModel):
    violation_type: str
    country_code: str
    guidance: str


@router.post("/guidance", response_model=AppealResponse)
async def get_appeal_guidance(payload: AppealRequest):
    """
    Get step-by-step AI-generated guidance for contesting a traffic violation.
    
    Covers:
    - Eligibility and deadlines
    - Required documents
    - Filing authority
    - Legal arguments to make
    - Expected timeline and costs
    """
    guidance = await ai_service.generate_appeal_guidance(
        violation_type=payload.violation_type,
        country_code=payload.country_code,
        state_code=payload.state_code,
        circumstances=payload.circumstances,
    )
    return AppealResponse(
        violation_type=payload.violation_type,
        country_code=payload.country_code,
        guidance=guidance,
    )
