// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PaymentEscrow
 * @notice Holds fine payments in escrow until confirmed by the traffic authority.
 *         Auto-releases to authority wallet on confirmation; refunds on rejection.
 */
contract PaymentEscrow is Ownable, ReentrancyGuard {
    enum EscrowState { Pending, Released, Refunded, Disputed }

    struct Escrow {
        bytes32     violationRecordId;
        address     payer;
        address     authority;
        uint256     amount;
        EscrowState state;
        uint256     deadline;   // Unix timestamp — auto-release after this
        uint256     createdAt;
    }

    mapping(bytes32 => Escrow) public escrows;
    uint256 public escrowCount;

    event EscrowCreated(bytes32 indexed escrowId, bytes32 violationRecordId, uint256 amount);
    event EscrowReleased(bytes32 indexed escrowId, address authority);
    event EscrowRefunded(bytes32 indexed escrowId, address payer);
    event EscrowDisputed(bytes32 indexed escrowId);

    constructor() Ownable(msg.sender) {}

    function createEscrow(
        bytes32 violationRecordId,
        address authority,
        uint256 deadlineDays
    ) external payable returns (bytes32 escrowId) {
        require(msg.value > 0, "PE: no value sent");

        escrowId = keccak256(
            abi.encodePacked(violationRecordId, msg.sender, block.timestamp)
        );

        escrows[escrowId] = Escrow({
            violationRecordId: violationRecordId,
            payer:             msg.sender,
            authority:         authority,
            amount:            msg.value,
            state:             EscrowState.Pending,
            deadline:          block.timestamp + (deadlineDays * 1 days),
            createdAt:         block.timestamp
        });

        escrowCount++;
        emit EscrowCreated(escrowId, violationRecordId, msg.value);
    }

    function releaseToAuthority(bytes32 escrowId) external onlyOwner nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Pending, "PE: not pending");

        e.state = EscrowState.Released;
        payable(e.authority).transfer(e.amount);
        emit EscrowReleased(escrowId, e.authority);
    }

    function refundPayer(bytes32 escrowId) external onlyOwner nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Pending, "PE: not pending");

        e.state = EscrowState.Refunded;
        payable(e.payer).transfer(e.amount);
        emit EscrowRefunded(escrowId, e.payer);
    }

    function autoReleaseExpired(bytes32 escrowId) external nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Pending, "PE: not pending");
        require(block.timestamp > e.deadline, "PE: deadline not passed");

        e.state = EscrowState.Released;
        payable(e.authority).transfer(e.amount);
        emit EscrowReleased(escrowId, e.authority);
    }

    function disputeEscrow(bytes32 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(msg.sender == e.payer, "PE: not payer");
        require(e.state == EscrowState.Pending, "PE: not pending");
        e.state = EscrowState.Disputed;
        emit EscrowDisputed(escrowId);
    }
}
