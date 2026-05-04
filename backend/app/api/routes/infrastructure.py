from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core import get_db
from app.models import RoadProject
from app.schemas import RoadProjectOut

router = APIRouter(prefix="/infrastructure", tags=["RoadWatch - Infrastructure"])

@router.get("/projects", response_model=List[RoadProjectOut])
async def list_road_projects(
    road_type: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List road projects and repair history."""
    query = select(RoadProject)
    if road_type:
        query = query.where(RoadProject.road_type == road_type)
    
    result = await db.execute(query)
    return result.scalars().all()
