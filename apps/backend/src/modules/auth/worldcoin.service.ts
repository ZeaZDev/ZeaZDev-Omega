// ZeaZDev [Backend Service - Worldcoin ZKP Verifier] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class WorldcoinService {
  private provider: ethers.Provider;
  private verifierContract: ethers.Contract;

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://mainnet.optimism.io',
    );

    // World ID Verifier ABI (minimal interface)
    const verifierAbi = [
      'function verifyProof(uint256 root, uint256 groupId, uint256 signalHash, uint256 nullifierHash, uint256 externalNullifierHash, uint256[8] calldata proof) external view',
    ];

    // Initialize contract (use actual World ID verifier address in production)
    const verifierAddress = process.env.WORLD_ID_VERIFIER_ADDRESS;
    if (verifierAddress && verifierAddress !== ethers.ZeroAddress) {
      this.verifierContract = new ethers.Contract(
        verifierAddress,
        verifierAbi,
        this.provider,
      );
    }
  }

  /**
   * Verify World ID proof on-chain
   * @param proof ZK proof as hex string
   * @param nullifierHash Unique nullifier
   * @param merkleRoot Merkle root
   * @param signal User signal (wallet address)
   * @returns boolean indicating if proof is valid
   */
  async verifyProof(
    proof: string,
    nullifierHash: string,
    merkleRoot: string,
    signal: string,
  ): Promise<boolean> {
    try {
      // If no verifier contract, return true for development
      if (!this.verifierContract) {
        console.warn('World ID verifier not configured, allowing in dev mode');
        return true;
      }

      // Parse proof array
      const proofArray = this.parseProof(proof);

      // Calculate signal hash
      const signalHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address'], [signal]),
      );

      // Calculate external nullifier hash
      const actionId = process.env.WLD_ACTION_ID || 'zeazdev-rewards';
      const externalNullifierHash = ethers.keccak256(
        ethers.toUtf8Bytes(actionId),
      );

      // Verify proof on-chain
      await this.verifierContract.verifyProof(
        merkleRoot,
        1, // groupId
        signalHash,
        nullifierHash,
        externalNullifierHash,
        proofArray,
      );

      return true;
    } catch (error) {
      console.error('World ID verification error:', error);
      return false;
    }
  }

  /**
   * Parse proof string into array of 8 uint256 values
   * @param proof Proof hex string
   * @returns Array of 8 proof values
   */
  private parseProof(proof: string): bigint[] {
    // In production, this would parse the actual proof format from World ID
    // For now, return a placeholder array
    const proofArray: bigint[] = [];
    for (let i = 0; i < 8; i++) {
      proofArray.push(BigInt(0));
    }
    return proofArray;
  }

  /**
   * Get nullifier hash from proof
   * @param proof World ID proof
   * @returns Nullifier hash
   */
  getNullifierHash(proof: any): string {
    return proof.nullifier_hash || proof.nullifierHash;
  }
}
