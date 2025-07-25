'use client';

import { WalletConnectButton } from '../../components/WalletConnectButton';
import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import type { Owner as BaseOwner } from '../../types/models';
import { useRouter } from 'next/navigation';
import { CONTRACT_ADDRESSES, LIFE_SIGNAL_REGISTRY_ABI } from '../../lib/contracts';
import Link from 'next/link';

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
    if (owner.isDeceased) return 'Death Confirmed';
    if (deathStatus?.isInGracePeriod) return 'Grace Period';
    if (deathStatus?.isActive) return 'Voting';
    return 'Active';
  };

  const getStatusColor = () => {
    if (owner.isDeceased) return 'bg-black text-white';
    if (deathStatus?.isInGracePeriod) return 'bg-orange-500 text-white';
    if (deathStatus?.isActive) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getActionButton = () => {
    if (owner.isDeceased) {
      return (
        <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded">
          Death Confirmed
        </span>
      );
    }

    if (deathStatus?.isInGracePeriod) {
      const now = Math.floor(Date.now() / 1000);
      const expired = graceExpiryData?.[0];
      const canFinalize = graceExpiryData?.[1];

      if (canFinalize) {
        return (
          <button
            onClick={handleFinalizeDeclaration}
            disabled={isPending}
            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
          >
            {isPending ? 'Finalizing...' : 'Finalize Death'}
          </button>
        );
      }

    return (
        <span className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded">
          Grace Period Active
        </span>
      );
    }

    if (deathStatus?.isActive) {
      if (hasVoted) {
    return (
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
            Voted: {userVote ? 'Yes' : 'No'}
          </span>
        );
      }

      if (userContact?.hasVotingRight) {
    return (
          <div className="flex gap-2">
            <button
              onClick={() => handleVote(true)}
              disabled={isPending}
              className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
            >
              Vote Yes
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={isPending}
              className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
            >
              Vote No
            </button>
          </div>
        );
      }

      return (
        <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded">
          No Voting Rights
        </span>
      );
    }

    if (userContact?.hasVotingRight) {
      return (
        <button
          onClick={handleDeclareDeceased}
          disabled={isPending}
          className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
        >
          {isPending ? 'Declaring...' : 'Declare Deceased'}
        </button>
      );
    }

    return (
      <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded">
        No Voting Rights
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Grace Period Alert */}
      {deathStatus?.isInGracePeriod && (
        <div className="mb-6 backdrop-blur-md bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-400">Grace Period Active</h3>
              <p className="text-white/70 text-sm">
                All contacts have voted to declare this owner deceased. The owner has 30 seconds 
                to prove they are alive by sending a heartbeat.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Owner Info */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">
            {owner.firstName} {owner.lastName}
          </h3>
          <p className="text-white/60 font-mono text-sm">
            {owner.address.slice(0, 6)}...{owner.address.slice(-4)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
            owner.isDeceased ? 'bg-black text-white' :
            deathStatus?.isInGracePeriod ? 'bg-orange-500/80 text-white' :
            deathStatus?.isActive ? 'bg-yellow-500/80 text-white' :
            'bg-emerald-500/80 text-white'
          }`}>
            {getStatusDisplay()}
          </span>
          <button
            onClick={refreshAll}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Voting Status */}
      {deathStatus?.isActive && (
        <div className="mb-6 backdrop-blur-md bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🗳️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400">Voting in Progress</h3>
              <p className="text-white/70">
                <strong>{deathStatus.votesFor}</strong> out of <strong>{deathStatus.totalVotingContacts}</strong> contacts have voted for death declaration
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Heartbeat & Actions */}
      <div className="flex items-center justify-between">
        <div className="text-white/60">
          Last heartbeat: {new Date(owner.lastHeartbeat * 1000).toLocaleString()}
        </div>
        <div className="flex items-center gap-2">
          {/* Action Buttons */}
          <div className="flex gap-2">
            {owner.isDeceased ? (
              <span className="px-3 py-1 text-sm bg-black/50 text-white rounded-lg">
                Death Confirmed
              </span>
            ) : deathStatus?.isInGracePeriod ? (
              graceExpiryData?.[1] ? (
                <button
                  onClick={handleFinalizeDeclaration}
                  disabled={isPending}
                  className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Finalizing...' : 'Finalize Death'}
                </button>
              ) : (
                <span className="px-3 py-1 text-sm bg-orange-500/50 text-white rounded-lg">
                  Grace Period Active
                </span>
              )
            ) : deathStatus?.isActive ? (
              hasVoted ? (
                <span className="px-3 py-1 text-sm bg-blue-500/50 text-white rounded-lg">
                  Voted: {userVote ? 'Yes' : 'No'}
                </span>
              ) : userContact?.hasVotingRight ? (
                <>
                  <button
                    onClick={() => handleVote(true)}
                    disabled={isPending}
                    className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                  >
                    Vote Yes
                  </button>
                  <button
                    onClick={() => handleVote(false)}
                    disabled={isPending}
                    className="px-3 py-1 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                  >
                    Vote No
                  </button>
                </>
              ) : (
                <span className="px-3 py-1 text-sm bg-white/10 text-white/60 rounded-lg">
                  No Voting Rights
                </span>
              )
            ) : userContact?.hasVotingRight ? (
              <button
                onClick={handleDeclareDeceased}
                disabled={isPending}
                className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Declaring...' : 'Declare Deceased'}
              </button>
            ) : (
              <span className="px-3 py-1 text-sm bg-white/10 text-white/60 rounded-lg">
                No Voting Rights
              </span>
            )}

            {/* Vault Access Button */}
            {deathStatus?.isDeceased && (
              <button
                onClick={() => setShowVaults(!showVaults)}
                className="px-3 py-1 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                {showVaults ? 'Hide Vaults' : `Access Vaults (${vaultFiles.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vault Access Section */}
      {deathStatus?.isDeceased && showVaults && (
        <div className="mt-6 backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🔓</span>
            </div>
            <h4 className="text-lg font-semibold text-emerald-400">
              Inherited Vault Access - {vaultFiles.length} Files Available
            </h4>
          </div>
          
          {vaultFiles.length === 0 ? (
            <p className="text-white/70">No files found in this owner's vaults.</p>
          ) : (
            <div className="space-y-3">
              {vaultFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-white/5 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex-1">
                    <div className="font-medium text-white">{file.originalName}</div>
                    <div className="text-xs text-white/60">
                      CID: {file.cid} • Uploaded: {new Date(file.uploadDate).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(file)}
                    disabled={downloadingFiles.has(file.id)}
                    className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {downloadingFiles.has(file.id) ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Downloading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>📥</span>
                        <span>Download</span>
                      </div>
                    )}
                  </button>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg text-sm text-white/70">
                <strong>Note:</strong> As an heir, you now have access to all files from this deceased owner's vaults. 
                These files were encrypted and are now available for inheritance.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          messageType === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm">
          Error: {error.message}
        </div>
      )}
    </div>
  );
};

export default function HeirsPortal() {
  const { address } = useAccount();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Fetch vault details for the current user as a contact
  const { data: vaultDetailsData, refetch: refetchOwners } = useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFE_SIGNAL_REGISTRY_ABI,
    functionName: 'getContactVaultDetails',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  });

  useEffect(() => {
    const loadOwners = async () => {
      if (!address) {
        setOwners([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
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
        setLoading(false);
      }
    };

    loadOwners();
  }, [address, vaultDetailsData]);

  const handleRefresh = () => {
    setLoading(true);
    refetchOwners();
  };

  if (!address) {
                        return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Heirs Portal</h1>
          <p className="text-gray-600">Please connect your wallet to access the heirs portal.</p>
                                </div>
                              </div>
    );
  }

  if (loading) {
                        return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading owners...</p>
                                </div>
                              </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
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
                Heirs Portal
              </h1>
            </div>
            <p className="text-xl text-white/80">
              Monitor and manage your inheritance responsibilities
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-white mb-2">Loading Owners</h2>
              <p className="text-white/60">Fetching your assigned owners from the blockchain...</p>
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Error Loading Owners</h2>
              <p className="text-white/60 mb-4">{error}</p>
              <button
                onClick={() => refetchOwners()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : owners.length === 0 ? (
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No Owners Found</h2>
              <p className="text-white/60 mb-4">
                You haven't been assigned as an heir to any owners yet.
              </p>
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Return Home
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {owners.map((owner) => (
                <div key={owner.address} className="backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl overflow-hidden">
                  <OwnerRow
                    owner={owner}
                    userAddress={address || ''}
                    onRefresh={() => refetchOwners()}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Developer link */}
          <div className="text-center mt-8">
            <Link href="/debug" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Developer Tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 