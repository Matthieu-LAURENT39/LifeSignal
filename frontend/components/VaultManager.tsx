'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useLifeSignalRegistryRead, useLifeSignalRegistryWrite, contractUtils, CONTRACT_ADDRESSES, LIFESIGNAL_REGISTRY_ABI } from '../lib/contracts';
import { useReadContract } from 'wagmi';
import type { Vault, VaultFile, User } from '../types/models';

interface VaultManagerProps {
  className?: string;
}

export default function VaultManager({ className = '' }: VaultManagerProps) {
  const { address, isConnected } = useAccount();
  const { data: readData, error: readError } = useLifeSignalRegistryRead();
  const { writeContract, isPending, error: writeError } = useLifeSignalRegistryWrite();

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateVault, setShowCreateVault] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);
  const [showAuthorizeContact, setShowAuthorizeContact] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<User[]>([]);

  // Form states
  const [newVault, setNewVault] = useState({
    name: '',
    vaultId: '',
    encryptionKey: '',
    iv: ''
  });

  const [newFile, setNewFile] = useState({
    originalName: '',
    mimeType: '',
    cid: '',
    fileId: ''
  });

  const [contactToAuthorize, setContactToAuthorize] = useState('');

  // Get owner's vault list using wagmi v2 hooks
  const { data: vaultList, error: vaultListError } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFESIGNAL_REGISTRY_ABI,
    functionName: 'getOwnerVaultList',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    }
  });

  // Debug logging
  console.log('VaultManager state:', { 
    isConnected, 
    address, 
    vaultList, 
    vaultListError,
    vaults: vaults.length 
  });

  // Load vault details when vault list is available
  useEffect(() => {
    if (!vaultList || vaultList.length === 0) {
      setVaults([]);
      setIsLoading(false);
      return;
    }

    // For now, create simple vault objects with basic info
    // In a real implementation, you'd need to create individual hooks for each vault
    const vaultDetails: Vault[] = vaultList.map((vaultId: string, index: number) => ({
      id: vaultId,
      name: `Vault ${index + 1}`,
      owner: address || '',
      files: [],
      contacts: [],
      isReleased: false,
      cypher: {
        iv: 'placeholder',
        encryptionKey: 'placeholder'
      }
    }));

    setVaults(vaultDetails);
    setIsLoading(false);
  }, [vaultList, address]);

  // Get available contacts using wagmi v2 hooks
  const { data: contactList, error: contactListError } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFESIGNAL_REGISTRY_ABI,
    functionName: 'getContactList',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    }
  });

  // Load contact details when contact list is available
  useEffect(() => {
    if (!contactList || contactList.length === 0) {
      setAvailableContacts([]);
      return;
    }

    // For now, create simple contact objects
    // In a real implementation, you'd need to create individual hooks for each contact
    const contacts: User[] = contactList.map((contactAddr: string, index: number) => ({
      id: contactAddr,
      address: contactAddr,
      firstName: `Contact`,
      lastName: contactAddr.slice(0, 6) + '...' + contactAddr.slice(-4),
      isIdVerified: true // Placeholder
    }));

    setAvailableContacts(contacts);
  }, [contactList]);

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
        args: [newVault.vaultId as `0x${string}`, newVault.name, iv, encryptionKey],
      });

      setShowCreateVault(false);
      setNewVault({ name: '', vaultId: '', encryptionKey: '', iv: '' });
      
      // Reload vaults after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error creating vault:', error);
    }
  };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeContract || !selectedVault) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFESIGNAL_REGISTRY_ABI,
        functionName: 'addVaultFile',
        args: [selectedVault.id as `0x${string}`, newFile.fileId, newFile.originalName, newFile.mimeType, newFile.cid, new Date().toISOString()],
      });

      setShowAddFile(false);
      setNewFile({ originalName: '', mimeType: '', cid: '', fileId: '' });
      
      // Reload vaults after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error adding file:', error);
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
        args: [selectedVault.id as `0x${string}`, contactToAuthorize as `0x${string}`],
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

  const handleReleaseVault = async (vaultId: string) => {
    if (!writeContract) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFESIGNAL_REGISTRY_ABI,
        functionName: 'releaseVault',
        args: [vaultId as `0x${string}`],
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
                  <span>{vault.contacts?.length || 0}</span>
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

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Vault ID (Wallet Address)
                  </label>
                  <input
                    type="text"
                    value={newVault.vaultId}
                    onChange={(e) => setNewVault(prev => ({ ...prev, vaultId: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="0x..."
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
                    disabled={isPending || !newVault.name || !newVault.vaultId}
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
              
              <form onSubmit={handleAddFile} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={newFile.originalName}
                    onChange={(e) => setNewFile(prev => ({ ...prev, originalName: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="document.pdf"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    MIME Type
                  </label>
                  <input
                    type="text"
                    value={newFile.mimeType}
                    onChange={(e) => setNewFile(prev => ({ ...prev, mimeType: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="application/pdf"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    File ID
                  </label>
                  <input
                    type="text"
                    value={newFile.fileId}
                    onChange={(e) => setNewFile(prev => ({ ...prev, fileId: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="unique-file-id"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    CID (IPFS Hash)
                  </label>
                  <input
                    type="text"
                    value={newFile.cid}
                    onChange={(e) => setNewFile(prev => ({ ...prev, cid: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Qm..."
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowAddFile(false)}
                    className="flex-1 px-6 py-3 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isPending || !newFile.originalName || !newFile.mimeType || !newFile.fileId || !newFile.cid}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Adding...' : 'Add File'}
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
      {(readError || writeError) && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-lg">
          <p className="text-sm">
            {readError?.message || writeError?.message || 'An error occurred'}
          </p>
        </div>
      )}
    </div>
  );
} 