const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying GracePeriodAutomation to Sepolia...");

  // Get the relay address from command line arguments
  const relayAddress = process.argv[2];
  if (!relayAddress) {
    throw new Error("Please provide relay address as argument: npm run deploy:sepolia -- RELAY_ADDRESS");
  }

  console.log("Relay address:", relayAddress);

  // Get the contract factory
  const GracePeriodAutomation = await ethers.getContractFactory("GracePeriodAutomation");

  // Deploy the contract
  const gracePeriodAutomation = await GracePeriodAutomation.deploy(relayAddress);

  // Wait for deployment to complete
  await gracePeriodAutomation.waitForDeployment();

  const address = await gracePeriodAutomation.getAddress();
  console.log("GracePeriodAutomation deployed to:", address);

  // Verify the relay address was set correctly
  const deployedRelayAddress = await gracePeriodAutomation.relayAddress();
  console.log("Relay address set to:", deployedRelayAddress);

  if (deployedRelayAddress.toLowerCase() !== relayAddress.toLowerCase()) {
    throw new Error("Relay address mismatch!");
  }

  console.log("Deployment successful!");
  console.log("Contract address:", address);
  console.log("Relay address:", deployedRelayAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    contract: "GracePeriodAutomation",
    address: address,
    relayAddress: deployedRelayAddress,
    deployer: await gracePeriodAutomation.runner.getAddress(),
    timestamp: new Date().toISOString(),
    blockNumber: await gracePeriodAutomation.runner.provider.getBlockNumber()
  };

  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));

  // Instructions for next steps
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Update your .env file with the contract address:");
  console.log(`   SEPOLIA_GRACE_PERIOD_AUTOMATION_ADDRESS=${address}`);
  console.log("2. Register the contract with Chainlink Automation");
  console.log("3. Start the relay server");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 