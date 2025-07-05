'use client';

import { WalletConnectButton } from '../../components/WalletConnectButton';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import type { Owner } from '../../types/models';
import { useRouter } from 'next/navigation';
import { CONTRACT_ADDRESSES, LIFESIGNAL_REGISTRY_ABI } from '../../lib/contracts';

// Mock data for testing
const mockOwnerData: { [key: string]: Owner } = {
  '0xowner1': {
    id: 'owner1',
    firstName: 'John',
    lastName: 'Smith',
    address: '0xowner1',
    status: 'active',
    graceInterval: 30,
    isIdVerified: true,
    hasVotingRight: false,
    deathDeclaration: null,
  },
  '0xowner2': {
    id: 'owner2',
    firstName: 'Emma',
    lastName: 'Wilson',
    address: '0xowner2',
    status: 'voting_in_progress',
    graceInterval: 30,
    isIdVerified: true,
    hasVotingRight: false,
    deathDeclaration: {
      declaredBy: '0xHeir1',
      declaredAt: new Date().toISOString(),
      votes: [
        { contactId: '0xHeir1', voted: true, votedAt: new Date().toISOString() },
      ],
      consensusReached: false,
    },
  }
};

const mockContactData: { [key: string]: { owner: Owner; hasVotingRight: boolean } } = {
  '0xB4eC4cD11f19499aE5a5706c0f0e4293CF10e24A': {
    owner: mockOwnerData['0xowner1'],
    hasVotingRight: true
  },
  '0xHeir2': {
    owner: mockOwnerData['0xowner2'],
    hasVotingRight: true
  }
};

