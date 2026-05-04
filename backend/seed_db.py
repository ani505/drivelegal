# This script seeds our database with initial data for the hackathon
# We add countries, violation types, road projects, etc.
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Country, State, ViolationCategory, ViolationType, ViolationSeverity, EnforcementZone, Lawyer, RoadProject, EmergencyFacility
from app.models.gamification import Badge, BadgeTier, InsurancePartner
from app.services.gamification_service import gamification_service

async def seed_data():
    print("Starting database seeding...")
    
    # create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Setup Countries (India and US)
        print("Adding countries...")
        res = await db.execute(select(Country).where(Country.code == "IN"))
        if not res.scalar_one_or_none():
            india = Country(code="IN", name="India", currency="INR")
            db.add(india)
            await db.flush()
        else:
            india = (await db.execute(select(Country).where(Country.code == "IN"))).scalar_one()

        # 2. Setup Violation Categories
        print("Adding categories...")
        res = await db.execute(select(ViolationCategory).where(ViolationCategory.name == "Speeding"))
        if not res.scalar_one_or_none():
            speed_cat = ViolationCategory(name="Speeding", description="Going too fast")
            db.add(speed_cat)
            await db.flush()
        else:
            speed_cat = (await db.execute(select(ViolationCategory).where(ViolationCategory.name == "Speeding"))).scalar_one()

        # 3. Add a sample violation type
        res = await db.execute(select(ViolationType).where(ViolationType.code == "S01"))
        if not res.scalar_one_or_none():
            v_type = ViolationType(
                category_id=speed_cat.id, code="S01", name="Over Speeding", 
                severity=ViolationSeverity.MEDIUM, fine_base=1000.0, fine_min=1000.0, fine_max=5000.0,
                legal_section="MV Act 183", country_id=india.id
            )
            db.add(v_type)

        # 4. Add road zones (Map page)
        print("Adding enforcement zones...")
        res = await db.execute(select(EnforcementZone).where(EnforcementZone.name == "Connaught Place"))
        if not res.scalar_one_or_none():
            db.add(EnforcementZone(name="Connaught Place", zone_type="speed_limit", lat=28.6315, lng=77.2167, radius_meters=500, speed_limit_kmh=30, is_verified=True))

        # 5. Add road projects (RoadWatch)
        print("Adding road projects...")
        res = await db.execute(select(RoadProject).where(RoadProject.name == "Outer Ring Road Maintenance"))
        if not res.scalar_one_or_none():
            db.add(RoadProject(
                name="Outer Ring Road Maintenance", road_type="NH", contractor_name="L&T Construction",
                budget_sanctioned=50000000.0, budget_spent=42000000.0, status="active",
                authority_email="contact@roadauthority.in", lat=28.6139, lng=77.2090
            ))

        # 6. Add hospitals (RoadSOS)
        print("Adding emergency facilities...")
        res = await db.execute(select(EmergencyFacility).where(EmergencyFacility.name == "AIIMS"))
        if not res.scalar_one_or_none():
            db.add(EmergencyFacility(name="AIIMS", facility_type="hospital", phone="011-26588500", address="New Delhi", lat=28.5672, lng=77.2100, rating=4.8))

        # 7. Seed gamification things using service
        print("Seeding badges and partners...")
        try:
            await gamification_service.seed_badges(db)
            await gamification_service.seed_insurance_partners(db)
        except:
            pass
        
        # save everything to database
        await db.commit()
        print("Finished seeding database! everything is ready.")

if __name__ == "__main__":
    asyncio.run(seed_data())
