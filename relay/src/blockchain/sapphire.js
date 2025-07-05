const { ethers } = require('ethers');
const config = require('../config');
const logger = require('../utils/logger');

// LifeSignalRegistry ABI (minimal for events and functions)
const LIFE_SIGNAL_REGISTRY_ABI = [
  // Events
  "event OwnerRegistered(address indexed owner, string firstName, string lastName)",
  "event ContactAdded(address indexed owner, address indexed contact, bool hasVotingRight)",
  "event ContactVerified(address indexed owner, address indexed contact)",
  "event HeartbeatSent(address indexed owner, uint256 timestamp)",
  "event DeathDeclared(address indexed owner, address indexed declaredBy, uint256 timestamp)",
  "event VoteCast(address indexed owner, address indexed voter, bool vote)",
  "event ConsensusReached(address indexed owner, bool isDeceased, uint256 timestamp)",
  
  // Functions
  "function getOwnerInfo(address _owner) external view returns (string memory firstName, string memory lastName, uint256 lastHeartbeat, uint256 graceInterval, bool isDeceased, bool exists)",
  "function getDeathDeclarationStatus(address _owner) external view returns (bool isActive, uint256 startTime, uint256 votesFor, uint256 votesAgainst, uint256 totalVotingContacts, bool consensusReached)",
  "function getContactInfo(address _owner, address _contact) external view returns (bool hasVotingRight, bool isVerified, bool exists)",
  "function getContactList(address _owner) external view returns (address[] memory)",
  "function hasVoted(address _owner, address _voter) external view returns (bool)",
  "function getVote(address _owner, address _voter) external view returns (bool)"
];

class SapphireInterface {
  constructor() {
    // Create regular provider for Sapphire (without encryption for now)
    this.provider = new ethers.JsonRpcProvider(config.sapphire.rpcUrl);
    
    this.wallet = new ethers.Wallet(config.sapphire.relayPrivateKey, this.provider);
    this.contract = new ethers.Contract(
      config.sapphire.lifeSignalRegistryAddress,
      LIFE_SIGNAL_REGISTRY_ABI,
      this.wallet
    );
    
    logger.info('Sapphire interface initialized', {
      network: 'Oasis Sapphire Testnet',
      relayAddress: config.sapphire.relayAddress,
      contractAddress: config.sapphire.lifeSignalRegistryAddress
    });
  }

  /**
   * Get owner information from Sapphire
   */
  async getOwnerInfo(ownerAddress) {
    try {
      const info = await this.contract.getOwnerInfo(ownerAddress);
      return {
        firstName: info[0],
        lastName: info[1],
        lastHeartbeat: info[2],
        graceInterval: info[3],
        isDeceased: info[4],
        exists: info[5]
      };
    } catch (error) {
      logger.error('Failed to get owner info from Sapphire', { error: error.message, ownerAddress });
      throw error;
    }
  }

  /**
   * Get death declaration status from Sapphire
   */
  async getDeathDeclarationStatus(ownerAddress) {
    try {
      const status = await this.contract.getDeathDeclarationStatus(ownerAddress);
      return {
        isActive: status[0],
        startTime: status[1],
        votesFor: status[2],
        votesAgainst: status[3],
        totalVotingContacts: status[4],
        consensusReached: status[5]
      };
    } catch (error) {
      logger.error('Failed to get death declaration status from Sapphire', { error: error.message, ownerAddress });
      throw error;
    }
  }

  /**
   * Get contact information from Sapphire
   */
  async getContactInfo(ownerAddress, contactAddress) {
    try {
      const info = await this.contract.getContactInfo(ownerAddress, contactAddress);
      return {
        hasVotingRight: info[0],
        isVerified: info[1],
        exists: info[2]
      };
    } catch (error) {
      logger.error('Failed to get contact info from Sapphire', { error: error.message, ownerAddress, contactAddress });
      throw error;
    }
  }

  /**
   * Get contact list from Sapphire
   */
  async getContactList(ownerAddress) {
    try {
      return await this.contract.getContactList(ownerAddress);
    } catch (error) {
      logger.error('Failed to get contact list from Sapphire', { error: error.message, ownerAddress });
      throw error;
    }
  }

  /**
   * Check if a voter has voted
   */
  async hasVoted(ownerAddress, voterAddress) {
    try {
      return await this.contract.hasVoted(ownerAddress, voterAddress);
    } catch (error) {
      logger.error('Failed to check if voter has voted on Sapphire', { error: error.message, ownerAddress, voterAddress });
      throw error;
    }
  }

  /**
   * Get vote from Sapphire
   */
  async getVote(ownerAddress, voterAddress) {
    try {
      return await this.contract.getVote(ownerAddress, voterAddress);
    } catch (error) {
      logger.error('Failed to get vote from Sapphire', { error: error.message, ownerAddress, voterAddress });
      throw error;
    }
  }

  /**
   * Listen to events from the contract
   */
  async listenToEvents(callback) {
    try {
      logger.info('Starting to listen to Sapphire events');
      
      // Listen to ConsensusReached events
      this.contract.on('ConsensusReached', (ownerAddress, isDeceased, timestamp, event) => {
        logger.info('ConsensusReached event received', {
          ownerAddress,
          isDeceased,
          timestamp: timestamp.toString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
        
        callback('ConsensusReached', {
          ownerAddress,
          isDeceased,
          timestamp: timestamp.toString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });

      // Listen to HeartbeatSent events
      this.contract.on('HeartbeatSent', (ownerAddress, timestamp, event) => {
        logger.info('HeartbeatSent event received', {
          ownerAddress,
          timestamp: timestamp.toString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
        
        callback('HeartbeatSent', {
          ownerAddress,
          timestamp: timestamp.toString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });

      // Listen to OwnerRegistered events
      this.contract.on('OwnerRegistered', (ownerAddress, firstName, lastName, event) => {
        logger.info('OwnerRegistered event received', {
          ownerAddress,
          firstName,
          lastName,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });

      // Listen to DeathDeclared events
      this.contract.on('DeathDeclared', (ownerAddress, declaredBy, timestamp, event) => {
        logger.info('DeathDeclared event received', {
          ownerAddress,
          declaredBy,
          timestamp: timestamp.toString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });

    } catch (error) {
      logger.error('Failed to listen to Sapphire events', { error: error.message });
      throw error;
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber() {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get network info
   */
  async getNetwork() {
    return await this.provider.getNetwork();
  }

  /**
   * Check if owner exists and is not deceased
   */
  async isOwnerActive(ownerAddress) {
    try {
      const ownerInfo = await this.getOwnerInfo(ownerAddress);
      return ownerInfo.exists && !ownerInfo.isDeceased;
    } catch (error) {
      logger.error('Failed to check if owner is active on Sapphire', { error: error.message, ownerAddress });
      return false;
    }
  }

  /**
   * Check if death declaration has consensus
   */
  async hasDeathDeclarationConsensus(ownerAddress) {
    try {
      const status = await this.getDeathDeclarationStatus(ownerAddress);
      return status.isActive && status.consensusReached;
    } catch (error) {
      logger.error('Failed to check death declaration consensus on Sapphire', { error: error.message, ownerAddress });
      return false;
    }
  }
}

module.exports = SapphireInterface; 