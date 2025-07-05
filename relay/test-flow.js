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

// ABIs (minimal for testing)
const GRACE_PERIOD_ABI = [
  "function getGracePeriodInfo(address ownerAddress) external view returns (uint256 startTime, bool hasPinged, bool processed, uint256 graceInterval, bool isDeceased)",
  "function getOwnerData(address ownerAddress) external view returns (uint256 graceInterval, bool isDeceased, bool exists, uint256 lastUpdate)"
];

const REGISTRY_ABI = [
  "function getOwnerInfo(address _owner) external view returns (string memory firstName, string memory lastName, uint256 lastHeartbeat, uint256 graceInterval, bool isDeceased, bool exists)",
  "function getDeathDeclarationStatus(address _owner) external view returns (bool isActive, uint256 startTime, uint256 votesFor, uint256 votesAgainst, uint256 totalVotingContacts, bool consensusReached)"
];

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Grace Period Flow\n');

  try {
    // Setup connections
    const sepoliaProvider = new ethers.JsonRpcProvider(config.sepolia.rpcUrl);
    const sepoliaWallet = new ethers.Wallet(config.sepolia.relayPrivateKey, sepoliaProvider);
    const sepoliaContract = new ethers.Contract(config.sepolia.gracePeriodAddress, GRACE_PERIOD_ABI, sepoliaWallet);

    const sapphireProvider = new ethers.JsonRpcProvider(config.sapphire.rpcUrl);
    const sapphireWallet = new ethers.Wallet(config.sapphire.relayPrivateKey, sapphireProvider);
    const sapphireContract = new ethers.Contract(config.sapphire.registryAddress, REGISTRY_ABI, sapphireWallet);

    // Test addresses (replace with real addresses from your system)
    const testOwnerAddress = "0x..."; // Replace with a real owner address
    const testContactAddress = "0x..."; // Replace with a real contact address

    console.log('📋 Test Configuration:');
    console.log(`Owner Address: ${testOwnerAddress}`);
    console.log(`Contact Address: ${testContactAddress}`);
    console.log(`Sepolia Contract: ${config.sepolia.gracePeriodAddress}`);
    console.log(`Sapphire Contract: ${config.sapphire.registryAddress}\n`);

    // Step 1: Check initial state
    console.log('🔍 Step 1: Checking Initial State');
    
    try {
      const sapphireOwnerInfo = await sapphireContract.getOwnerInfo(testOwnerAddress);
      console.log('Sapphire Owner Info:', {
        firstName: sapphireOwnerInfo[0],
        lastName: sapphireOwnerInfo[1],
        graceInterval: sapphireOwnerInfo[3].toString(),
        isDeceased: sapphireOwnerInfo[4],
        exists: sapphireOwnerInfo[5]
      });
    } catch (error) {
      console.log('❌ No owner found on Sapphire (this is expected for testing)');
    }

    try {
      const sepoliaOwnerData = await sepoliaContract.getOwnerData(testOwnerAddress);
      console.log('Sepolia Owner Data:', {
        graceInterval: sepoliaOwnerData[0].toString(),
        isDeceased: sepoliaOwnerData[1],
        exists: sepoliaOwnerData[2],
        lastUpdate: sepoliaOwnerData[3].toString()
      });
    } catch (error) {
      console.log('❌ No owner data found on Sepolia (this is expected for testing)');
    }

    // Step 2: Check death declaration status
    console.log('\n🔍 Step 2: Checking Death Declaration Status');
    
    try {
      const deathStatus = await sapphireContract.getDeathDeclarationStatus(testOwnerAddress);
      console.log('Death Declaration Status:', {
        isActive: deathStatus[0],
        startTime: deathStatus[1].toString(),
        votesFor: deathStatus[2].toString(),
        votesAgainst: deathStatus[3].toString(),
        totalVotingContacts: deathStatus[4].toString(),
        consensusReached: deathStatus[5]
      });
    } catch (error) {
      console.log('❌ No death declaration found (this is expected for testing)');
    }

    // Step 3: Check grace period info
    console.log('\n🔍 Step 3: Checking Grace Period Info');
    
    try {
      const graceInfo = await sepoliaContract.getGracePeriodInfo(testOwnerAddress);
      console.log('Grace Period Info:', {
        startTime: graceInfo[0].toString(),
        hasPinged: graceInfo[1],
        processed: graceInfo[2],
        graceInterval: graceInfo[3].toString(),
        isDeceased: graceInfo[4]
      });
    } catch (error) {
      console.log('❌ No grace period found (this is expected for testing)');
    }

    // Step 4: Test relay API
    console.log('\n🔍 Step 4: Testing Relay API');
    
    try {
      const response = await fetch('http://localhost:3000/status');
      const status = await response.json();
      console.log('Relay Status:', status);
    } catch (error) {
      console.log('❌ Relay API not accessible. Make sure relay server is running on port 3000');
    }

    console.log('\n✅ Testing completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Register a real owner on Sapphire');
    console.log('2. Add contacts and verify them');
    console.log('3. Initiate a death declaration');
    console.log('4. Watch the relay process the events');
    console.log('5. Test the grace period flow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Manual testing functions
async function testOwnerRegistration() {
  console.log('📝 Testing Owner Registration Flow\n');
  
  // This would require the actual contract functions
  console.log('To test owner registration:');
  console.log('1. Call registerOwner() on Sapphire LifeSignalRegistry');
  console.log('2. Add contacts with addContact()');
  console.log('3. Verify contacts with verifyContact()');
  console.log('4. Check relay logs for OwnerRegistered event');
}

async function testDeathDeclaration() {
  console.log('💀 Testing Death Declaration Flow\n');
  
  console.log('To test death declaration:');
  console.log('1. Call declareDeceased() on Sapphire');
  console.log('2. Vote on death declaration with voteOnDeathDeclaration()');
  console.log('3. Watch for ConsensusReached event');
  console.log('4. Check relay logs for grace period start');
}

async function testGracePeriod() {
  console.log('⏰ Testing Grace Period Flow\n');
  
  console.log('To test grace period:');
  console.log('1. Wait for grace period to start (after consensus)');
  console.log('2. Call sendHeartbeat() on Sapphire to ping');
  console.log('3. Watch relay record ping on Sepolia');
  console.log('4. Wait for grace period to end');
  console.log('5. Check Chainlink automation processing');
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      await testCompleteFlow();
      break;
    case 'register':
      await testOwnerRegistration();
      break;
    case 'death':
      await testDeathDeclaration();
      break;
    case 'grace':
      await testGracePeriod();
      break;
    default:
      console.log('Usage: node test-flow.js [status|register|death|grace]');
      console.log('\nCommands:');
      console.log('  status  - Check current state of contracts');
      console.log('  register - Test owner registration flow');
      console.log('  death   - Test death declaration flow');
      console.log('  grace   - Test grace period flow');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCompleteFlow, testOwnerRegistration, testDeathDeclaration, testGracePeriod }; 