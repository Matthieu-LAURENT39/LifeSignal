import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting User contract deployment with custom parameters...");

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log("Usage: npx hardhat run scripts/deploy-user-args.ts -- <firstname> <lastname> <email> [unlockTimeInDays]");
    console.log("Example: npx hardhat run scripts/deploy-user-args.ts -- John Doe john@example.com 365");
    process.exit(1);
  }

  const [firstname, lastname, email, unlockTimeInDays = "365"] = args;
  const unlockTime = Math.floor(Date.now() / 1000) + parseInt(unlockTimeInDays) * 24 * 60 * 60;

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);

  // Check account balance
  const balance = await deployer.getBalance();
  console.log(`💰 Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  if (balance.isZero()) {
    throw new Error("❌ Insufficient balance to deploy contract");
  }

  console.log("📋 Deployment parameters:");
  console.log(`   First Name: ${firstname}`);
  console.log(`   Last Name: ${lastname}`);
  console.log(`   Email: ${email}`);
  console.log(`   Unlock Time: ${new Date(unlockTime * 1000).toISOString()} (${unlockTimeInDays} days from now)`);

  try {
    // Deploy the User contract
    console.log("🔨 Deploying User contract...");
    const User = await ethers.getContractFactory("User");
    
    const userContract = await User.deploy(
      unlockTime,
      firstname,
      lastname,
      email,
      { gasLimit: 5000000 }
    );

    console.log("⏳ Waiting for deployment transaction...");
    await userContract.deployed();

    console.log("✅ User contract deployed successfully!");
    console.log(`📍 Contract address: ${userContract.address}`);
    console.log(`🔗 Transaction hash: ${userContract.deployTransaction?.hash}`);

    // Verify deployment
    console.log("\n🔍 Verifying contract deployment...");
    
    const owner = await userContract.getOwner();
    const deployedFirstname = await userContract.getFirstname();
    const deployedLastname = await userContract.getLastname();
    const deployedEmail = await userContract.getEmail();
    const status = await userContract.getStatus();
    const graceInterval = await userContract.getGraceInterval();

    console.log(`👤 Owner: ${owner}`);
    console.log(`📝 Name: ${deployedFirstname} ${deployedLastname}`);
    console.log(`📧 Email: ${deployedEmail}`);
    console.log(`📊 Status: ${status === 0 ? 'ACTIVE' : 'OTHER'}`);
    console.log(`⏰ Grace Interval: ${graceInterval} hours (${graceInterval / 24} days)`);

    // Save deployment info
    const deploymentInfo = {
      contract: "User",
      address: userContract.address,
      network: ethers.provider.network?.name || 'Unknown',
      deployer: deployer.address,
      firstname,
      lastname,
      email,
      unlockTime,
      unlockTimeReadable: new Date(unlockTime * 1000).toISOString(),
      deploymentTime: new Date().toISOString(),
      transactionHash: userContract.deployTransaction?.hash
    };

    const fs = require('fs');
    fs.writeFileSync(`deployment-user-${Date.now()}.json`, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to file");

    console.log("\n🎉 Deployment completed successfully!");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 