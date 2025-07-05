'use client';

import { WalletConnectButton } from './WalletConnectButton';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function Portal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      {/* Wallet Button - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <WalletConnectButton size="md" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              LifeSignal
            </h1>
            <p className="text-xl text-white/80">
              Choose your portal
            </p>
          </div>
          
          {/* Portal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User Portal */}
            <Link href="/user-portal">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 cursor-pointer"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">👤</span>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-4">User Portal</h2>
                  
                  <p className="text-white/80 mb-6 leading-relaxed">
                    Create and manage your inheritance vaults. Upload files, set up heirs, and secure your digital legacy.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-white/60">
                      <span>🔒</span>
                      <span>Create vaults</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-white/60">
                      <span>📁</span>
                      <span>Upload files</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-white/60">
                      <span>👥</span>
                      <span>Manage heirs</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="inline-flex items-center gap-2 text-emerald-400 font-semibold">
                      <span>Enter Portal</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
            
            {/* Heir Portal */}
            <Link href="/heirs-portal">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 cursor-pointer"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🏛️</span>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-4">Heirs Portal</h2>
                  
                  <p className="text-white/80 mb-6 leading-relaxed">
                    Access files from your inheritance. Use your inheritance link to decrypt and download secured files.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-white/60">
                      <span>🔑</span>
                      <span>Access files</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-white/60">
                      <span>📥</span>
                      <span>Download content</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-white/60">
                      <span>🔐</span>
                      <span>Decrypt vaults</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="inline-flex items-center gap-2 text-purple-400 font-semibold">
                      <span>Enter Portal</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
          
          {/* Back to home */}
          <div className="text-center mt-12">
            <Link href="/" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 