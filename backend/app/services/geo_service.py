"""
DriveLegal — Geo / Location Service
"""
import httpx
from typing import Optional
from geopy.distance import geodesic
from app.core.config import settings


class GeoService:
    """Handles geolocation, reverse geocoding, and proximity queries."""

    async def get_location_from_ip(self, ip: str) -> dict:
        """Detect user country/state from IP address using ipinfo.io."""
        try:
            url = f"https://ipinfo.io/{ip}/json"
            params = {}
            if settings.IPINFO_TOKEN:
                params["token"] = settings.IPINFO_TOKEN

            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url, params=params)
                data = resp.json()

            return {
                "ip": ip,
                "country_code": data.get("country", "").upper(),
                "region": data.get("region"),
                "city": data.get("city"),
                "lat": None,
                "lng": None,
                "success": True,
            }
        except Exception as e:
            return {"success": False, "error": str(e), "country_code": None}

    async def reverse_geocode(self, lat: float, lng: float) -> dict:
        """
        Convert lat/lng to country + state using Google Maps Geocoding API.
        Falls back to a basic lookup if no API key.
        """
        if not settings.GOOGLE_MAPS_API_KEY:
            return {"country_code": None, "state_code": None, "city": None}

        try:
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                "latlng": f"{lat},{lng}",
                "key": settings.GOOGLE_MAPS_API_KEY,
            }
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url, params=params)
                data = resp.json()

            country_code = None
            state_code = None
            city = None

            if data.get("results"):
                for component in data["results"][0].get("address_components", []):
                    types = component.get("types", [])
                    if "country" in types:
                        country_code = component.get("short_name")
                    elif "administrative_area_level_1" in types:
                        state_code = component.get("short_name")
                    elif "locality" in types:
                        city = component.get("long_name")

            return {
                "country_code": country_code,
                "state_code": state_code,
                "city": city,
                "success": True,
            }
        except Exception as e:
            return {"success": False, "error": str(e), "country_code": None}

    def calculate_distance_km(
        self, lat1: float, lng1: float, lat2: float, lng2: float
    ) -> float:
        """Calculate distance in km between two coordinates."""
        return geodesic((lat1, lng1), (lat2, lng2)).kilometers

    def filter_zones_by_proximity(
        self,
        zones: list,
        user_lat: float,
        user_lng: float,
        radius_km: float,
    ) -> list:
        """
        Filter enforcement zones within radius and attach distance.
        Expects zone objects with .lat and .lng attributes.
        """
        results = []
        for zone in zones:
            dist = self.calculate_distance_km(user_lat, user_lng, zone.lat, zone.lng)
            if dist <= radius_km:
                zone_dict = {
                    "id": zone.id,
                    "name": zone.name,
                    "zone_type": zone.zone_type,
                    "description": zone.description,
                    "lat": zone.lat,
                    "lng": zone.lng,
                    "radius_meters": zone.radius_meters,
                    "speed_limit_kmh": zone.speed_limit_kmh,
                    "enforcement_level": zone.enforcement_level,
                    "is_verified": zone.is_verified,
                    "distance_km": round(dist, 3),
                }
                results.append(zone_dict)
        results.sort(key=lambda x: x["distance_km"])
        return results


geo_service = GeoService()
