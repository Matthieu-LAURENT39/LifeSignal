const { ethers } = require('ethers');
const config = require('./src/config');
const logger = require('./src/utils/logger');

// Test addresses
const TEST_ADDRESS = '0xD448E18287ED6b6D5fa6f5Fe367BB85B93B1058a';

async function testConnections() {
  console.log('🔍 Testing blockchain connections and contract interactions...\n');

  // Test Sepolia connection
  console.log('📡 Testing Sepolia connection...');
  try {
    const sepoliaProvider = new ethers.JsonRpcProvider(config.sepolia.rpcUrl);
    const sepoliaBlock = await sepoliaProvider.getBlockNumber();
    console.log(`✅ Sepolia connected! Current block: ${sepoliaBlock}`);
    
    // Test GracePeriodAutomation contract
    const gracePeriodAbi = [
      'function getOwnerData(address owner) external view returns (uint256 graceInterval, bool isDeceased, bool exists, uint256 lastUpdate)',
      'function getGracePeriodInfo(address owner) external view returns (uint256 graceInterval, bool isDeceased, bool exists, uint256 lastUpdate)',
      'function relayAddress() external view returns (address)',
      'function gracePeriodStart(address) external view returns (uint256)',
      'function hasPinged(address) external view returns (bool)',
      'function processedGracePeriod(address) external view returns (bool)'
    ];
    
    const gracePeriodContract = new ethers.Contract(
      config.sepolia.gracePeriodAutomationAddress,
      gracePeriodAbi,
      sepoliaProvider
    );
    
    console.log(`📋 GracePeriodAutomation contract: ${config.sepolia.gracePeriodAutomationAddress}`);
    
    // Check relay address
    const relayAddress = await gracePeriodContract.relayAddress();
    console.log(`🔗 Contract relay address: ${relayAddress}`);
    console.log(`🔑 Our relay address: ${config.sepolia.relayAddress}`);
    console.log(`✅ Relay addresses match: ${relayAddress.toLowerCase() === config.sepolia.relayAddress.toLowerCase()}`);
    
    if (relayAddress === '0x0000000000000000000000000000000000000000') {
      console.log(`⚠️  WARNING: Contract relay address is zero! Contract needs to be redeployed with correct relay address.`);
    }
    
    // Test owner data call
    try {
      const ownerData = await gracePeriodContract.getOwnerData(TEST_ADDRESS);
      console.log(`📊 Owner data for ${TEST_ADDRESS}:`, {
        graceInterval: ownerData[0].toString(),
        isDeceased: ownerData[1],
        exists: ownerData[2],
        lastUpdate: ownerData[3].toString()
      });
      
      // Check grace period status
      const graceStart = await gracePeriodContract.gracePeriodStart(TEST_ADDRESS);
      const hasPinged = await gracePeriodContract.hasPinged(TEST_ADDRESS);
      const processed = await gracePeriodContract.processedGracePeriod(TEST_ADDRESS);
      
      console.log(`⏰ Grace period status:`, {
        startTime: graceStart.toString(),
        hasPinged: hasPinged,
        processed: processed
      });
      
    } catch (error) {
      console.log(`❌ Failed to get owner data: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Sepolia connection failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test Sapphire connection
  console.log('💎 Testing Sapphire connection...');
  try {
    const sapphireProvider = new ethers.JsonRpcProvider(config.sapphire.rpcUrl);
    const sapphireBlock = await sapphireProvider.getBlockNumber();
    console.log(`✅ Sapphire connected! Current block: ${sapphireBlock}`);
    
    // Test LifeSignalRegistry contract
    const registryAbi = [
      'function getOwnerInfo(address _owner) external view returns (string memory firstName, string memory lastName, uint256 lastHeartbeat, uint256 graceInterval, bool isDeceased, bool exists)',
      'function getContactInfo(address _owner, address _contact) external view returns (bool hasVotingRight, bool isVerified, bool exists)',
      'function getDeathDeclarationStatus(address _owner) external view returns (bool isActive, uint256 startTime, uint256 votesFor, uint256 votesAgainst, uint256 totalVotingContacts, bool consensusReached)',
      'function getContactList(address _owner) external view returns (address[] memory)'
    ];
    
    const registryContract = new ethers.Contract(
      config.sapphire.lifeSignalRegistryAddress,
      registryAbi,
      sapphireProvider
    );
    
    console.log(`📋 LifeSignalRegistry contract: ${config.sapphire.lifeSignalRegistryAddress}`);
    
    // Test owner info call
    try {
      const ownerInfo = await registryContract.getOwnerInfo(TEST_ADDRESS);
      console.log(`📊 Owner info for ${TEST_ADDRESS}:`, {
        firstName: ownerInfo[0],
        lastName: ownerInfo[1],
        lastHeartbeat: ownerInfo[2].toString(),
        graceInterval: ownerInfo[3].toString(),
        isDeceased: ownerInfo[4],
        exists: ownerInfo[5]
      });
      
      // Test contact list
      const contactList = await registryContract.getContactList(TEST_ADDRESS);
      console.log(`👥 Contact list: ${contactList.length} contacts`);
      
      // Test death declaration status
      const deathStatus = await registryContract.getDeathDeclarationStatus(TEST_ADDRESS);
      console.log(`💀 Death declaration status:`, {
        isActive: deathStatus[0],
        startTime: deathStatus[1].toString(),
        votesFor: deathStatus[2].toString(),
        votesAgainst: deathStatus[3].toString(),
        totalVotingContacts: deathStatus[4].toString(),
        consensusReached: deathStatus[5]
      });
      
    } catch (error) {
      console.log(`❌ Failed to get owner info: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Sapphire connection failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🎯 Test completed!');
  
  console.log('\n📋 Summary of issues:');
  console.log('1. Sepolia GracePeriodAutomation relay address is zero - contract needs redeployment');
  console.log('2. Sapphire LifeSignalRegistry has no relay functionality - this is expected');
  console.log('3. Owner data is null because no owners have been registered yet');
}

// Run the test
testConnections().catch(console.error); 