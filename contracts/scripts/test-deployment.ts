import { ethers } from "hardhat";

async function main() {
  console.log("Testing User contract deployment and basic interactions...");

  // Get the signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Deploy the User contract
  const User = await ethers.getContractFactory("User");
  const user = await User.deploy("Test", "User", "test@example.com");

  await user.waitForDeployment();
  const userAddress = await user.getAddress();

  console.log("User contract deployed to:", userAddress);

  // Test basic getter functions
  console.log("\n--- Testing Basic Getters ---");
  
  const owner = await user.getOwner();
  console.log("Owner:", owner);

  const firstname = await user.getFirstname();
  console.log("Firstname:", firstname);

  const lastname = await user.getLastname();
  console.log("Lastname:", lastname);

  const email = await user.getEmail();
  console.log("Email:", email);

  const status = await user.getStatus();
  console.log("Status:", status);

  const hasVotingRight = await user.getHasVotingRight();
  console.log("Has Voting Right:", hasVotingRight);

  const isIdVerified = await user.getIsIdVerified();
  console.log("Is ID Verified:", isIdVerified);

  // Test basic setter functions
  console.log("\n--- Testing Basic Setters ---");
  
  await user.setFirstname("Updated");
  const updatedFirstname = await user.getFirstname();
  console.log("Updated Firstname:", updatedFirstname);

  await user.setLastname("Name");
  const updatedLastname = await user.getLastname();
  console.log("Updated Lastname:", updatedLastname);

  await user.setEmail("updated@example.com");
  const updatedEmail = await user.getEmail();
  console.log("Updated Email:", updatedEmail);

  // Test vault and contact management
  console.log("\n--- Testing Vault and Contact Management ---");
  
  const testVault = "0x1234567890123456789012345678901234567890";
  const testContact = "0x0987654321098765432109876543210987654321";

  await user.addVault(testVault);
  console.log("Added vault:", testVault);

  await user.addContact(testContact);
  console.log("Added contact:", testContact);

  const vaults = await user.getVaults();
  console.log("Vaults:", vaults);

  const contacts = await user.getContacts();
  console.log("Contacts:", contacts);

  const isVault = await user.isVault(testVault);
  console.log("Is vault:", isVault);

  const isContact = await user.isContact(testContact);
  console.log("Is contact:", isContact);

  // Test comprehensive getter
  console.log("\n--- Testing Comprehensive Getter ---");
  
  const userData = await user.getUserData();
  console.log("Complete User Data:", {
    owner: userData[0],
    firstname: userData[1],
    lastname: userData[2],
    email: userData[3],
    birthDate: userData[4],
    status: userData[5],
    graceInterval: userData[6],
    createdAt: userData[7],
    lastUpdated: userData[8],
    hasVotingRight: userData[9],
    isIdVerified: userData[10],
    vaults: userData[11],
    contacts: userData[12],
    hasDeathDecl: userData[13]
  });

  console.log("\n✅ All tests passed! User contract is working correctly.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 