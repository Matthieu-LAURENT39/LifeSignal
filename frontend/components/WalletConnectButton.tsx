'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';

interface WalletConnectButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function WalletConnectButton({ 
  className = '', 
  variant = 'primary',
  size = 'md' 
}: WalletConnectButtonProps) {
  const baseStyles = `
    relative overflow-hidden font-medium transition-all duration-300 
    backdrop-blur-md border border-white/20 shadow-lg 
    hover:shadow-2xl hover:shadow-indigo-500/25
    active:scale-95
  `;

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-indigo-600/80 to-purple-600/80 
      hover:from-indigo-500/90 hover:to-purple-500/90 
      text-white shadow-indigo-500/25
    `,
    secondary: `
      bg-white/10 hover:bg-white/20 
      text-white border-indigo-400/50 
      hover:border-indigo-300/70
    `,
    outline: `
      bg-transparent hover:bg-indigo-500/20 
      text-indigo-300 border-indigo-400/50 
      hover:text-white hover:border-indigo-300
    `
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl'
  };

  const buttonClasses = `
    ${baseStyles} 
    ${variantStyles[variant]} 
    ${sizeStyles[size]} 
    ${className}
  `;

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openConnectModal}
                    type="button"
                    className={buttonClasses}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-xl opacity-70" />
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Connect Wallet
                    </span>
                  </motion.button>
                );
              }

              if (chain.unsupported) {
                return (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openChainModal}
                    type="button"
                    className={`${buttonClasses} !bg-red-500/80 hover:!bg-red-500/90`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-full blur-xl opacity-70" />
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Wrong Network
                    </span>
                  </motion.button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openChainModal}
                    type="button"
                    className={`${buttonClasses} !px-3 !py-2`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-xl opacity-70" />
                    <span className="relative z-10 flex items-center gap-2">
                      {chain.hasIcon && (
                        <div className="w-4 h-4 rounded-full overflow-hidden">
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              className="w-full h-full"
                            />
                          )}
                        </div>
                      )}
                      <span className="hidden sm:inline">{chain.name}</span>
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openAccountModal}
                    type="button"
                    className={buttonClasses}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-xl opacity-70" />
                    <span className="relative z-10 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
                      <span className="hidden sm:inline">
                        {account.displayName}
                      </span>
                      <span className="sm:hidden">
                        {account.displayName.slice(0, 6)}...
                      </span>
                      <span className="text-xs opacity-70">
                        {account.displayBalance ? ` (${account.displayBalance})` : ''}
                      </span>
                    </span>
                  </motion.button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
} 