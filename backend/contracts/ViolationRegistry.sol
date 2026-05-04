// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ViolationRegistry
 * @notice Immutable on-chain record of traffic violations for DriveLegal.
 *         Each record stores a hash of the full violation data (stored off-chain
 *         in PostgreSQL / IPFS) plus key searchable fields.
 */
contract ViolationRegistry is Ownable, Pausable {
    // ─── Events ───────────────────────────────────────────────────────────────

    event ViolationRecorded(
        bytes32 indexed recordId,
        string  indexed driverDID,
        string  violationCode,
        uint256 timestamp
    );

    event ViolationVerified(bytes32 indexed recordId, address verifier);
    event PaymentExecuted(bytes32 indexed recordId, uint256 amount, address payer);

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct ViolationRecord {
        bytes32  recordId;       // keccak256(driverDID + violationCode + timestamp)
        string   driverDID;      // Decentralised identifier (e.g. did:ethr:0x...)
        string   violationCode;  // e.g. "MV_OVERSPEEDING"
        string   countryCode;    // ISO-3166 alpha-2
        bytes32  dataHash;       // keccak256 of full JSON record stored off-chain
        uint256  fineAmountWei;  // Fine denominated in wei (0 if paid in fiat)
        bool     isPaid;
        bool     isAppealed;
        uint256  createdAt;
        uint256  updatedAt;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    mapping(bytes32 => ViolationRecord) public records;
    mapping(string  => bytes32[])       public driverRecords;  // DID → record IDs
    bytes32[]                           public allRecordIds;

    uint256 public totalRecords;
    uint256 public totalFinesCollected;

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Record a new traffic violation on-chain.
     * @dev Only callable by owner (the DriveLegal backend wallet).
     */
    function recordViolation(
        string  calldata driverDID,
        string  calldata violationCode,
        string  calldata countryCode,
        bytes32          dataHash,
        uint256          fineAmountWei
    ) external onlyOwner whenNotPaused returns (bytes32 recordId) {
        recordId = keccak256(
            abi.encodePacked(driverDID, violationCode, block.timestamp, totalRecords)
        );

        require(records[recordId].createdAt == 0, "VR: duplicate record");

        records[recordId] = ViolationRecord({
            recordId:       recordId,
            driverDID:      driverDID,
            violationCode:  violationCode,
            countryCode:    countryCode,
            dataHash:       dataHash,
            fineAmountWei:  fineAmountWei,
            isPaid:         false,
            isAppealed:     false,
            createdAt:      block.timestamp,
            updatedAt:      block.timestamp
        });

        driverRecords[driverDID].push(recordId);
        allRecordIds.push(recordId);
        totalRecords++;

        emit ViolationRecorded(recordId, driverDID, violationCode, block.timestamp);
        return recordId;
    }

    /**
     * @notice Pay a fine via smart contract (for crypto payments).
     */
    function payFine(bytes32 recordId) external payable whenNotPaused {
        ViolationRecord storage rec = records[recordId];
        require(rec.createdAt != 0, "VR: record not found");
        require(!rec.isPaid, "VR: already paid");
        require(msg.value >= rec.fineAmountWei, "VR: insufficient payment");

        rec.isPaid = true;
        rec.updatedAt = block.timestamp;
        totalFinesCollected += msg.value;

        // Refund overpayment
        if (msg.value > rec.fineAmountWei) {
            payable(msg.sender).transfer(msg.value - rec.fineAmountWei);
        }

        emit PaymentExecuted(recordId, msg.value, msg.sender);
    }

    /**
     * @notice Mark a record as appealed.
     */
    function flagAppeal(bytes32 recordId) external onlyOwner {
        ViolationRecord storage rec = records[recordId];
        require(rec.createdAt != 0, "VR: record not found");
        rec.isAppealed = true;
        rec.updatedAt = block.timestamp;
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getRecord(bytes32 recordId)
        external view returns (ViolationRecord memory)
    {
        return records[recordId];
    }

    function getDriverHistory(string calldata driverDID)
        external view returns (bytes32[] memory)
    {
        return driverRecords[driverDID];
    }

    function verifyDataIntegrity(bytes32 recordId, bytes32 expectedHash)
        external view returns (bool)
    {
        return records[recordId].dataHash == expectedHash;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function withdrawFines(address payable recipient) external onlyOwner {
        recipient.transfer(address(this).balance);
    }
}
