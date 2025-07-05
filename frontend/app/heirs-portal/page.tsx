'use client';

import { WalletConnectButton } from '../../components/WalletConnectButton';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HeirsPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      {/* Wallet Button - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <WalletConnectButton size="md" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 px-4 py-8 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Link href="/" className="text-white/60 hover:text-white/80 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                Heirs Portal
              </h1>
            </div>
            <p className="text-xl text-white/80">
              Access your inheritance files securely
            </p>
          </div>
          
          {/* Inheritance Status */}
          <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl p-6 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏛️</span>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Inheritance Access</h2>
              <p className="text-white/60 mb-6">
                You have access to inheritance files from 2 vaults
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">2</div>
                  <div className="text-sm text-white/60">Available Vaults</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400 mb-1">8</div>
                  <div className="text-sm text-white/60">Total Files</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-400 mb-1">1.2 GB</div>
                  <div className="text-sm text-white/60">Total Size</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Access Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Direct Access */}
            <div className="backdrop-blur-md bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔑</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Direct Access</h3>
                <p className="text-white/60 text-sm">Access files directly with your wallet</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/80">
                  <span>✅</span>
                  <span>Automatically detected vaults</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <span>✅</span>
                  <span>Instant file access</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <span>✅</span>
                  <span>Secure decryption</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Link href="/heir-decrypt">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300"
                  >
                    Access Files
                  </motion.button>
                </Link>
              </div>
            </div>
            
            {/* Link Access */}
            <div className="backdrop-blur-md bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-2xl p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔗</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Link Access</h3>
                <p className="text-white/60 text-sm">Use an inheritance link to access files</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/80">
                  <span>✅</span>
                  <span>One-time access links</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <span>✅</span>
                  <span>No wallet required</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <span>✅</span>
                  <span>Secure token-based access</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Link href="/heir-register?token=demo-token-123">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-pink-600/80 to-rose-600/80 hover:from-pink-500/90 hover:to-rose-500/90 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300"
                  >
                    Use Link
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Available Vaults */}
          <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Available Inheritance Vaults</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span>📄</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Personal Documents</h3>
                    <p className="text-white/60 text-sm">From: John Doe • 4 files</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-lg border border-purple-500/30">
                    View Files
                  </button>
                  <button className="px-3 py-1 bg-white/10 text-white/60 text-xs rounded-lg border border-white/20">
                    Download All
                  </button>
                </div>
              </div>
              
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <span>🏦</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Financial Records</h3>
                    <p className="text-white/60 text-sm">From: Jane Smith • 4 files</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-pink-600/20 text-pink-400 text-xs rounded-lg border border-pink-500/30">
                    View Files
                  </button>
                  <button className="px-3 py-1 bg-white/10 text-white/60 text-xs rounded-lg border border-white/20">
                    Download All
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/heir-decrypt">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300"
              >
                Access All Files
              </motion.button>
            </Link>
            <Link href="/debug">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300"
              >
                Developer Tools
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 