'use client';

import { WalletConnectButton } from '../../components/WalletConnectButton';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Debug Mode
            </h1>
            <p className="text-lg text-white/80 mb-4">
              Outils de développement et de test
            </p>
            <Link href="/" className="text-white/60 hover:text-white/80 text-sm transition-colors">
              ← Retour à l&apos;accueil
            </Link>
          </div>
          
          {/* Wallet Connect Button Demo */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Boutons de connexion (test)</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <WalletConnectButton size="lg" />
              <div className="flex gap-2">
                <WalletConnectButton variant="secondary" size="md" />
                <WalletConnectButton variant="outline" size="md" />
              </div>
            </div>
          </div>
          
          {/* Debug Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Actions de développement</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/vault">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-500/90 hover:to-teal-500/90 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
                >
                  🔒 Create Vault
                </motion.button>
              </Link>
              
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500/90 hover:to-purple-500/90 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-indigo-500/25"
                >
                  📊 Dashboard
                </motion.button>
              </Link>
              
              <Link href="/heir-decrypt">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                >
                  🔑 Heir Access
                </motion.button>
              </Link>
              
              <Link href="/heir-register?token=demo-token-123">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500/90 hover:to-blue-500/90 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                >
                  📝 Heir Register
                </motion.button>
              </Link>
              
              <Link href="/test-encryption">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-orange-600/80 to-red-600/80 hover:from-orange-500/90 hover:to-red-500/90 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-orange-500/25"
                >
                  🧪 Test Lab
                </motion.button>
              </Link>
            </div>
          </div>
          
          {/* Technical Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Confidential Smart Contracts</h3>
              <p className="text-white/60">Powered by Sapphire network for private key management</p>
            </div>
            
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AES-256 Encryption</h3>
              <p className="text-white/60">Client-side encryption for maximum security</p>
            </div>
            
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Walrus Storage</h3>
              <p className="text-white/60">Decentralized storage for your encrypted files</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 