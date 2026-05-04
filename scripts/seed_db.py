"""
DriveLegal — Database Seed Script
Seeds: Countries, States, Violation Categories, and Indian Traffic Laws (MV Act 2019)
Run: python scripts/seed_db.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from app.models.models import (
    Base, Country, State, ViolationCategory, ViolationType, ViolationSeverity
)


engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


COUNTRIES = [
    {"code": "IN", "name": "India", "currency": "INR", "language_codes": ["en", "hi", "ta", "te", "mr", "bn"], "has_idp": True},
    {"code": "US", "name": "United States", "currency": "USD", "language_codes": ["en", "es"], "has_idp": True},
    {"code": "GB", "name": "United Kingdom", "currency": "GBP", "language_codes": ["en"], "has_idp": True},
    {"code": "DE", "name": "Germany", "currency": "EUR", "language_codes": ["de", "en"], "has_idp": True},
    {"code": "AU", "name": "Australia", "currency": "AUD", "language_codes": ["en"], "has_idp": True},
]

INDIA_STATES = [
    {"code": "KA", "name": "Karnataka", "capital": "Bengaluru"},
    {"code": "MH", "name": "Maharashtra", "capital": "Mumbai"},
    {"code": "TN", "name": "Tamil Nadu", "capital": "Chennai"},
    {"code": "DL", "name": "Delhi", "capital": "New Delhi"},
    {"code": "GJ", "name": "Gujarat", "capital": "Gandhinagar"},
    {"code": "RJ", "name": "Rajasthan", "capital": "Jaipur"},
    {"code": "UP", "name": "Uttar Pradesh", "capital": "Lucknow"},
    {"code": "WB", "name": "West Bengal", "capital": "Kolkata"},
    {"code": "AP", "name": "Andhra Pradesh", "capital": "Amaravati"},
    {"code": "TS", "name": "Telangana", "capital": "Hyderabad"},
    {"code": "KL", "name": "Kerala", "capital": "Thiruvananthapuram"},
    {"code": "PB", "name": "Punjab", "capital": "Chandigarh"},
    {"code": "HR", "name": "Haryana", "capital": "Chandigarh"},
    {"code": "MP", "name": "Madhya Pradesh", "capital": "Bhopal"},
    {"code": "BR", "name": "Bihar", "capital": "Patna"},
    {"code": "OR", "name": "Odisha", "capital": "Bhubaneswar"},
    {"code": "AS", "name": "Assam", "capital": "Dispur"},
    {"code": "JH", "name": "Jharkhand", "capital": "Ranchi"},
    {"code": "CH", "name": "Chhattisgarh", "capital": "Raipur"},
    {"code": "HP", "name": "Himachal Pradesh", "capital": "Shimla"},
    {"code": "UK", "name": "Uttarakhand", "capital": "Dehradun"},
    {"code": "GA", "name": "Goa", "capital": "Panaji"},
]

CATEGORIES = [
    {"name": "Speed Violations", "description": "Violations related to speed limits", "icon": "speedometer"},
    {"name": "Drunk Driving", "description": "Driving under influence of alcohol or drugs", "icon": "wine"},
    {"name": "Document Violations", "description": "Missing or invalid driving documents", "icon": "document"},
    {"name": "Signal & Sign Violations", "description": "Traffic signal and road sign violations", "icon": "traffic-light"},
    {"name": "Seatbelt & Helmet", "description": "Safety equipment violations", "icon": "shield"},
    {"name": "Mobile Phone", "description": "Using mobile phone while driving", "icon": "phone"},
    {"name": "Overloading", "description": "Vehicle overloading violations", "icon": "truck"},
    {"name": "Lane & Parking", "description": "Lane discipline and parking violations", "icon": "parking"},
    {"name": "Vehicle Condition", "description": "Faulty or non-compliant vehicle", "icon": "car"},
    {"name": "Dangerous Driving", "description": "Reckless or dangerous driving", "icon": "warning"},
]

# Motor Vehicles Act 2019 violations (India)
INDIA_VIOLATIONS = [
    # Speed
    {
        "code": "IN-MV-183", "category": "Speed Violations",
        "name": "Overspeeding (LMV)", "severity": ViolationSeverity.MEDIUM,
        "fine_min": 1000, "fine_max": 2000, "fine_base": 1000,
        "license_points": 2, "legal_section": "Section 183",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Driving a light motor vehicle above the prescribed speed limit.",
        "name_translations": {"hi": "तेज़ गति से वाहन चलाना (हल्के मोटर वाहन)", "ta": "வேகமாக வாகனம் ஓட்டுதல்"},
    },
    {
        "code": "IN-MV-183-HMV", "category": "Speed Violations",
        "name": "Overspeeding (HMV / Transport Vehicle)", "severity": ViolationSeverity.HIGH,
        "fine_min": 2000, "fine_max": 4000, "fine_base": 2000,
        "license_points": 3, "legal_section": "Section 183",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Driving a heavy motor vehicle or transport vehicle above the prescribed speed limit.",
    },
    # Drunk Driving
    {
        "code": "IN-MV-185-1ST", "category": "Drunk Driving",
        "name": "Drunk Driving (First Offence)", "severity": ViolationSeverity.HIGH,
        "fine_min": 10000, "fine_max": 10000, "fine_base": 10000,
        "license_points": 6, "suspension_days": 180,
        "legal_section": "Section 185",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": True, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Driving under the influence of alcohol (BAC > 30mg/100ml) — first offence. Imprisonment up to 6 months or fine of ₹10,000 or both.",
        "name_translations": {"hi": "नशे में गाड़ी चलाना (पहली बार)"},
    },
    {
        "code": "IN-MV-185-2ND", "category": "Drunk Driving",
        "name": "Drunk Driving (Repeat Offence within 3 years)", "severity": ViolationSeverity.CRITICAL,
        "fine_min": 15000, "fine_max": 15000, "fine_base": 15000,
        "license_points": 12, "suspension_days": 365,
        "legal_section": "Section 185",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": True, "is_bailable": False,
        "appeal_window_days": 30,
        "description": "Second drunk driving offence within 3 years. Imprisonment up to 2 years or fine of ₹15,000 or both.",
    },
    # Documents
    {
        "code": "IN-MV-3", "category": "Document Violations",
        "name": "Driving Without Valid License", "severity": ViolationSeverity.HIGH,
        "fine_min": 5000, "fine_max": 10000, "fine_base": 5000,
        "license_points": 0,
        "legal_section": "Section 3/181",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Driving a motor vehicle in a public place without a valid driving licence.",
        "name_translations": {"hi": "बिना वैध लाइसेंस के गाड़ी चलाना", "ta": "செல்லுபடியாகும் உரிமம் இல்லாமல் வாகனம் ஓட்டுதல்"},
    },
    {
        "code": "IN-MV-130", "category": "Document Violations",
        "name": "Driving Without Valid Insurance", "severity": ViolationSeverity.HIGH,
        "fine_min": 2000, "fine_max": 4000, "fine_base": 2000,
        "legal_section": "Section 130/196",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Using a motor vehicle in a public place without a valid third-party insurance policy.",
    },
    {
        "code": "IN-MV-PUC", "category": "Document Violations",
        "name": "No Pollution Under Control (PUC) Certificate", "severity": ViolationSeverity.LOW,
        "fine_min": 10000, "fine_max": 10000, "fine_base": 10000,
        "legal_section": "Section 190(2)",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Driving without a valid Pollution Under Control certificate.",
        "name_translations": {"hi": "प्रदूषण नियंत्रण प्रमाण पत्र नहीं"},
    },
    # Signals
    {
        "code": "IN-MV-119", "category": "Signal & Sign Violations",
        "name": "Jumping Red Light", "severity": ViolationSeverity.HIGH,
        "fine_min": 1000, "fine_max": 5000, "fine_base": 1000,
        "license_points": 2,
        "legal_section": "Section 119/177A",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Disobeying traffic signals by crossing a red light.",
        "name_translations": {"hi": "लाल बत्ती तोड़ना", "ta": "சிவப்பு விளக்கை மீறுதல்"},
    },
    # Seatbelt / Helmet
    {
        "code": "IN-MV-194B", "category": "Seatbelt & Helmet",
        "name": "Not Wearing Seatbelt", "severity": ViolationSeverity.MEDIUM,
        "fine_min": 1000, "fine_max": 1000, "fine_base": 1000,
        "license_points": 1,
        "legal_section": "Section 194B",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Driver or front passenger not wearing a seatbelt while vehicle is in motion.",
        "name_translations": {"hi": "सीटबेल्ट न पहनना", "ta": "சீட்பெல்ட் அணியாமல் இருத்தல்"},
    },
    {
        "code": "IN-MV-129", "category": "Seatbelt & Helmet",
        "name": "Not Wearing Helmet (Two-Wheeler)", "severity": ViolationSeverity.MEDIUM,
        "fine_min": 1000, "fine_max": 1000, "fine_base": 1000,
        "license_points": 1, "suspension_days": 90,
        "legal_section": "Section 129/194D",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Riding a two-wheeler without a protective helmet. 3-month license suspension on repeat.",
        "name_translations": {"hi": "हेलमेट न पहनना", "ta": "தலைக்கவசம் அணியாமல் இருத்தல்"},
    },
    # Mobile Phone
    {
        "code": "IN-MV-184A", "category": "Mobile Phone",
        "name": "Using Mobile Phone While Driving", "severity": ViolationSeverity.HIGH,
        "fine_min": 1000, "fine_max": 5000, "fine_base": 1000,
        "license_points": 3,
        "legal_section": "Section 184",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Using a handheld mobile device while driving — first offence ₹1,000–₹5,000.",
        "name_translations": {"hi": "गाड़ी चलाते समय मोबाइल फोन का उपयोग", "ta": "வாகனம் ஓட்டும்போது மொபைல் பயன்படுத்துதல்"},
    },
    # Dangerous Driving
    {
        "code": "IN-MV-184", "category": "Dangerous Driving",
        "name": "Dangerous Driving", "severity": ViolationSeverity.CRITICAL,
        "fine_min": 1000, "fine_max": 5000, "fine_base": 1000,
        "license_points": 6, "suspension_days": 180,
        "legal_section": "Section 184",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": True, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Driving in a manner dangerous to the public. First offence: imprisonment up to 1 year or fine ₹1,000–₹5,000.",
    },
    # Overloading
    {
        "code": "IN-MV-194", "category": "Overloading",
        "name": "Vehicle Overloading (Passenger)", "severity": ViolationSeverity.MEDIUM,
        "fine_min": 1000, "fine_max": 2000, "fine_base": 1000,
        "legal_section": "Section 194",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Carrying passengers exceeding the vehicle's registered capacity. ₹1,000 per extra passenger.",
    },
    # Lane & Parking
    {
        "code": "IN-MV-122", "category": "Lane & Parking",
        "name": "Wrong-Side Driving", "severity": ViolationSeverity.HIGH,
        "fine_min": 1000, "fine_max": 5000, "fine_base": 1000,
        "license_points": 2,
        "legal_section": "Section 122",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Driving on the wrong side of the road.",
        "name_translations": {"hi": "गलत दिशा में गाड़ी चलाना"},
    },
    # Vehicle Condition
    {
        "code": "IN-MV-190", "category": "Vehicle Condition",
        "name": "Using Vehicle in Unsafe Condition", "severity": ViolationSeverity.MEDIUM,
        "fine_min": 1000, "fine_max": 5000, "fine_base": 1000,
        "legal_section": "Section 190",
        "act_name": "Motor Vehicles Act 1988 (Amended 2019)",
        "is_cognizable": False, "is_bailable": True,
        "appeal_window_days": 30,
        "description": "Using a motor vehicle in a condition that is a source of danger to road users (faulty brakes, lights, etc.).",
    },
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        print("🌱 Seeding countries...")
        country_map = {}
        for c_data in COUNTRIES:
            country = Country(**c_data)
            db.add(country)
            await db.flush()
            country_map[c_data["code"]] = country.id
        print(f"   ✅ {len(COUNTRIES)} countries added")

        print("🌱 Seeding Indian states...")
        for s_data in INDIA_STATES:
            state = State(country_id=country_map["IN"], **s_data)
            db.add(state)
        print(f"   ✅ {len(INDIA_STATES)} states added")

        print("🌱 Seeding violation categories...")
        cat_map = {}
        for cat_data in CATEGORIES:
            cat = ViolationCategory(**cat_data)
            db.add(cat)
            await db.flush()
            cat_map[cat_data["name"]] = cat.id
        print(f"   ✅ {len(CATEGORIES)} categories added")

        print("🌱 Seeding Indian traffic violations (MV Act 2019)...")
        for v_data in INDIA_VIOLATIONS:
            cat_name = v_data.pop("category")
            violation = ViolationType(
                category_id=cat_map.get(cat_name),
                country_id=country_map["IN"],
                currency="INR",
                appeal_authority="Judicial Magistrate / Traffic Court",
                **v_data,
            )
            db.add(violation)
        print(f"   ✅ {len(INDIA_VIOLATIONS)} violations added")

        await db.commit()
        print("\n🎉 Database seeded successfully!")
        print("   Run `uvicorn app.main:app --reload` to start the API")


if __name__ == "__main__":
    asyncio.run(seed())
