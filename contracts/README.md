# LifeSignal Smart Contracts

Smart contracts for the LifeSignal inheritance vault system, deployed on Oasis Sapphire for privacy-preserving functionality.

## Overview

The LifeSignal system consists of smart contracts that manage:
- Owner registration and identity
- Trusted contact management
- Death declaration voting system
- Heartbeat mechanism for proof of life

## Contracts

### LifeSignalRegistry.sol

Main contract managing owners, contacts, and death declarations.

**Key Features:**
- Owner registration with personal information
- Contact addition with voting rights
- Contact verification system
- Heartbeat mechanism
- Decentralized death declaration voting
- Privacy-preserving data storage

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Add your private key to `.env`:
```
PRIVATE_KEY=your_private_key_without_0x_prefix
```

## Development

### Compile contracts
```bash
npm run compile
```

### Run tests
```bash
npm test
```

### Deploy to Sapphire Testnet
```bash
npm run deploy:testnet
```

### Deploy to Sapphire Mainnet
```bash
npm run deploy:mainnet
```

## Network Configuration

### Sapphire Testnet
- **RPC URL:** https://testnet.sapphire.oasis.dev
- **Chain ID:** 0x5aff (23295)
- **Explorer:** https://testnet.explorer.sapphire.oasis.dev

### Sapphire Mainnet
- **RPC URL:** https://sapphire.oasis.io
- **Chain ID:** 0x5afe (23294)
- **Explorer:** https://explorer.sapphire.oasis.io

## Contract Architecture

```
LifeSignalRegistry
├── Owner Management
│   ├── registerOwner()
│   ├── sendHeartbeat()
│   └── getOwnerInfo()
├── Contact Management
│   ├── addContact()
│   ├── verifyContact()
│   └── getContactInfo()
└── Death Declaration
    ├── declareDeceased()
    ├── voteOnDeathDeclaration()
    └── getDeathDeclarationStatus()
```

## Usage Flow

1. **Owner Registration:**
   ```solidity
   registerOwner("John", "Doe", "john@email.com", "+1234567890", 30 days)
   ```

2. **Add Contacts:**
   ```solidity
   addContact(contactAddress, true) // true = has voting rights
   ```

3. **Contact Verification:**
   ```solidity
   verifyContact(ownerAddress) // Called by contact
   ```

4. **Send Heartbeat:**
   ```solidity
   sendHeartbeat() // Proves owner is alive
   ```

5. **Declare Death:**
   ```solidity
   declareDeceased(ownerAddress) // Initiates voting
   ```

6. **Vote on Declaration:**
   ```solidity
   voteOnDeathDeclaration(ownerAddress, true) // true = confirm death
   ```

## Security Features

- **Privacy:** Uses Oasis Sapphire for confidential smart contracts
- **Access Control:** Role-based permissions for owners and contacts
- **Consensus:** Majority voting required for death declarations
- **Anti-spam:** Grace periods and verification requirements
- **Reversible:** Heartbeats cancel active death declarations

## Testing

The test suite covers:
- Owner registration and validation
- Contact management and verification
- Heartbeat functionality
- Death declaration voting process
- Edge cases and error conditions

Run tests with:
```bash
npx hardhat test
```

## Gas Optimization

The contracts are optimized for:
- Minimal storage usage
- Efficient mapping structures
- Event-based data retrieval
- Batched operations where possible

## Deployment Addresses

After deployment, save the contract addresses:

### Testnet
```
LIFE_SIGNAL_REGISTRY_ADDRESS="0x..."
```

### Mainnet
```
LIFE_SIGNAL_REGISTRY_ADDRESS="0x..."
```

## Integration

To integrate with the frontend:

1. Copy the contract ABI from `artifacts/contracts/LifeSignalRegistry.sol/LifeSignalRegistry.json`
2. Use the deployed contract address
3. Configure the appropriate network in your Web3 provider

## Support

For questions or issues:
- Check the test files for usage examples
- Review the contract documentation
- Open an issue in the repository 