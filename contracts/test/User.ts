import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import { User } from "../typechain-types";

import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "../.env" });

describe("User Contract", function () {
  let userContract: User;
  let owner: any;
  let otherAccount: any;
  let thirdAccount: any;
  let deployedAddress: string;
  let isDeployedContract: boolean = false;

  // Test parameters
  const testFirstname = "John";
  const testLastname = "Doe";
  const testEmail = "john.doe@example.com";
  const testVault = "0x1234567890123456789012345678901234567890";
  const testContact = "0x0987654321098765432109876543210987654321";

  before(async function () {
    // Get signers
    [owner, otherAccount, thirdAccount] = await hre.ethers.getSigners();

    // Check if we should use a deployed contract address
    const deployedContractAddress = process.env.DEPLOYED_USER_CONTRACT_ADDRESS;
    
    if (deployedContractAddress) {
      try {
        // Try to connect to deployed contract
        console.log("Attempting to connect to deployed contract at:", deployedContractAddress);
        userContract = await hre.ethers.getContractAt("User", deployedContractAddress);
        
        // Test if the contract actually exists and has the expected interface
        try {
          await userContract.getOwner();
          deployedAddress = deployedContractAddress;
          isDeployedContract = true;
          console.log("✅ Successfully connected to deployed contract");
        } catch (error) {
          console.log("❌ Deployed contract exists but doesn't have User interface");
          console.log("   Error:", (error as Error).message);
          console.log("   Deploying new contract for testing instead...");
          await deployNewContract();
        }
      } catch (error) {
        console.log("❌ Could not connect to deployed contract");
        console.log("   Error:", (error as Error).message);
        console.log("   Deploying new contract for testing instead...");
        await deployNewContract();
      }
    } else {
      console.log("No deployed contract address provided, deploying new contract for testing");
      await deployNewContract();
    }
  });

  async function deployNewContract() {
    console.log("Deploying new User contract for testing...");
    const User = await hre.ethers.getContractFactory("User");
    userContract = await User.deploy(testFirstname, testLastname, testEmail);
    await userContract.waitForDeployment();
    deployedAddress = await userContract.getAddress();
    isDeployedContract = false;
    console.log("✅ New contract deployed at:", deployedAddress);
  }

  describe("Contract Setup", function () {
    it("Should have a valid contract instance", async function () {
      expect(userContract).to.not.be.undefined;
      expect(await userContract.getAddress()).to.be.a("string");
      console.log("Contract address:", await userContract.getAddress());
      console.log("Using deployed contract:", isDeployedContract);
    });

    it("Should be able to call basic functions", async function () {
      // Test basic function calls to ensure contract is working
      try {
        const owner = await userContract.getOwner();
        expect(owner).to.not.equal(ethers.ZeroAddress);
        console.log("✅ Contract owner:", owner);
      } catch (error) {
        console.log("❌ Error calling getOwner:", (error as Error).message);
        throw error;
      }
    });
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(userContract).to.not.be.undefined;
      expect(await userContract.getAddress()).to.be.a("string");
    });

    it("Should set the correct owner", async function () {
      const contractOwner = await userContract.getOwner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("Should set initial user data correctly", async function () {
      const firstname = await userContract.getFirstname();
      const lastname = await userContract.getLastname();
      const email = await userContract.getEmail();
      const status = await userContract.getStatus();
      const hasVotingRight = await userContract.getHasVotingRight();
      const isIdVerified = await userContract.getIsIdVerified();

      // If using deployed contract, don't assume initial values
      if (!isDeployedContract) {
        expect(firstname).to.equal(testFirstname);
        expect(lastname).to.equal(testLastname);
        expect(email).to.equal(testEmail);
        expect(status).to.equal(0); // ACTIVE = 0
        expect(hasVotingRight).to.be.true;
        expect(isIdVerified).to.be.false;
      } else {
        // Just verify the data exists
        expect(firstname).to.be.a("string");
        expect(lastname).to.be.a("string");
        expect(email).to.be.a("string");
        expect(status).to.be.a("number");
        expect(hasVotingRight).to.be.a("boolean");
        expect(isIdVerified).to.be.a("boolean");
      }
    });

    it("Should have valid timestamps", async function () {
      const createdAt = await userContract.getCreatedAt();
      const lastUpdated = await userContract.getLastUpdated();
      const currentTime = Math.floor(Date.now() / 1000);

      expect(createdAt).to.be.greaterThan(0);
      expect(lastUpdated).to.be.greaterThan(0);
      
      if (!isDeployedContract) {
        expect(lastUpdated).to.equal(createdAt);
        expect(createdAt).to.be.closeTo(currentTime, 60); // Within 60 seconds
      }
    });

    it("Should have valid grace interval", async function () {
      const graceInterval = await userContract.getGraceInterval();
      expect(graceInterval).to.be.greaterThan(0);
      
      if (!isDeployedContract) {
        expect(graceInterval).to.equal(720 * 3600); // 720 hours in seconds
      }
    });
  });

  describe("Basic Getters", function () {
    it("Should return user data", async function () {
      const userData = await userContract.getBasicUserData();
      
      expect(userData).to.have.length(11);
      expect(userData[0]).to.not.equal(ethers.ZeroAddress); // owner
      expect(userData[1]).to.be.a("string"); // firstname
      expect(userData[2]).to.be.a("string"); // lastname
      expect(userData[3]).to.be.a("string"); // email
      expect(userData[4]).to.be.a("string"); // birthDate
      expect(userData[5]).to.be.a("bigint"); // status (changed from number to bigint)
      expect(userData[6]).to.be.a("bigint"); // graceInterval
      expect(userData[7]).to.be.a("bigint"); // createdAt
      expect(userData[8]).to.be.a("bigint"); // lastUpdated
      expect(userData[9]).to.be.a("boolean"); // hasVotingRight
      expect(userData[10]).to.be.a("boolean"); // isIdVerified
    });

    it("Should return vaults and contacts", async function () {
      const vaults = await userContract.getVaults();
      const contacts = await userContract.getContacts();
      
      expect(vaults).to.be.an("array");
      expect(contacts).to.be.an("array");
    });

    it("Should return vault and contact counts", async function () {
      const vaultCount = await userContract.getVaultCount();
      const contactCount = await userContract.getContactCount();
      
      expect(vaultCount).to.be.a("bigint");
      expect(contactCount).to.be.a("bigint");
    });
  });

  describe("Access Control", function () {
    it("Should allow only owner to modify user data", async function () {
      await expect(
        userContract.connect(otherAccount).setFirstname("NewName")
      ).to.be.revertedWithCustomError(userContract, "Unauthorized");
    });

    it("Should allow owner to modify user data", async function () {
      await expect(userContract.setFirstname("NewName")).to.not.be.reverted;
    });

    it("Should prevent non-owner from changing owner", async function () {
      await expect(
        userContract.connect(otherAccount).setOwner(otherAccount.address)
      ).to.be.revertedWithCustomError(userContract, "Unauthorized");
    });
  });

  describe("User Data Management", function () {
    it("Should allow owner to update firstname", async function () {
      const newFirstname = "Alice";
      await userContract.setFirstname(newFirstname);
      
      const updatedFirstname = await userContract.getFirstname();
      expect(updatedFirstname).to.equal(newFirstname);
    });

    it("Should allow owner to update lastname", async function () {
      const newLastname = "Smith";
      await userContract.setLastname(newLastname);
      
      const updatedLastname = await userContract.getLastname();
      expect(updatedLastname).to.equal(newLastname);
    });

    it("Should allow owner to update email", async function () {
      const newEmail = "alice.smith@example.com";
      await userContract.setEmail(newEmail);
      
      const updatedEmail = await userContract.getEmail();
      expect(updatedEmail).to.equal(newEmail);
    });

    it("Should allow owner to update birth date", async function () {
      const newBirthDate = "1990-01-01";
      await userContract.setBirthDate(newBirthDate);
      
      const updatedBirthDate = await userContract.getBirthDate();
      expect(updatedBirthDate).to.equal(newBirthDate);
    });

    it("Should update lastUpdated timestamp when data is modified", async function () {
      const beforeUpdate = await userContract.getLastUpdated();
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await userContract.setFirstname("UpdatedName");
      
      const afterUpdate = await userContract.getLastUpdated();
      expect(afterUpdate).to.be.greaterThan(beforeUpdate);
    });

    it("Should emit UserProfileUpdated event", async function () {
      const newFirstname = "EventTest";
      await expect(userContract.setFirstname(newFirstname))
        .to.emit(userContract, "UserProfileUpdated");
    });
  });

  describe("Vault Management", function () {
    it("Should allow owner to add vault", async function () {
      await userContract.addVault(testVault);
      
      const vaults = await userContract.getVaults();
      expect(vaults).to.include(testVault);
    });

    it("Should prevent adding duplicate vault", async function () {
      await expect(userContract.addVault(testVault))
        .to.be.revertedWithCustomError(userContract, "DuplicateVault");
    });

    it("Should prevent adding zero address as vault", async function () {
      await expect(userContract.addVault(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(userContract, "InvalidAddress");
    });

    it("Should allow owner to remove vault", async function () {
      await userContract.removeVault(testVault);
      
      const vaults = await userContract.getVaults();
      expect(vaults).to.not.include(testVault);
    });

    it("Should prevent removing non-existent vault", async function () {
      await expect(userContract.removeVault(testVault))
        .to.be.revertedWithCustomError(userContract, "VaultNotFound");
    });

    it("Should correctly identify vault", async function () {
      await userContract.addVault(testVault);
      
      const isVault = await userContract.isVault(testVault);
      expect(isVault).to.be.true;
      
      const isNotVault = await userContract.isVault(otherAccount.address);
      expect(isNotVault).to.be.false;
    });

    it("Should emit VaultAdded event", async function () {
      const newVault = "0x1111111111111111111111111111111111111111";
      await expect(userContract.addVault(newVault))
        .to.emit(userContract, "VaultAdded");
    });

    it("Should emit VaultRemoved event", async function () {
      await expect(userContract.removeVault(testVault))
        .to.emit(userContract, "VaultRemoved");
    });
  });

  describe("Contact Management", function () {
    it("Should allow owner to add contact", async function () {
      await userContract.addContact(testContact);
      
      const contacts = await userContract.getContacts();
      expect(contacts).to.include(testContact);
    });

    it("Should prevent adding duplicate contact", async function () {
      await expect(userContract.addContact(testContact))
        .to.be.revertedWithCustomError(userContract, "DuplicateContact");
    });

    it("Should prevent adding zero address as contact", async function () {
      await expect(userContract.addContact(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(userContract, "InvalidAddress");
    });

    it("Should allow owner to remove contact", async function () {
      await userContract.removeContact(testContact);
      
      const contacts = await userContract.getContacts();
      expect(contacts).to.not.include(testContact);
    });

    it("Should prevent removing non-existent contact", async function () {
      await expect(userContract.removeContact(testContact))
        .to.be.revertedWithCustomError(userContract, "ContactNotFound");
    });

    it("Should correctly identify contact", async function () {
      await userContract.addContact(testContact);
      
      const isContact = await userContract.isContact(testContact);
      expect(isContact).to.be.true;
      
      const isNotContact = await userContract.isContact(otherAccount.address);
      expect(isNotContact).to.be.false;
    });

    it("Should emit ContactAdded event", async function () {
      const newContact = "0x2222222222222222222222222222222222222222";
      await expect(userContract.addContact(newContact))
        .to.emit(userContract, "ContactAdded");
    });

    it("Should emit ContactRemoved event", async function () {
      await expect(userContract.removeContact(testContact))
        .to.emit(userContract, "ContactRemoved");
    });
  });

  describe("Status Management", function () {
    it("Should allow owner to change status", async function () {
      await userContract.setStatus(1); // VOTING_IN_PROGRESS
      
      const status = await userContract.getStatus();
      expect(status).to.equal(1);
    });

    it("Should emit UserStatusChanged event", async function () {
      await expect(userContract.setStatus(2)) // GRACE_PERIOD
        .to.emit(userContract, "UserStatusChanged");
    });
  });

  describe("Voting Rights and ID Verification", function () {
    beforeEach(async function () {
      // Reset status to ACTIVE before each test
      await userContract.setStatus(0); // ACTIVE
    });

    it("Should allow owner to update voting rights", async function () {
      await userContract.setHasVotingRight(false);
      
      const hasVotingRight = await userContract.getHasVotingRight();
      expect(hasVotingRight).to.be.false;
    });

    it("Should allow owner to update ID verification status", async function () {
      await userContract.setIsIdVerified(true);
      
      const isIdVerified = await userContract.getIsIdVerified();
      expect(isIdVerified).to.be.true;
    });

    it("Should emit VotingRightsUpdated event", async function () {
      await expect(userContract.setHasVotingRight(true))
        .to.emit(userContract, "VotingRightsUpdated");
    });

    it("Should emit IdVerificationUpdated event", async function () {
      await expect(userContract.setIsIdVerified(false))
        .to.emit(userContract, "IdVerificationUpdated");
    });
  });

  describe("Owner Management", function () {
    beforeEach(async function () {
      // Reset status to ACTIVE before each test
      try {
        await userContract.setStatus(0); // ACTIVE
      } catch (error) {
        // If setting status fails, the contract might already be in ACTIVE state
        console.log("Status reset skipped - contract may already be ACTIVE");
      }
    });

    it("Should allow owner to transfer ownership", async function () {
      await userContract.setOwner(otherAccount.address);
      
      const newOwner = await userContract.getOwner();
      expect(newOwner).to.equal(otherAccount.address);
    });

    it("Should prevent setting zero address as owner", async function () {
      await expect(userContract.setOwner(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(userContract, "InvalidAddress");
    });

    it("Should emit OwnerChanged event", async function () {
      await expect(userContract.setOwner(thirdAccount.address))
        .to.emit(userContract, "OwnerChanged");
    });
  });

  describe("Death Declaration System", function () {
    beforeEach(async function () {
      // Reset status to ACTIVE and add a contact for testing death declaration
      try {
        await userContract.setStatus(0); // ACTIVE
      } catch (error) {
        // If setting status fails, the contract might already be in ACTIVE state
        console.log("Status reset skipped - contract may already be ACTIVE");
      }
      await userContract.addContact(otherAccount.address);
    });

    it("Should allow contact to create death declaration", async function () {
      await userContract.connect(otherAccount).createDeathDeclaration();
      
      const hasDeathDecl = await userContract.getDeathDeclarationStatus();
      expect(hasDeathDecl).to.be.true;
    });

    it("Should prevent non-contact from creating death declaration", async function () {
      await expect(
        userContract.connect(thirdAccount).createDeathDeclaration()
      ).to.be.revertedWithCustomError(userContract, "Unauthorized");
    });

    it("Should prevent duplicate death declaration", async function () {
      await userContract.connect(otherAccount).createDeathDeclaration();
      
      await expect(
        userContract.connect(otherAccount).createDeathDeclaration()
      ).to.be.revertedWithCustomError(userContract, "DeathDeclarationNotFound");
    });

    it("Should emit DeathDeclarationCreated event", async function () {
      await expect(userContract.connect(otherAccount).createDeathDeclaration())
        .to.emit(userContract, "DeathDeclarationCreated");
    });

    it("Should allow contact to vote on death declaration", async function () {
      await userContract.connect(otherAccount).createDeathDeclaration();
      
      await expect(userContract.connect(otherAccount).voteOnDeathDeclaration(true))
        .to.emit(userContract, "VoteCast");
    });

    it("Should prevent duplicate voting", async function () {
      await userContract.connect(otherAccount).createDeathDeclaration();
      await userContract.connect(otherAccount).voteOnDeathDeclaration(true);
      
      await expect(
        userContract.connect(otherAccount).voteOnDeathDeclaration(false)
      ).to.be.revertedWithCustomError(userContract, "VoteAlreadyExists");
    });
  });

  describe("Comprehensive Data Retrieval", function () {
    it("Should return complete user data", async function () {
      const userData = await userContract.getUserData();
      
      expect(userData).to.have.length(14);
      expect(userData[0]).to.not.equal(ethers.ZeroAddress); // owner
      expect(userData[1]).to.be.a("string"); // firstname
      expect(userData[2]).to.be.a("string"); // lastname
      expect(userData[3]).to.be.a("string"); // email
      expect(userData[4]).to.be.a("string"); // birthDate
      expect(userData[5]).to.be.a("bigint"); // status (changed from number to bigint)
      expect(userData[6]).to.be.a("bigint"); // graceInterval
      expect(userData[7]).to.be.a("bigint"); // createdAt
      expect(userData[8]).to.be.a("bigint"); // lastUpdated
      expect(userData[9]).to.be.a("boolean"); // hasVotingRight
      expect(userData[10]).to.be.a("boolean"); // isIdVerified
      expect(userData[11]).to.be.an("array"); // vaults
      expect(userData[12]).to.be.an("array"); // contacts
      expect(userData[13]).to.be.a("boolean"); // hasDeathDecl
    });

    it("Should return vaults and contacts", async function () {
      const [vaults, contacts] = await userContract.getVaultsAndContacts();
      
      expect(vaults).to.be.an("array");
      expect(contacts).to.be.an("array");
    });
  });

  describe("Error Handling", function () {
    it("Should handle invalid vault index", async function () {
      // Ensure contract is in ACTIVE state
      try {
        await userContract.setStatus(0); // ACTIVE
      } catch (error) {
        // If setting status fails, the contract might already be in ACTIVE state
        console.log("Status reset skipped - contract may already be ACTIVE");
      }
      
      // First add a vault to ensure the array has elements
      await userContract.addVault(testVault);
      // Then remove it to make the array empty again
      await userContract.removeVault(testVault);
      
      await expect(userContract.getVaultAtIndex(0))
        .to.be.revertedWithCustomError(userContract, "VaultNotFound");
    });

    it("Should handle invalid contact index", async function () {
      // Ensure contract is in ACTIVE state
      try {
        await userContract.setStatus(0); // ACTIVE
      } catch (error) {
        // If setting status fails, the contract might already be in ACTIVE state
        console.log("Status reset skipped - contract may already be ACTIVE");
      }
      
      // First add a contact to ensure the array has elements
      await userContract.addContact(testContact);
      // Then remove it to make the array empty again
      await userContract.removeContact(testContact);
      
      await expect(userContract.getContactAtIndex(0))
        .to.be.revertedWithCustomError(userContract, "ContactNotFound");
    });

    it("Should handle death declaration not found", async function () {
      await expect(userContract.getDeathDeclaration())
        .to.be.revertedWithCustomError(userContract, "DeathDeclarationNotFound");
    });
  });

  describe("Network Integration", function () {
    it("Should connect to network", async function () {
      const network = await hre.ethers.provider.getNetwork();
      console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
      
      if (network.chainId === 0x5affn) { // Sapphire testnet
        console.log("✅ Connected to Sapphire testnet");
      } else if (network.chainId === 0x5afen) { // Sapphire mainnet
        console.log("✅ Connected to Sapphire mainnet");
      } else {
        console.log("ℹ️  Running on local/other network");
      }
    });
  });
}); 