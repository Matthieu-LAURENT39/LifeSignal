'use client';

import { WalletConnectButton } from '../../components/WalletConnectButton';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import type { Owner } from '../../types/models';
import { useRouter } from 'next/navigation';

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

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    const fetchHeirInfo = async () => {
      if (!address) return;

      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const heirData = mockContactData[address];
        if (!heirData) {
          throw new Error('Not authorized as heir');
        }

        setOwnerInfo(heirData.owner);
        setHasVotingRight(heirData.hasVotingRight);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setOwnerInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeirInfo();
  }, [address, isConnected, router]);

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

        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8">
          {/* Owner Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Vault Owner</h2>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white">
                  {ownerInfo.firstName} {ownerInfo.lastName}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  ownerInfo.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                  ownerInfo.status === 'voting_in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                  ownerInfo.status === 'grace_period' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {ownerInfo.status === 'active' ? 'Active' :
                   ownerInfo.status === 'voting_in_progress' ? 'Voting in Progress' :
                   ownerInfo.status === 'grace_period' ? 'Grace Period' :
                   'Deceased'}
                </div>
              </div>
              <div className="text-white/60 text-sm font-mono">
                {ownerInfo.address}
              </div>
            </div>
          </div>

          {/* Death Declaration Section */}
          {hasVotingRight && ownerInfo.status === 'active' && (
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-medium text-white mb-4">Death Declaration</h3>
              <p className="text-white/70 text-sm mb-4">
                As a trusted contact with voting rights, you can initiate a death declaration process if you believe the owner has passed away.
              </p>
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={isVoting}
                className="w-full py-3 px-4 rounded-xl font-medium transition-colors bg-red-500 hover:bg-red-600 text-white disabled:bg-red-500/50 disabled:text-white/50 disabled:cursor-not-allowed"
              >
                Declare Owner as Deceased
              </button>
            </div>
          )}

          {/* Voting Status */}
          {ownerInfo.status === 'voting_in_progress' && ownerInfo.deathDeclaration && (
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-medium text-white mb-4">Death Declaration Status</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-sm text-white/70 mb-3">
                    A death declaration process has been initiated.
                  </div>
                  <div className="text-sm text-white/70">
                    Date: <span className="text-white">{new Date(ownerInfo.deathDeclaration.declaredAt).toLocaleString()}</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-medium text-white/70 mb-2">Voting Progress:</div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/70">Required Consensus</span>
                        <span className="text-white font-medium">50%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 to-red-500 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(ownerInfo.deathDeclaration.votes.filter(v => v.voted).length / ownerInfo.deathDeclaration.votes.length) * 100}%` 
                          }}
                        />
                      </div>
                      <p className="text-white/60 text-xs mt-2 text-center">
                        Voting in progress. The outcome will be determined when consensus is reached.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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