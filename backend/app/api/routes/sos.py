# Emergency SOS API - helps people find hospitals/police fast
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
    # this will get the emergency facilities like Hospitals or Police
    print(f"DEBUG: Looking for emergency spots. Type: {facility_type}")
    
    # building the query
    sql_query = select(EmergencyFacility)
    
    # filter if user provided a specific type
    if facility_type:
        sql_query = sql_query.where(EmergencyFacility.facility_type == facility_type)
    
    # running the query
    db_result = await db.execute(sql_query)
    all_facilities = db_result.scalars().all()
    
    print(f"DEBUG: Found {len(all_facilities)} facilities nearby")
    return all_facilities
