const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const config = {
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC_URL,
    gracePeriodAddress: process.env.SEPOLIA_GRACE_PERIOD_AUTOMATION_ADDRESS,
    relayPrivateKey: process.env.SEPOLIA_RELAY_PRIVATE_KEY
  },
  sapphire: {
    rpcUrl: process.env.SAPPHIRE_RPC_URL,
    registryAddress: process.env.SAPPHIRE_LIFE_SIGNAL_REGISTRY_ADDRESS,
    relayPrivateKey: process.env.SAPPHIRE_RELAY_PRIVATE_KEY
  }
};

// Full ABIs for testing
const REGISTRY_ABI = [
  "function registerOwner(string calldata _firstName, string calldata _lastName, string calldata _email, string calldata _phone, uint256 _graceInterval) external",
  "function addContact(address _contact, bool _hasVotingRight) external",
  "function verifyContact(address _owner) external",
  "function declareDeceased(address _owner) external",
  "function voteOnDeathDeclaration(address _owner, bool _vote) external",
  "function sendHeartbeat() external",
  "function getOwnerInfo(address _owner) external view returns (string memory firstName, string memory lastName, uint256 lastHeartbeat, uint256 graceInterval, bool isDeceased, bool exists)",
  "function getDeathDeclarationStatus(address _owner) external view returns (bool isActive, uint256 startTime, uint256 votesFor, uint256 votesAgainst, uint256 totalVotingContacts, bool consensusReached)",
  "function getContactInfo(address _owner, address _contact) external view returns (bool hasVotingRight, bool isVerified, bool exists)"
];

const GRACE_PERIOD_ABI = [
  "function getGracePeriodInfo(address ownerAddress) external view returns (uint256 startTime, bool hasPinged, bool processed, uint256 graceInterval, bool isDeceased)",
  "function getOwnerData(address ownerAddress) external view returns (uint256 graceInterval, bool isDeceased, bool exists, uint256 lastUpdate)"
];

class LifeSignalTester {
  constructor() {
    this.setupConnections();
  }

  setupConnections() {
    // Sepolia setup
    const sepoliaProvider = new ethers.JsonRpcProvider(config.sepolia.rpcUrl);
    const sepoliaWallet = new ethers.Wallet(config.sepolia.relayPrivateKey, sepoliaProvider);
    this.sepoliaContract = new ethers.Contract(config.sepolia.gracePeriodAddress, GRACE_PERIOD_ABI, sepoliaWallet);

    // Sapphire setup
    const sapphireProvider = new ethers.JsonRpcProvider(config.sapphire.rpcUrl);
    const sapphireWallet = new ethers.Wallet(config.sapphire.relayPrivateKey, sapphireProvider);
    this.sapphireContract = new ethers.Contract(config.sapphire.registryAddress, REGISTRY_ABI, sapphireWallet);
  }

  async testOwnerRegistration(ownerWallet, firstName = "John", lastName = "Doe") {
    console.log('📝 Testing Owner Registration...');
    
    try {
      const ownerContract = this.sapphireContract.connect(ownerWallet);
      
      // Register owner
      const tx = await ownerContract.registerOwner(
        firstName,
        lastName,
        "john@example.com",
        "+1234567890",
        7 * 24 * 60 * 60 // 7 days grace interval
      );
      
      console.log('✅ Owner registration transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Owner registered successfully!');
      
      return true;
    } catch (error) {
      console.error('❌ Owner registration failed:', error.message);
      return false;
    }
  }

  async testAddContact(ownerWallet, contactAddress, hasVotingRight = true) {
    console.log('👥 Testing Contact Addition...');
    
    try {
      const ownerContract = this.sapphireContract.connect(ownerWallet);
      
      const tx = await ownerContract.addContact(contactAddress, hasVotingRight);
      console.log('✅ Contact addition transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Contact added successfully!');
      
      return true;
    } catch (error) {
      console.error('❌ Contact addition failed:', error.message);
      return false;
    }
  }

  async testVerifyContact(contactWallet, ownerAddress) {
    console.log('✅ Testing Contact Verification...');
    
    try {
      const contactContract = this.sapphireContract.connect(contactWallet);
      
      const tx = await contactContract.verifyContact(ownerAddress);
      console.log('✅ Contact verification transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Contact verified successfully!');
      
      return true;
    } catch (error) {
      console.error('❌ Contact verification failed:', error.message);
      return false;
    }
  }

  async testDeathDeclaration(contactWallet, ownerAddress) {
    console.log('💀 Testing Death Declaration...');
    
    try {
      const contactContract = this.sapphireContract.connect(contactWallet);
      
      const tx = await contactContract.declareDeceased(ownerAddress);
      console.log('✅ Death declaration transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Death declared successfully!');
      
      return true;
    } catch (error) {
      console.error('❌ Death declaration failed:', error.message);
      return false;
    }
  }

  async testVote(contactWallet, ownerAddress, vote = true) {
    console.log(`🗳️ Testing Vote (${vote ? 'FOR' : 'AGAINST'})...`);
    
    try {
      const contactContract = this.sapphireContract.connect(contactWallet);
      
      const tx = await contactContract.voteOnDeathDeclaration(ownerAddress, vote);
      console.log('✅ Vote transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Vote recorded successfully!');
      
      return true;
    } catch (error) {
      console.error('❌ Vote failed:', error.message);
      return false;
    }
  }

