"""
DriveLegal — Backend Tests
Run: pytest tests/ -v
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# ─── Health ─────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


@pytest.mark.anyio
async def test_root(client):
    resp = await client.get("/")
    assert resp.status_code == 200
    assert resp.json()["name"] == "DriveLegal API"


# ─── Violations ─────────────────────────────────────────────────

@pytest.mark.anyio
async def test_list_violations_empty(client):
    resp = await client.get("/api/v1/violations/")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.anyio
async def test_list_violations_with_country(client):
    resp = await client.get("/api/v1/violations/?country_code=IN")
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_violation_not_found(client):
    resp = await client.get("/api/v1/violations/99999")
    assert resp.status_code == 404


# ─── Chat ────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_chat_creates_session(client):
    resp = await client.post("/api/v1/chat/", json={
        "message": "What is the fine for speeding in India?",
        "country_code": "IN",
        "language": "en",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "session_token" in data
    assert "message" in data
    assert data["message"]["role"] == "assistant"


@pytest.mark.anyio
async def test_chat_continues_session(client):
    # First message
    resp1 = await client.post("/api/v1/chat/", json={
        "message": "Hello",
        "country_code": "IN",
    })
    token = resp1.json()["session_token"]

    # Continue with session token
    resp2 = await client.post("/api/v1/chat/", json={
        "message": "What about helmet fines?",
        "session_token": token,
        "country_code": "IN",
    })
    assert resp2.status_code == 200
    assert resp2.json()["session_token"] == token


# ─── Geo ─────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_detect_location(client):
    resp = await client.get("/api/v1/geo/detect")
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_nearby_zones_empty(client):
    resp = await client.post("/api/v1/geo/zones/nearby", json={
        "lat": 12.9716,
        "lng": 77.5946,
        "radius_km": 5.0,
    })
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.anyio
async def test_list_countries(client):
    resp = await client.get("/api/v1/geo/countries")
    assert resp.status_code == 200


# ─── Translate ────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_list_languages(client):
    resp = await client.get("/api/v1/translate/languages")
    assert resp.status_code == 200
    data = resp.json()
    assert "languages" in data
    assert "en" in data["languages"]
    assert "hi" in data["languages"]


@pytest.mark.anyio
async def test_translate_unsupported_lang(client):
    resp = await client.post("/api/v1/translate/", json={
        "text": "Hello",
        "target_language": "xx-invalid",
    })
    assert resp.status_code == 400


# ─── Document Upload ─────────────────────────────────────────────

@pytest.mark.anyio
async def test_upload_invalid_type(client):
    resp = await client.post(
        "/api/v1/documents/upload",
        files={"file": ("test.txt", b"hello world", "text/plain")},
    )
    assert resp.status_code == 415


@pytest.mark.anyio
async def test_document_not_found(client):
    resp = await client.get("/api/v1/documents/99999")
    assert resp.status_code == 404


# ─── Auth ────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_register_and_login(client):
    # Register
    reg_resp = await client.post("/api/v1/auth/register", json={
        "email": "test@drivelegal.com",
        "password": "testpass123",
        "full_name": "Test User",
        "country_code": "IN",
    })
    assert reg_resp.status_code in (201, 409)  # 409 if already exists

    # Login
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "test@drivelegal.com",
        "password": "testpass123",
    })
    if login_resp.status_code == 200:
        assert "access_token" in login_resp.json()


@pytest.mark.anyio
async def test_login_wrong_password(client):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "test@drivelegal.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401
