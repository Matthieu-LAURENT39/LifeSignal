require("@nomicfoundation/hardhat-toolbox");
require("@oasisprotocol/sapphire-hardhat");
require("@nomicfoundation/hardhat-ignition-ethers");

require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable intermediate representation to fix stack too deep
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    "sapphire-testnet": {
      url: "https://testnet.sapphire.oasis.dev",
      chainId: 0x5aff,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    "sapphire-mainnet": {
      url: "https://sapphire.oasis.io",
      chainId: 0x5afe,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    "sepolia": {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      "sapphire-testnet": "test",
      "sapphire-mainnet": "test",
    },
    customChains: [
      {
        network: "sapphire-testnet",
        chainId: 0x5aff,
        urls: {
          apiURL: "https://testnet.explorer.sapphire.oasis.dev/api",
          browserURL: "https://testnet.explorer.sapphire.oasis.dev",
        },
      },
      {
        network: "sapphire-mainnet",
        chainId: 0x5afe,
        urls: {
          apiURL: "https://explorer.sapphire.oasis.io/api",
          browserURL: "https://explorer.sapphire.oasis.io",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
}; 