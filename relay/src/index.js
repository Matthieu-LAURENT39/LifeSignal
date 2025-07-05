const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const RelayService = require('./services/relayService');
const logger = require('./utils/logger');
const config = require('./config');

// Utility function to serialize BigInt values for JSON
const serializeBigInt = (data) => {
  if (!data) return null;
  if (typeof data === 'bigint') return data.toString();
  if (Array.isArray(data)) return data.map(serializeBigInt);
  if (typeof data === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }
  return data;
};

class RelayServer {
  constructor() {
    this.app = express();
    this.relayService = new RelayService();
    this.server = null;
  }

  /**
   * Initialize the server
   */
  initialize() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'lifesignal-relay'
      });
    });

    // Status endpoint
    this.app.get('/status', (req, res) => {
      const status = this.relayService.getStatus();
      res.json({
        ...status,
        timestamp: new Date().toISOString()
      });
    });

    // Start relay endpoint
    this.app.post('/start', async (req, res) => {
      try {
        await this.relayService.start();
        res.json({ 
          success: true, 
          message: 'Relay service started',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to start relay service via API', { error: error.message });
        res.status(500).json({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Stop relay endpoint
    this.app.post('/stop', async (req, res) => {
      try {
        await this.relayService.stop();
        res.json({ 
          success: true, 
          message: 'Relay service stopped',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to stop relay service via API', { error: error.message });
        res.status(500).json({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Get owner data endpoint
    this.app.get('/owner/:address', async (req, res) => {
      try {
        const { address } = req.params;
        
        // Get data from both chains
        const [sepoliaData, sapphireData] = await Promise.all([
          this.relayService.ethereum.getOwnerData(address).catch(() => null),
          this.relayService.sapphire.getOwnerInfo(address).catch(() => null)
        ]);

        res.json({
          address,
          sepolia: serializeBigInt(sepoliaData),
          sapphire: serializeBigInt(sapphireData),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to get owner data', { address: req.params.address, error: error.message });
        res.status(500).json({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Get grace period info endpoint
    this.app.get('/grace-period/:address', async (req, res) => {
      try {
        const { address } = req.params;
        const gracePeriodInfo = await this.relayService.ethereum.getGracePeriodInfo(address);
        
        res.json({
          address,
          gracePeriodInfo: serializeBigInt(gracePeriodInfo),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to get grace period info', { address: req.params.address, error: error.message });
        res.status(500).json({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error', { error: error.message, stack: error.stack });
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ 
        success: false, 
        error: 'Not found',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Start the server
   */
  async start() {
    try {
      this.initialize();
      
      this.server = this.app.listen(config.server.port, config.server.host, () => {
        logger.info(`Relay server started`, {
          host: config.server.host,
          port: config.server.port
        });
      });

      // Start the relay service
      await this.relayService.start();

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start relay server', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    try {
      // Stop the relay service
      await this.relayService.stop();

      // Stop the HTTP server
      if (this.server) {
        this.server.close(() => {
          logger.info('Relay server stopped');
        });
      }
    } catch (error) {
      logger.error('Failed to stop relay server', { error: error.message });
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down relay server...');
    await this.stop();
    process.exit(0);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new RelayServer();
  server.start().catch((error) => {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  });
}

module.exports = RelayServer; 