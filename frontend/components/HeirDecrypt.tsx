'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { decryptFile } from '../lib/crypto/encryption';

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

interface InheritedVault {
  id: string;
  name: string;
  description: string;
  originalOwner: string;
  ownerName: string;
  releaseDate: string;
  canAccess: boolean;
  isReleased: boolean;
  vaultKey?: string;
  files: InheritedFile[];
}

interface InheritedFile {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  cid: string;
  iv: string;
  uploadDate: string;
  isDecrypted: boolean;
}

interface HeirDecryptProps {
  className?: string;
}

export function HeirDecrypt({ className = '' }: HeirDecryptProps) {
  const { address, isConnected } = useAccount();
  const [inheritedVaults, setInheritedVaults] = useState<InheritedVault[]>([]);
  const [selectedVault, setSelectedVault] = useState<InheritedVault | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [vaultPassword, setVaultPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [accessAttempts, setAccessAttempts] = useState(0);
  const [decryptionError, setDecryptionError] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);



  // Mock data - in a real app, this would come from the blockchain
  useEffect(() => {
    const loadInheritedVaults = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const allVaults: InheritedVault[] = [
        {
          id: '1',
          name: 'Sarah\'s Family Documents',
          description: 'Important documents and family photos from Sarah Johnson',
          originalOwner: '0x742d35Cc123456789abcdef0123456789abcdef01',
          ownerName: 'Sarah Johnson',
          releaseDate: '2024-07-01T10:00:00Z',
          canAccess: true,
          isReleased: true,
          vaultKey: 'U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIipRkwB0K1Y=',
          files: [
            {
              id: 'f1',
              originalName: 'family_will.pdf',
              size: 1024768,
              mimeType: 'application/pdf',
              cid: 'QmXr57UuZkiHDGvVxzx9SQ7QW8kJ5N4FZzjnK2dR8f1Xyz',
              iv: 'dGVzdGl2MTIzNDU2Nzg=',
              uploadDate: '2024-01-15T10:15:00Z',
              isDecrypted: false
            },
            {
              id: 'f2',
              originalName: 'family_photos.zip',
              size: 15728640,
              mimeType: 'application/zip',
              cid: 'QmYt68GjKfHqJ8X9HdAcZ7QY9kR5M3FHWbcN2dV6g8Abc',
              iv: 'dGVzdGl2MTIzNDU2NzI=',
              uploadDate: '2024-01-15T10:20:00Z',
              isDecrypted: false
            }
          ]
        },
        // Locked vaults are not visible to heirs
        // {
        //   id: '2',
        //   name: 'Mike\'s Business Assets',
        //   description: 'Business documents and crypto keys from Mike Wilson',
        //   originalOwner: '0x8ba1f109551bd432803012645ac136ddd64dba72',
        //   ownerName: 'Mike Wilson',
        //   releaseDate: '2024-08-15T14:30:00Z',
        //   canAccess: false,
        //   isReleased: false,
        //   files: [...]
        // }
      ];

      // Only show vaults that are released and accessible
      const accessibleVaults = allVaults.filter(vault => vault.isReleased && vault.canAccess);
      setInheritedVaults(accessibleVaults);
      setIsLoading(false);
    };

    loadInheritedVaults();
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

  const handleAccessVault = async (vault: InheritedVault) => {
    setSelectedVault(vault);
    setShowPasswordModal(true);
    setDecryptionError('');
    setAccessAttempts(0);
  };

  const handleVaultAccess = async () => {
    if (!selectedVault) return;

    setIsDecrypting(true);
    setDecryptionProgress(0);
    setDecryptionError('');

    try {
      // Simulate fetching vault key from smart contract
      setDecryptionProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!selectedVault.vaultKey) {
        throw new Error('Vault key not available');
      }

      // Simulate key decryption with password
      setDecryptionProgress(40);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (vaultPassword !== 'demo123') {
        setAccessAttempts(prev => prev + 1);
        if (accessAttempts >= 2) {
          throw new Error('Maximum access attempts exceeded. Please try again later.');
        }
        throw new Error('Invalid password. Please try again.');
      }

      // Mark vault as accessible
      setDecryptionProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

      setInheritedVaults(prev => prev.map(vault => 
        vault.id === selectedVault.id 
          ? { ...vault, canAccess: true, vaultKey: selectedVault.vaultKey }
          : vault
      ));

      setDecryptionProgress(100);
      setShowPasswordModal(false);
      setVaultPassword('');
      
    } catch (error) {
      setDecryptionError(error instanceof Error ? error.message : 'Failed to access vault');
    } finally {
      setIsDecrypting(false);
      setDecryptionProgress(0);
    }
  };

  const handleDecryptFile = async (file: InheritedFile, vault: InheritedVault) => {
    if (!vault.vaultKey) {
      setDecryptionError('Vault key not available');
      return;
    }

    setIsDecrypting(true);
    setDecryptionProgress(0);
    setDecryptionError('');

    try {
      // Retrieve encrypted file from Walrus using direct HTTP API
      setDecryptionProgress(25);
      const res = await fetch(`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${file.cid}`);
      if (!res.ok) throw new Error("Download failed: " + res.statusText);
      const blob = await res.blob();
      const encryptedArrayBuffer = await blob.arrayBuffer();
      
      // Decrypt file using Web Crypto API (matching the encryption method)
      setDecryptionProgress(50);
      const decryptedBlob = await decryptFileWebCrypto(
        encryptedArrayBuffer,
        vault.vaultKey!,
        file.mimeType
      );

      setDecryptionProgress(75);

      // Download decrypted file
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDecryptionProgress(100);
      
      // Mark file as decrypted
      setInheritedVaults(prev => prev.map(v => 
        v.id === vault.id 
          ? {
              ...v,
              files: v.files.map(f => 
                f.id === file.id ? { ...f, isDecrypted: true } : f
              )
            }
          : v
      ));

    } catch (error) {
      setDecryptionError(error instanceof Error ? error.message : 'Failed to decrypt file');
    } finally {
      setIsDecrypting(false);
      setDecryptionProgress(0);
    }
  };

  const handleDecryptAllFiles = async (vault: InheritedVault) => {
    if (!vault.vaultKey) {
      setDecryptionError('Vault key not available');
      return;
    }

    setIsDecrypting(true);
    setDecryptionProgress(0);
    setDecryptionError('');

    try {
      const totalFiles = vault.files.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = vault.files[i];
        setDecryptionProgress(((i + 1) / totalFiles) * 100);
        
        // Retrieve and decrypt each file
        const res = await fetch(`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${file.cid}`);
        if (!res.ok) throw new Error("Download failed: " + res.statusText);
        const blob = await res.blob();
        const encryptedArrayBuffer = await blob.arrayBuffer();
        
        const decryptedBlob = await decryptFileWebCrypto(
          encryptedArrayBuffer,
          vault.vaultKey!,
          file.mimeType
        );

        // Download file
        const url = URL.createObjectURL(decryptedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Mark all files as decrypted
      setInheritedVaults(prev => prev.map(v => 
        v.id === vault.id 
          ? {
              ...v,
              files: v.files.map(f => ({ ...f, isDecrypted: true }))
            }
          : v
      ));

    } catch (error) {
      setDecryptionError(error instanceof Error ? error.message : 'Failed to decrypt files');
    } finally {
      setIsDecrypting(false);
      setDecryptionProgress(0);
    }
  };

  if (!isConnected) {
    return (
      <div className={`backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-white/70">Please connect your wallet to access inherited vaults</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 text-center ${className}`}>
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/70">Loading inherited vaults...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Inherited Vaults</h1>
            <p className="text-white/70">Access and decrypt files from vaults you've inherited</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-sm">Connected as</p>
            <p className="text-white font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
        </div>

        {/* Error Display */}
        {decryptionError && (
          <div className="bg-red-500/10 border border-red-400/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-400 font-medium">Error</p>
            </div>
            <p className="text-red-300 mt-2">{decryptionError}</p>
          </div>
        )}

        {/* Progress Bar */}
        {isDecrypting && (
          <div className="bg-black/20 border border-white/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white font-medium">
                {decryptionProgress < 25 ? 'Accessing vault...' :
                 decryptionProgress < 50 ? 'Retrieving files...' :
                 decryptionProgress < 75 ? 'Decrypting...' :
                 'Completing...'}
              </p>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${decryptionProgress}%` }}
              />
            </div>
            <p className="text-white/60 text-sm mt-2">{decryptionProgress}% complete</p>
          </div>
        )}

        {inheritedVaults.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Available Vaults</h3>
            <p className="text-white/70">You don't have any accessible inherited vaults at this time</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {inheritedVaults.map((vault) => (
              <motion.div
                key={vault.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-sm bg-green-500/10 border border-green-400/50 rounded-2xl p-6 hover:bg-green-500/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">{vault.name}</h3>
                    <p className="text-white/60 text-sm mb-2">{vault.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-white/50">From: {vault.ownerName}</span>
                      <span className="text-white/50">Released: {formatDate(vault.releaseDate)}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-400/50">
                    ✓ Available
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Files:</span>
                    <span className="text-white">{vault.files.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Total Size:</span>
                    <span className="text-white">{formatFileSize(vault.files.reduce((sum, f) => sum + f.size, 0))}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {vault.vaultKey ? (
                    <>
                      <button
                        onClick={() => handleDecryptAllFiles(vault)}
                        disabled={isDecrypting}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 disabled:from-gray-600/50 disabled:to-gray-600/50 text-white font-medium rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                      >
                        📥 Download All
                      </button>
                      <button
                        onClick={() => setSelectedVault(vault)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-300"
                      >
                        👁️ View Files
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAccessVault(vault)}
                      disabled={isDecrypting}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500/90 hover:to-purple-500/90 disabled:from-gray-600/50 disabled:to-gray-600/50 text-white font-medium rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                    >
                      🔓 Access Vault
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Vault Details Modal */}
      <AnimatePresence>
        {selectedVault && selectedVault.vaultKey && (
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
              className="backdrop-blur-md bg-slate-900/90 border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedVault.name}</h2>
                  <p className="text-white/70">{selectedVault.description}</p>
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

              <div className="space-y-4">
                {selectedVault.files.map((file) => (
                  <div key={file.id} className="bg-black/20 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
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
                          <p className="text-white/40 text-xs">Uploaded: {formatDate(file.uploadDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.isDecrypted && (
                          <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                            ✓ Downloaded
                          </span>
                        )}
                        <button
                          onClick={() => handleDecryptFile(file, selectedVault)}
                          disabled={isDecrypting}
                          className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 rounded text-purple-300 text-sm transition-colors disabled:opacity-50"
                        >
                          📥 Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleDecryptAllFiles(selectedVault)}
                  disabled={isDecrypting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 disabled:from-gray-600/50 disabled:to-gray-600/50 text-white font-medium rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
                >
                  📥 Download All Files
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="backdrop-blur-md bg-slate-900/90 border border-white/20 rounded-3xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-6">Access Vault</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Vault Password</label>
                  <input
                    type="password"
                    value={vaultPassword}
                    onChange={(e) => setVaultPassword(e.target.value)}
                    placeholder="Enter vault password"
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/20"
                  />
                  <p className="text-white/50 text-sm mt-2">
                    For demo purposes, use password: <code className="bg-white/10 px-2 py-1 rounded">demo123</code>
                  </p>
                </div>

                {accessAttempts > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-400/50 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ {accessAttempts} failed attempt{accessAttempts > 1 ? 's' : ''}. {3 - accessAttempts} attempts remaining.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleVaultAccess}
                  disabled={isDecrypting || !vaultPassword}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 disabled:from-gray-600/50 disabled:to-gray-600/50 text-white font-medium rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
                >
                  {isDecrypting ? 'Accessing...' : 'Access Vault'}
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
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