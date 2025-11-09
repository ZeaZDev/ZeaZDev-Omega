/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Smart-Contracts-WorldID
 * @File: IWorldIDVerifier.sol
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Interface for World ID ZKP verification integration
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

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
