'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useLifeSignalRegistryWrite, CONTRACT_ADDRESSES, LIFESIGNAL_REGISTRY_ABI } from '../lib/contracts';
import type { User, VaultFile, Contact } from '../types/models';

interface VaultCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vault: {
    name: string;
    files: File[];
    selectedContacts: string[];
    encryptionKey: string;
    encryptedFiles: { name: string; data: ArrayBuffer }[];
  }) => void;
  availableContacts: Contact[];
}

type Step = 'name' | 'files' | 'contacts';

// Encryption utilities
const generateEncryptionKey = async (): Promise<CryptoKey> => {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

const encryptFile = async (file: File, key: CryptoKey): Promise<{ data: ArrayBuffer; iv: Uint8Array }> => {
  const fileBuffer = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    fileBuffer
  );
  
  // Prepend IV to encrypted data
  const result = new Uint8Array(iv.length + encryptedData.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedData), iv.length);
  
  return { data: result.buffer, iv };
};

const exportKey = async (key: CryptoKey): Promise<string> => {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

const downloadFile = (data: ArrayBuffer, filename: string) => {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Upload encrypted file to Walrus
const uploadToWalrus = async (encryptedData: ArrayBuffer, filename: string): Promise<string | null> => {
  try {
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const res = await fetch(
      "https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=5",
      {
        method: "PUT",
        body: blob,
      }
    );
    
    if (!res.ok) {
      throw new Error(`Upload failed for ${filename}: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    // Extract blobId from response
    const blobId = 
      data?.newlyCreated?.blobObject?.blobId ||
      data?.alreadyCertified?.blobId ||
      "";
    
    const txId = 
      data?.newlyCreated?.blobObject?.id ||
      data?.alreadyCertified?.event?.txDigest ||
      "";
    
    // Console log the Walrus upload details
    console.log(`=== WALRUS UPLOAD SUCCESS ===`);
    console.log(`File: ${filename}`);
    console.log(`Blob ID: ${blobId}`);
    console.log(`Transaction ID: ${txId}`);
    console.log(`Full Response:`, data);
    console.log(`=== END WALRUS UPLOAD ===`);
    
    return blobId;
  } catch (error) {
    console.error(`Failed to upload ${filename} to Walrus:`, error);
    return null;
  }
};

export default function VaultCreator({ isOpen, onClose, onSubmit, availableContacts }: VaultCreatorProps) {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending, error: writeError } = useLifeSignalRegistryWrite();
  
  // Debug logging
  console.log('VaultCreator state:', { isConnected, address, writeContract, isPending, writeError });
  
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [step, setStep] = useState<Step>('name');
  const [isCreating, setIsCreating] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address || !writeContract) {
      console.error('Wallet not connected or missing required data:', { isConnected, address, writeContract });
      alert('Please connect your wallet first');
      return;
    }

    // Check if user is on the correct network (Sapphire Testnet)
    if (typeof window !== 'undefined' && window.ethereum) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const sapphireTestnetChainId = '0x5aff'; // 23295 in hex
      
      if (chainId !== sapphireTestnetChainId) {
        alert('Please switch to Sapphire Testnet network in your wallet');
        return;
      }
    }

    if (!name.trim()) {
      console.error('Vault name is required');
      alert('Please enter a vault name');
      return;
    }

    if (files.length === 0) {
      alert('Please select at least one file');
      return;
    }
    
    try {
      setIsCreating(true);
      setIsEncrypting(true);
      
      // Generate encryption key for this vault
      const encryptionKey = await generateEncryptionKey();
      const exportedKey = await exportKey(encryptionKey);
      
      // Console log the encryption key
      console.log('=== VAULT ENCRYPTION DEBUG ===');
      console.log('Vault Name:', name);
      console.log('Encryption Key (Base64):', exportedKey);
      
      // Encrypt all files and upload to Walrus
      const encryptedFiles: { name: string; data: ArrayBuffer }[] = [];
      const walrusBlobIds: string[] = [];
      
      for (const file of files) {
        const encryptionResult = await encryptFile(file, encryptionKey);
        encryptedFiles.push({
          name: file.name,
          data: encryptionResult.data
        });
        
        // Console log the IV for this file
        const ivHex = Array.from(encryptionResult.iv)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
        console.log(`File: ${file.name}`);
        console.log(`  IV (Hex): ${ivHex}`);
        console.log(`  IV (Base64): ${btoa(String.fromCharCode(...encryptionResult.iv))}`);
        
        // Upload encrypted file to Walrus instead of downloading
        const blobId = await uploadToWalrus(encryptionResult.data, `${file.name}.encrypted`);
        if (blobId) {
          walrusBlobIds.push(blobId);
        }
      }
      
      console.log('=== VAULT WALRUS SUMMARY ===');
      console.log('Total files uploaded:', walrusBlobIds.length);
      console.log('All Blob IDs:', walrusBlobIds);
      console.log('=== END VAULT ENCRYPTION DEBUG ===');
      
      // Use the actual encryption key for blockchain storage
      const cypherIV = Math.random().toString(36).substring(2, 18); // 16 character random string for IV
      
      console.log('Creating vault with:', {
        name,
        cypherIV,
        encryptionKey: exportedKey.substring(0, 8) + '...' // Log partial key for security
      });

      // Create vault on blockchain using smart contract
      console.log('Calling contractUtils.createVault...');
      console.log('Contract address:', CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY);
      console.log('writeContract function:', typeof writeContract);
      
      // Test if writeContract is working
      if (typeof writeContract !== 'function') {
        throw new Error('writeContract is not a function');
      }
      
      // Call writeContract directly to trigger MetaMask popup - use the real encryption key
      console.log('About to call writeContract with args:', [name, cypherIV, exportedKey]);
      
      try {
        const result = await writeContract({
          address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
          abi: LIFESIGNAL_REGISTRY_ABI,
          functionName: 'createVault',
          args: [name, cypherIV, exportedKey],
        });

        console.log('Vault creation transaction result:', result);
      } catch (error) {
        console.error('Error calling createVault:', error);
        
        // Handle specific error types
        let errorMessage = 'Failed to create vault. Please try again.';
        
        if (error instanceof Error) {
          const errorStr = error.message.toLowerCase();
          
          if (errorStr.includes('owner not registered')) {
            errorMessage = 'You must register as an owner first before creating vaults. Please complete your registration.';
          } else if (errorStr.includes('user rejected') || errorStr.includes('user denied')) {
            errorMessage = 'Transaction was cancelled by user.';
          } else if (errorStr.includes('insufficient funds') || errorStr.includes('gas')) {
            errorMessage = 'Insufficient funds for transaction. Please check your wallet balance.';
          } else if (errorStr.includes('network') || errorStr.includes('connection')) {
            errorMessage = 'Network connection error. Please check your internet connection and try again.';
          } else if (errorStr.includes('contract') || errorStr.includes('execution')) {
            errorMessage = 'Smart contract execution failed. The contract may not be deployed or there might be an issue with the blockchain.';
          } else {
            errorMessage = error.message;
          }
        }
        
        alert(errorMessage);
        return;
      }

      // Call the original onSubmit for UI updates
      onSubmit({ 
        name, 
        files, 
        selectedContacts, 
        encryptionKey: exportedKey,
        encryptedFiles 
      });
      
      // Reset form
      setName('');
      setFiles([]);
      setSelectedContacts([]);
      setStep('name');
      onClose();
    } catch (error) {
      console.error('Error creating vault:', error);
      // Show error to user
      alert(`Error creating vault: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
      setIsEncrypting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Vault Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. Family Documents"
                required
              />
            </div>
            
            <div className="flex justify-end mt-6">
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={async () => {
                    console.log('Testing writeContract...');
                    try {
                      await writeContract({
                        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
                        abi: LIFESIGNAL_REGISTRY_ABI,
                        functionName: 'sendHeartbeat',
                        args: [],
                      });
                      console.log('sendHeartbeat test successful');
                    } catch (error) {
                      console.error('sendHeartbeat test failed:', error);
                    }
                  }}
                  disabled={!isConnected || isCreating || isPending}
                  className="px-4 py-2 bg-blue-600/90 hover:bg-blue-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Test Contract
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setStep('files')}
                  disabled={!name.trim() || isCreating || isPending}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Add Files
                </motion.button>
              </div>
            </div>
          </div>
        );

      case 'files':
        return (
          <div className="space-y-4">
            <div
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              className="relative border-2 border-dashed border-white/30 rounded-2xl p-8 text-center hover:border-emerald-400/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Drag & drop files here</p>
                  <p className="text-white/50 text-sm">or click to select files</p>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">Selected Files ({files.length})</h3>
                  <button
                    onClick={() => setFiles([])}
                    className="text-white/60 hover:text-white/80 text-sm"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-white/50 text-sm">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setStep('name')}
                className="px-6 py-2 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20"
              >
                Back
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setStep('contacts')}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
              >
                Next: Add Contacts
              </motion.button>
            </div>
          </div>
        );

      case 'contacts':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-white/80 text-sm font-medium">
                  Select Contacts
                </label>
                <span className="text-white/60 text-xs">
                  {selectedContacts.length} selected
                </span>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {availableContacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedContacts.includes(contact.id)
                        ? 'bg-emerald-500/20 border-emerald-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="text-white font-medium">
                        {contact.firstName} {contact.lastName}
                      </div>
                      <div className="text-white/60 text-sm font-mono">
                        {contact.address ? `${contact.address.slice(0,6)}...${contact.address.slice(-4)}` : 'No address'}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedContacts.includes(contact.id)
                        ? 'border-emerald-500 bg-emerald-500/20'
                        : 'border-white/20'
                    }`}>
                      {selectedContacts.includes(contact.id) && (
                        <span className="text-emerald-500">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setStep('files')}
                className="px-6 py-2 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20"
              >
                Back
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isCreating || isPending}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating || isPending ? 'Creating Vault...' : 'Create Vault'}
              </motion.button>
            </div>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-xl bg-gradient-to-br from-slate-800 via-purple-800 to-slate-800 border border-white/20 rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-white/60 hover:text-white"
          onClick={onClose}
        >
          ✖
        </button>

        <h2 className="text-2xl font-semibold text-white mb-6">Create New Vault</h2>

        {writeError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">
              Error: {writeError.message || 'Failed to create vault'}
            </p>
          </div>
        )}

        {isEncrypting && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <p className="text-blue-300 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Encrypting files and uploading to Walrus...
            </p>
          </div>
        )}
        
        {isCreating && !isEncrypting && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
            <p className="text-emerald-300 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Creating vault on blockchain...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {renderStep()}
        </form>
      </motion.div>
    </div>
  );
} 