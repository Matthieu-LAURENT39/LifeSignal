import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@oasisprotocol/sapphire-hardhat";
import * as dotenv from "dotenv";

// Load environment variables from .env file in root path
dotenv.config({ path: "../.env" });

const accounts = process.env.SAPPHIRE_PRIVATE_KEY ? [process.env.SAPPHIRE_PRIVATE_KEY] : {
  mnemonic: "test test test test test test test test test test test junk",
  path: "m/44'/60'/0'/0",
  initialIndex: 0,
  count: 20,
  passphrase: "",
};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    "sapphire": {
      url: process.env.SAPPHIRE_RPC_URL || "https://sapphire.oasis.io",
      chainId: 0x5afe,
      accounts,
    },
    "sapphire-testnet": {
      url: process.env.SAPPHIRE_TESTNET_RPC_URL || "https://testnet.sapphire.oasis.io",
      accounts,
      chainId: 0x5aff,
    }
  }
};

export default config;
