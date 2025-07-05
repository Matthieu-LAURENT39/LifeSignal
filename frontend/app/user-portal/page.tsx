'use client';

import { WalletConnectButton } from '../../components/WalletConnectButton';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import type { Vault, VaultFile, Owner, Contact } from '../../types/models';
import VaultCreator from '../../components/VaultCreator';
import ContactCreator from '../../components/ContactCreator';

const buildMockData = (ownerAddr: string): Owner => {
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
    vaults: [],
    owner: {} as Owner // will be set later
  };

  const c2: Contact = {
    id: 'c2',
    address: '0xHeir2',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike@example.com',
    birthDate: '1988-07-22',
    hasVotingRight: false,
    isIdVerified: false,
    vaults: [],
    owner: {} as Owner // will be set later
  };

  // link contacts to vaults
  v1.contacts = [c1, c2];
  v2.contacts = [c1];
  c1.vaults = [v1, v2];
  c2.vaults = [v1];

  // utilisateur courant
  const owner: Owner = {
    id: 'u1',
    address: ownerAddr,
    firstName: 'Alice',
    lastName: 'Owner',
    email: 'alice@domain.com',
    phone: '0606060606',
    status: 'active',
    graceInterval: 30,
    deathDeclaration: null,
    hasVotingRight: false,
    isIdVerified: true,
    vaults: [v1, v2],
    contacts: [c1, c2]
  };

  // Set owner reference in contacts
  c1.owner = owner;
  c2.owner = owner;

  return owner;
};

