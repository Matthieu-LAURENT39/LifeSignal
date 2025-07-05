'use client';

import { WalletConnectButton } from '../../components/WalletConnectButton';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface VaultFile {
  id: string;
  originalName: string;
  mimeType: string;
  cid: string;
  uploadDate: string;
}

interface Vault {
  id: string;
  name: string;
  owner: string;
  files: VaultFile[];
  contacts: Contact[];
  isReleased: boolean;
  cypher: {
    iv: string;
    encryptionKey: string;
  };
}

interface Contact {
  id: string;
  address: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  email?: string;
  hasVotingRight: boolean;
  isIdVerified: boolean;
  vaults: Vault[];
  user: User;
}

interface User {
    id: string;
    address: string;
    name: string;
    email?: string;
    status: 'active' | 'voting_in_progress' | 'grace_period' | 'dead';
    graceInterval: number; // in days (30 days for death declaration)
    deathDeclaration: {
        declaredBy: string;
        declaredAt: string;
        votes: { contactId: string; voted: boolean; votedAt: string }[];
        consensusReached: boolean;
        consensusReachedAt?: string;
    } | null;
    vaults: Vault[];
    contacts: Contact[];
  }

const buildMockData = (ownerAddr: string): User => {
  // files
  const f1: VaultFile = {
    id: 'f1',
    originalName: 'passport.pdf',
    mimeType: 'application/pdf',
    cid: 'QmXr…xyz',
    uploadDate: '2024-01-15T10:15:00Z'
  };

  // vaults
  const v1: Vault = {
    id: 'v1',
    name: 'Family Documents',
    owner: ownerAddr,
    files: [f1],
    contacts: [],           // remplis plus bas
    isReleased: false,
    cypher: {
      iv: 'dGVzdA==',
      encryptionKey: 'base64-key…'
    },
  };

  const v2: Vault = {
    id: 'v2',
    name: 'Business Assets',
    owner: ownerAddr,
    files: [],
    contacts: [],
    isReleased: false,
    cypher: {
      iv: 'dGVzdDI=',
      encryptionKey: 'base64-key-2'
    },
  };

  // contacts
  const c1: Contact = {
    id: 'c1',
    address: '0xHeir1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@example.com',
    birthDate: '1990-03-12',
    hasVotingRight: true,
    isIdVerified: true,
    vaults: [], // filled later
    user: {} as User
  };

  const c2: Contact = {
    id: 'c2',
    address: '0xHeir2',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike@example.com',
    birthDate: '1988-07-22',
    hasVotingRight: false,
    isIdVerified: true,
    vaults: [],
    user: {} as User
  };

  // link contacts to vaults
  v1.contacts = [c1, c2];
  v2.contacts = [c1];
  c1.vaults = [v1, v2];
  c2.vaults = [v1];

  // utilisateur courant
  const user: User = {
    id: 'u1',
    address: ownerAddr,
    name: 'Alice Owner',
    email: 'alice@domain.com',
    status: 'active',
    graceInterval: 30,
    deathDeclaration: null,
    vaults: [v1, v2],
    contacts: [c1, c2]
  };

  // close circular refs
  c1.user = user;
  c2.user = user;

  return user;
};

export default function UserPortal() {
  const { address, isConnected } = useAccount();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) {
      setIsLoading(false);
      return;
    }

    // simulate API / chain fetch
    const timer = setTimeout(() => {
      setCurrentUser(buildMockData(address));
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [isConnected, address]);

  // Calculate real statistics
  const activeVaults = currentUser?.vaults.filter(v => !v.isReleased).length ?? 0;
  const totalFiles = currentUser?.vaults.reduce((n, v) => n + v.files.length, 0) ?? 0;
  const totalHeirsCount = currentUser?.contacts.length ?? 0;
  const vaultsInDanger = 0;

  // Get recent vaults (last 3)
  const recentVaults = currentUser?.vaults.slice(0, 3) ?? [];

  const getVaultIcon = (vaultName: string) => {
    if (vaultName.toLowerCase().includes('family')) return '🏦';
    if (vaultName.toLowerCase().includes('business')) return '💼';
    if (vaultName.toLowerCase().includes('property')) return '🏠';
    return '📄';
  };

  const getVaultColor = (index: number) => {
    const colors = [
      'from-emerald-500 to-teal-500',
      'from-teal-500 to-cyan-500',
      'from-cyan-500 to-blue-500'
    ];
    return colors[index % colors.length];
  };

  const getVaultButtonColor = (index: number) => {
    const colors = [
      'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
      'bg-teal-600/20 text-teal-400 border-teal-500/30',
      'bg-cyan-600/20 text-cyan-400 border-cyan-500/30'
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your vaults...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
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
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                User Portal
              </h1>
            </div>
            <p className="text-xl text-white/80">
              Manage your inheritance vaults and digital legacy
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">{activeVaults}</div>
              <div className="text-sm text-white/60">Active Vaults</div>
            </div>
            <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-teal-400 mb-1">{totalFiles}</div>
              <div className="text-sm text-white/60">Total Files</div>
            </div>
            <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400 mb-1">{totalHeirsCount}</div>
              <div className="text-sm text-white/60">Heirs</div>
            </div>
          </div>
          
          {/* Vaults Section */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Your Vaults</h2>
            <Link href="/vault">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
              >
                <span>➕</span> Create Vault
              </motion.button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {currentUser?.vaults.map((vault, index) => (
              <div key={vault.id} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                {/* Gradient ring */}
                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${getVaultColor(index)} blur-2xl opacity-30`} />

                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getVaultColor(index)} rounded-2xl flex items-center justify-center text-xl`}>
                    {getVaultIcon(vault.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{vault.name}</h3>
                    <p className="text-white/60 text-xs">
                      {vault.files.length} files • {vault.contacts.length} heirs
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 relative z-10">
                  <button className="flex-1 px-3 py-2 bg-white/10 text-white/80 text-xs rounded-lg border border-white/20 hover:bg-white/20">Open</button>
                  <button className="flex-1 px-3 py-2 bg-white/5 text-white/50 text-xs rounded-lg border border-white/20 hover:bg-white/10">Manage</button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Contacts Section */}
          <div className="flex items-center justify-between mb-4 mt-2">
            <h2 className="text-2xl font-semibold text-white">Your Contacts</h2>
            <Link href="/dashboard#add-contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
              >
                <span>➕</span> Add Contact
              </motion.button>
            </Link>
          </div>

          <div className="overflow-x-auto mb-12 backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl">
            <table className="min-w-full text-sm text-white/80">
              <thead className="bg-white/10 text-xs uppercase tracking-wider text-white/60">
                <tr>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Address</th>
                  <th className="py-3 px-4 text-center">Voting</th>
                  <th className="py-3 px-4 text-center">ID Verified</th>
                  <th className="py-3 px-4 text-center">Vaults</th>
                </tr>
              </thead>
              <tbody>
                {currentUser?.contacts.map((c, idx) => (
                  <tr key={c.id} className={idx % 2 ? 'bg-white/5' : ''}>
                    <td className="py-3 px-4 whitespace-nowrap">{c.firstName} {c.lastName}</td>
                    <td className="py-3 px-4 font-mono">{c.address.slice(0,6)}…{c.address.slice(-4)}</td>
                    <td className="py-3 px-4 text-center">
                      {c.hasVotingRight ? <span className="text-green-400">Yes</span> : <span className="text-gray-400">No</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.isIdVerified ? '✔️' : '❌'}
                    </td>
                    <td className="py-3 px-4 text-center">{c.vaults.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Developer link */}
          <div className="text-center">
            <Link href="/debug" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Developer Tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 