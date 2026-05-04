# RoadWatch API - created for hackathon 2026
# helps citizens track road construction and budgets
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
    # this endpoint returns all road projects from the database
    print(f"DEBUG: Fetching road projects. Filter: {road_type}")
    
    # building the query
    stmt = select(RoadProject)
    
    if road_type is not None:
        stmt = stmt.where(RoadProject.road_type == road_type)
    
    # execute the query and get results
    res = await db.execute(stmt)
    projects_list = res.scalars().all()
    
    print(f"DEBUG: Found {len(projects_list)} projects")
    return projects_list
