const EthereumInterface = require('../blockchain/ethereum');
const SapphireInterface = require('../blockchain/sapphire');
const logger = require('../utils/logger');
const config = require('../config');

class RelayService {
  constructor() {
    this.ethereum = new EthereumInterface();
    this.sapphire = new SapphireInterface();
    this.isRunning = false;
    this.ownerDataCache = new Map(); // Cache owner data to avoid frequent queries
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache timeout
  }

  /**
   * Start the relay service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Relay service is already running');
      return;
    }

    try {
      logger.info('Starting relay service...');

      // Initialize connections
      await this.initializeConnections();

      // Start event listeners
      await this.startEventListeners();

      // Start periodic tasks
      this.startPeriodicTasks();

      this.isRunning = true;
      logger.info('Relay service started successfully');
    } catch (error) {
      logger.error('Failed to start relay service', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the relay service
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('Relay service is not running');
      return;
    }

    try {
      logger.info('Stopping relay service...');
      
      // Stop periodic tasks
      this.stopPeriodicTasks();
      
      this.isRunning = false;
      logger.info('Relay service stopped successfully');
    } catch (error) {
      logger.error('Failed to stop relay service', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize blockchain connections
   */
  async initializeConnections() {
    try {
      // Test Sepolia connection
      const sepoliaBlock = await this.ethereum.getBlockNumber();
      const sepoliaNetwork = await this.ethereum.getNetwork();
      logger.info('Sepolia connection established', { 
        blockNumber: sepoliaBlock,
        chainId: sepoliaNetwork.chainId
      });

      // Test Sapphire connection
      const sapphireBlock = await this.sapphire.getBlockNumber();
      const sapphireNetwork = await this.sapphire.getNetwork();
      logger.info('Sapphire connection established', { 
        blockNumber: sapphireBlock,
        chainId: sapphireNetwork.chainId
      });

    } catch (error) {
      logger.error('Failed to initialize connections', { error: error.message });
      throw error;
    }
  }

