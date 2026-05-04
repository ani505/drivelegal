import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import engine, Base, AsyncSessionLocal
from app.models import Country, State, ViolationCategory, ViolationType, ViolationSeverity, EnforcementZone, Lawyer, RoadProject, EmergencyFacility
from app.models.gamification import Badge, BadgeTier, InsurancePartner
from app.services.gamification_service import gamification_service

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Countries
        res = await db.execute(select(Country).where(Country.code == "IN"))
        india = res.scalar_one_or_none()
        if not india:
            india = Country(code="IN", name="India", currency="INR")
            db.add(india)
            await db.flush()

        res = await db.execute(select(Country).where(Country.code == "US"))
        usa = res.scalar_one_or_none()
        if not usa:
            usa = Country(code="US", name="United States", currency="USD")
            db.add(usa)
            await db.flush()

        # 2. Violation Categories
        res = await db.execute(select(ViolationCategory).where(ViolationCategory.name == "Speeding"))
        speeding = res.scalar_one_or_none()
        if not speeding:
            speeding = ViolationCategory(name="Speeding", description="Exceeding the set speed limit")
            db.add(speeding)
            await db.flush()

        # 3. Violation Types
        res = await db.execute(select(ViolationType).where(ViolationType.code == "S01"))
        if not res.scalar_one_or_none():
            db.add(ViolationType(
                category_id=speeding.id, code="S01", name="Over Speeding (Urban)", 
                severity=ViolationSeverity.MEDIUM, fine_base=1000.0, fine_min=1000.0, fine_max=5000.0,
                legal_section="MV Act Sec 183", country_id=india.id
            ))

        # 4. Enforcement Zones
        res = await db.execute(select(EnforcementZone).where(EnforcementZone.name == "Connaught Place Speed Zone"))
        if not res.scalar_one_or_none():
            db.add_all([
                EnforcementZone(name="Connaught Place Speed Zone", zone_type="speed_limit", lat=28.6315, lng=77.2167, radius_meters=500, speed_limit_kmh=30, is_verified=True),
                EnforcementZone(name="IGI Airport No-Honking Zone", zone_type="no_honking", lat=28.5562, lng=77.0999, radius_meters=800, is_verified=True),
            ])

        # 5. Lawyers
        res = await db.execute(select(Lawyer).where(Lawyer.email == "priya@legalaid.in"))
        if not res.scalar_one_or_none():
            db.add_all([
                Lawyer(name="Adv. Priya Sharma", email="priya@legalaid.in", phone="+91 98100 12345", specialization="Overspeeding", rating=4.8, review_count=124, country_id=india.id, languages=["English", "Hindi"]),
                Lawyer(name="Adv. Rajan Mehta", email="rajan@mehtalaw.com", phone="+91 97600 54321", specialization="Traffic Appeals", rating=4.5, review_count=89, country_id=india.id, languages=["English", "Gujarati", "Hindi"]),
            ])

        # 6. Road Projects (RoadWatch)
        res = await db.execute(select(RoadProject).where(RoadProject.name == "Outer Ring Road Maintenance"))
        if not res.scalar_one_or_none():
            db.add_all([
                RoadProject(
                    name="Outer Ring Road Maintenance", road_type="NH", contractor_name="L&T Infrastructure",
                    budget_sanctioned=50000000.0, budget_spent=42000000.0, status="active",
                    authority_email="ee.nh@gov.in", lat=28.6139, lng=77.2090
                ),
                RoadProject(
                    name="MG Road Relaying", road_type="SH", contractor_name="GMR Group",
                    budget_sanctioned=25000000.0, budget_spent=25000000.0, status="completed",
                    authority_email="ee.pwd@gov.in", lat=28.4595, lng=77.0266
                )
            ])

        # 7. Emergency Facilities (RoadSOS)
        res = await db.execute(select(EmergencyFacility).where(EmergencyFacility.name == "AIIMS Trauma Centre"))
        if not res.scalar_one_or_none():
            db.add_all([
                EmergencyFacility(name="AIIMS Trauma Centre", facility_type="hospital", phone="011-26588500", address="Ansari Nagar, New Delhi", lat=28.5672, lng=77.2100, rating=4.8),
                EmergencyFacility(name="Safdarjung Hospital", facility_type="hospital", phone="011-26730000", address="Safdarjung, New Delhi", lat=28.5665, lng=77.2078, rating=4.2),
                EmergencyFacility(name="Delhi Police Headquarters", facility_type="police", phone="100", address="Jai Singh Road, New Delhi", lat=28.6291, lng=77.2148, rating=4.5),
            ])

        # 6. Badges & Partners (using service - service handles duplicates usually)
        print("Seeding badges and insurance partners...")
        try:
            await gamification_service.seed_badges(db)
            await gamification_service.seed_insurance_partners(db)
        except Exception as e:
            print(f"Service seeding note: {e}")
        
        await db.commit()
        print("✅ Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
