const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LifeSignalRegistry", function () {
  let lifeSignalRegistry;
  let owner, contact1, contact2, addr3;

  beforeEach(async function () {
    [owner, contact1, contact2, addr3] = await ethers.getSigners();

    const LifeSignalRegistry = await ethers.getContractFactory("LifeSignalRegistry");
    lifeSignalRegistry = await LifeSignalRegistry.deploy();
    await lifeSignalRegistry.deployed();
  });

  describe("Owner Registration", function () {
    it("Should register an owner successfully", async function () {
      await lifeSignalRegistry.registerOwner(
        "John",
        "Doe",
        "john@example.com",
        "+1234567890",
        30 * 24 * 60 * 60 // 30 days in seconds
      );

      const ownerInfo = await lifeSignalRegistry.getOwnerInfo(owner.address);
      expect(ownerInfo.firstName).to.equal("John");
      expect(ownerInfo.lastName).to.equal("Doe");
      expect(ownerInfo.exists).to.be.true;
      expect(ownerInfo.isDeceased).to.be.false;
    });

    it("Should fail if grace interval is too short", async function () {
      await expect(
        lifeSignalRegistry.registerOwner(
          "John",
          "Doe",
          "john@example.com",
          "+1234567890",
          12 * 60 * 60 // 12 hours
        )
      ).to.be.revertedWith("Grace interval too short");
    });

    it("Should fail if trying to register twice", async function () {
      await lifeSignalRegistry.registerOwner(
        "John",
        "Doe",
        "john@example.com",
        "+1234567890",
        30 * 24 * 60 * 60
      );

      await expect(
        lifeSignalRegistry.registerOwner(
          "Jane",
          "Doe",
          "jane@example.com",
          "+1234567890",
          30 * 24 * 60 * 60
        )
      ).to.be.revertedWith("Owner already registered");
    });
  });

  describe("Contact Management", function () {
    beforeEach(async function () {
      await lifeSignalRegistry.registerOwner(
        "John",
        "Doe",
        "john@example.com",
        "+1234567890",
        30 * 24 * 60 * 60
      );
    });

    it("Should add a contact successfully", async function () {
      await lifeSignalRegistry.addContact(contact1.address, true);

      const contactInfo = await lifeSignalRegistry.getContactInfo(owner.address, contact1.address);
      expect(contactInfo.exists).to.be.true;
      expect(contactInfo.hasVotingRight).to.be.true;
      expect(contactInfo.isVerified).to.be.false;
    });

    it("Should verify a contact", async function () {
      await lifeSignalRegistry.addContact(contact1.address, true);
      await lifeSignalRegistry.connect(contact1).verifyContact(owner.address);

      const contactInfo = await lifeSignalRegistry.getContactInfo(owner.address, contact1.address);
      expect(contactInfo.isVerified).to.be.true;
    });

    it("Should fail if contact tries to add themselves", async function () {
      await expect(
        lifeSignalRegistry.addContact(owner.address, true)
      ).to.be.revertedWith("Cannot add yourself as contact");
    });
  });

  describe("Heartbeat", function () {
    beforeEach(async function () {
      await lifeSignalRegistry.registerOwner(
        "John",
        "Doe",
        "john@example.com",
        "+1234567890",
        30 * 24 * 60 * 60
      );
    });

    it("Should send heartbeat successfully", async function () {
      const tx = await lifeSignalRegistry.sendHeartbeat();
      await expect(tx).to.emit(lifeSignalRegistry, "HeartbeatSent");

      const ownerInfo = await lifeSignalRegistry.getOwnerInfo(owner.address);
      expect(ownerInfo.lastHeartbeat).to.be.gt(0);
    });

    it("Should fail if owner is not registered", async function () {
      await expect(
        lifeSignalRegistry.connect(contact1).sendHeartbeat()
      ).to.be.revertedWith("Owner not registered");
    });
  });

  describe("Death Declaration", function () {
    beforeEach(async function () {
      // Register owner
      await lifeSignalRegistry.registerOwner(
        "John",
        "Doe",
        "john@example.com",
        "+1234567890",
        30 * 24 * 60 * 60
      );

      // Add and verify contacts
      await lifeSignalRegistry.addContact(contact1.address, true);
      await lifeSignalRegistry.addContact(contact2.address, true);
      await lifeSignalRegistry.connect(contact1).verifyContact(owner.address);
      await lifeSignalRegistry.connect(contact2).verifyContact(owner.address);
    });

    it("Should initiate death declaration", async function () {
      const tx = await lifeSignalRegistry.connect(contact1).declareDeceased(owner.address);
      await expect(tx).to.emit(lifeSignalRegistry, "DeathDeclared");

      const declarationStatus = await lifeSignalRegistry.getDeathDeclarationStatus(owner.address);
      expect(declarationStatus.isActive).to.be.true;
      expect(declarationStatus.votesFor).to.equal(1);
      expect(declarationStatus.totalVotingContacts).to.equal(2);
    });

    it("Should vote on death declaration", async function () {
      await lifeSignalRegistry.connect(contact1).declareDeceased(owner.address);
      
      const tx = await lifeSignalRegistry.connect(contact2).voteOnDeathDeclaration(owner.address, true);
      await expect(tx).to.emit(lifeSignalRegistry, "VoteCast");
      await expect(tx).to.emit(lifeSignalRegistry, "ConsensusReached");

      const ownerInfo = await lifeSignalRegistry.getOwnerInfo(owner.address);
      expect(ownerInfo.isDeceased).to.be.true;
    });

    it("Should cancel death declaration with heartbeat", async function () {
      await lifeSignalRegistry.connect(contact1).declareDeceased(owner.address);
      
      const tx = await lifeSignalRegistry.sendHeartbeat();
      await expect(tx).to.emit(lifeSignalRegistry, "ConsensusReached");

      const declarationStatus = await lifeSignalRegistry.getDeathDeclarationStatus(owner.address);
      expect(declarationStatus.isActive).to.be.false;

      const ownerInfo = await lifeSignalRegistry.getOwnerInfo(owner.address);
      expect(ownerInfo.isDeceased).to.be.false;
    });

    it("Should fail if non-voting contact tries to declare death", async function () {
      // Add non-voting contact
      await lifeSignalRegistry.addContact(addr3.address, false);
      await lifeSignalRegistry.connect(addr3).verifyContact(owner.address);

      await expect(
        lifeSignalRegistry.connect(addr3).declareDeceased(owner.address)
      ).to.be.revertedWith("No voting rights");
    });
  });
}); 