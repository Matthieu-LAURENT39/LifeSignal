const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment on", hre.network.name);

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy LifeSignalRegistry
  console.log("\n📦 Deploying LifeSignalRegistry...");
  const LifeSignalRegistry = await hre.ethers.getContractFactory("LifeSignalRegistry");
  const lifeSignalRegistry = await LifeSignalRegistry.deploy();
  await lifeSignalRegistry.waitForDeployment();

  const contractAddress = await lifeSignalRegistry.getAddress();
  console.log("✅ LifeSignalRegistry deployed to:", contractAddress);

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    contracts: {
      LifeSignalRegistry: contractAddress,
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify contracts if not on local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await lifeSignalRegistry.deploymentTransaction().wait(5);

    console.log("🔍 Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified successfully");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }

  console.log("\n🎉 Deployment completed!");
  console.log("📝 Save these addresses for your frontend configuration:");
  console.log(`LIFE_SIGNAL_REGISTRY_ADDRESS="${contractAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 