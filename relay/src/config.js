require('dotenv').config();

const config = {
  // Sepolia (Ethereum) Configuration
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    chainId: 11155111,
    gracePeriodAutomationAddress: process.env.SEPOLIA_GRACE_PERIOD_AUTOMATION_ADDRESS,
    relayPrivateKey: process.env.SEPOLIA_RELAY_PRIVATE_KEY,
    relayAddress: process.env.SEPOLIA_RELAY_ADDRESS,
  },

  // Oasis Sapphire Configuration
  sapphire: {
    rpcUrl: process.env.SAPPHIRE_RPC_URL || 'https://testnet.sapphire.oasis.dev',
    chainId: 23295, // Sapphire testnet
    lifeSignalRegistryAddress: process.env.SAPPHIRE_LIFE_SIGNAL_REGISTRY_ADDRESS,
    relayPrivateKey: process.env.SAPPHIRE_RELAY_PRIVATE_KEY,
    relayAddress: process.env.SAPPHIRE_RELAY_ADDRESS,
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/relay.log',
  },

  // Monitoring Configuration
  monitoring: {
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
    eventPollingInterval: parseInt(process.env.EVENT_POLLING_INTERVAL) || 15000, // 15 seconds
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 5000, // 5 seconds
  },

  // Chainlink Automation Configuration
  chainlink: {
    automationRegistryAddress: process.env.CHAINLINK_AUTOMATION_REGISTRY_ADDRESS || '0xE16Df59B887e3Caa439E0b29B42bA2e7976FD8b2', // Sepolia
    upkeepId: process.env.UPKEEP_ID,
  }
};

// Validation
const requiredEnvVars = [
  'SEPOLIA_RPC_URL',
  'SEPOLIA_GRACE_PERIOD_AUTOMATION_ADDRESS',
  'SEPOLIA_RELAY_PRIVATE_KEY',
  'SEPOLIA_RELAY_ADDRESS',
  'SAPPHIRE_RPC_URL',
  'SAPPHIRE_LIFE_SIGNAL_REGISTRY_ADDRESS',
  'SAPPHIRE_RELAY_PRIVATE_KEY',
  'SAPPHIRE_RELAY_ADDRESS'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

module.exports = config; 