  async testHeartbeat(ownerWallet) {
    console.log('💓 Testing Heartbeat...');
    
    try {
      const ownerContract = this.sapphireContract.connect(ownerWallet);
      
      const tx = await ownerContract.sendHeartbeat();
      console.log('✅ Heartbeat transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Heartbeat sent successfully!');
      
      return true;
    } catch (error) {
      console.error('❌ Heartbeat failed:', error.message);
      return false;
    }
  }

  async checkStatus(ownerAddress) {
    console.log('🔍 Checking Status...');
    
    try {
      // Check Sapphire status
      const sapphireInfo = await this.sapphireContract.getOwnerInfo(ownerAddress);
      console.log('Sapphire Owner Info:', {
        firstName: sapphireInfo[0],
        lastName: sapphireInfo[1],
        graceInterval: sapphireInfo[3].toString(),
        isDeceased: sapphireInfo[4],
        exists: sapphireInfo[5]
      });

      const deathStatus = await this.sapphireContract.getDeathDeclarationStatus(ownerAddress);
      console.log('Death Declaration Status:', {
        isActive: deathStatus[0],
        consensusReached: deathStatus[5],
        votesFor: deathStatus[2].toString(),
        votesAgainst: deathStatus[3].toString()
      });

      // Check Sepolia status
      try {
        const sepoliaData = await this.sepoliaContract.getOwnerData(ownerAddress);
        console.log('Sepolia Owner Data:', {
          exists: sepoliaData[2],
          isDeceased: sepoliaData[1],
          graceInterval: sepoliaData[0].toString()
        });

        const graceInfo = await this.sepoliaContract.getGracePeriodInfo(ownerAddress);
        console.log('Grace Period Info:', {
          startTime: graceInfo[0].toString(),
          hasPinged: graceInfo[1],
          processed: graceInfo[2]
        });
      } catch (error) {
        console.log('Sepolia: No data yet (expected if relay hasn\'t synced)');
      }

    } catch (error) {
      console.error('❌ Status check failed:', error.message);
    }
  }

  async runCompleteTest() {
    console.log('🧪 Running Complete LifeSignal Test\n');

    // Generate test wallets
    const ownerWallet = ethers.Wallet.createRandom();
    const contact1Wallet = ethers.Wallet.createRandom();
    const contact2Wallet = ethers.Wallet.createRandom();

    console.log('📋 Test Addresses:');
    console.log(`Owner: ${ownerWallet.address}`);
    console.log(`Contact 1: ${contact1Wallet.address}`);
    console.log(`Contact 2: ${contact2Wallet.address}\n`);

    console.log('⚠️  IMPORTANT: Fund these addresses with test tokens before proceeding!\n');

    // Step 1: Register owner
    await this.testOwnerRegistration(ownerWallet);
    await this.checkStatus(ownerWallet.address);

    // Step 2: Add contacts
    await this.testAddContact(ownerWallet, contact1Wallet.address, true);
    await this.testAddContact(ownerWallet, contact2Wallet.address, true);

    // Step 3: Verify contacts
    await this.testVerifyContact(contact1Wallet, ownerWallet.address);
    await this.testVerifyContact(contact2Wallet, ownerWallet.address);

    // Step 4: Declare death
    await this.testDeathDeclaration(contact1Wallet, ownerWallet.address);
    await this.checkStatus(ownerWallet.address);

    // Step 5: Vote
    await this.testVote(contact2Wallet, ownerWallet.address, true);
    await this.checkStatus(ownerWallet.address);

    console.log('\n🎉 Test completed! Check the relay logs for cross-chain events.');
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const tester = new LifeSignalTester();

  switch (command) {
    case 'complete':
      await tester.runCompleteTest();
      break;
    case 'status':
      const address = process.argv[3];
      if (!address) {
        console.log('Usage: node test-real-flow.js status <owner_address>');
        return;
      }
      await tester.checkStatus(address);
      break;
    case 'register':
      const ownerKey = process.argv[3];
      if (!ownerKey) {
        console.log('Usage: node test-real-flow.js register <owner_private_key>');
        return;
      }
      const ownerWallet = new ethers.Wallet(ownerKey);
      await tester.testOwnerRegistration(ownerWallet);
      break;
    case 'heartbeat':
      const heartbeatKey = process.argv[3];
      if (!heartbeatKey) {
        console.log('Usage: node test-real-flow.js heartbeat <owner_private_key>');
        return;
      }
      const heartbeatWallet = new ethers.Wallet(heartbeatKey);
      await tester.testHeartbeat(heartbeatWallet);
      break;
    default:
      console.log('Usage: node test-real-flow.js [complete|status|register|heartbeat]');
      console.log('\nCommands:');
      console.log('  complete <owner_key> <contact1_key> <contact2_key> - Run complete test');
      console.log('  status <address> - Check status of an address');
      console.log('  register <private_key> - Register an owner');
      console.log('  heartbeat <private_key> - Send heartbeat');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LifeSignalTester; 