'use client';

import { WalletConnectButton } from '../components/WalletConnectButton';
import { Portal } from '../components/Portal';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();

  // Show portal when connected
  if (isConnected) {
    return <Portal />;
  }

  // Show simple landing page when not connected
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 px-4 py-8 md:py-16">
        <div className="max-w-lg mx-auto text-center">
          {/* Header */}
          <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              LifeSignal
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-6 leading-relaxed">
              Secure your digital legacy with confidential blockchain
            </p>
            
            <p className="text-sm md:text-base text-white/60 mb-8">
              Create encrypted inheritance vaults on the Sapphire network. 
              Your files are protected by AES-256 encryption and confidential smart contracts.
            </p>
            
            {/* Wallet Connect */}
            <div className="mb-6">
              <WalletConnectButton size="lg" />
            </div>
            
            <div className="text-xs text-white/50">
              Connect your wallet to get started
            </div>
          </div>
          
          {/* Debug link */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <Link href="/debug" className="text-white/40 hover:text-white/60 text-xs transition-colors">
              Developer Mode
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