  /**
   * Start event listeners for both blockchains
   */
  async startEventListeners() {
    try {
      // Listen to Sapphire events
      await this.sapphire.listenToEvents((eventType, eventData) => {
        this.handleSapphireEvent(eventType, eventData);
      });

      // Listen to Sepolia events
      await this.ethereum.listenToEvents((eventType, eventData) => {
        this.handleSepoliaEvent(eventType, eventData);
      });

      logger.info('Event listeners started');
    } catch (error) {
      logger.error('Failed to start event listeners', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle events from Sapphire
   */
  async handleSapphireEvent(eventType, eventData) {
    try {
      logger.info('Processing Sapphire event', { eventType, ownerAddress: eventData.ownerAddress });

      switch (eventType) {
        case 'ConsensusReached':
          await this.handleConsensusReached(eventData);
          break;
        case 'HeartbeatSent':
          await this.handleHeartbeatSent(eventData);
          break;
        case 'OwnerRegistered':
          await this.handleOwnerRegistered(eventData);
          break;
        default:
          logger.debug('Unhandled Sapphire event type', { eventType });
      }
    } catch (error) {
      logger.error('Failed to handle Sapphire event', { 
        eventType, 
        ownerAddress: eventData.ownerAddress, 
        error: error.message 
      });
    }
  }

  /**
   * Handle events from Sepolia
   */
  async handleSepoliaEvent(eventType, eventData) {
    try {
      logger.info('Processing Sepolia event', { eventType, ownerAddress: eventData.ownerAddress });

      switch (eventType) {
        case 'GracePeriodProcessed':
          await this.handleGracePeriodProcessed(eventData);
          break;
        default:
          logger.debug('Unhandled Sepolia event type', { eventType });
      }
    } catch (error) {
      logger.error('Failed to handle Sepolia event', { 
        eventType, 
        ownerAddress: eventData.ownerAddress, 
        error: error.message 
      });
    }
  }

  /**
   * Handle consensus reached on Sapphire
   */
  async handleConsensusReached(eventData) {
    const { ownerAddress, isDeceased } = eventData;

    try {
      if (isDeceased) {
        // Death confirmed, start grace period on Sepolia
        await this.startGracePeriodOnSepolia(ownerAddress);
      } else {
        // Death rejected, update owner data on Sepolia
        await this.updateOwnerDataOnSepolia(ownerAddress);
      }
    } catch (error) {
      logger.error('Failed to handle consensus reached', { 
        ownerAddress, 
        isDeceased, 
        error: error.message 
      });
    }
  }

  /**
   * Handle heartbeat sent on Sapphire
   */
  async handleHeartbeatSent(eventData) {
    const { ownerAddress } = eventData;

    try {
      // Record ping on Sepolia
      await this.ethereum.recordPing(ownerAddress);
    } catch (error) {
      logger.error('Failed to handle heartbeat sent', { 
        ownerAddress, 
        error: error.message 
      });
    }
  }

  /**
   * Handle owner registered on Sapphire
   */
  async handleOwnerRegistered(eventData) {
    const { ownerAddress } = eventData;

    try {
      // Update owner data on Sepolia
      await this.updateOwnerDataOnSepolia(ownerAddress);
    } catch (error) {
      logger.error('Failed to handle owner registered', { 
        ownerAddress, 
        error: error.message 
      });
    }
  }

  /**
   * Handle grace period processed on Sepolia
   */
  async handleGracePeriodProcessed(eventData) {
    const { ownerAddress, isDead } = eventData;

    try {
      if (isDead) {
        // Owner is confirmed dead, could trigger additional actions
        logger.info('Owner confirmed dead after grace period', { ownerAddress });
        // TODO: Implement additional actions like notifying heirs, etc.
      } else {
        // Owner is alive, could trigger additional actions
        logger.info('Owner confirmed alive after grace period', { ownerAddress });
        // TODO: Implement additional actions
      }
    } catch (error) {
      logger.error('Failed to handle grace period processed', { 
        ownerAddress, 
        isDead, 
        error: error.message 
      });
    }
  }

  /**
   * Start grace period on Sepolia
   */
  async startGracePeriodOnSepolia(ownerAddress) {
    try {
      // First update owner data
      await this.updateOwnerDataOnSepolia(ownerAddress);
      
      // Then start grace period
      await this.ethereum.startGracePeriod(ownerAddress);
      
      logger.info('Grace period started on Sepolia', { ownerAddress });
    } catch (error) {
      logger.error('Failed to start grace period on Sepolia', { 
        ownerAddress, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update owner data on Sepolia from Sapphire
   */
  async updateOwnerDataOnSepolia(ownerAddress) {
    try {
      // Get owner data from Sapphire
      const ownerInfo = await this.sapphire.getOwnerInfo(ownerAddress);
      
      // Update on Sepolia
      await this.ethereum.updateOwnerData(
        ownerAddress,
        ownerInfo.graceInterval,
        ownerInfo.isDeceased,
        ownerInfo.exists
      );

      // Update cache
      this.ownerDataCache.set(ownerAddress, {
        ...ownerInfo,
        lastUpdate: Date.now()
      });

      logger.info('Owner data updated on Sepolia', { ownerAddress });
    } catch (error) {
      logger.error('Failed to update owner data on Sepolia', { 
        ownerAddress, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Start periodic tasks
   */
  startPeriodicTasks() {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, config.monitoring.healthCheckInterval);

    // Cache cleanup every 10 minutes
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, 10 * 60 * 1000);

    logger.info('Periodic tasks started');
  }

  /**
   * Stop periodic tasks
   */
  stopPeriodicTasks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    logger.info('Periodic tasks stopped');
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    try {
      const sepoliaBlock = await this.ethereum.getBlockNumber();
      const sapphireBlock = await this.sapphire.getBlockNumber();
      
      logger.debug('Health check completed', {
        sepoliaBlock,
        sapphireBlock,
        cacheSize: this.ownerDataCache.size
      });
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
    }
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [address, data] of this.ownerDataCache.entries()) {
      if (now - data.lastUpdate > this.cacheTimeout) {
        this.ownerDataCache.delete(address);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Cache cleanup completed', { cleanedCount });
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      cacheSize: this.ownerDataCache.size,
      sepoliaAddress: config.sepolia.relayAddress,
      sapphireAddress: config.sapphire.relayAddress
    };
  }
}

module.exports = RelayService; 