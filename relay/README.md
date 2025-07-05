# LifeSignal Relay Server

A Node.js off-chain relay server that bridges Ethereum Sepolia (Chainlink automation) with Oasis Sapphire (LifeSignalRegistry).

## Architecture

```
[Sapphire LifeSignalRegistry] <-> [Node.js Relay] <-> [Sepolia GracePeriodAutomation + Chainlink]
```

The relay server:
- Listens to events on both blockchains
- Synchronizes owner data between chains
- Handles grace period coordination
- Provides REST API for monitoring and control

## Features

- **Cross-chain Event Listening**: Monitors events on both Sepolia and Sapphire
- **Data Synchronization**: Keeps owner data in sync between chains
- **Grace Period Management**: Coordinates grace periods between chains
- **Health Monitoring**: Continuous health checks and logging
- **REST API**: HTTP endpoints for monitoring and control
- **Error Handling**: Robust error handling and retry mechanisms
- **Security**: Helmet.js security middleware and input validation

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Access to Sepolia testnet (Infura/Alchemy)
- Access to Oasis Sapphire testnet
- Private keys for relay accounts on both chains

## Installation

1. Clone the repository and navigate to the relay directory:
```bash
cd relay
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment example and configure it:
```bash
cp env.example .env
```

4. Edit `.env` with your configuration (see Configuration section)

## Configuration

### Environment Variables

#### Sepolia (Ethereum) Configuration
- `SEPOLIA_RPC_URL`: RPC URL for Sepolia (Infura/Alchemy)
- `SEPOLIA_GRACE_PERIOD_AUTOMATION_ADDRESS`: Deployed GracePeriodAutomation contract address
- `SEPOLIA_RELAY_PRIVATE_KEY`: Private key for relay account on Sepolia
- `SEPOLIA_RELAY_ADDRESS`: Public address of relay account on Sepolia

#### Oasis Sapphire Configuration
- `SAPPHIRE_RPC_URL`: RPC URL for Sapphire testnet
- `SAPPHIRE_LIFE_SIGNAL_REGISTRY_ADDRESS`: Deployed LifeSignalRegistry contract address
- `SAPPHIRE_RELAY_PRIVATE_KEY`: Private key for relay account on Sapphire
- `SAPPHIRE_RELAY_ADDRESS`: Public address of relay account on Sapphire

#### Server Configuration
- `PORT`: HTTP server port (default: 3000)
- `HOST`: HTTP server host (default: localhost)

#### Monitoring Configuration
- `HEALTH_CHECK_INTERVAL`: Health check interval in ms (default: 30000)
- `EVENT_POLLING_INTERVAL`: Event polling interval in ms (default: 15000)
- `MAX_RETRIES`: Maximum retry attempts (default: 3)
- `RETRY_DELAY`: Delay between retries in ms (default: 5000)

## Usage

### Starting the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### API Endpoints

#### Health Check
```bash
GET /health
```

#### Service Status
```bash
GET /status
```

#### Start Relay Service
```bash
POST /start
```

#### Stop Relay Service
```bash
POST /stop
```

#### Get Owner Data
```bash
GET /owner/:address
```

#### Get Grace Period Info
```bash
GET /grace-period/:address
```

## Deployment Steps

### 1. Deploy LifeSignalRegistry on Sapphire

Deploy your LifeSignalRegistry contract on Oasis Sapphire testnet.

### 2. Deploy GracePeriodAutomation on Sepolia

```bash
cd contracts
npm run deploy:grace-period:sepolia -- --relay-address YOUR_RELAY_ADDRESS
```

### 3. Set Up Relay Accounts

Create two accounts (one for each chain) and fund them with test tokens.

### 4. Configure Environment

Update the `.env` file with all required addresses and private keys.

### 5. Start the Relay

```bash
cd relay
npm start
```

## Event Flow

### 1. Death Declaration Consensus (Sapphire → Sepolia)

1. Contacts vote on death declaration on Sapphire
2. Consensus is reached (majority votes for death)
3. Relay detects `ConsensusReached` event
4. Relay updates owner data on Sepolia
5. Relay starts grace period on Sepolia

### 2. Owner Ping (Sapphire → Sepolia)

1. Owner sends heartbeat on Sapphire
2. Relay detects `HeartbeatSent` event
3. Relay records ping on Sepolia

### 3. Grace Period Processing (Sepolia → Chainlink)

1. Chainlink automation checks grace period status
2. If grace period ended, automation processes result
3. Relay detects `GracePeriodProcessed` event
4. Relay can trigger additional actions

## Monitoring

### Logs

Logs are written to:
- `logs/combined.log`: All logs
- `logs/error.log`: Error logs only

### Health Checks

The server performs periodic health checks:
- Blockchain connectivity
- Contract accessibility
- Cache status

### Metrics

Monitor the following metrics:
- Event processing rate
- Cross-chain transaction success rate
- Cache hit/miss ratio
- Error rates

## Security Considerations

1. **Private Keys**: Store private keys securely, never commit them to version control
2. **Network Security**: Use HTTPS in production
3. **Access Control**: Implement authentication for API endpoints in production
4. **Rate Limiting**: Consider implementing rate limiting for API endpoints
5. **Monitoring**: Set up alerts for critical errors and service downtime

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check RPC URLs and network connectivity
2. **Gas Errors**: Ensure relay accounts have sufficient funds
3. **Contract Errors**: Verify contract addresses and ABIs
4. **Event Listening**: Check if events are being emitted correctly

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in your `.env` file.

## Development

### Project Structure

```
relay/
├── src/
│   ├── blockchain/
│   │   ├── ethereum.js      # Sepolia interface
│   │   └── sapphire.js      # Sapphire interface
│   ├── services/
│   │   └── relayService.js  # Main relay logic
│   ├── utils/
│   │   └── logger.js        # Logging utility
│   ├── config.js            # Configuration
│   └── index.js             # Server entry point
├── package.json
├── env.example
└── README.md
```

### Adding New Events

1. Add event signature to the appropriate ABI
2. Add event listener in the blockchain interface
3. Add event handler in the relay service
4. Update tests

### Testing

```bash
npm test
```

## License

MIT 