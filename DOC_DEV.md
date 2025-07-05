# 🛠️ Technical Documentation – Life Signal

This document outlines the core technologies used in the project and how to install and run the codebase locally.

---

## 🧩 Tech Stack Overview

### 🧠 Self
**Self** is a decentralized identity protocol that lets users prove attributes (like being alive) **privately and self-sovereignly**, without revealing sensitive information. It’s ideal for zero-knowledge identity flows in privacy-first dApps.

### 🧊 Walrus
**Walrus** is a decentralized cold-storage solution optimized for encrypted files. It offers:
- Long-term storage
- High availability
- Better read/write performance than IPFS
Perfect for storing sensitive user data like inheritance documents.

### 🛡️ Oasis Sapphire
**Oasis Sapphire** is a confidential EVM-compatible blockchain. It enables smart contracts to keep data (like encryption keys) **private**, even on-chain. This is critical for secure inheritance scenarios.

### ⛓️ Chainlink Automation
**Chainlink Automation** runs decentralized off-chain logic to monitor smart contract conditions.  
We use it to detect **user inactivity** (via "life pings") and trigger inheritance when needed. It currently runs on **Sepolia testnet**.

### 🌐 Next.js + Tailwind + Ethers.js
- **Next.js**: React-based framework for building the frontend.
- **Tailwind CSS**: Utility-first styling for clean and fast UI development.
- **Ethers.js**: Used for blockchain interaction (e.g., contract calls, wallet connection).

### 🧪 Hardhat v2 + Ignition
- **Hardhat**: Development framework for compiling, deploying, and testing smart contracts.
- **Ignition**: Deployment orchestration tool by Hardhat for reproducible, modular deployments.

---

## 🚀 Project Setup & Installation

### 🔧 Prerequisites

- Node.js v20+
- npm
- Metamask
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/Matthieu-LAURENT39/LifeSignal.git
cd lifesignal
```

### 2. Install dependencies
```bash
npm install
```

### 3. Launch application
```bash
cd frontend
npm run dev
```



