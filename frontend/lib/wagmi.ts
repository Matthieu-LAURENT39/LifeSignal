import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { defineChain } from 'viem';

// Define Sapphire Testnet chain
export const sapphireTestnet = defineChain({
  id: 23295,
  name: 'Sapphire Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TEST',
    symbol: 'TEST',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.sapphire.oasis.dev'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Sapphire Testnet Explorer',
      url: 'https://testnet.explorer.sapphire.oasis.dev',
    },
  },
  testnet: true,
});

// Define Sapphire Mainnet chain
export const sapphireMainnet = defineChain({
  id: 23294,
  name: 'Sapphire',
  nativeCurrency: {
    decimals: 18,
    name: 'ROSE',
    symbol: 'ROSE',
  },
  rpcUrls: {
    default: {
      http: ['https://sapphire.oasis.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Sapphire Explorer',
      url: 'https://explorer.sapphire.oasis.io',
    },
  },
  testnet: false,
});

export const config = getDefaultConfig({
  appName: 'LifeSignal - Crypto Inheritance Vault',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [sapphireTestnet, sapphireMainnet],
  transports: {
    [sapphireTestnet.id]: http('https://testnet.sapphire.oasis.dev', {
      timeout: 20000,
      retryCount: 3,
      retryDelay: 1000,
    }),
    [sapphireMainnet.id]: http('https://sapphire.oasis.io', {
      timeout: 20000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
  ssr: true,
}); 