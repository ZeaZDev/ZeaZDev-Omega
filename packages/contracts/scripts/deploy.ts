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

  // Setup permissions
  console.log("\n5. Setting up permissions...");
  
  // Add ZeaZStake as minter for ZeaToken (for staking rewards)
  await zeaToken.addMinter(zeazStakeAddress);
  console.log("Added ZeaZStake as minter for ZeaToken");

  // Add ZeaZRewards as game contract for DingToken
  await dingToken.addGameContract(zeazRewardsAddress);
  console.log("Added ZeaZRewards as game contract for DingToken");

  // Transfer initial tokens to rewards contract
  const rewardAmount = ethers.parseEther("10000000"); // 10M ZEA for rewards
  await zeaToken.transfer(zeazRewardsAddress, rewardAmount);
  console.log("Transferred 10M ZEA to ZeaZRewards contract");

  // Summary
  console.log("\n======================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("======================================");
  console.log("ZeaToken ($ZEA):", zeaTokenAddress);
  console.log("DingToken ($DING):", dingTokenAddress);
  console.log("ZeaZRewards:", zeazRewardsAddress);
  console.log("ZeaZStake:", zeazStakeAddress);
  console.log("======================================");
  console.log("\nUpdate your .env file with these addresses!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
