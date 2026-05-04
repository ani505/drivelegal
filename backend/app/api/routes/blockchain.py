"""
DriveLegal — Blockchain API Routes
Endpoints for recording and verifying violation records on-chain.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from app.services.blockchain_service import blockchain_service, BlockchainService
from app.core.config import settings

router = APIRouter(prefix="/blockchain", tags=["Blockchain"])


# ─── Schemas ─────────────────────────────────────────────────────────────────

class RecordViolationRequest(BaseModel):
    user_id: int
    violation_code: str
    country_code: str
    violation_data: dict
    fine_amount_usd: float = 0.0


class VerifyIntegrityRequest(BaseModel):
    record_id: str
    violation_data: dict


# ─── Dependency ──────────────────────────────────────────────────────────────

def get_blockchain() -> BlockchainService:
    if not settings.ENABLE_BLOCKCHAIN:
        # Still works — service runs in mock mode; return it for demo purposes
        pass
    return blockchain_service


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/record", summary="Record a violation on-chain")
async def record_violation(
    body: RecordViolationRequest,
    svc: BlockchainService = Depends(get_blockchain),
):
    """
    Hash the violation data and write an immutable record to the blockchain.
    Returns the on-chain record ID and transaction hash.
    """
    driver_did = svc.build_driver_did(body.user_id, body.country_code)
    try:
        result = await svc.record_violation(
            driver_did=driver_did,
            violation_code=body.violation_code,
            country_code=body.country_code,
            violation_data=body.violation_data,
            fine_amount_usd=body.fine_amount_usd,
        )
        return {
            "success":    True,
            "driver_did": driver_did,
            **result,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/verify/{record_id}", summary="Verify a violation record")
async def verify_record(
    record_id: str,
    svc: BlockchainService = Depends(get_blockchain),
):
    """Fetch a violation record from the chain and return its fields."""
    result = await svc.verify_record(record_id)
    if not result.get("verified"):
        raise HTTPException(status_code=404, detail=result.get("error", "Record not found"))
    return result


@router.get("/history/{driver_did:path}", summary="Driver on-chain history")
async def get_driver_history(
    driver_did: str,
    svc: BlockchainService = Depends(get_blockchain),
):
    """Return all on-chain violation record IDs for a driver DID."""
    try:
        return await svc.get_driver_history(driver_did)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/verify-integrity", summary="Verify data has not been tampered")
async def verify_integrity(
    body: VerifyIntegrityRequest,
    svc: BlockchainService = Depends(get_blockchain),
):
    """
    Recompute the keccak-256 hash of provided violation_data and compare
    it with the hash stored on-chain. Returns a boolean `matches` field.
    """
    try:
        return await svc.verify_integrity(body.record_id, body.violation_data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/status", summary="Blockchain connection status")
async def blockchain_status(svc: BlockchainService = Depends(get_blockchain)):
    return {
        "enabled":   settings.ENABLE_BLOCKCHAIN,
        "mock_mode": svc.mock_mode,
        "network":   getattr(settings, "ETHEREUM_RPC_URL", "not configured"),
        "contract":  getattr(settings, "CONTRACT_ADDRESS", "not deployed"),
    }
