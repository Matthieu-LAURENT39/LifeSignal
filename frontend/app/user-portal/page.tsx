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
import OwnerRegistration from '../../components/OwnerRegistration';
import VaultManager from '../../components/VaultManager';
import { useLifeSignalRegistryRead, useLifeSignalRegistryWrite } from '../../lib/contracts';
import { contractUtils } from '../../lib/contracts';

export default function UserPortal() {
  const { address, isConnected } = useAccount();
  const { data: ownerInfo, error: ownerError, isLoading: ownerLoading } = useLifeSignalRegistryRead(
    'getOwnerInfo', 
    address ? [address] : undefined, 
    {
    enabled: !!address && isConnected,
    }
  );
  
  // Get detailed vault list from blockchain
  const { data: vaultListDetails, error: vaultListDetailsError, isLoading: vaultListDetailsLoading } = useLifeSignalRegistryRead(
    'getOwnerVaultListDetails',
    address ? [address] : undefined,
    {
      enabled: !!address && isConnected,
    }
  );
  
  // Get detailed contact list from blockchain
  const { data: contactListDetails, error: contactListDetailsError, isLoading: contactListDetailsLoading } = useLifeSignalRegistryRead(
    'getContactListDetails',
    address ? [address] : undefined,
    {
      enabled: !!address && isConnected && !!ownerInfo && (ownerInfo as any)[5], // exists is the 6th element
    }
  );
  
  const { writeContract, isPending } = useLifeSignalRegistryWrite();
  const [currentUser, setCurrentUser] = useState<Owner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [isVaultCreatorOpen, setIsVaultCreatorOpen] = useState(false);
  const [isContactCreatorOpen, setIsContactCreatorOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vaultToDelete, setVaultToDelete] = useState<Vault | null>(null);
  const [showAliveConfirm, setShowAliveConfirm] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [newlyCreatedContacts, setNewlyCreatedContacts] = useState<Contact[]>([]);

  const searchParams = useSearchParams();
  const isDebugMode = searchParams.get('debug') === 'true';

  // State to store fetched contact details
  const [contactDetails, setContactDetails] = useState<Record<string, any>>({});
  const [isLoadingContactDetails, setIsLoadingContactDetails] = useState(false);

  // Function to fetch contact details for all contacts
  const fetchContactDetails = async (contactAddresses: string[]) => {
    if (!contactAddresses || contactAddresses.length === 0) return;
    
    setIsLoadingContactDetails(true);
    const details: Record<string, any> = {};

    try {
      for (const contactAddr of contactAddresses) {
        try {
          const contactInfo = await contractUtils.getContactInfo(
            // We need to pass a readContract function here
            // For now, we'll use the useLifeSignalRegistryRead hook pattern
            null as any, // This should be the readContract function
            address!,
            contactAddr
          );
          
          if (contactInfo) {
            details[contactAddr] = contactInfo;
          }
        } catch (error) {
          console.error(`Error fetching details for contact ${contactAddr}:`, error);
        }
      }
      
      setContactDetails(details);
    } catch (error) {
      console.error('Error fetching contact details:', error);
    } finally {
      setIsLoadingContactDetails(false);
    }
  };

  // Custom hook to fetch contact details
  const useContactDetail = (contactAddress: string) => {
    return useLifeSignalRegistryRead(
      'getContactInfo',
      address && contactAddress ? [address, contactAddress] : undefined,
      {
        enabled: !!address && !!contactAddress && isConnected,
      }
    );
  };



  useEffect(() => {
    if (!isConnected || !address) {
      setIsLoading(false);
      return;
    }

    // Check registration status based on contract data
    if (ownerLoading || vaultListDetailsLoading || contactListDetailsLoading) {
      setIsLoading(true);
      return;
    }

    if (ownerError || vaultListDetailsError || contactListDetailsError) {
      console.error('Error checking registration:', ownerError || vaultListDetailsError || contactListDetailsError);
      setIsRegistered(false);
      setIsLoading(false);
      return;
    }

    if (ownerInfo) {
      // ownerInfo is an array with [firstName, lastName, lastHeartbeat, graceInterval, isDeceased, exists]
      const [firstName, lastName, lastHeartbeat, graceInterval, isDeceased, exists] = ownerInfo as [string, string, bigint, bigint, boolean, boolean];
      
      console.log('Owner info from contract:', { firstName, lastName, exists, isDeceased, lastHeartbeat, graceInterval });
      console.log('Contact list details from contract:', contactListDetails);
      console.log('Vault list details from contract:', vaultListDetails);
      
      if (exists) {
        console.log('User is already registered:', { firstName, lastName, exists, isDeceased });
        setIsRegistered(true);
        
        // Build user data from blockchain data
        const userData = buildUserDataFromBlockchain(address, firstName, lastName, vaultListDetails, Number(graceInterval || 30), contactListDetails);
        setCurrentUser(userData);
      } else {
        console.log('User is not registered - exists is false');
        setIsRegistered(false);
      }
    } else {
      console.log('No owner info found, user not registered');
      setIsRegistered(false);
    }
    
    setIsLoading(false);
  }, [isConnected, address, ownerInfo, ownerError, ownerLoading, vaultListDetails, vaultListDetailsError, vaultListDetailsLoading, contactListDetails, contactListDetailsError, contactListDetailsLoading]);

  // Clear newly created contacts when blockchain data refreshes to prevent duplicates
  useEffect(() => {
    if (contactListDetails && Array.isArray(contactListDetails)) {
      const details = contactListDetails as any[];
      if (details.length >= 7) {
        const contactAddresses = details[0] as string[];
        if (contactAddresses && contactAddresses.length > 0) {
          // Clear newly created contacts that are now in the blockchain data
          setNewlyCreatedContacts(prev => 
            prev.filter(contact => contact.address && !contactAddresses.includes(contact.address))
          );
        }
      }
    }
  }, [contactListDetails]);

  // Function to get contact display data
  const getContactDisplayData = (contactAddr: string, index: number) => {
    // Check if we have contact details for this address
    const contactDetail = contactDetails[contactAddr];
    console.log("getContactDisplayData")
    console.log(contactDetail)
    if (contactDetail) {
      // Return real contact data from blockchain
      return {
        firstName: contactDetail.firstName || `Contact ${index + 1}`,
        lastName: contactDetail.lastName || '',
        email: contactDetail.email || 'contact@example.com',
        phone: contactDetail.phone || '+1234567890',
        hasVotingRight: contactDetail.hasVotingRight || false,
        isIdVerified: contactDetail.isVerified || false
      };
    } else {
      // Return placeholder data
      return {
        firstName: `Contact`,
        lastName: `${index + 1}`,
        email: 'contact@example.com',
        phone: '+1234567890',
        hasVotingRight: false,
        isIdVerified: false
      };
    }
  };

  // Function to build user data from blockchain data
  const buildUserDataFromBlockchain = (ownerAddr: string, firstName: string, lastName: string, vaultDetails: any, graceIntervalDays: number = 30, contactDetails: any): Owner => {
    // Create vault objects from detailed vault data
    let vaults: Vault[] = [];
    
    if (vaultDetails && Array.isArray(vaultDetails) && vaultDetails.length >= 8) {
      // vaultDetails is an array: [vaultIds, names, owners, isReleased, cypherIvs, encryptionKeys, fileIds, authorizedContacts]
      const vaultIds = vaultDetails[0] as string[];
      const names = vaultDetails[1] as string[];
      const owners = vaultDetails[2] as string[];
      const isReleased = vaultDetails[3] as boolean[];
      const cypherIvs = vaultDetails[4] as string[];
      const encryptionKeys = vaultDetails[5] as string[];
      const fileIds = vaultDetails[6] as string[][];
      const authorizedContacts = vaultDetails[7] as string[][];
      
      if (vaultIds && Array.isArray(vaultIds)) {
        vaults = vaultIds.map((vaultId: string, index: number) => ({
          id: vaultId,
          name: names?.[index] || `Vault ${index + 1}`,
          owner: owners?.[index] || ownerAddr,
          files: [], // Would need to fetch individual file details
          contacts: [], // Would need to fetch individual contact details
          isReleased: isReleased?.[index] || false,
          cypher: {
            iv: cypherIvs?.[index] || 'placeholder',
            encryptionKey: encryptionKeys?.[index] || 'placeholder'
          }
        }));
      }
    }

    // Create contact objects from detailed contact data
    let contacts: Contact[] = [];
    
    if (contactDetails && Array.isArray(contactDetails) && contactDetails.length >= 7) {
      // contactDetails is an array: [contactAddresses, firstNames, lastNames, emails, phones, hasVotingRights, isVerified]
      const contactAddresses = contactDetails[0] as string[];
      const firstNames = contactDetails[1] as string[];
      const lastNames = contactDetails[2] as string[];
      const emails = contactDetails[3] as string[];
      const phones = contactDetails[4] as string[];
      const hasVotingRights = contactDetails[5] as boolean[];
      const isVerified = contactDetails[6] as boolean[];
      
      if (contactAddresses && Array.isArray(contactAddresses)) {
        contacts = contactAddresses.map((contactAddr: string, index: number) => {
          // Calculate how many vaults this contact is authorized for
          let authorizedVaultCount = 0;
          if (vaultDetails && Array.isArray(vaultDetails) && vaultDetails.length >= 8) {
            const authorizedContacts = vaultDetails[7] as string[][];
            // Count vaults where this contact is in the authorized contacts list
            authorizedVaultCount = authorizedContacts.filter(contactList => 
              contactList.includes(contactAddr)
            ).length;
          }

          return {
            id: contactAddr,
            address: contactAddr,
            firstName: firstNames?.[index] || `Contact ${index + 1}`,
            lastName: lastNames?.[index] || '',
            email: emails?.[index] || 'contact@example.com',
            phone: phones?.[index] || '+1234567890',
            hasVotingRight: hasVotingRights?.[index] || false,
            isIdVerified: isVerified?.[index] || false,
            vaults: [], // Would need to fetch from contract
            authorizedVaultCount, // Store the count for display
            owner: {
              id: ownerAddr,
              address: ownerAddr,
              firstName,
              lastName,
              status: 'active' as const,
              graceInterval: graceIntervalDays,
              deathDeclaration: null,
              hasVotingRight: false,
              isIdVerified: true,
              vaults,
              contacts: []
            }
          } as Contact;
        });
      }
    }

    // Create the owner object
    const owner: Owner = {
      id: 'u1',
      address: ownerAddr,
      firstName,
      lastName,
      email: 'user@example.com', // Not stored on blockchain
      phone: '+1234567890', // Not stored on blockchain
      status: 'active',
      graceInterval: graceIntervalDays,
      deathDeclaration: null,
      hasVotingRight: false,
      isIdVerified: true,
      vaults,
      contacts
    };

    return owner;
  };

  const handleRegistrationComplete = () => {
    setShowRegistration(false);
    setIsRegistered(true);
    // Load user data after registration - will be handled by the useEffect when ownerInfo updates
      setIsLoading(false);
  };

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

  const handleCreateVault = async ({ name, files, selectedContacts, encryptionKey, encryptedFiles }: { 
    name: string; 
    files: File[]; 
    selectedContacts: string[];
    encryptionKey: string;
    encryptedFiles: { name: string; data: ArrayBuffer }[];
  }) => {
    // The vault creation is handled by the VaultCreator component which calls the smart contract
    // Here we just need to update the local state to reflect the new vault
    if (!currentUser || !address) return;

    // Create a new vault object for the UI
    // Note: The actual vault ID will be returned from the contract, but for now we'll use a placeholder
    const newVault: Vault = {
      id: `vault_${Date.now()}`, // Placeholder ID - in real implementation, this would come from the contract
      name,
      owner: address,
      files: encryptedFiles.map((file, index) => ({
        id: `f${Date.now()}_${index}`,
      originalName: file.name,
        mimeType: files[index]?.type || 'application/octet-stream',
      cid: `QmXr…${Math.random().toString(36).substr(2, 6)}`,
      uploadDate: new Date().toISOString()
      })),
      contacts: currentUser.contacts?.filter(c => selectedContacts.includes(c.id)) || [],
      isReleased: false,
      cypher: {
        iv: 'placeholder',
        encryptionKey: encryptionKey
      }
    };

    // Update the user's vault list
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

  const handleCreateContact = async ({ firstName, lastName, email, phone, contactAddress, hasVotingRight, selectedVaultAddresses }: { 
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    contactAddress: string;
    hasVotingRight: boolean;
    selectedVaultAddresses: string[];
  }) => {
    if (!address || !writeContract) {
      console.error('Wallet not connected or contract not available');
      return;
    }

    try {
      console.log('Creating contact with data:', { firstName, lastName, email, phone, contactAddress, hasVotingRight, selectedVaultAddresses });
      
      // Use the contract utility to add contact with authorized vaults
      const hash = await contractUtils.addContact(
        writeContract,
        contactAddress,
        firstName,
        lastName,
        email,
        phone,
        hasVotingRight,
        selectedVaultAddresses.map(vaultId => BigInt(vaultId))
      );
      
      console.log('Contact created successfully:', hash);
      
      // Add the new contact to local state for immediate display
      if (currentUser) {
        const newContact: Contact = {
          id: contactAddress,
          address: contactAddress,
          firstName,
          lastName,
          email,
          phone,
          hasVotingRight,
          isIdVerified: false,
          vaults: [],
          authorizedVaultCount: selectedVaultAddresses.length,
          owner: currentUser
        };
        
        setNewlyCreatedContacts(prev => [...prev, newContact]);
      }
      
      console.log('Contact created successfully on blockchain');
      
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  };

  // Component to render a contact row with fetched details
  const ContactRow = ({ contact, index }: { contact: Contact; index: number }) => {
    return (
      <tr className={index % 2 ? 'bg-white/5' : ''}>
        <td className="py-3 px-4 text-center">
          {contact.isIdVerified ? '✔️' : '❌'}
        </td>
        <td className="py-3 px-4 whitespace-nowrap">
          {`${contact.firstName} ${contact.lastName}`}
        </td>
        <td className="py-3 px-4 text-sm">
          {contact.email || 'No email'}
        </td>
        <td className="py-3 px-4 text-sm">
          {contact.phone || 'No phone'}
        </td>
        <td className="py-3 px-4 font-mono">
          {contact.address ? `${contact.address.slice(0,6)}…${contact.address.slice(-4)}` : 'No address'}
        </td>
        <td className="py-3 px-4 text-center">
          {contact.hasVotingRight ? <span className="text-green-400">Yes</span> : <span className="text-gray-400">No</span>}
        </td>
        <td className="py-3 px-4 text-center">{contact.authorizedVaultCount ?? 0}</td>
      </tr>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Checking Blockchain Registration</h2>
          <p className="text-white/60">Verifying if you're already registered on Oasis Sapphire...</p>
        </div>
      </div>
    );
  }

  // Show registration form if user is not registered
  if (isRegistered === false) {
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
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Link href="/" className="text-white/60 hover:text-white/80 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Welcome to LifeSignal
              </h1>
            </div>
            <p className="text-xl text-white/80 mb-8">
              Register to start managing your digital inheritance
            </p>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Register as Owner</h2>
                <p className="text-white/60 text-sm">
                  Create your account on the blockchain to start using LifeSignal
                </p>
              </div>
              
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-emerald-400">Privacy Protected</span>
                </div>
                <p className="text-xs text-white/70">
                  Your data is stored securely on the Oasis Sapphire blockchain with transparent and immutable records.
                </p>
              </div>
              
              <button
                onClick={() => setShowRegistration(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105"
              >
                Start Registration
              </button>
            </div>
          </div>
        </div>
        
        {showRegistration && (
          <OwnerRegistration
            onRegistrationComplete={handleRegistrationComplete}
            onCancel={() => setShowRegistration(false)}
          />
        )}
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
              
              {/* Blockchain Vault Manager */}
              <div className="mb-12">
                <h2 className="text-2xl font-semibold text-white mb-6">Blockchain Vault Manager</h2>
                <VaultManager />
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
                      <th className="py-3 px-4 text-left">Email</th>
                      <th className="py-3 px-4 text-left">Phone</th>
                      <th className="py-3 px-4 text-left">Address</th>
                      <th className="py-3 px-4 text-center">Voting</th>
                      <th className="py-3 px-4 text-center">Vaults</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Combine blockchain contacts with newly created contacts
                      const blockchainContacts = currentUser?.contacts || [];
                      const allContacts = [...blockchainContacts, ...newlyCreatedContacts];
                      
                      if (allContacts.length > 0) {
                        return allContacts.map((contact, idx) => (
                          <ContactRow key={contact.id} contact={contact} index={idx} />
                        ));
                      } else {
                      return (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-white/60">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                </div>
                                <p>No contacts found</p>
                                <p className="text-sm">Add your first contact to start building your digital inheritance network</p>
                              </div>
                          </td>
                        </tr>
                      );
                      }
                    })()}
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
      
      {/* Debug logging for vault data */}
      {isDebugMode && currentUser && (
        <div style={{ display: 'none' }}>
          {/* Debug info would go here */}
        </div>
      )}

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