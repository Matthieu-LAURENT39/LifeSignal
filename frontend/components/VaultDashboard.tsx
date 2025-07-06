'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract } from 'wagmi';
import { decryptFile } from '../lib/crypto/encryption';
import { CONTRACT_ADDRESSES, LIFE_SIGNAL_REGISTRY_ABI } from '../lib/contracts';

// Web Crypto API decryption function to match the encryption method used in VaultManager
const decryptFileWebCrypto = async (
  encryptedArrayBuffer: ArrayBuffer,
  encryptionKey: string,
  mimeType: string
): Promise<Blob> => {
  try {
    let keyBuffer: Uint8Array;
    
    // Try to detect if the key is base64 or a random string
    try {
      // First try to decode as base64
      keyBuffer = Uint8Array.from(atob(encryptionKey), c => c.charCodeAt(0));
    } catch (e) {
      // If base64 decoding fails, treat as a random string and convert to bytes
      console.log('Key is not base64, treating as random string');
      const encoder = new TextEncoder();
      const keyBytes = encoder.encode(encryptionKey);
      // Pad or truncate to 32 bytes for AES-256
      keyBuffer = new Uint8Array(32);
      keyBuffer.set(keyBytes.slice(0, 32));
    }
    
    // Import the key
    const key = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const encryptedArray = new Uint8Array(encryptedArrayBuffer);
    
    // Extract IV from the beginning (first 12 bytes for AES-GCM)
    const iv = encryptedArray.slice(0, 12);
    const ciphertext = encryptedArray.slice(12);
    
    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );
    
    return new Blob([decryptedData], { type: mimeType });
  } catch (error) {
    throw new Error(`Web Crypto decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

interface Contact {
  id: string;
  address: string;
  name: string;
  email?: string;
  role: 'heir' | 'contact';
  votingWeight: number;
}

interface VaultFile {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  cid: string;
  iv: string;
  uploadDate: string;
  encryptionKey: string;
}

interface Vault {
  id: string;
  name: string;
  description: string;
  owner: string;
  createdAt: string;
  lastPing: string;
  nextPingDue: string;
  pingInterval: number; // in days
  graceWindow: number; // in days
  status: 'active' | 'grace_period' | 'released' | 'expired';
  masterKey: string;
  files: VaultFile[];
  contacts: Contact[];
  totalVotes: number;
  requiredVotes: number;
  isLocked: boolean;
}

interface VaultDashboardProps {
  className?: string;
}

export function VaultDashboard({ className = '' }: VaultDashboardProps) {
  const { address, isConnected } = useAccount();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    address: '',
    name: '',
    email: '',
    role: 'heir' as 'heir' | 'contact',
    votingWeight: 1
  });
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPingTime, setLastPingTime] = useState<string>('');
  const [nextPingDue, setNextPingDue] = useState<string>('');
  const [pingInterval] = useState<number>(14); // 14 days

  // Mock data - in a real app, this would come from the blockchain
  useEffect(() => {
    const loadVaults = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set initial ping times
      const lastPing = '2024-07-03T14:30:00Z';
      const nextPing = '2024-07-17T14:30:00Z';
      setLastPingTime(lastPing);
      setNextPingDue(nextPing);

      const mockVaults: Vault[] = [
        {
          id: '1',
          name: 'Family Documents',
          description: 'Important family documents and photos',
          owner: address,
          createdAt: '2024-01-15T10:00:00Z',
          lastPing: '2024-07-03T14:30:00Z',
          nextPingDue: '2024-07-17T14:30:00Z',
          pingInterval: 14,
          graceWindow: 7,
          status: 'active',
          masterKey: 'U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIipRkwB0K1Y=',
          files: [
            {
              id: 'f1',
              originalName: 'passport.pdf',
              size: 2048576,
              mimeType: 'application/pdf',
              cid: 'QmXr57UuZkiHDGvVxzx9SQ7QW8kJ5N4FZzjnK2dR8f1Xyz',
              iv: 'dGVzdGl2MTIzNDU2Nzg=',
              uploadDate: '2024-01-15T10:15:00Z',
              encryptionKey: 'U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIipRkwB0K1Y='
            },
            {
              id: 'f2',
              originalName: 'family_photo.jpg',
              size: 5242880,
              mimeType: 'image/jpeg',
              cid: 'QmYt68GjKfHqJ8X9HdAcZ7QY9kR5M3FHWbcN2dV6g8Abc',
              iv: 'dGVzdGl2MTIzNDU2NzI=',
              uploadDate: '2024-01-15T10:20:00Z',
              encryptionKey: 'U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIipRkwB0K1Y='
            }
          ],
          contacts: [
            {
              id: 'c1',
              address: '0x742d35Cc123456789abcdef0123456789abcdef01',
              name: 'Sarah Johnson',
              email: 'sarah@example.com',
              role: 'heir',
              votingWeight: 2
            },
            {
              id: 'c2',
              address: '0x8ba1f109551bd432803012645ac136ddd64dba72',
              name: 'Mike Wilson',
              email: 'mike@example.com',
              role: 'contact',
              votingWeight: 1
            }
          ],
          totalVotes: 0,
          requiredVotes: 2,
          isLocked: false
        },
        {
          id: '2',
          name: 'Business Assets',
          description: 'Business documents and crypto keys',
          owner: address,
          createdAt: '2024-02-01T09:00:00Z',
          lastPing: '2024-07-03T14:30:00Z',
          nextPingDue: '2024-07-17T14:30:00Z',
          pingInterval: 30,
          graceWindow: 14,
          status: 'grace_period',
          masterKey: 'U3FsdGVkX2+wvqprZltvSg6qr6h6YkGSJjqSlxC1L2Z=',
          files: [
            {
              id: 'f3',
              originalName: 'crypto_keys.txt',
              size: 1024,
              mimeType: 'text/plain',
              cid: 'QmZu79HjLfIrK9Y0IdBdZ8QX0kN6M4GIXcjO3eW7h9Def',
              iv: 'dGVzdGl2MTIzNDU2NzM=',
              uploadDate: '2024-02-01T09:15:00Z',
              encryptionKey: 'U3FsdGVkX2+wvqprZltvSg6qr6h6YkGSJjqSlxC1L2Z='
            }
          ],
          contacts: [
            {
              id: 'c3',
              address: '0x123d35Cc456789abcdef0123456789abcdef0234',
              name: 'Business Partner',
              role: 'heir',
              votingWeight: 3
            }
          ],
          totalVotes: 1,
          requiredVotes: 2,
          isLocked: false
        }
      ];

      setVaults(mockVaults);
      setIsLoading(false);
    };

    loadVaults();
  }, [isConnected, address]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilNextPing = (nextPingDue: string) => {
    if (!nextPingDue) return { days: 0, hours: 0, minutes: 0, isOverdue: false };
    
    const now = new Date();
    const dueDate = new Date(nextPingDue);
    const diff = dueDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, isOverdue: true };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, isOverdue: false };
  };

  const getPingStatus = (nextPingDue: string) => {
    const timeLeft = getTimeUntilNextPing(nextPingDue);
    
    if (timeLeft.isOverdue) {
      return { status: 'overdue', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-400/50' };
    } else if (timeLeft.days <= 3) {
      return { status: 'urgent', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-400/50' };
    } else if (timeLeft.days <= 7) {
      return { status: 'warning', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-400/50' };
    } else {
      return { status: 'good', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-400/50' };
    }
  };

  const handlePing = () => {
    const now = new Date().toISOString();
    const nextPing = new Date();
    nextPing.setDate(nextPing.getDate() + pingInterval);
    const nextPingString = nextPing.toISOString();
    
    // Update ping times
    setLastPingTime(now);
    setNextPingDue(nextPingString);
    
    // Update all vaults with the new ping
    setVaults(prev => prev.map(vault => ({
      ...vault,
      lastPing: now,
      nextPingDue: nextPingString,
      status: 'active' as const
    })));
  };

  // Update timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update timer
      setVaults(prev => [...prev]);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleAddContact = () => {
    if (!selectedVault || !newContact.address || !newContact.name) return;

    const contact: Contact = {
      id: `c${Date.now()}`,
      address: newContact.address,
      name: newContact.name,
      email: newContact.email || undefined,
      role: newContact.role,
      votingWeight: newContact.votingWeight
    };

    setVaults(prev => prev.map(vault => {
      if (vault.id === selectedVault.id) {
        return {
          ...vault,
          contacts: [...vault.contacts, contact]
        };
      }
      return vault;
    }));

    setNewContact({
      address: '',
      name: '',
      email: '',
      role: 'heir',
      votingWeight: 1
    });
    setShowAddContact(false);
  };

  const handleRemoveContact = (vaultId: string, contactId: string) => {
    setVaults(prev => prev.map(vault => {
      if (vault.id === vaultId) {
        return {
          ...vault,
          contacts: vault.contacts.filter(c => c.id !== contactId)
        };
      }
      return vault;
    }));
  };

  const handleDownloadFile = async (file: VaultFile, vault: Vault) => {
    try {
      // Retrieve encrypted file from Walrus using direct HTTP API
      const res = await fetch(`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${file.cid}`);
      if (!res.ok) throw new Error("Download failed: " + res.statusText);
      const blob = await res.blob();
      const encryptedArrayBuffer = await blob.arrayBuffer();

      // Decrypt the file using Web Crypto API (matching the encryption method)
      const decryptedBlob = await decryptFileWebCrypto(
        encryptedArrayBuffer,
        file.encryptionKey,
        file.mimeType
      );

      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className={`backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-white/70">Please connect your wallet to view your inheritance vaults</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 text-center ${className}`}>
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/70">Loading your vaults...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Inheritance Vaults</h1>
            <p className="text-white/70">Manage your vaults, contacts, and account proof-of-life</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-sm">Connected as</p>
            <p className="text-white font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
        </div>

        {/* Account Ping */}
        {vaults.length > 0 && (
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">Account Proof of Life</h2>
                <p className="text-white/70 mb-4">Send a ping to prove you're alive and reset all vault timers</p>
                
                {/* Timer Display */}
                {nextPingDue && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-white/50 text-sm">Last Ping</p>
                      <p className="text-white font-medium">{lastPingTime ? formatDate(lastPingTime) : 'Never'}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-sm">Next Ping Due</p>
                      <p className="text-white font-medium">{formatDate(nextPingDue)}</p>
                    </div>
                  </div>
                )}
                
                {/* Countdown Timer */}
                {nextPingDue && (
                  <div className={`border rounded-xl p-4 mb-4 ${getPingStatus(nextPingDue).bgColor} ${getPingStatus(nextPingDue).borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm mb-1">Time Until Next Ping</p>
                        {(() => {
                          const timeLeft = getTimeUntilNextPing(nextPingDue);
                          const status = getPingStatus(nextPingDue);
                          
                          if (timeLeft.isOverdue) {
                            return (
                              <p className={`text-lg font-bold ${status.color}`}>
                                ⚠️ OVERDUE
                              </p>
                            );
                          } else {
                            return (
                              <p className={`text-lg font-bold ${status.color}`}>
                                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                              </p>
                            );
                          }
                        })()}
                      </div>
                      <div className="text-right">
                        <p className="text-white/50 text-xs">Interval</p>
                        <p className="text-white font-medium">{pingInterval} days</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Info */}
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
                  <p className="text-blue-300 text-sm">
                    💡 Your ping proves you're alive and resets the countdown for all your vaults. 
                    If you don't ping within {pingInterval} days, your heirs will be able to access your vaults.
                  </p>
                </div>
              </div>
              
              <div className="ml-6">
                <button
                  onClick={handlePing}
                  className="px-6 py-3 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-500/90 hover:to-emerald-500/90 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                >
                  🚀 Send Ping
                </button>
              </div>
            </div>
          </div>
        )}

        {vaults.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-4.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Vaults Found</h3>
            <p className="text-white/70 mb-4">Create your first inheritance vault to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {vaults.map((vault) => {
              return (
                <motion.div
                  key={vault.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedVault(vault)}
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-white mb-1">{vault.name}</h3>
                    <p className="text-white/60 text-sm">{vault.description}</p>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Files:</span>
                      <span className="text-white">{vault.files.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Contacts:</span>
                      <span className="text-white">{vault.contacts.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Created:</span>
                      <span className="text-white">{formatDate(vault.createdAt)}</span>
                    </div>
                  </div>


                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vault Details Modal */}
      <AnimatePresence>
        {selectedVault && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedVault(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="backdrop-blur-md bg-slate-900/90 border border-white/20 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedVault.name}</h2>
                  <p className="text-white/70">{selectedVault.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={`https://explorer.oasis.io/address/${CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-400/30 rounded-lg text-orange-300 text-sm transition-all duration-300 hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Smart Contract
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVault(null)}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Files Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Files ({selectedVault.files.length})</h3>
                    <button className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/50 rounded-lg text-green-300 text-sm transition-colors">
                      + Add Files
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedVault.files.map((file) => (
                      <div key={file.id} className="bg-black/20 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-white font-medium">{file.originalName}</p>
                                <div className="relative">
                                  <button
                                    onMouseEnter={() => setTooltipVisible(file.id)}
                                    onMouseLeave={() => setTooltipVisible(null)}
                                    onClick={() => setTooltipVisible(tooltipVisible === file.id ? null : file.id)}
                                    className="w-4 h-4 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white/60 transition-colors"
                                    title="View Walrus Blob ID"
                                  >
                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                    </svg>
                                  </button>
                                  {tooltipVisible === file.id && (
                                    <div 
                                      className="fixed z-[100] top-1/4 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-600 rounded-lg p-4 min-w-[350px] shadow-2xl"
                                      onMouseEnter={() => setTooltipVisible(file.id)}
                                      onMouseLeave={() => setTooltipVisible(null)}
                                    >
                                      <p className="text-gray-300 text-xs mb-2">Walrus Blob ID:</p>
                                      <div className="flex items-center gap-2 mb-3">
                                        <p className="text-white font-mono text-sm break-all bg-gray-800 p-2 rounded flex-1">{file.cid}</p>
                                        <button
                                          onClick={() => navigator.clipboard.writeText(file.cid)}
                                          className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
                                          title="Copy to clipboard"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                          </svg>
                                        </button>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <a 
                                          href={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${file.cid}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300 underline text-sm"
                                        >
                                          View on Walrus ↗
                                        </a>
                                        <button
                                          onClick={() => setTooltipVisible(null)}
                                          className="text-gray-500 hover:text-gray-300 text-sm"
                                        >
                                          Close
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-white/50 text-sm">{formatFileSize(file.size)}</p>
                              <p className="text-white/40 text-xs">{formatDate(file.uploadDate)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(file, selectedVault)}
                            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 rounded text-blue-300 text-sm transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contacts Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Contacts ({selectedVault.contacts.length})</h3>
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 rounded-lg text-blue-300 text-sm transition-colors"
                    >
                      + Add Contact
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedVault.contacts.map((contact) => (
                      <div key={contact.id} className="bg-black/20 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{contact.name}</p>
                              <span className={`px-2 py-1 rounded text-xs ${contact.role === 'heir' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {contact.role}
                              </span>
                            </div>
                            <p className="text-white/50 text-sm font-mono">{contact.address.slice(0, 8)}...{contact.address.slice(-6)}</p>
                            {contact.email && (
                              <p className="text-white/40 text-xs">{contact.email}</p>
                            )}
                            <p className="text-white/60 text-xs mt-1">Voting Weight: {contact.votingWeight}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveContact(selectedVault.id, contact.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Voting Status */}
                  <div className="mt-6 bg-black/20 rounded-xl p-4">
                    <h4 className="text-white font-medium mb-3">Voting Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Current Votes:</span>
                        <span className="text-white">{selectedVault.totalVotes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Required Votes:</span>
                        <span className="text-white">{selectedVault.requiredVotes}</span>
                      </div>
                      <div className="w-full bg-black/20 rounded-full h-2 mt-3">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((selectedVault.totalVotes / selectedVault.requiredVotes) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-white/60 text-xs text-center mt-2">
                        {selectedVault.totalVotes >= selectedVault.requiredVotes ? 
                          'Sufficient votes to release vault' : 
                          `${selectedVault.requiredVotes - selectedVault.totalVotes} more votes needed`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddContact(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="backdrop-blur-md bg-slate-900/90 border border-white/20 rounded-3xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-6">Add Contact</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Wallet Address *</label>
                  <input
                    type="text"
                    value={newContact.address}
                    onChange={(e) => setNewContact(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contact name"
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Email (Optional)</label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@example.com"
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Role</label>
                    <select
                      value={newContact.role}
                      onChange={(e) => setNewContact(prev => ({ ...prev, role: e.target.value as 'heir' | 'contact' }))}
                      className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="heir">Heir</option>
                      <option value="contact">Contact</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Voting Weight</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newContact.votingWeight}
                      onChange={(e) => setNewContact(prev => ({ ...prev, votingWeight: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleAddContact}
                  disabled={!newContact.address || !newContact.name}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500/90 hover:to-purple-500/90 disabled:from-gray-600/50 disabled:to-gray-600/50 text-white font-medium rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
                >
                  Add Contact
                </button>
                <button
                  onClick={() => setShowAddContact(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 