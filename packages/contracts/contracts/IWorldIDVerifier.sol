// ZeaZDev [Smart Contract - World ID Verifier Interface] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IWorldIDVerifier
 * @dev Interface for World ID ZKP verification
 */
interface IWorldIDVerifier {
    /**
     * @dev Verify a World ID proof
     * @param root Merkle root
     * @param groupId Group identifier
     * @param signalHash Signal hash
     * @param nullifierHash Unique nullifier to prevent double-claims
     * @param externalNullifierHash External nullifier
     * @param proof ZK proof bytes
     */
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}
