"""
Geo Routes — /api/v1/geo
Enforcement zones, location detection, and map data.
"""
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core import get_db
from app.models import EnforcementZone, State, Country
from app.schemas import LocationRequest, EnforcementZoneOut, ZoneReportRequest, MessageResponse
from app.services import geo_service

router = APIRouter(prefix="/geo", tags=["Geo & Enforcement Zones"])


@router.post("/zones/nearby", response_model=list[EnforcementZoneOut])
async def get_nearby_zones(
    payload: LocationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Get enforcement zones (speed traps, checkpoints, school zones)
    within a radius of the given coordinates.
    """
    result = await db.execute(select(EnforcementZone))
    all_zones = result.scalars().all()

    nearby = geo_service.filter_zones_by_proximity(
        all_zones,
        payload.lat,
        payload.lng,
        payload.radius_km,
    )
    return nearby


@router.get("/detect")
async def detect_location(request: Request):
    """
    Detect user's country and region from their IP address.
    Returns jurisdiction info for pre-filling legal queries.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    if client_ip in ("127.0.0.1", "::1", "testclient"):
        return {
            "ip": client_ip,
            "country_code": "IN",
            "region": "Karnataka",
            "city": "Bangalore",
            "note": "Localhost detected — defaulting to IN",
        }
    result = await geo_service.get_location_from_ip(client_ip)
    return result


@router.post("/reverse-geocode")
async def reverse_geocode(lat: float = Query(...), lng: float = Query(...)):
    """Convert coordinates to country and state codes."""
    return await geo_service.reverse_geocode(lat, lng)


@router.post("/zones/report", response_model=MessageResponse, status_code=201)
async def report_enforcement_zone(
    payload: ZoneReportRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Community report: Submit a new enforcement zone (speed trap, checkpoint).
    Requires 3+ reports to become verified.
    """
    # Check if zone already exists nearby
    result = await db.execute(select(EnforcementZone))
    existing = result.scalars().all()
    nearby = geo_service.filter_zones_by_proximity(
        existing, payload.lat, payload.lng, radius_km=0.2
    )
    nearby_same_type = [z for z in nearby if z["zone_type"] == payload.zone_type]

    if nearby_same_type:
        # Increment report count on closest existing zone
        closest_id = nearby_same_type[0]["id"]
        zone_result = await db.execute(
            select(EnforcementZone).where(EnforcementZone.id == closest_id)
        )
        zone = zone_result.scalar_one_or_none()
        if zone:
            zone.report_count += 1
            if zone.report_count >= 3:
                zone.is_verified = True
            return MessageResponse(message="Report added to existing zone. Thank you!")

    # Create new zone
    zone = EnforcementZone(
        zone_type=payload.zone_type,
        name=f"Community Reported {payload.zone_type.replace('_', ' ').title()}",
        lat=payload.lat,
        lng=payload.lng,
        description=payload.description,
        speed_limit_kmh=payload.speed_limit_kmh,
        report_count=1,
        is_verified=False,
    )
    db.add(zone)
    return MessageResponse(message="New enforcement zone reported. Thank you for keeping roads safe!")


@router.get("/countries")
async def list_countries(db: AsyncSession = Depends(get_db)):
    """List all supported countries."""
    result = await db.execute(select(Country).order_by(Country.name))
    countries = result.scalars().all()
    return [
        {"code": c.code, "name": c.name, "currency": c.currency, "language_codes": c.language_codes}
        for c in countries
    ]


@router.get("/countries/{country_code}/states")
async def list_states(country_code: str, db: AsyncSession = Depends(get_db)):
    """List states/provinces for a country."""
    country_result = await db.execute(
        select(Country).where(Country.code == country_code.upper())
    )
    country = country_result.scalar_one_or_none()
    if not country:
        return []

    result = await db.execute(
        select(State).where(State.country_id == country.id).order_by(State.name)
    )
    states = result.scalars().all()
    return [{"code": s.code, "name": s.name} for s in states]


# ── /enforcement-zones (frontend-compatible GET alias) ────────────────────────
@router.get("/enforcement-zones")
async def get_enforcement_zones(
    lat: float = Query(None),
    lng: float = Query(None),
    radius_km: float = Query(5.0),
    db: AsyncSession = Depends(get_db),
):
    """
    GET-based enforcement zones lookup (frontend-compatible).
    Falls back to all zones if no lat/lng provided.
    """
    result = await db.execute(select(EnforcementZone))
    all_zones = result.scalars().all()

    if lat is not None and lng is not None:
        return geo_service.filter_zones_by_proximity(all_zones, lat, lng, radius_km)

    return [
        {
            "id": z.id, "name": z.name, "zone_type": z.zone_type,
            "description": z.description, "lat": z.lat, "lng": z.lng,
            "radius_meters": z.radius_meters, "speed_limit_kmh": z.speed_limit_kmh,
            "enforcement_level": z.enforcement_level, "is_verified": z.is_verified,
        }
        for z in all_zones
    ]
