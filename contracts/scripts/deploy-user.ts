import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting User contract deployment...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);

  // Check account balance
  const balance = await deployer.getBalance();
  console.log(`💰 Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  if (balance.isZero()) {
    throw new Error("❌ Insufficient balance to deploy contract");
  }

  // Deployment parameters
  const unlockTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now
  const firstname = "John";
  const lastname = "Doe";
  const email = "john.doe@example.com";

  console.log("📋 Deployment parameters:");
  console.log(`   Unlock Time: ${new Date(unlockTime * 1000).toISOString()}`);
  console.log(`   First Name: ${firstname}`);
  console.log(`   Last Name: ${lastname}`);
  console.log(`   Email: ${email}`);

  try {
    // Deploy the User contract
    console.log("🔨 Deploying User contract...");
    const User = await ethers.getContractFactory("User");
    
    const userContract = await User.deploy(
      unlockTime,
      firstname,
      lastname,
      email,
      { gasLimit: 5000000 } // Set gas limit for deployment
    );

    console.log("⏳ Waiting for deployment transaction...");
    await userContract.deployed();

    console.log("✅ User contract deployed successfully!");
    console.log(`📍 Contract address: ${userContract.address}`);
    console.log(`🔗 Transaction hash: ${userContract.deployTransaction?.hash}`);

    // Verify contract deployment by calling some getter functions
    console.log("\n🔍 Verifying contract deployment...");
    
    const owner = await userContract.getOwner();
    console.log(`👤 Owner: ${owner}`);
    
    const deployedFirstname = await userContract.getFirstname();
    console.log(`📝 First Name: ${deployedFirstname}`);
    
    const deployedLastname = await userContract.getLastname();
    console.log(`📝 Last Name: ${deployedLastname}`);
    
    const deployedEmail = await userContract.getEmail();
    console.log(`📧 Email: ${deployedEmail}`);
    
    const status = await userContract.getStatus();
    console.log(`📊 Status: ${status === 0 ? 'ACTIVE' : 'OTHER'}`);
    
    const graceInterval = await userContract.getGraceInterval();
    console.log(`⏰ Grace Interval: ${graceInterval} hours (${graceInterval / 24} days)`);
    
    const hasVotingRight = await userContract.getHasVotingRight();
    console.log(`🗳️  Has Voting Right: ${hasVotingRight}`);
    
    const isIdVerified = await userContract.getIsIdVerified();
    console.log(`✅ ID Verified: ${isIdVerified}`);

    // Get all user data in one call
    console.log("\n📊 Complete User Data:");
    const userData = await userContract.getUserData();
    console.log(`   Owner: ${userData.owner}`);
    console.log(`   First Name: ${userData.firstname}`);
    console.log(`   Last Name: ${userData.lastname}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Birth Date: ${userData.birthDate}`);
    console.log(`   Status: ${userData.status}`);
    console.log(`   Grace Interval: ${userData.graceInterval} hours`);
    console.log(`   Created At: ${new Date(userData.createdAt * 1000).toISOString()}`);
    console.log(`   Last Updated: ${new Date(userData.lastUpdated * 1000).toISOString()}`);
    console.log(`   Has Voting Right: ${userData.hasVotingRight}`);
    console.log(`   Is ID Verified: ${userData.isIdVerified}`);
    console.log(`   Vaults Count: ${userData.userVaults.length}`);
    console.log(`   Contacts Count: ${userData.userContacts.length}`);
    console.log(`   Has Death Declaration: ${userData.hasDeathDecl}`);

    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Contract Summary:");
    console.log(`   Contract: User`);
    console.log(`   Address: ${userContract.address}`);
    console.log(`   Network: ${ethers.provider.network?.name || 'Unknown'}`);
    console.log(`   Deployer: ${deployer.address}`);

    // Save deployment info to a file (optional)
    const deploymentInfo = {
      contract: "User",
      address: userContract.address,
      network: ethers.provider.network?.name || 'Unknown',
      deployer: deployer.address,
      deployerBalance: ethers.utils.formatEther(balance),
      unlockTime: unlockTime,
      unlockTimeReadable: new Date(unlockTime * 1000).toISOString(),
      firstname,
      lastname,
      email,
      deploymentTime: new Date().toISOString(),
      transactionHash: userContract.deployTransaction?.hash
    };

    console.log("\n💾 Deployment info saved to deployment-info.json");
    const fs = require('fs');
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Handle script execution
main()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 