"""
DriveLegal — Blockchain Service
Web3.py integration with Polygon/Ethereum for immutable violation records.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Optional web3 import (graceful degradation if not installed) ─────────────

try:
    from web3 import Web3
    from web3.middleware import geth_poa_middleware
    WEB3_AVAILABLE = True
except ImportError:
    WEB3_AVAILABLE = False
    logger.warning("web3 not installed — blockchain features will use mock mode")


# ─── ABI (minimal — generated from ViolationRegistry.sol) ────────────────────

VIOLATION_REGISTRY_ABI = [
    {
        "inputs": [
            {"internalType": "string",  "name": "driverDID",      "type": "string"},
            {"internalType": "string",  "name": "violationCode",  "type": "string"},
            {"internalType": "string",  "name": "countryCode",    "type": "string"},
            {"internalType": "bytes32", "name": "dataHash",       "type": "bytes32"},
            {"internalType": "uint256", "name": "fineAmountWei",  "type": "uint256"},
        ],
        "name": "recordViolation",
        "outputs": [{"internalType": "bytes32", "name": "recordId", "type": "bytes32"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "recordId", "type": "bytes32"}],
        "name": "getRecord",
        "outputs": [
            {
                "components": [
                    {"internalType": "bytes32", "name": "recordId",      "type": "bytes32"},
                    {"internalType": "string",  "name": "driverDID",     "type": "string"},
                    {"internalType": "string",  "name": "violationCode", "type": "string"},
                    {"internalType": "string",  "name": "countryCode",   "type": "string"},
                    {"internalType": "bytes32", "name": "dataHash",      "type": "bytes32"},
                    {"internalType": "uint256", "name": "fineAmountWei", "type": "uint256"},
                    {"internalType": "bool",    "name": "isPaid",        "type": "bool"},
                    {"internalType": "bool",    "name": "isAppealed",    "type": "bool"},
                    {"internalType": "uint256", "name": "createdAt",     "type": "uint256"},
                    {"internalType": "uint256", "name": "updatedAt",     "type": "uint256"},
                ],
                "internalType": "struct ViolationRegistry.ViolationRecord",
                "name": "",
                "type": "tuple",
            }
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "string", "name": "driverDID", "type": "string"}],
        "name": "getDriverHistory",
        "outputs": [{"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "recordId",     "type": "bytes32"},
            {"internalType": "bytes32", "name": "expectedHash", "type": "bytes32"},
        ],
        "name": "verifyDataIntegrity",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
]


# ─── BlockchainService ────────────────────────────────────────────────────────

class BlockchainService:
    """Manages all interactions with the ViolationRegistry smart contract."""

    def __init__(self):
        self.w3: Optional[object] = None
        self.contract: Optional[object] = None
        self.mock_mode = not WEB3_AVAILABLE or not settings.ENABLE_BLOCKCHAIN
        self._mock_store: dict[str, dict] = {}

        if not self.mock_mode:
            self._init_web3()

    # ─── Init ──────────────────────────────────────────────────────────────

    def _init_web3(self):
        try:
            self.w3 = Web3(Web3.HTTPProvider(settings.ETHEREUM_RPC_URL))
            # Polygon / PoA chains need this middleware
            self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)

            if not self.w3.is_connected():
                logger.error("Cannot connect to blockchain node — switching to mock mode")
                self.mock_mode = True
                return

            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
                abi=VIOLATION_REGISTRY_ABI,
            )
            logger.info(
                "Blockchain connected: %s  Contract: %s",
                settings.ETHEREUM_RPC_URL,
                settings.CONTRACT_ADDRESS,
            )
        except Exception as exc:
            logger.error("Blockchain init failed: %s — mock mode active", exc)
            self.mock_mode = True

    # ─── Helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def compute_data_hash(violation_data: dict) -> str:
        """Return a deterministic keccak-256 hex hash of the violation JSON."""
        canonical = json.dumps(violation_data, sort_keys=True, default=str)
        return "0x" + hashlib.sha3_256(canonical.encode()).hexdigest()

    @staticmethod
    def build_driver_did(user_id: int, country_code: str) -> str:
        return f"did:drivelegal:{country_code.lower()}:{user_id}"

    # ─── Core Operations ───────────────────────────────────────────────────

    async def record_violation(
        self,
        driver_did: str,
        violation_code: str,
        country_code: str,
        violation_data: dict,
        fine_amount_usd: float = 0.0,
    ) -> dict:
        """Record a violation on-chain (or mock) and return the record info."""
        data_hash = self.compute_data_hash(violation_data)
        fine_wei = int(fine_amount_usd * 1e18 // 2000)  # rough USD→ETH; replace w/ oracle

        if self.mock_mode:
            return self._mock_record(driver_did, violation_code, country_code, data_hash)

        try:
            account = self.w3.eth.account.from_key(settings.WALLET_PRIVATE_KEY)
            nonce = self.w3.eth.get_transaction_count(account.address)

            tx = self.contract.functions.recordViolation(
                driver_did,
                violation_code,
                country_code,
                bytes.fromhex(data_hash[2:]),
                fine_wei,
            ).build_transaction(
                {
                    "from":     account.address,
                    "nonce":    nonce,
                    "gas":      300_000,
                    "gasPrice": self.w3.eth.gas_price,
                }
            )

            signed = account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

            record_id = "0x" + receipt.logs[0]["data"].hex()[:64] if receipt.logs else "0x0"

            return {
                "record_id":    record_id,
                "tx_hash":      tx_hash.hex(),
                "data_hash":    data_hash,
                "block_number": receipt.blockNumber,
                "status":       "confirmed" if receipt.status == 1 else "failed",
                "mock":         False,
            }
        except Exception as exc:
            logger.error("on-chain record_violation failed: %s", exc)
            raise

    async def verify_record(self, record_id: str) -> dict:
        """Fetch and return a violation record from the chain."""
        if self.mock_mode:
            rec = self._mock_store.get(record_id)
            if not rec:
                return {"verified": False, "error": "Record not found (mock mode)"}
            return {"verified": True, "record": rec, "mock": True}

        try:
            raw = self.contract.functions.getRecord(
                bytes.fromhex(record_id.replace("0x", ""))
            ).call()
            return {
                "verified": True,
                "record": {
                    "record_id":      record_id,
                    "driver_did":     raw[1],
                    "violation_code": raw[2],
                    "country_code":   raw[3],
                    "data_hash":      raw[4].hex(),
                    "fine_amount_wei":raw[5],
                    "is_paid":        raw[6],
                    "is_appealed":    raw[7],
                    "created_at":     datetime.utcfromtimestamp(raw[8]).isoformat(),
                    "updated_at":     datetime.utcfromtimestamp(raw[9]).isoformat(),
                },
                "mock": False,
            }
        except Exception as exc:
            logger.error("verify_record failed: %s", exc)
            return {"verified": False, "error": str(exc)}

    async def get_driver_history(self, driver_did: str) -> dict:
        """Return all on-chain record IDs for a driver DID."""
        if self.mock_mode:
            ids = [
                v["record_id"]
                for v in self._mock_store.values()
                if v.get("driver_did") == driver_did
            ]
            return {"driver_did": driver_did, "record_ids": ids, "mock": True}

        try:
            raw_ids = self.contract.functions.getDriverHistory(driver_did).call()
            return {
                "driver_did": driver_did,
                "record_ids": ["0x" + r.hex() for r in raw_ids],
                "mock": False,
            }
        except Exception as exc:
            logger.error("get_driver_history failed: %s", exc)
            raise

    async def verify_integrity(self, record_id: str, violation_data: dict) -> dict:
        """Recompute the data hash and check it matches what's on-chain."""
        expected_hash = self.compute_data_hash(violation_data)

        if self.mock_mode:
            rec = self._mock_store.get(record_id, {})
            on_chain = rec.get("data_hash", "")
            return {
                "matches":        on_chain == expected_hash,
                "expected_hash":  expected_hash,
                "on_chain_hash":  on_chain,
                "mock":           True,
            }

        try:
            matches = self.contract.functions.verifyDataIntegrity(
                bytes.fromhex(record_id.replace("0x", "")),
                bytes.fromhex(expected_hash.replace("0x", "")),
            ).call()
            return {
                "matches":       matches,
                "expected_hash": expected_hash,
                "mock":          False,
            }
        except Exception as exc:
            logger.error("verify_integrity failed: %s", exc)
            raise

    # ─── Mock Helpers ──────────────────────────────────────────────────────

    def _mock_record(
        self,
        driver_did: str,
        violation_code: str,
        country_code: str,
        data_hash: str,
    ) -> dict:
        import uuid
        record_id = "0x" + uuid.uuid4().hex
        self._mock_store[record_id] = {
            "record_id":      record_id,
            "driver_did":     driver_did,
            "violation_code": violation_code,
            "country_code":   country_code,
            "data_hash":      data_hash,
            "is_paid":        False,
            "is_appealed":    False,
            "created_at":     datetime.utcnow().isoformat(),
        }
        return {
            "record_id": record_id,
            "tx_hash":   "0x" + "0" * 64,
            "data_hash": data_hash,
            "block_number": 0,
            "status":    "confirmed (mock)",
            "mock":      True,
        }


# ─── Singleton ────────────────────────────────────────────────────────────────
blockchain_service = BlockchainService()
