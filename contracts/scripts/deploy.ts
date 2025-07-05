import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying LifeSignal contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📱 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy core contracts
  console.log("\n🏗️ Deploying core contracts...");

  // Deploy core contracts
  console.log("\n🏗️ Deploying core contracts...");

  const HeirRegistry = await ethers.getContractFactory("HeirRegistry");
  const heirRegistry = await HeirRegistry.deploy();
  await heirRegistry.waitForDeployment();
  console.log("✅ HeirRegistry deployed to:", await heirRegistry.getAddress());

  const KeepAlive = await ethers.getContractFactory("KeepAlive");
  const keepAlive = await KeepAlive.deploy();
  await keepAlive.waitForDeployment();
  console.log("✅ KeepAlive deployed to:", await keepAlive.getAddress());

  const DeathOracle = await ethers.getContractFactory("DeathOracle");
  const deathOracle = await DeathOracle.deploy();
  await deathOracle.waitForDeployment();
  console.log("✅ DeathOracle deployed to:", await deathOracle.getAddress());

  // Deploy vault controller
  console.log("\n🎮 Deploying VaultController...");
  const VaultController = await ethers.getContractFactory("VaultController");
  const vaultController = await VaultController.deploy(
    await deathOracle.getAddress(),
    await keepAlive.getAddress(),
    2 // Required confirmations
  );
  await vaultController.waitForDeployment();
  console.log("✅ VaultController deployed to:", await vaultController.getAddress());

  // Deploy vault implementation
  console.log("\n🏦 Deploying Vault implementation...");
  const Vault = await ethers.getContractFactory("Vault");
  const vaultImplementation = await Vault.deploy();
  await vaultImplementation.waitForDeployment();
  console.log("✅ Vault implementation deployed to:", await vaultImplementation.getAddress());

  // Deploy vault factory
  console.log("\n🏭 Deploying VaultFactory...");
  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  const vaultFactory = await VaultFactory.deploy(
    await vaultImplementation.getAddress(),
    await vaultController.getAddress(),
    await heirRegistry.getAddress()
  );
  await vaultFactory.waitForDeployment();
  console.log("✅ VaultFactory deployed to:", await vaultFactory.getAddress());

  // Post-deployment setup
  console.log("\n⚙️ Setting up contracts...");

  // Grant roles and permissions
  const ADMIN_ROLE = await heirRegistry.ADMIN_ROLE();
  const VAULT_ROLE = await heirRegistry.VAULT_ROLE();
  
  // Grant VaultFactory permission to manage vaults in HeirRegistry
  await heirRegistry.grantRole(VAULT_ROLE, await vaultFactory.getAddress());
  console.log("✅ VaultFactory granted VAULT_ROLE in HeirRegistry");

  // Add some initial oracles (using deployer for testing)
  await deathOracle.addOracle(deployer.address);
  console.log("✅ Added deployer as oracle in DeathOracle");

  // Grant VaultFactory permission to authorize vaults in controller
  await vaultController.grantRole(ADMIN_ROLE, await vaultFactory.getAddress());
  console.log("✅ VaultFactory granted ADMIN_ROLE in VaultController");

  // Display deployment summary
  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log("HeirRegistry:", await heirRegistry.getAddress());
  console.log("KeepAlive:", await keepAlive.getAddress());
  console.log("DeathOracle:", await deathOracle.getAddress());
  console.log("VaultController:", await vaultController.getAddress());
  console.log("Vault Implementation:", await vaultImplementation.getAddress());
  console.log("VaultFactory:", await vaultFactory.getAddress());
  console.log("================================");

  // Save deployment addresses to file
  const deploymentInfo = {
    network: "oasisSapphireTestnet",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      HeirRegistry: await heirRegistry.getAddress(),
      KeepAlive: await keepAlive.getAddress(),
      DeathOracle: await deathOracle.getAddress(),
      VaultController: await vaultController.getAddress(),
      VaultImplementation: await vaultImplementation.getAddress(),
      VaultFactory: await vaultFactory.getAddress(),
    },
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployments.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to deployments.json");

  console.log("\n🎉 LifeSignal deployment completed successfully!");
  console.log("🔗 You can now create vaults using the VaultFactory at:", await vaultFactory.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 