export default function HeirsPortal() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [ownerInfo, setOwnerInfo] = useState<Owner | null>(null);
  const [hasVotingRight, setHasVotingRight] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();

  // Get contact vault details from blockchain
  const { data: contactVaultDetails, error: vaultDetailsError, isLoading: vaultDetailsLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFESIGNAL_REGISTRY_ABI,
    functionName: 'getContactVaultDetails',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  });

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    const fetchHeirInfo = async () => {
      if (!address) return;

      setIsLoading(true);
      try {
        // Check if user has access to any vaults from real contract data
        if (contactVaultDetails && Array.isArray(contactVaultDetails) && contactVaultDetails.length >= 7) {
          const vaultIds = contactVaultDetails[0] as readonly bigint[];
          if (vaultIds && vaultIds.length > 0) {
            // User has access to vaults - this is a real heir
            setOwnerInfo({
              id: 'real-heir',
              firstName: 'Vault',
              lastName: 'Contact',
              address: address,
              status: 'active',
              graceInterval: 30,
              isIdVerified: true,
              hasVotingRight: true,
              deathDeclaration: null,
            });
            setHasVotingRight(true);
            setError(null);
          } else {
            // No vaults found but user is still a contact
            setOwnerInfo({
              id: 'contact-no-vaults',
              firstName: 'Contact',
              lastName: 'User',
              address: address,
              status: 'active',
              graceInterval: 30,
              isIdVerified: true,
              hasVotingRight: false,
              deathDeclaration: null,
            });
            setHasVotingRight(false);
            setError(null);
          }
        } else if (vaultDetailsError) {
          // Contract error - user might not be a contact at all
          throw new Error(`Contract error: ${vaultDetailsError.message}`);
        } else if (!vaultDetailsLoading && !contactVaultDetails) {
          // No data returned - user is not a contact
          throw new Error('No vault access found - you are not authorized as a contact for any vaults');
        } else {
          // Still loading or no data yet
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setOwnerInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeirInfo();
  }, [address, isConnected, router, contactVaultDetails, vaultDetailsError, vaultDetailsLoading]);

  const handleDeclareDeceased = async () => {
    if (!ownerInfo || !address) return;

    setIsVoting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update owner status
      setOwnerInfo(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'voting_in_progress',
          deathDeclaration: {
            declaredBy: address,
            declaredAt: new Date().toISOString(),
            votes: [
              { contactId: address, voted: true, votedAt: new Date().toISOString() }
            ],
            consensusReached: false
          }
        };
      });
    } catch (err) {
      setError('Failed to declare death. Please try again.');
    } finally {
      setIsVoting(false);
      setShowConfirmation(false);
    }
  };

  // Base layout that's always shown
  const BaseLayout = ({ children }: { children: React.ReactNode }) => (
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
      <div className="relative z-10 container mx-auto px-4 py-16">
        {children}
      </div>
    </div>
  );

  if (!isConnected) {
    return (
      <BaseLayout>
        <div className="max-w-md w-full mx-auto backdrop-blur-xl bg-white/10 p-8 rounded-2xl border border-white/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-white/70 mb-6">
            Please connect your wallet to access the heirs portal.
          </p>
        </div>
      </BaseLayout>
    );
  }

  if (isLoading) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center">
          <div className="text-white text-xl">Loading heir information...</div>
        </div>
      </BaseLayout>
    );
  }

  if (error) {
    return (
      <BaseLayout>
        <div className="max-w-md w-full mx-auto backdrop-blur-xl bg-white/10 p-8 rounded-2xl border border-white/20">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-white/70 mb-6">{error}</p>
          </div>
        </div>
      </BaseLayout>
    );
  }

  if (!ownerInfo) return null;

  return (
    <BaseLayout>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Heirs Portal
          </h1>
        </div>



        {/* Owners Table - Where user is a contact */}
        <div className="mt-8 backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8">
          <h3 className="text-xl font-semibold text-white mb-6">Owners Where You Are a Contact</h3>
          
          {vaultDetailsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="text-white/70 mt-2">Loading owner information...</p>
            </div>
          ) : vaultDetailsError ? (
            <div className="text-center py-8">
              <p className="text-red-400">Error loading owner information: {vaultDetailsError.message}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-white/70">Owner Address</th>
                    <th className="px-6 py-3 text-white/70">Status</th>
                    <th className="px-6 py-3 text-white/70">Voting Rights</th>
                    <th className="px-6 py-3 text-white/70">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(() => {
                    // Check if we have valid vault data to extract owner information
                    if (!contactVaultDetails || !Array.isArray(contactVaultDetails) || contactVaultDetails.length < 7) {
                      return (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-white/70">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                              </div>
                              <p className="text-white/70 font-medium">No Owner Access</p>
                              <p className="text-white/50 text-sm">You are not a contact for any owners</p>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    const vaultOwners = contactVaultDetails[2] as readonly `0x${string}`[];
                    
                    if (!vaultOwners || vaultOwners.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-white/70">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                              </div>
                              <p className="text-white/70 font-medium">No Owners Found</p>
                              <p className="text-white/50 text-sm">No owner information available</p>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // Get unique owners
                    const uniqueOwners = [...new Set(vaultOwners)];
                    
                    return uniqueOwners.map((ownerAddress, index) => (
                      <tr key={ownerAddress} className="hover:bg-white/5">
                        <td className="px-6 py-4 text-white/70 font-mono text-sm">
                          {ownerAddress.slice(0, 6)}...{ownerAddress.slice(-4)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                            Yes
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              // For now, we'll use a simple alert. In a real implementation,
                              // you'd want to fetch owner details and show a proper modal
                              alert(`Death declaration for ${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`);
                            }}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            Declare Death
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Vault Access Table */}
        <div className="mt-8 backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Vault Access</h3>
            {contactVaultDetails && Array.isArray(contactVaultDetails) && contactVaultDetails.length >= 7 && (
              <div className="text-sm text-white/70">
                {(() => {
                  const vaultIds = contactVaultDetails[0] as readonly bigint[];
                  return `${vaultIds?.length || 0} vault${vaultIds?.length !== 1 ? 's' : ''}`;
                })()}
              </div>
            )}
          </div>
          
          {vaultDetailsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="text-white/70 mt-2">Loading vault details from blockchain...</p>
            </div>
          ) : vaultDetailsError ? (
            <div className="text-center py-8">
              <p className="text-red-400">Error loading vault details: {vaultDetailsError.message}</p>
              <details className="mt-4 text-left">
                <summary className="text-white/50 cursor-pointer text-xs">Debug Info</summary>
                <pre className="mt-2 text-xs text-white/50 bg-black/20 p-2 rounded overflow-auto">
                  {JSON.stringify({ 
                    error: vaultDetailsError?.message || vaultDetailsError, 
                    address, 
                    isConnected,
                    contractAddress: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY
                  }, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-white/70">Vault Name</th>
                      <th className="px-6 py-3 text-white/70">Owner</th>
                      <th className="px-6 py-3 text-white/70">Status</th>
                      <th className="px-6 py-3 text-white/70">Files</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {(() => {
                      // Check if we have valid vault data
                      if (!contactVaultDetails || !Array.isArray(contactVaultDetails) || contactVaultDetails.length < 7) {
                        return (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-white/70">
                              <div className="flex flex-col items-center space-y-2">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                  </svg>
                                </div>
                                <p className="text-white/70 font-medium">No Vault Access</p>
                                <p className="text-white/50 text-sm">You are not authorized as a contact for any vaults</p>
                                <details className="mt-4 text-left">
                                  <summary className="text-white/50 cursor-pointer text-xs">Debug Info</summary>
                                  <pre className="mt-2 text-xs text-white/50 bg-black/20 p-2 rounded overflow-auto max-w-xs">
                                    {(() => {
                                      if (!contactVaultDetails) return 'No data';
                                      if (!Array.isArray(contactVaultDetails)) return 'Not an array';
                                      return `Array with ${contactVaultDetails.length} items`;
                                    })()}
                                  </pre>
                                </details>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const vaultIds = contactVaultDetails[0] as readonly bigint[];
                      const vaultNames = contactVaultDetails[1] as readonly string[];
                      const vaultOwners = contactVaultDetails[2] as readonly `0x${string}`[];
                      const isReleased = contactVaultDetails[3] as readonly boolean[];
                      const fileIds = contactVaultDetails[6] as readonly (readonly bigint[])[];

                      if (!vaultIds || vaultIds.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-white/70">
                              <div className="flex flex-col items-center space-y-2">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                  </svg>
                                </div>
                                <p className="text-white/70 font-medium">No Vaults Found</p>
                                <p className="text-white/50 text-sm">You may not have been authorized for any vaults yet</p>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return vaultIds.map((vaultId, index) => (
                        <tr key={Number(vaultId)} className="hover:bg-white/5">
                          <td className="px-6 py-4 text-white">
                            {vaultNames[index] || `Vault ${Number(vaultId)}`}
                          </td>
                          <td className="px-6 py-4 text-white/70 font-mono text-xs">
                            {vaultOwners[index] ? `${vaultOwners[index].slice(0, 6)}...${vaultOwners[index].slice(-4)}` : 'Unknown'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isReleased[index] 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {isReleased[index] ? 'Released' : 'Locked'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white">
                            {fileIds[index] ? fileIds[index].length : 0} files
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-800 via-purple-800 to-slate-800 border border-white/20 rounded-2xl p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Confirm Death Declaration</h3>
              <p className="text-white/70 mb-6">
                Are you sure you want to declare {ownerInfo?.firstName} {ownerInfo?.lastName} as deceased? This action will initiate a voting process among all trusted contacts.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclareDeceased}
                  disabled={isVoting}
                  className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                    isVoting
                      ? 'bg-red-500/50 text-white/50 cursor-not-allowed border-red-500/20'
                      : 'bg-red-500 hover:bg-red-600 text-white border-red-500/20'
                  }`}
                >
                  {isVoting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Confirm Declaration'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseLayout>
  );
} 