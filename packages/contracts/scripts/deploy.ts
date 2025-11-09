/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Smart-Contracts-Deployment
 * @File: deploy.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Deployment script for all smart contracts to Optimism L2
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy ZeaToken ($ZEA)
  console.log("\n1. Deploying ZeaToken...");
  const ZeaToken = await ethers.getContractFactory("ZeaToken");
  const zeaToken = await ZeaToken.deploy(deployer.address);
  await zeaToken.waitForDeployment();
  const zeaTokenAddress = await zeaToken.getAddress();
  console.log("ZeaToken deployed to:", zeaTokenAddress);

  // Deploy DingToken ($DING)
  console.log("\n2. Deploying DingToken...");
  const DingToken = await ethers.getContractFactory("DingToken");
  const dingToken = await DingToken.deploy(deployer.address);
  await dingToken.waitForDeployment();
  const dingTokenAddress = await dingToken.getAddress();
  console.log("DingToken deployed to:", dingTokenAddress);

  // Deploy ZeaZRewards (using mock World ID verifier for now)
  console.log("\n3. Deploying ZeaZRewards...");
  const worldIdVerifier = process.env.WORLD_ID_VERIFIER_ADDRESS || ethers.ZeroAddress;
  const ZeaZRewards = await ethers.getContractFactory("ZeaZRewards");
  const zeazRewards = await ZeaZRewards.deploy(
    worldIdVerifier,
    zeaTokenAddress,
    dingTokenAddress,
    deployer.address
  );
  await zeazRewards.waitForDeployment();
  const zeazRewardsAddress = await zeazRewards.getAddress();
  console.log("ZeaZRewards deployed to:", zeazRewardsAddress);

  // Deploy ZeaZStake
  console.log("\n4. Deploying ZeaZStake...");
  const ZeaZStake = await ethers.getContractFactory("ZeaZStake");
  const zeazStake = await ZeaZStake.deploy(zeaTokenAddress, deployer.address);
  await zeazStake.waitForDeployment();
  const zeazStakeAddress = await zeazStake.getAddress();
  console.log("ZeaZStake deployed to:", zeazStakeAddress);

  // Deploy ZeaTreasury
  console.log("\n5. Deploying ZeaTreasury...");
  const ZeaTreasury = await ethers.getContractFactory("ZeaTreasury");
  const zeaTreasury = await ZeaTreasury.deploy(deployer.address);
  await zeaTreasury.waitForDeployment();
  const zeaTreasuryAddress = await zeaTreasury.getAddress();
  console.log("ZeaTreasury deployed to:", zeaTreasuryAddress);

  // Deploy ZeaGovernance
  console.log("\n6. Deploying ZeaGovernance...");
  const ZeaGovernance = await ethers.getContractFactory("ZeaGovernance");
  const zeaGovernance = await ZeaGovernance.deploy(
    zeaTokenAddress,
    deployer.address
  );
  await zeaGovernance.waitForDeployment();
  const zeaGovernanceAddress = await zeaGovernance.getAddress();
  console.log("ZeaGovernance deployed to:", zeaGovernanceAddress);

  // Setup permissions
  console.log("\n7. Setting up permissions...");
  
  // Add ZeaZStake as minter for ZeaToken (for staking rewards)
  await zeaToken.addMinter(zeazStakeAddress);
  console.log("Added ZeaZStake as minter for ZeaToken");

  // Add ZeaZRewards as game contract for DingToken
  await dingToken.addGameContract(zeazRewardsAddress);
  console.log("Added ZeaZRewards as game contract for DingToken");

  // Transfer treasury ownership to governance
  await zeaTreasury.transferOwnership(zeaGovernanceAddress);
  console.log("Transferred treasury ownership to governance contract");

  // Transfer initial tokens to rewards contract
  const rewardAmount = ethers.parseEther("10000000"); // 10M ZEA for rewards
  await zeaToken.transfer(zeazRewardsAddress, rewardAmount);
  console.log("Transferred 10M ZEA to ZeaZRewards contract");

  // Transfer some tokens to treasury
  const treasuryAmount = ethers.parseEther("100000000"); // 100M ZEA for treasury
  await zeaToken.transfer(zeaTreasuryAddress, treasuryAmount);
  console.log("Transferred 100M ZEA to ZeaTreasury contract");

  // Summary
  console.log("\n======================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("======================================");
  console.log("ZeaToken ($ZEA):", zeaTokenAddress);
  console.log("DingToken ($DING):", dingTokenAddress);
  console.log("ZeaZRewards:", zeazRewardsAddress);
  console.log("ZeaZStake:", zeazStakeAddress);
  console.log("ZeaTreasury:", zeaTreasuryAddress);
  console.log("ZeaGovernance:", zeaGovernanceAddress);
  console.log("======================================");
  console.log("\nUpdate your .env file with these addresses!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
