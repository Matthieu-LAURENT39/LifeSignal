'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useLifeSignalRegistryWrite, contractUtils, CONTRACT_ADDRESSES, LIFESIGNAL_REGISTRY_ABI } from '../lib/contracts';
import { useReadContract } from 'wagmi';
import type { Vault, VaultFile, Contact } from '../types/models';

interface VaultManagerProps {
  className?: string;
}

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

export default function VaultManager({ className = '' }: VaultManagerProps) {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending, error: writeError } = useLifeSignalRegistryWrite();

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateVault, setShowCreateVault] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);
  const [showAuthorizeContact, setShowAuthorizeContact] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isUploadingToWalrus, setIsUploadingToWalrus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [newVault, setNewVault] = useState({
    name: '',
    encryptionKey: '',
    iv: ''
  });

  const [contactToAuthorize, setContactToAuthorize] = useState('');

  // Get detailed vault list using wagmi v2 hooks
  const { data: vaultListDetails, error: vaultListDetailsError } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFESIGNAL_REGISTRY_ABI,
    functionName: 'getOwnerVaultListDetails',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    }
  });

  // Debug logging
  console.log('VaultManager state:', { 
    isConnected, 
    address, 
    vaultListDetails, 
    vaultListDetailsError,
    vaults: vaults.length 
  });

  // Load vault details when vault list is available
  useEffect(() => {
    if (!vaultListDetails || !Array.isArray(vaultListDetails) || vaultListDetails.length < 8) {
      setVaults([]);
      setIsLoading(false);
      return;
    }

    // vaultListDetails is an array: [vaultIds, names, vaultOwners, isReleased, cypherIvs, encryptionKeys, fileIds, authorizedContacts]
    const vaultIds = vaultListDetails[0] as readonly bigint[];
    const names = vaultListDetails[1] as readonly string[];
    const vaultOwners = vaultListDetails[2] as readonly string[];
    const isReleased = vaultListDetails[3] as readonly boolean[];
    const cypherIvs = vaultListDetails[4] as readonly string[];
    const encryptionKeys = vaultListDetails[5] as readonly string[];
    const fileIds = vaultListDetails[6] as readonly (readonly bigint[])[];
    const authorizedContacts = vaultListDetails[7] as readonly (readonly string[])[];

    if (!vaultIds || vaultIds.length === 0) {
      setVaults([]);
      setIsLoading(false);
      return;
    }

    // Create vault objects with real data from blockchain
    const vaultDetails: Vault[] = vaultIds.map((vaultId: bigint, index: number) => ({
      id: vaultId.toString(),
      name: names?.[index] || `Vault ${index + 1}`,
      owner: vaultOwners?.[index] || address || '',
      files: [], // Would need to fetch individual file details
      contacts: [], // Would need to fetch individual contact details
      isReleased: isReleased?.[index] || false,
      cypher: {
        iv: cypherIvs?.[index] || 'placeholder',
        encryptionKey: encryptionKeys?.[index] || 'placeholder'
      },
      // Store the authorized contacts count for display
      authorizedContactsCount: authorizedContacts?.[index]?.length || 0
    }));

    setVaults(vaultDetails);
    setIsLoading(false);
  }, [vaultListDetails, address]);

  // Get detailed contact list using wagmi v2 hooks
  const { data: contactListDetails, error: contactListDetailsError } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFESIGNAL_REGISTRY_ABI,
    functionName: 'getContactListDetails',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    }
  });

  // Load contact details when contact list is available
  useEffect(() => {
    if (!contactListDetails || !Array.isArray(contactListDetails) || contactListDetails.length < 7) {
      setAvailableContacts([]);
      return;
    }

    // contactListDetails is an array: [contactAddresses, firstNames, lastNames, emails, phones, hasVotingRights, isVerified]
    const contactAddresses = contactListDetails[0] as string[];
    const firstNames = contactListDetails[1] as string[];
    const lastNames = contactListDetails[2] as string[];
    const emails = contactListDetails[3] as string[];
    const phones = contactListDetails[4] as string[];
    const hasVotingRights = contactListDetails[5] as boolean[];
    const isVerified = contactListDetails[6] as boolean[];

    if (!contactAddresses || contactAddresses.length === 0) {
      setAvailableContacts([]);
      return;
    }

    // Create contact objects with real data from blockchain
    const contacts: Contact[] = contactAddresses.map((contactAddr: string, index: number) => ({
      id: contactAddr,
      address: contactAddr,
      firstName: firstNames?.[index] || `Contact ${index + 1}`,
      lastName: lastNames?.[index] || '',
      email: emails?.[index] || 'contact@example.com',
      phone: phones?.[index] || '+1234567890',
      isIdVerified: isVerified?.[index] || false,
      hasVotingRight: hasVotingRights?.[index] || false,
      vaults: [],
      owner: {
        id: address || '',
        address: address || '',
        firstName: 'Owner',
        lastName: '',
        status: 'active' as const,
        graceInterval: 30,
        deathDeclaration: null,
        hasVotingRight: false,
        isIdVerified: true,
        vaults: [],
        contacts: []
      }
    }));

    setAvailableContacts(contacts);
  }, [contactListDetails]);

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeContract || !address) return;

    try {
      // Generate simple keys for the vault (no encryption)
      const encryptionKey = Math.random().toString(36);
      const iv = Math.random().toString(36);

      writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFESIGNAL_REGISTRY_ABI,
        functionName: 'createVault',
        args: [newVault.name, iv, encryptionKey],
      });

      setShowCreateVault(false);
      setNewVault({ name: '', encryptionKey: '', iv: '' });
      
      // Reload vaults after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error creating vault:', error);
    }
  };

  // File upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setUploadedFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeContract || !selectedVault || uploadedFiles.length === 0) return;

    try {
      setIsEncrypting(true);
      setIsUploadingToWalrus(true);

      console.log('=== BULK FILE ENCRYPTION DEBUG ===');
      console.log('Total files to process:', uploadedFiles.length);

      // Process all files
      for (const file of uploadedFiles) {
        // Generate encryption key for each file
        const encryptionKey = await generateEncryptionKey();
        const exportedKey = await exportKey(encryptionKey);

        console.log(`Processing file: ${file.name}`);
        console.log(`Encryption Key (Base64): ${exportedKey}`);

        // Encrypt file
        const encryptionResult = await encryptFile(file, encryptionKey);
        
        // Console log the IV
        const ivHex = Array.from(encryptionResult.iv)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
        console.log(`IV (Hex): ${ivHex}`);
        console.log(`IV (Base64): ${btoa(String.fromCharCode(...encryptionResult.iv))}`);

        // Upload to Walrus
        const blobId = await uploadToWalrus(encryptionResult.data, `${file.name}.encrypted`);
        
        if (blobId) {
          // Add file to vault on blockchain
          const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await writeContract({
            address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
            abi: LIFESIGNAL_REGISTRY_ABI,
            functionName: 'addVaultFile',
            args: [BigInt(selectedVault.id), file.name, file.type, blobId, new Date().toISOString()],
          });

          console.log(`File ${file.name} uploaded successfully with Blob ID: ${blobId}`);
        } else {
          console.error(`Failed to upload ${file.name} to Walrus`);
        }
      }

      console.log('=== END BULK FILE ENCRYPTION DEBUG ===');

      setShowAddFile(false);
      resetAddFileForm();
      
      // Reload vaults after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error adding files:', error);
      alert('Failed to add files. Please try again.');
    } finally {
      setIsEncrypting(false);
      setIsUploadingToWalrus(false);
    }
  };

  const handleAuthorizeContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeContract || !selectedVault) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFESIGNAL_REGISTRY_ABI,
        functionName: 'authorizeVaultContact',
        args: [BigInt(selectedVault.id), contactToAuthorize as `0x${string}`],
      });

      setShowAuthorizeContact(false);
      setContactToAuthorize('');
      
      // Reload vaults after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error authorizing contact:', error);
    }
  };

  const resetAddFileForm = () => {
    setUploadedFiles([]);
    setIsEncrypting(false);
    setIsUploadingToWalrus(false);
  };

  const handleReleaseVault = async (vaultId: string) => {
    if (!writeContract) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFESIGNAL_REGISTRY_ABI,
        functionName: 'releaseVault',
        args: [BigInt(vaultId)],
      });
      
      // Reload vaults after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error releasing vault:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className={`bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 ${className}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Vault Manager</h2>
          <p className="text-white/60">Please connect your wallet to manage vaults</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">Vault Manager</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateVault(true)}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 shadow-lg"
        >
          Create Vault
        </motion.button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : vaults.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Vaults Found</h3>
          <p className="text-white/60 mb-6">Create your first vault to start managing your digital assets</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateVault(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all duration-200"
          >
            Create Your First Vault
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((vault) => (
            <motion.div
              key={vault.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{vault.name}</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  vault.isReleased 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {vault.isReleased ? 'Released' : 'Active'}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-white/60 text-sm">
                  <span className="w-20">Owner:</span>
                  <span className="font-mono">{vault.owner.slice(0, 6)}...{vault.owner.slice(-4)}</span>
                </div>
                <div className="flex items-center text-white/60 text-sm">
                  <span className="w-20">Contacts:</span>
                  <span>{vault.authorizedContactsCount || 0}</span>
                </div>
                <div className="flex items-center text-white/60 text-sm">
                  <span className="w-20">Files:</span>
                  <span>{vault.files?.length || 0}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedVault(vault);
                    setShowAddFile(true);
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors"
                >
                  Add File
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedVault(vault);
                    setShowAuthorizeContact(true);
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors"
                >
                  Add Contact
                </motion.button>
              </div>

              {vault.isReleased && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReleaseVault(vault.id)}
                  className="w-full mt-3 px-4 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Release Vault
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Vault Modal */}
      <AnimatePresence>
        {showCreateVault && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full mx-4"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Create New Vault</h3>
              
              <form onSubmit={handleCreateVault} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Vault Name
                  </label>
                  <input
                    type="text"
                    value={newVault.name}
                    onChange={(e) => setNewVault(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="e.g. Family Documents"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowCreateVault(false)}
                    className="flex-1 px-6 py-3 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isPending || !newVault.name}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Creating...' : 'Create Vault'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add File Modal */}
      <AnimatePresence>
        {showAddFile && selectedVault && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full mx-4"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Add File to {selectedVault.name}</h3>
              
              {/* Loading States */}
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
              
              {/* File Upload Section */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Upload Files
                  </label>
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={handleDragOver}
                    className="relative border-2 border-dashed border-white/30 rounded-xl p-6 text-center hover:border-emerald-400/50 transition-colors cursor-pointer"
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
                    
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">Click to select files</p>
                        <p className="text-white/50 text-sm">or drag & drop multiple files here</p>
                      </div>
                    </div>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium">Selected Files ({uploadedFiles.length})</h3>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles([])}
                        className="text-white/60 hover:text-white/80 text-sm"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {uploadedFiles.map((file, index) => (
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
                            type="button"
                            onClick={() => removeFile(index)}
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
              </div>
              
              <form onSubmit={handleAddFile} className="space-y-4">

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setShowAddFile(false);
                      resetAddFileForm();
                    }}
                    className="flex-1 px-6 py-3 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isPending || isEncrypting || uploadedFiles.length === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEncrypting ? 'Processing Files...' : uploadedFiles.length > 0 ? `Add ${uploadedFiles.length} File${uploadedFiles.length !== 1 ? 's' : ''}` : 'Add Files'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Authorize Contact Modal */}
      <AnimatePresence>
        {showAuthorizeContact && selectedVault && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full mx-4"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Authorize Contact for {selectedVault.name}</h3>
              
              <form onSubmit={handleAuthorizeContact} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Contact Address
                  </label>
                  <select
                    value={contactToAuthorize}
                    onChange={(e) => setContactToAuthorize(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  >
                    <option value="">Select a contact</option>
                    {availableContacts.map((contact) => (
                      <option key={contact.id} value={contact.address}>
                        {contact.firstName} {contact.lastName} ({contact.address?.slice(0, 6)}...{contact.address?.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowAuthorizeContact(false)}
                    className="flex-1 px-6 py-3 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isPending || !contactToAuthorize}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Authorizing...' : 'Authorize Contact'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {writeError && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-lg">
          <p className="text-sm">
            {writeError?.message || 'An error occurred'}
          </p>
        </div>
      )}
    </div>
  );
} 