export default function UserPortal() {
  const { address, isConnected } = useAccount();
  const [currentUser, setCurrentUser] = useState<Owner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [isVaultCreatorOpen, setIsVaultCreatorOpen] = useState(false);
  const [isContactCreatorOpen, setIsContactCreatorOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vaultToDelete, setVaultToDelete] = useState<Vault | null>(null);
  const [showAliveConfirm, setShowAliveConfirm] = useState(false);
  const searchParams = useSearchParams();
  const isDebugMode = searchParams.get('debug') === 'true';

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
  const activeVaults = currentUser?.vaults?.filter(v => !v.isReleased).length ?? 0;
  const totalFiles = currentUser?.vaults?.reduce((n, v) => n + (v.files?.length ?? 0), 0) ?? 0;
  const totalHeirsCount = currentUser?.contacts?.length ?? 0;

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

  const handleCreateVault = async ({ name, files, selectedContacts }: { name: string; files: File[]; selectedContacts: string[] }) => {
    // Here we would normally make an API call to create the vault
    // For now, we'll just update the local state with a mock vault
    if (!currentUser || !currentUser.contacts) return;

    // Create mock VaultFiles from the uploaded files
    const vaultFiles: VaultFile[] = files.map(file => ({
      id: `f${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalName: file.name,
      mimeType: file.type,
      cid: `QmXr…${Math.random().toString(36).substr(2, 6)}`,
      uploadDate: new Date().toISOString()
    }));

    const newVault: Vault = {
      id: `v${Date.now()}`,
      name,
      owner: address!,
      files: vaultFiles,
      contacts: currentUser.contacts.filter(c => selectedContacts.includes(c.id)),
      isReleased: false,
      cypher: {
        iv: 'dGVzdA==',
        encryptionKey: 'base64-key…'
      },
    };

    setCurrentUser(prev => {
      if (!prev || !prev.vaults) return prev;
      return {
        ...prev,
        vaults: [...prev.vaults, newVault]
      };
    });

    setIsVaultCreatorOpen(false);
  };

  const handleDeleteVault = (vault: Vault) => {
    setVaultToDelete(vault);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteVault = () => {
    if (!vaultToDelete || !currentUser || !currentUser.vaults) return;

    setCurrentUser(prev => {
      if (!prev || !prev.vaults) return prev;
      return {
        ...prev,
        vaults: prev.vaults.filter(v => v.id !== vaultToDelete.id)
      };
    });

    setShowDeleteConfirm(false);
    setVaultToDelete(null);
    setSelectedVault(null);
  };

  const handleImAlive = () => {
    if (!currentUser) return;

    // Here we would normally make an API call to confirm user is alive
    setCurrentUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'active',
        deathDeclaration: null
      };
    });

    setShowAliveConfirm(false);
  };

  const isUserInDangerousState = currentUser?.status === 'voting_in_progress' || currentUser?.status === 'grace_period';

  const setUserStatus = (status: Owner['status'], withVotes: boolean = false) => {
    if (!currentUser) return;

    setCurrentUser(prev => {
      if (!prev || !prev.contacts) return prev;

      const deathDeclaration = status === 'active' ? null : {
        declaredBy: '0xDeclarer',
        declaredAt: new Date().toISOString(),
        votes: withVotes ? [
          { contactId: prev.contacts[0].id, voted: true, votedAt: new Date().toISOString() },
          { contactId: prev.contacts[1].id, voted: false, votedAt: new Date().toISOString() }
        ] : [],
        consensusReached: false
      };

      return {
        ...prev,
        status,
        deathDeclaration
      };
    });
  };

  const handleCreateContact = async ({ firstname, lastname, contact, contactType, hasVotingRight, selectedVaultIds }: { 
    firstname: string;
    lastname: string;
    contact: string;
    contactType: 'email' | 'phone';
    hasVotingRight: boolean;
    selectedVaultIds: string[];
  }) => {
    if (!currentUser || !currentUser.vaults) return;

    const selectedVaults = currentUser.vaults.filter(v => selectedVaultIds.includes(v.id));

    // Generate a random 10-character ID
    const randomId = Math.random().toString(36).substring(2, 12);

    const newContact: Contact = {
      id: randomId,
      firstName: firstname,
      lastName: lastname,
      email: contactType === 'email' ? contact : '',
      phone: contactType === 'phone' ? contact : '',
      hasVotingRight,
      isIdVerified: false,  // Will be verified through Self.ID
      vaults: selectedVaults,
      owner: currentUser
    };

    // Log the newly created contact
    console.log('New contact created:', newContact);

    // Update the user's contacts
    setCurrentUser(prev => {
      if (!prev || !prev.contacts) return prev;
      return {
        ...prev,
        contacts: [...prev.contacts, newContact]
      };
    });

    // Also update the selected vaults with the new contact
    setCurrentUser(prev => {
      if (!prev || !prev.vaults) return prev;
      return {
        ...prev,
        vaults: prev.vaults.map(vault => 
          selectedVaultIds.includes(vault.id)
            ? { ...vault, contacts: [...(vault.contacts || []), newContact] }
            : vault
        )
      };
    });

    setIsContactCreatorOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your vaults...</div>
      </div>
    );
  }

  // Add dead status check
  if (currentUser?.status === 'dead') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Dead Status Message */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">💀</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-red-400 mb-4">
              You Are Dead
            </h1>
            <p className="text-xl text-white/60">
              Your vaults have been released to your heirs
            </p>
          </div>
        </div>

        {/* Debug Section */}
        {isDebugMode && currentUser && (
          <div className="fixed bottom-4 left-4 right-4 z-50 backdrop-blur-xl bg-black/40 border border-white/20 rounded-2xl p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Debug Controls</h3>
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Current Status:</span>
                <span className="px-2 py-1 rounded-lg text-sm bg-red-500/20 text-red-400">
                  {currentUser.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => setUserStatus('active')}
                className="p-2 rounded-xl border bg-white/5 border-white/20 text-white/80 hover:bg-white/10"
              >
                Set Active
              </button>
              <button
                onClick={() => setUserStatus('voting_in_progress', true)}
                className="p-2 rounded-xl border bg-white/5 border-white/20 text-white/80 hover:bg-white/10"
              >
                Start Voting
              </button>
              <button
                onClick={() => setUserStatus('grace_period')}
                className="p-2 rounded-xl border bg-white/5 border-white/20 text-white/80 hover:bg-white/10"
              >
                Set Grace Period
              </button>
              <button
                onClick={() => setUserStatus('dead')}
                className="p-2 rounded-xl border bg-red-500/20 border-red-500/50 text-red-400"
              >
                Set Dead
              </button>
            </div>

            {currentUser.deathDeclaration && (
              <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-2">Death Declaration Details</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-white/60">
                    Declared by: <span className="text-white/80 font-mono">{currentUser.deathDeclaration.declaredBy}</span>
                  </p>
                  <p className="text-white/60">
                    Declared at: <span className="text-white/80">{new Date(currentUser.deathDeclaration.declaredAt).toLocaleString()}</span>
                  </p>
                  {currentUser.deathDeclaration.votes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-white/60 mb-1">Votes:</p>
                      <div className="space-y-1">
                        {currentUser.deathDeclaration.votes.map(vote => (
                          <div key={vote.contactId} className="flex items-center justify-between text-xs bg-white/5 rounded-lg p-2">
                            <span className="font-mono text-white/70">{vote.contactId}</span>
                            <span className={vote.voted ? 'text-emerald-400' : 'text-red-400'}>
                              {vote.voted ? 'Voted Yes' : 'Not Voted'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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

            {/* Status Warning Banner */}
            {isUserInDangerousState && (
              <div className="mt-6 backdrop-blur-md bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-red-400">Death Declaration in Progress</h3>
                    <p className="text-white/70 text-sm mt-1">
                      {currentUser?.status === 'voting_in_progress' 
                        ? `Your contacts have initiated a death declaration process. If you&apos;re seeing this, please confirm you&apos;re alive.`
                        : `You are in a grace period. Please confirm you&apos;re alive to prevent vault release.`}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAliveConfirm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg whitespace-nowrap"
                  >
                    I&apos;m Alive
                  </motion.button>
                </div>
              </div>
            )}
          </div>
          
          {/* Only show the rest of the content if not in dangerous state */}
          {!isUserInDangerousState && (
            <>
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsVaultCreatorOpen(true)}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
                >
                  <span>➕</span> Create Vault
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {currentUser?.vaults?.map((vault, index) => (
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
                          {vault.files?.length ?? 0} files • {vault.contacts?.length ?? 0} heirs
                        </p>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <button
                        className="w-full px-3 py-2 bg-white/10 text-white/80 text-sm rounded-lg border border-white/20 hover:bg-white/20"
                        onClick={() => setSelectedVault(vault)}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Contacts Section */}
              <div className="flex items-center justify-between mb-4 mt-2">
                <h2 className="text-2xl font-semibold text-white">Your Contacts</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsContactCreatorOpen(true)}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
                >
                  <span>➕</span> Add Contact
                </motion.button>
              </div>

              <div className="overflow-x-auto mb-12 backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl">
                <table className="min-w-full text-sm text-white/80">
                  <thead className="bg-white/10 text-xs uppercase tracking-wider text-white/60">
                    <tr>
                      <th className="py-3 px-4 text-center">ID Verified</th>
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-4 text-left">Address</th>
                      <th className="py-3 px-4 text-center">Voting</th>
                      <th className="py-3 px-4 text-center">Vaults</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUser?.contacts?.map((contact, idx) => {
                      const typedContact = contact as Contact;
                      return (
                        <tr key={contact.id} className={idx % 2 ? 'bg-white/5' : ''}>
                          <td className="py-3 px-4 text-center">
                            {contact.isIdVerified ? '✔️' : '❌'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">{contact.firstName} {contact.lastName}</td>
                          <td className="py-3 px-4 font-mono">
                            {contact.address ? `${contact.address.slice(0,6)}…${contact.address.slice(-4)}` : 'No address'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {typedContact.hasVotingRight ? <span className="text-green-400">Yes</span> : <span className="text-gray-400">No</span>}
                          </td>
                          <td className="py-3 px-4 text-center">{typedContact.vaults?.length ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Developer link */}
              <div className="text-center">
                <Link href="/debug" className="text-white/40 hover:text-white/60 text-sm transition-colors">
                  Developer Tools
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedVault && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedVault(null)}>
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-800 via-purple-800 to-slate-800 border border-white/20 rounded-2xl p-6" onClick={(e)=>e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-white/60 hover:text-white" onClick={()=>setSelectedVault(null)}>✖</button>
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className={`w-10 h-10 bg-gradient-to-r ${getVaultColor(0)} rounded-lg flex items-center justify-center`}>{getVaultIcon(selectedVault.name)}</span>
              {selectedVault.name}
            </h3>

            {/* Files list */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-2">Files</h4>
              {!selectedVault.files?.length ? (
                <p className="text-white/50 text-sm">No files</p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {selectedVault.files.map(f => (
                    <li key={f.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm">
                      <span>{f.originalName}</span>
                      <span className="text-white/40 text-xs">{f.mimeType}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Contacts list */}
            <div>
              <h4 className="text-lg font-medium text-white mb-2">Contacts</h4>
              {!selectedVault.contacts?.length ? (
                <p className="text-white/50 text-sm">No contacts</p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {selectedVault.contacts.map(contact => (
                    <li key={contact.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm">
                      <span>{contact.firstName} {contact.lastName}</span>
                      <span className="font-mono text-xs">
                        {contact.address ? `${contact.address.slice(0,6)}…${contact.address.slice(-4)}` : 'No address'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Add Delete Button */}
            <div className="mt-8 pt-4 border-t border-white/10">
              <button
                onClick={() => handleDeleteVault(selectedVault)}
                className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors"
              >
                Delete Vault
              </button>
              <p className="text-white/40 text-xs text-center mt-2">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && vaultToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md bg-gradient-to-br from-slate-800 via-purple-800 to-slate-800 border border-white/20 rounded-2xl p-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Delete Vault</h3>
              <p className="text-white/70 mb-6">
                Are you sure you want to delete &ldquo;{vaultToDelete.name}&rdquo;? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setVaultToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteVault}
                  className="flex-1 px-4 py-2 bg-red-500/80 hover:bg-red-500/90 text-white rounded-xl border border-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Alive Confirmation Modal */}
      {showAliveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md bg-gradient-to-br from-slate-800 via-purple-800 to-slate-800 border border-white/20 rounded-2xl p-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✋</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Confirm You&apos;re Alive</h3>
              <p className="text-white/70 mb-6">
                By confirming, you&apos;ll cancel the death declaration process and reset your status to active. This will notify all your contacts.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAliveConfirm(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImAlive}
                  className="flex-1 px-4 py-2 bg-emerald-500/80 hover:bg-emerald-500/90 text-white rounded-xl border border-emerald-500/20 transition-colors"
                >
                  Yes, I&apos;m Alive
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Vault Creator Modal */}
      {!isUserInDangerousState && (
        <VaultCreator
          isOpen={isVaultCreatorOpen}
          onClose={() => setIsVaultCreatorOpen(false)}
          onSubmit={handleCreateVault}
          availableContacts={currentUser?.contacts || []}
        />
      )}

      {/* Contact Creator Modal */}
      <ContactCreator
        isOpen={isContactCreatorOpen}
        onClose={() => setIsContactCreatorOpen(false)}
        onSubmit={handleCreateContact}
        availableVaults={currentUser?.vaults || []}
      />

      {/* Debug Section */}
      {isDebugMode && currentUser && (
        <div className="fixed bottom-4 left-4 right-4 z-50 backdrop-blur-xl bg-black/40 border border-white/20 rounded-2xl p-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Debug Controls</h3>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Current Status:</span>
              <span className={`px-2 py-1 rounded-lg text-sm ${
                currentUser.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                currentUser.status === 'voting_in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                currentUser.status === 'grace_period' ? 'bg-orange-500/20 text-orange-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {currentUser.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => setUserStatus('active')}
              className={`p-2 rounded-xl border transition-colors ${
                currentUser.status === 'active'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
              }`}
            >
              Set Active
            </button>
            <button
              onClick={() => setUserStatus('voting_in_progress', true)}
              className={`p-2 rounded-xl border transition-colors ${
                currentUser.status === 'voting_in_progress'
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                  : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
              }`}
            >
              Start Voting
            </button>
            <button
              onClick={() => setUserStatus('grace_period')}
              className={`p-2 rounded-xl border transition-colors ${
                currentUser.status === 'grace_period'
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                  : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
              }`}
            >
              Set Grace Period
            </button>
            <button
              onClick={() => setUserStatus('dead')}
              className={`p-2 rounded-xl border transition-colors ${
                (currentUser?.status as string) === 'dead'
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
              }`}
            >
              Set Dead
            </button>
          </div>

          {currentUser.deathDeclaration && (
            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <h4 className="text-sm font-medium text-white/80 mb-2">Death Declaration Details</h4>
              <div className="space-y-1 text-sm">
                <p className="text-white/60">
                  Declared by: <span className="text-white/80 font-mono">{currentUser.deathDeclaration.declaredBy}</span>
                </p>
                <p className="text-white/60">
                  Declared at: <span className="text-white/80">{new Date(currentUser.deathDeclaration.declaredAt).toLocaleString()}</span>
                </p>
                {currentUser.deathDeclaration.votes.length > 0 && (
                  <div className="mt-2">
                    <p className="text-white/60 mb-1">Votes:</p>
                    <div className="space-y-1">
                      {currentUser.deathDeclaration.votes.map(vote => (
                        <div key={vote.contactId} className="flex items-center justify-between text-xs bg-white/5 rounded-lg p-2">
                          <span className="font-mono text-white/70">{vote.contactId}</span>
                          <span className={vote.voted ? 'text-emerald-400' : 'text-red-400'}>
                            {vote.voted ? 'Voted Yes' : 'Not Voted'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 