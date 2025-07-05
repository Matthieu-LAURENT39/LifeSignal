const { ethers } = require('ethers');
const config = require('../config');
const logger = require('../utils/logger');

// GracePeriodAutomation ABI (minimal for events and relay functions)
const GRACE_PERIOD_ABI = [
  // Events
  "event GracePeriodStarted(address indexed ownerAddress, uint256 startTime, uint256 graceInterval)",
  "event OwnerPinged(address indexed ownerAddress, uint256 pingTime)",
  "event GracePeriodProcessed(address indexed ownerAddress, bool isDead, uint256 processTime)",
  "event OwnerDataUpdated(address indexed ownerAddress, uint256 graceInterval, bool isDeceased)",
  "event RelayAddressUpdated(address indexed oldRelay, address indexed newRelay)",
  
  // Functions
  "function updateOwnerData(address ownerAddress, uint256 graceInterval, bool isDeceased, bool exists) external",
  "function startGracePeriod(address ownerAddress) external",
  "function recordPing(address ownerAddress) external",
  "function getGracePeriodInfo(address ownerAddress) external view returns (uint256 startTime, bool hasPinged, bool processed, uint256 graceInterval, bool isDeceased)",
  "function getOwnerData(address ownerAddress) external view returns (uint256 graceInterval, bool isDeceased, bool exists, uint256 lastUpdate)",
  "function relayAddress() external view returns (address)"
];

class EthereumInterface {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.sepolia.rpcUrl);
    this.wallet = new ethers.Wallet(config.sepolia.relayPrivateKey, this.provider);
    this.contract = new ethers.Contract(
      config.sepolia.gracePeriodAutomationAddress,
      GRACE_PERIOD_ABI,
      this.wallet
    );
    
    logger.info('Ethereum interface initialized', {
      network: 'Sepolia',
      relayAddress: config.sepolia.relayAddress,
      contractAddress: config.sepolia.gracePeriodAutomationAddress
    });
  }

  /**
   * Update owner data on Sepolia from Sapphire
   */
  async updateOwnerData(ownerAddress, graceInterval, isDeceased, exists) {
    try {
      logger.info('Updating owner data on Sepolia', { ownerAddress, graceInterval, isDeceased, exists });
      
      const tx = await this.contract.updateOwnerData(ownerAddress, graceInterval, isDeceased, exists);
      const receipt = await tx.wait();
      
      logger.info('Owner data updated on Sepolia', {
        ownerAddress,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      });
      
      return receipt;
    } catch (error) {
      logger.error('Failed to update owner data on Sepolia', { error: error.message, ownerAddress });
      throw error;
    }
  }

  /**
   * Start grace period on Sepolia
   */
  async startGracePeriod(ownerAddress) {
    try {
      logger.info('Starting grace period on Sepolia', { ownerAddress });
      
      const tx = await this.contract.startGracePeriod(ownerAddress);
      const receipt = await tx.wait();
      
      logger.info('Grace period started on Sepolia', {
        ownerAddress,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      });
      
      return receipt;
    } catch (error) {
      logger.error('Failed to start grace period on Sepolia', { error: error.message, ownerAddress });
      throw error;
    }
  }

  /**
   * Record ping on Sepolia
   */
  async recordPing(ownerAddress) {
    try {
      logger.info('Recording ping on Sepolia', { ownerAddress });
      
      const tx = await this.contract.recordPing(ownerAddress);
      const receipt = await tx.wait();
      
      logger.info('Ping recorded on Sepolia', {
        ownerAddress,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      });
      
      return receipt;
    } catch (error) {
      logger.error('Failed to record ping on Sepolia', { error: error.message, ownerAddress });
      throw error;
    }
  }

  /**
   * Get grace period info from Sepolia
   */
  async getGracePeriodInfo(ownerAddress) {
    try {
      const info = await this.contract.getGracePeriodInfo(ownerAddress);
      return {
        startTime: info[0],
        hasPinged: info[1],
        processed: info[2],
        graceInterval: info[3],
        isDeceased: info[4]
      };
    } catch (error) {
      logger.error('Failed to get grace period info from Sepolia', { error: error.message, ownerAddress });
      throw error;
    }
  }

  /**
   * Get owner data from Sepolia
   */
  async getOwnerData(ownerAddress) {
    try {
      const data = await this.contract.getOwnerData(ownerAddress);
      return {
        graceInterval: data[0],
        isDeceased: data[1],
        exists: data[2],
        lastUpdate: data[3]
      };
    } catch (error) {
      logger.error('Failed to get owner data from Sepolia', { error: error.message, ownerAddress });
      throw error;
    }
  }

  /**
   * Listen to events from the contract
   */
  async listenToEvents(callback) {
    try {
      logger.info('Starting to listen to Sepolia events');
      
      // Listen to GracePeriodProcessed events
      this.contract.on('GracePeriodProcessed', (ownerAddress, isDead, processTime, event) => {
        logger.info('GracePeriodProcessed event received', {
          ownerAddress,
          isDead,
          processTime: processTime.toString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
        
        callback('GracePeriodProcessed', {
          ownerAddress,
          isDead,
          processTime: processTime.toString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });

      // Listen to OwnerDataUpdated events
      this.contract.on('OwnerDataUpdated', (ownerAddress, graceInterval, isDeceased, event) => {
        logger.info('OwnerDataUpdated event received', {
          ownerAddress,
          graceInterval: graceInterval.toString(),
          isDeceased,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });

      // Listen to GracePeriodStarted events
      this.contract.on('GracePeriodStarted', (ownerAddress, startTime, graceInterval, event) => {
        logger.info('GracePeriodStarted event received', {
          ownerAddress,
          startTime: startTime.toString(),
          graceInterval: graceInterval.toString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });

      // Listen to OwnerPinged events
      this.contract.on('OwnerPinged', (ownerAddress, pingTime, event) => {
        logger.info('OwnerPinged event received', {
          ownerAddress,
          pingTime: pingTime.toString(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });

    } catch (error) {
      logger.error('Failed to listen to Sepolia events', { error: error.message });
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
}

module.exports = EthereumInterface; 