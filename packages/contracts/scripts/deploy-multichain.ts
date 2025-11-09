/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Smart-Contracts-Deployment
 * @File: deploy-multichain.ts
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 2.0.0
 * @Description: Multi-chain deployment script for Phase 6 contracts
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("========================================");
  console.log("MULTI-CHAIN DEPLOYMENT - PHASE 6");
  console.log("========================================");
  console.log("Network:", network.name);
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("========================================\n");

  // Get existing token addresses (should be deployed on each chain)
  const zeaTokenAddress = process.env.ZEA_TOKEN_ADDRESS || ethers.ZeroAddress;
  const dingTokenAddress = process.env.DING_TOKEN_ADDRESS || ethers.ZeroAddress;

  if (zeaTokenAddress === ethers.ZeroAddress || dingTokenAddress === ethers.ZeroAddress) {
    console.log("⚠️  WARNING: Token addresses not set. Deploy tokens first!");
    console.log("Set ZEA_TOKEN_ADDRESS and DING_TOKEN_ADDRESS in .env");
  } else {
    console.log("Using existing tokens:");
    console.log("  ZEA Token:", zeaTokenAddress);
    console.log("  DING Token:", dingTokenAddress);
    console.log("");
  }

  // Deploy ZeaBridge
  console.log("📡 1. Deploying ZeaBridge...");
  const ZeaBridge = await ethers.getContractFactory("ZeaBridge");
  const bridge = await ZeaBridge.deploy(zeaTokenAddress, dingTokenAddress);
  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();
  console.log("✅ ZeaBridge deployed to:", bridgeAddress);

  // Deploy ZeaLiquidityPool (ZEA/DING)
  console.log("\n💧 2. Deploying ZEA/DING Liquidity Pool...");
  const ZeaLiquidityPool = await ethers.getContractFactory("ZeaLiquidityPool");
  const pool = await ZeaLiquidityPool.deploy(
    zeaTokenAddress,
    dingTokenAddress,
    "ZEA-DING LP",
    "ZEA-DING"
  );
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("✅ Liquidity Pool deployed to:", poolAddress);

  // Deploy game contracts (Phase 7)
  console.log("\n🎮 3. Deploying ZeaPoker...");
  const ZeaPoker = await ethers.getContractFactory("ZeaPoker");
  const poker = await ZeaPoker.deploy(zeaTokenAddress, dingTokenAddress);
  await poker.waitForDeployment();
  const pokerAddress = await poker.getAddress();
  console.log("✅ ZeaPoker deployed to:", pokerAddress);

  console.log("\n🎰 4. Deploying ZeaRoulette...");
  const ZeaRoulette = await ethers.getContractFactory("ZeaRoulette");
  const roulette = await ZeaRoulette.deploy(zeaTokenAddress, dingTokenAddress);
  await roulette.waitForDeployment();
  const rouletteAddress = await roulette.getAddress();
  console.log("✅ ZeaRoulette deployed to:", rouletteAddress);

  // Summary
  console.log("\n========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("========================================");
  console.log("Network:", network.name);
  console.log("\nPhase 6 - Cross-Chain:");
  console.log("  ZeaBridge:", bridgeAddress);
  console.log("  Liquidity Pool:", poolAddress);
  console.log("\nPhase 7 - Advanced GameFi:");
  console.log("  ZeaPoker:", pokerAddress);
  console.log("  ZeaRoulette:", rouletteAddress);
  console.log("\nToken Addresses:");
  console.log("  ZEA Token:", zeaTokenAddress);
  console.log("  DING Token:", dingTokenAddress);
  console.log("========================================");

  // Save deployment info to file
  const deploymentInfo = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    timestamp: new Date().toISOString(),
    contracts: {
      ZeaBridge: bridgeAddress,
      LiquidityPool: poolAddress,
      ZeaPoker: pokerAddress,
      ZeaRoulette: rouletteAddress,
      ZeaToken: zeaTokenAddress,
      DingToken: dingTokenAddress,
    },
  };

  console.log("\n📝 Deployment info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✅ Multi-chain deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
