import { ethers } from "hardhat";

async function main() {
  console.log("Deploying User contract...");

  // Get the signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deployment parameters - modify these as needed
  const firstname = process.env.USER_FIRSTNAME || "John";
  const lastname = process.env.USER_LASTNAME || "Doe";
  const email = process.env.USER_EMAIL || "john.doe@example.com";

  console.log("Deployment parameters:");
  console.log("  Firstname:", firstname);
  console.log("  Lastname:", lastname);
  console.log("  Email:", email);

  // Deploy the User contract
  const User = await ethers.getContractFactory("User");
  const user = await User.deploy(firstname, lastname, email);

  await user.waitForDeployment();
  const userAddress = await user.getAddress();

  console.log("User contract deployed to:", userAddress);
  console.log("Transaction hash:", user.deploymentTransaction()?.hash);

  // Verify the deployment by calling a view function
  const owner = await user.getOwner();
  console.log("Contract owner:", owner);
  console.log("Expected owner:", deployer.address);

  if (owner === deployer.address) {
    console.log("✅ Deployment successful!");
  } else {
    console.log("❌ Deployment verification failed!");
  }

  return userAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 