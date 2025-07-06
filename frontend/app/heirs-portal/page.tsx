'use client';

import { WalletConnectButton } from '../../components/WalletConnectButton';
import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import type { Owner as BaseOwner } from '../../types/models';
import { useRouter } from 'next/navigation';
import { CONTRACT_ADDRESSES, LIFE_SIGNAL_REGISTRY_ABI } from '../../lib/contracts';

interface Owner extends BaseOwner {
  lastHeartbeat: number;
  isDeceased: boolean;
  exists: boolean;
}

interface VaultFile {
  id: string;
  originalName: string;
  mimeType: string;
  cid: string;
  uploadDate: string;
}

interface DeathDeclarationStatus {
  isActive: boolean;
  isDeceased: boolean;
  votesFor: number;
  votesAgainst: number;
  totalVotingContacts: number;
  consensusReached: boolean;
  isInGracePeriod: boolean;
  gracePeriodEnd: number;
}

interface Contact {
  address: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hasVotingRight: boolean;
  isVerified: boolean;
  exists: boolean;
}



const OwnerRow: React.FC<{ 
  owner: Owner; 
  userAddress: string; 
  onRefresh: () => void;
}> = ({ owner, userAddress, onRefresh }) => {
  const [deathStatus, setDeathStatus] = useState<DeathDeclarationStatus | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [userContact, setUserContact] = useState<Contact | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [showVaults, setShowVaults] = useState(false);
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  const { writeContract, isPending, error } = useWriteContract();

  // Read contract data
  const { data: deathStatusData, refetch: refetchDeathStatus } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFE_SIGNAL_REGISTRY_ABI,
    functionName: 'getDeathDeclarationStatus',
    args: [owner.address as `0x${string}`],
  });

  const { data: contactsData, refetch: refetchContacts } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFE_SIGNAL_REGISTRY_ABI,
    functionName: 'getContactListDetails',
    args: [owner.address as `0x${string}`],
  });

  const { data: hasVotedData, refetch: refetchHasVoted } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFE_SIGNAL_REGISTRY_ABI,
    functionName: 'hasVoted',
    args: [owner.address as `0x${string}`, userAddress as `0x${string}`],
  });

  const { data: userVoteData, refetch: refetchUserVote } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFE_SIGNAL_REGISTRY_ABI,
    functionName: 'getVote',
    args: [owner.address as `0x${string}`, userAddress as `0x${string}`],
    query: { enabled: hasVoted }
  });

  const { data: graceExpiryData, refetch: refetchGraceExpiry } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFE_SIGNAL_REGISTRY_ABI,
    functionName: 'checkGracePeriodExpiry',
    args: [owner.address as `0x${string}`],
  });

  // Fetch vault data when owner is deceased
  const { data: vaultData, refetch: refetchVaultData } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFE_SIGNAL_REGISTRY_ABI,
    functionName: 'getOwnerVaultListDetails',
    args: [owner.address as `0x${string}`],
    query: { enabled: deathStatus?.isDeceased || false }
  });

  useEffect(() => {
    if (deathStatusData) {
      const [isActive, isDeceased, votesFor, votesAgainst, totalVotingContacts, consensusReached, isInGracePeriod, gracePeriodEnd] = deathStatusData as unknown as any[];
      setDeathStatus({
        isActive,
        isDeceased,
        votesFor: Number(votesFor),
        votesAgainst: Number(votesAgainst),
        totalVotingContacts: Number(totalVotingContacts),
        consensusReached,
        isInGracePeriod,
        gracePeriodEnd: Number(gracePeriodEnd)
      });
    }
  }, [deathStatusData]);

  useEffect(() => {
    if (contactsData) {
      const [addresses, firstNames, lastNames, emails, phones, hasVotingRights, isVerified] = contactsData as unknown as any[];
      const contactList = addresses.map((addr: string, index: number) => ({
        address: addr,
        firstName: firstNames[index],
        lastName: lastNames[index],
        email: emails[index],
        phone: phones[index],
        hasVotingRight: hasVotingRights[index],
        isVerified: isVerified[index],
        exists: true
      }));
      setContacts(contactList);
      
      // Find user's contact info
      const userContactInfo = contactList.find((c: Contact) => c.address.toLowerCase() === userAddress.toLowerCase());
      setUserContact(userContactInfo || null);
    }
  }, [contactsData, userAddress]);

  useEffect(() => {
    if (hasVotedData !== undefined) {
      setHasVoted(hasVotedData as boolean);
    }
  }, [hasVotedData]);

  useEffect(() => {
    if (userVoteData !== undefined) {
      setUserVote(userVoteData as boolean);
    }
  }, [userVoteData]);

  // Process vault data when owner is deceased
  useEffect(() => {
    if (vaultData && deathStatus?.isDeceased) {
      const [vaultIds, names, owners, isReleased, cypherIvs, encryptionKeys, fileIds] = vaultData as unknown as any[];
      
      if (vaultIds && Array.isArray(vaultIds)) {
        const allFiles: VaultFile[] = [];
        
        vaultIds.forEach((vaultId: string, vaultIndex: number) => {
          const vaultName = names?.[vaultIndex] || `Vault ${vaultIndex + 1}`;
          const files = fileIds?.[vaultIndex] || [];
          
          // Use real file IDs from blockchain
          files.forEach((fileId: string, fileIndex: number) => {
            allFiles.push({
              id: `${vaultId}_${fileId}`,
              originalName: `File ${fileIndex + 1} from ${vaultName}`, // Will be replaced with real name from blockchain
              mimeType: 'application/octet-stream', // Will be replaced with real mime type from blockchain
              cid: `placeholder_${fileId}`, // Will be replaced with real CID from blockchain
              uploadDate: new Date().toISOString() // Will be replaced with real upload date from blockchain
            });
          });
        });
        
        setVaultFiles(allFiles);
      }
    }
  }, [vaultData, deathStatus?.isDeceased]);

    const refreshAll = async () => {
      setIsLoading(true);
    setMessage('');
    setMessageType('');
    
    try {
      await Promise.all([
        refetchDeathStatus(),
        refetchContacts(),
        refetchHasVoted(),
        refetchUserVote(),
        refetchGraceExpiry(),
        refetchVaultData()
      ]);
      onRefresh();
    } catch (error) {
      console.error('Error refreshing:', error);
      } finally {
        setIsLoading(false);
      }
    };

  // Web Crypto API decryption function to match the encryption method used in vaults
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

  const handleDownloadFile = async (file: VaultFile) => {
    const fileKey = file.id;
    setDownloadingFiles(prev => new Set([...prev, fileKey]));
    
    try {
      console.log('=== HEIR DOWNLOADING FILE ===');
      console.log('File ID:', file.id);
      console.log('File Name:', file.originalName);
      console.log('CID:', file.cid);

      // Extract vault ID and file ID from the combined ID
      const [vaultId, fileId] = file.id.split('_');
      
      if (!vaultId || !fileId) {
        throw new Error('Invalid file ID format');
      }

      // Get vault info from smart contract to get encryption key and IV
      const { readContract } = await import('wagmi/actions');
      const { config } = await import('../../lib/wagmi');
      
      const vaultInfo = await readContract(config, {
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFE_SIGNAL_REGISTRY_ABI,
        functionName: 'getVaultInfo',
        args: [BigInt(vaultId)],
      });
      
      if (!vaultInfo) {
        throw new Error('Could not retrieve vault information');
      }

      console.log('Vault info retrieved:', vaultInfo);

      // Get file info from smart contract to get actual file details
      const fileInfo = await readContract(config, {
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFE_SIGNAL_REGISTRY_ABI,
        functionName: 'getVaultFileInfo',
        args: [BigInt(vaultId), BigInt(fileId)],
      });

      if (!fileInfo) {
        throw new Error('Could not retrieve file information');
      }

      console.log('File info retrieved:', fileInfo);

      // Extract file data
      const originalName = fileInfo[0] as string;
      const mimeType = fileInfo[1] as string;
      const cid = fileInfo[2] as string;
      const uploadDate = fileInfo[3] as string;
      const exists = fileInfo[4] as boolean;
      
      if (!exists) {
        throw new Error('File does not exist');
      }

      // Extract vault encryption data
      const cypherIv = vaultInfo[4] as string;
      const encryptionKey = vaultInfo[5] as string;

      console.log('Downloading from Walrus with CID:', cid);

      // Retrieve encrypted file from Walrus using direct HTTP API
      const res = await fetch(`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${cid}`);
      if (!res.ok) throw new Error("Download failed: " + res.statusText);
      const blob = await res.blob();
      const encryptedArrayBuffer = await blob.arrayBuffer();
      
      console.log('File retrieved from Walrus, size:', encryptedArrayBuffer.byteLength);

      // Decrypt the file using Web Crypto API (matching the encryption method)
      const decryptedBlob = await decryptFileWebCrypto(
        encryptedArrayBuffer,
        encryptionKey,
        mimeType
      );

      console.log('File decrypted successfully');

      // Download the decrypted file
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName || file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('File downloaded successfully');
      console.log('=== HEIR DOWNLOAD COMPLETE ===');
      
      setMessage(`Successfully downloaded: ${originalName || file.originalName}`);
      setMessageType('success');
    } catch (error) {
      console.error('Error downloading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Failed to download file: ${errorMessage}`);
      setMessageType('error');
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  };

  const handleDeclareDeceased = async () => {
    if (!userContact?.hasVotingRight) {
      setMessage('You do not have voting rights for this owner');
      setMessageType('error');
      return;
    }

    try {
      setMessage('');
      setMessageType('');

      await writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFE_SIGNAL_REGISTRY_ABI,
        functionName: 'declareDeceased',
        args: [owner.address as `0x${string}`],
      });

      setMessage('Death declaration initiated successfully');
      setMessageType('success');
      setTimeout(refreshAll, 2000);
    } catch (error: any) {
      console.error('Error declaring deceased:', error);
      let errorMessage = 'Failed to declare deceased';
      if (error.message?.includes('Owner already deceased')) {
        errorMessage = 'Owner is already deceased';
      } else if (error.message?.includes('Death declaration already active')) {
        errorMessage = 'Death declaration is already active';
      }
      setMessage(errorMessage);
      setMessageType('error');
    }
  };

  const handleVote = async (vote: boolean) => {
    if (!userContact?.hasVotingRight) {
      setMessage('You do not have voting rights for this owner');
      setMessageType('error');
      return;
    }

    try {
      setMessage('');
      setMessageType('');

      await writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFE_SIGNAL_REGISTRY_ABI,
        functionName: 'voteOnDeathDeclaration',
        args: [owner.address as `0x${string}`, vote],
      });

      setMessage(`Vote submitted successfully: ${vote ? 'Yes' : 'No'}`);
      setMessageType('success');
      setTimeout(refreshAll, 2000);
    } catch (error: any) {
      console.error('Error voting:', error);
      let errorMessage = 'Failed to submit vote';
      if (error.message?.includes('Already voted')) {
        errorMessage = 'You have already voted';
      } else if (error.message?.includes('No active death declaration')) {
        errorMessage = 'No active death declaration to vote on';
      }
      setMessage(errorMessage);
      setMessageType('error');
    }
  };

  const handleFinalizeDeclaration = async () => {
    try {
      setMessage('');
      setMessageType('');

      await writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFE_SIGNAL_REGISTRY_ABI,
        functionName: 'finalizeDeathDeclaration',
        args: [owner.address as `0x${string}`],
      });

      setMessage('Death declaration finalized successfully');
      setMessageType('success');
      setTimeout(refreshAll, 2000);
    } catch (error: any) {
      console.error('Error finalizing declaration:', error);
      setMessage('Failed to finalize death declaration');
      setMessageType('error');
    }
  };

  const getStatusDisplay = () => {
    if (deathStatus?.isDeceased) return 'Deceased';
    if (deathStatus?.isInGracePeriod) return 'Grace Period';
    if (deathStatus?.isActive) return 'Voting';
    return 'Active';
  };

  const getStatusColor = () => {
    if (deathStatus?.isDeceased) return 'bg-red-500/20 text-red-400 border-red-400/50';
    if (deathStatus?.isInGracePeriod) return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50';
    if (deathStatus?.isActive) return 'bg-purple-500/20 text-purple-400 border-purple-400/50';
    return 'bg-green-500/20 text-green-400 border-green-400/50';
  };

  const getActionButton = () => {
    if (deathStatus?.isDeceased) {
      return (
        <button
          onClick={() => setShowVaults(!showVaults)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 text-white font-medium rounded-xl transition-all duration-300"
        >
          {showVaults ? 'Hide Vaults' : 'View Vaults'}
        </button>
      );
    }

    if (deathStatus?.isInGracePeriod) {
      return (
        <button
          disabled
          className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 rounded-xl cursor-not-allowed"
        >
          Grace Period Active
        </button>
      );
    }

    if (deathStatus?.isActive) {
      if (!hasVoted) {
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleVote(true)}
              disabled={isLoading || !userContact?.hasVotingRight}
              className="px-4 py-2 bg-gradient-to-r from-red-600/80 to-orange-600/80 hover:from-red-500/90 hover:to-orange-500/90 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vote Yes
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={isLoading || !userContact?.hasVotingRight}
              className="px-4 py-2 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-500/90 hover:to-emerald-500/90 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vote No
            </button>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70">
            Voted: {userVote ? 'Yes' : 'No'}
          </span>
          {deathStatus.consensusReached && (
            <button
              onClick={handleFinalizeDeclaration}
              className="px-4 py-2 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 text-white font-medium rounded-xl transition-all duration-300"
            >
              Finalize
            </button>
          )}
        </div>
      );
    }

    return (
      <button
        onClick={handleDeclareDeceased}
        disabled={isLoading || !userContact?.hasVotingRight}
        className="px-4 py-2 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        Declare Deceased
      </button>
    );
  };

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8">
      {/* Owner Info */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-white">{owner.firstName} {owner.lastName}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()} whitespace-nowrap`}>
              {getStatusDisplay()}
            </span>
          </div>
          <p className="text-white/60 font-mono text-sm mb-1">{owner.address}</p>
          <p className="text-white/50 text-sm">Last heartbeat: {new Date(owner.lastHeartbeat * 1000).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          {getActionButton()}
          <button
            onClick={refreshAll}
            disabled={isLoading}
            className="p-2 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors"
          >
            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mb-6 rounded-xl p-4 ${
          messageType === 'success' 
            ? 'bg-green-500/10 border border-green-400/50 text-green-400'
            : 'bg-red-500/10 border border-red-400/50 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {messageType === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <p className="font-medium">{message}</p>
          </div>
        </div>
      )}

      {/* Death Declaration Status */}
      {deathStatus?.isActive && (
        <div className="mb-6">
          <div className="bg-black/20 rounded-xl p-4">
            <h4 className="text-white font-medium mb-3">Voting Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Votes For:</span>
                <span className="text-white">{deathStatus.votesFor}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Votes Against:</span>
                <span className="text-white">{deathStatus.votesAgainst}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Total Voting Contacts:</span>
                <span className="text-white">{deathStatus.totalVotingContacts}</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2 mt-3">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((deathStatus.votesFor / deathStatus.totalVotingContacts) * 100, 100)}%` }}
                />
              </div>
              <p className="text-white/60 text-xs text-center mt-2">
                {deathStatus.consensusReached ? 
                  'Consensus reached' : 
                  `${Math.ceil(deathStatus.totalVotingContacts * 0.51) - deathStatus.votesFor} more votes needed for consensus`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vaults */}
      {showVaults && deathStatus?.isDeceased && (
        <div className="mt-6 space-y-4">
          <h4 className="text-lg font-semibold text-white mb-4">Available Vaults</h4>
          {vaultFiles.length === 0 ? (
            <div className="bg-black/20 rounded-xl p-6 text-center">
              <p className="text-white/70">No files available in the vaults</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {vaultFiles.map((file) => (
                <div key={file.id} className="bg-black/20 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">{file.originalName}</p>
                        <p className="text-white/50 text-sm">Uploaded: {new Date(file.uploadDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(file)}
                      disabled={downloadingFiles.has(file.id)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500/90 hover:to-indigo-500/90 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {downloadingFiles.has(file.id) ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>Downloading...</span>
                        </div>
                      ) : (
                        'Download'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function HeirsPortal() {
  const { address: userAddress, isConnected } = useAccount();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Fetch vault details for the current user as a contact
  const { data: vaultDetailsData, refetch: refetchOwners } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFE_SIGNAL_REGISTRY_ABI,
    functionName: 'getContactVaultDetails',
    args: [userAddress as `0x${string}`],
    query: { enabled: !!userAddress }
  });

  useEffect(() => {
    const loadOwners = async () => {
      if (!userAddress) {
        setOwners([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');

        if (vaultDetailsData) {
          const [vaultIds, vaultNames, vaultOwners, isReleased, cypherIvs, encryptionKeys, fileIds] = vaultDetailsData as unknown as any[];
          
          if (vaultOwners && Array.isArray(vaultOwners)) {
            // Get unique owners from vault owners
            const uniqueOwners = [...new Set(vaultOwners)];
            
            const realOwners: Owner[] = uniqueOwners.map((ownerAddr: string, index: number) => {
              // Find all vaults for this owner
              const ownerVaults = vaultOwners.map((vaultOwner: string, vaultIndex: number) => 
                vaultOwner === ownerAddr ? vaultIndex : -1
              ).filter((index: number) => index !== -1);
              
              // Get owner info from the first vault (they should all have the same owner info)
              const firstVaultIndex = ownerVaults[0];
              
              return {
                address: ownerAddr,
                firstName: `Owner ${index + 1}`, // We'll need to fetch this from getOwnerInfo
                lastName: '', // We'll need to fetch this from getOwnerInfo
                lastHeartbeat: Math.floor(Date.now() / 1000) - 3600, // Default to 1 hour ago
                graceInterval: 86400, // Default to 24 hours
                isDeceased: false, // We'll need to check this from getDeathDeclarationStatus
                exists: true,
                status: 'active' as const,
                hasVotingRight: true, // Will be checked per owner
                isIdVerified: true,
                deathDeclaration: null,
                id: index.toString()
              };
            });

            setOwners(realOwners);
          } else {
            setOwners([]);
          }
        } else {
          setOwners([]);
        }
      } catch (error) {
        console.error('Error loading owners:', error);
        setError('Failed to load owners. Please try again.');
        setOwners([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOwners();
  }, [userAddress, vaultDetailsData]);

  const handleRefresh = () => {
    setIsLoading(true);
    refetchOwners();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white p-4">
        <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 text-center max-w-xl mx-auto mt-20">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-white/70 mb-6">Please connect your wallet to access the heirs portal</p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white p-4">
        <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 text-center max-w-xl mx-auto mt-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading heirs portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Heirs Portal</h1>
              <p className="text-white/70">Monitor and manage your inheritance rights</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-sm">Connected as</p>
              <p className="text-white font-mono text-sm">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-400/50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-400 font-medium">Error</p>
              </div>
              <p className="text-red-300 mt-2">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
            <p className="text-blue-300 text-sm">
              💡 As an heir, you can monitor the status of your inheritance rights and participate in death declarations when necessary.
            </p>
          </div>
        </div>

        {/* Owners Grid */}
        <div className="grid grid-cols-1 gap-6">
          {owners.length === 0 ? (
            <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Inheritance Rights</h3>
              <p className="text-white/70">You haven't been designated as an heir for any vaults yet</p>
            </div>
          ) : (
            owners.map((owner) => (
              <OwnerRow
                key={owner.address}
                owner={owner}
                userAddress={userAddress as string}
                onRefresh={handleRefresh}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 