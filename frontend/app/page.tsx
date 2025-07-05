'use client';

import { WalletConnectButton } from '../components/WalletConnectButton';
import { Portal } from '../components/Portal';
import { WarningModal } from '../components/WarningModal';
import Link from 'next/link';
import { useAccount, useBalance } from 'wagmi';
import { useState, useEffect } from 'react';

export default function Home() {
  const { isConnected, address } = useAccount();
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);
  
  // Get balance for the connected address
  const { data: balanceData } = useBalance({
    address: address,
  });

  // Check balance when connected
  useEffect(() => {
    if (isConnected && balanceData) {
      const balanceInEth = parseFloat(balanceData.formatted);
      if (balanceInEth < 0.5) {
        setShowBalanceWarning(true);
      }
    }
  }, [isConnected, balanceData]);

  // Show portal when connected and has sufficient balance
  if (isConnected) {
    const balanceInEth = balanceData ? parseFloat(balanceData.formatted) : 0;
    
    if (balanceInEth >= 0.5) {
      return <Portal />;
    } else {
      // Show warning modal and landing page
      return (
        <>
          <WarningModal
            isOpen={showBalanceWarning}
            onClose={() => setShowBalanceWarning(false)}
            title="Insufficient Balance"
            message="We need 0.5 tokens in your wallet to proceed. Please add more tokens to your wallet and try again."
            icon={
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            }
            actionText="Add Tokens"
            onAction={() => {
              // Could open a modal or redirect to a faucet
              console.log('User wants to add tokens');
            }}
          />
          
          {/* Show landing page when balance is insufficient */}
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
                  
                  {/* Balance Warning */}
                  <div className="bg-yellow-500/10 border border-yellow-400/50 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-yellow-400 font-medium">Insufficient Balance</span>
                    </div>
                    <p className="text-yellow-300 text-sm">
                      Your wallet needs at least 0.5 tokens to use LifeSignal. 
                      Current balance: {balanceData ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}` : 'Loading...'}
                    </p>
                  </div>
                  
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
        </>
      );
    }
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
