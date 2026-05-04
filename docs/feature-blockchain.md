# Feature: Blockchain-Based Violation Records

**Branch:** `feature/blockchain-records`  
**Status:** 🔲 Planned — Phase 2

## Overview
Immutable violation records on a blockchain for tamper-proof cross-border driving history.

## Planned Implementation

### Tech Stack
- Ethereum / Polygon (low gas fees)
- Solidity smart contracts
- Web3.py for Python integration
- IPFS for document storage

### Smart Contracts to Build
- `ViolationRegistry.sol` — Store violation hashes on-chain
- `PaymentEscrow.sol` — Auto-execute fine payment upon confirmation
- `DriverIdentity.sol` — Cross-border identity verification

### Backend Integration
- `app/services/blockchain_service.py` — Web3 interaction layer
- `app/api/routes/blockchain.py` — REST endpoints
- New model: `BlockchainRecord` in `app/models/models.py`

### API Endpoints to Add
```
POST /api/v1/blockchain/record          — Record violation on-chain
GET  /api/v1/blockchain/verify/{hash}  — Verify a violation record
GET  /api/v1/blockchain/history/{did}  — Get driver's on-chain history
POST /api/v1/blockchain/pay            — Execute smart contract payment
```

### Environment Variables to Add
```
ETHEREUM_RPC_URL=https://polygon-rpc.com
WALLET_PRIVATE_KEY=your-wallet-key
CONTRACT_ADDRESS=0x...
```

## Resources
- [Polygon Docs](https://docs.polygon.technology/)
- [Web3.py Docs](https://web3py.readthedocs.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/)
