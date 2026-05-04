from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core import get_db
from app.models import EmergencyFacility
from app.schemas import EmergencyFacilityOut

router = APIRouter(prefix="/sos", tags=["RoadSOS - Emergency"])

@router.get("/facilities", response_model=List[EmergencyFacilityOut])
async def list_emergency_facilities(
    facility_type: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List nearby emergency facilities (hospitals, police, etc)."""
    query = select(EmergencyFacility)
    if facility_type:
        query = query.where(EmergencyFacility.facility_type == facility_type)
    
    result = await db.execute(query)
    return result.scalars().all()
