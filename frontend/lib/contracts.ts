import { useReadContract, useWriteContract } from 'wagmi';

export const LIFE_SIGNAL_REGISTRY_ADDRESS = '0x7AD2e1B6E17EcD6Dd280D2EDa37660763D229AF4';

export const LIFE_SIGNAL_REGISTRY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_contact",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_firstName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_lastName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_email",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_phone",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "_hasVotingRight",
        "type": "bool"
      },
      {
        "internalType": "uint256[]",
        "name": "_authorizedVaults",
        "type": "uint256[]"
      }
    ],
    "name": "addContact",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_cypherIv",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_encryptionKey",
        "type": "string"
      }
    ],
    "name": "createVault",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_vaultId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_originalName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_mimeType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_cid",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_uploadDate",
        "type": "string"
      }
    ],
    "name": "addVaultFile",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "getOwnerVaultListDetails",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "vaultIds",
        "type": "uint256[]"
      },
      {
        "internalType": "string[]",
        "name": "names",
        "type": "string[]"
      },
      {
        "internalType": "address[]",
        "name": "vaultOwners",
        "type": "address[]"
      },
      {
        "internalType": "bool[]",
        "name": "isReleased",
        "type": "bool[]"
      },
      {
        "internalType": "string[]",
        "name": "cypherIvs",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "encryptionKeys",
        "type": "string[]"
      },
      {
        "internalType": "uint256[][]",
        "name": "fileIds",
        "type": "uint256[][]"
      },
      {
        "internalType": "address[][]",
        "name": "authorizedContacts",
        "type": "address[][]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_vaultId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_fileId",
        "type": "uint256"
      }
    ],
    "name": "getVaultFileInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "originalName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "mimeType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "uploadDate",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_vaultId",
        "type": "uint256"
      }
    ],
    "name": "getVaultInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isReleased",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "cypherIv",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "encryptionKey",
        "type": "string"
      },
      {
        "internalType": "uint256[]",
        "name": "fileIds",
        "type": "uint256[]"
      },
      {
        "internalType": "address[]",
        "name": "authorizedContacts",
        "type": "address[]"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "declareDeceased",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_vaultId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_contact",
        "type": "address"
      }
    ],
    "name": "authorizeVaultContact",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_vaultId",
        "type": "uint256"
      }
    ],
    "name": "releaseVault",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "finalizeDeathDeclaration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "checkGracePeriodExpiry",
    "outputs": [
      {
        "internalType": "bool",
        "name": "expired",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "canFinalize",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "getContactList",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "getContactListDetails",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "contactAddresses",
        "type": "address[]"
      },
      {
        "internalType": "string[]",
        "name": "firstNames",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "lastNames",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "emails",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "phones",
        "type": "string[]"
      },
      {
        "internalType": "bool[]",
        "name": "hasVotingRights",
        "type": "bool[]"
      },
      {
        "internalType": "bool[]",
        "name": "isVerified",
        "type": "bool[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_contact",
        "type": "address"
      }
    ],
    "name": "getContactInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "firstName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "lastName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "email",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "phone",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "hasVotingRight",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isVerified",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "getDeathDeclarationStatus",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isDeceased",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "votesFor",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "votesAgainst",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalVotingContacts",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "consensusReached",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isInGracePeriod",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "gracePeriodEnd",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "getOwnerInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "firstName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "lastName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "lastHeartbeat",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "graceInterval",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isDeceased",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_voter",
        "type": "address"
      }
    ],
    "name": "getVote",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_voter",
        "type": "address"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_firstName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_lastName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_email",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_phone",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_graceInterval",
        "type": "uint256"
      }
    ],
    "name": "registerOwner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "sendHeartbeat",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_firstName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_lastName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_email",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_phone",
        "type": "string"
      }
    ],
    "name": "updateContactInfo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "verifyContact",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_vote",
        "type": "bool"
      }
    ],
    "name": "voteOnDeathDeclaration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_contact",
        "type": "address"
      }
    ],
    "name": "getContactVaultDetails",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "vaultIds",
        "type": "uint256[]"
      },
      {
        "internalType": "string[]",
        "name": "vaultNames",
        "type": "string[]"
      },
      {
        "internalType": "address[]",
        "name": "vaultOwners",
        "type": "address[]"
      },
      {
        "internalType": "bool[]",
        "name": "isReleased",
        "type": "bool[]"
      },
      {
        "internalType": "string[]",
        "name": "cypherIvs",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "encryptionKeys",
        "type": "string[]"
      },
      {
        "internalType": "uint256[][]",
        "name": "fileIds",
        "type": "uint256[][]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "contact",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "firstName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "lastName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "hasVotingRight",
        "type": "bool"
      }
    ],
    "name": "ContactAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "contact",
        "type": "address"
      }
    ],
    "name": "ContactVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isDeceased",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ConsensusReached",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "declaredBy",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "DeathDeclared",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "gracePeriodEnd",
        "type": "uint256"
      }
    ],
    "name": "GracePeriodStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "HeartbeatSent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "firstName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "lastName",
        "type": "string"
      }
    ],
    "name": "OwnerRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "vote",
        "type": "bool"
      }
    ],
    "name": "VoteCast",
    "type": "event"
  }
] as const;

// Contract addresses
export const CONTRACT_ADDRESSES = {
  LIFESIGNAL_REGISTRY: LIFE_SIGNAL_REGISTRY_ADDRESS,
} as const;

// Hooks for reading contract data
export const useContractRead = (functionName: string, args?: any[]) => {
  return useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFE_SIGNAL_REGISTRY_ABI,
    functionName: functionName as any,
    args: args as any,
  });
};

// Hook for writing to contract
export const useContractWrite = () => {
  return useWriteContract();
}

// Utility function to convert days to seconds
export const daysToSeconds = (days: number): bigint => {
  return BigInt(days * 24 * 60 * 60);
};

// Helper functions for common contract operations
export const contractHelpers = {
  // Register a new owner
  registerOwner: async (
    writeContract: any,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    graceIntervalDays: number
  ) => {
    const graceInterval = daysToSeconds(graceIntervalDays);
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'registerOwner',
      args: [
        firstName,
        lastName,
        email,
        phone,
        graceInterval
      ],
    });
  },

  // Add a contact
  addContact: async (
    writeContract: any,
    contactAddress: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    hasVotingRight: boolean,
    authorizedVaults: number[] = []
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'addContact',
      args: [
        contactAddress,
        firstName,
        lastName,
        email,
        phone,
        hasVotingRight,
        authorizedVaults
      ],
    });
  },

  // Send heartbeat
  sendHeartbeat: async (writeContract: any) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'sendHeartbeat',
      args: [],
    });
  },

  // Get owner information
  getOwnerInfo: async (readContract: any, ownerAddress: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getOwnerInfo',
      args: [ownerAddress],
    });
  },

  // Create a vault
  createVault: async (writeContract: any, name: string, cypherIv: string, encryptionKey: string) => {
    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFE_SIGNAL_REGISTRY_ABI,
        functionName: 'createVault',
        args: [name, cypherIv, encryptionKey],
      });
      return result;
    } catch (error) {
      console.error('Error creating vault:', error);
      throw error;
    }
  },

  // Add file to vault
  addVaultFile: async (writeContract: any, vaultId: number, originalName: string, mimeType: string, cid: string, uploadDate: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'addVaultFile',
      args: [vaultId, originalName, mimeType, cid, uploadDate],
    });
  },

  // Authorize contact for vault
  authorizeVaultContact: async (writeContract: any, vaultId: number, contact: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'authorizeVaultContact',
      args: [vaultId, contact],
    });
  },

  // Release vault
  releaseVault: async (writeContract: any, vaultId: number) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'releaseVault',
      args: [vaultId],
    });
  },

  // Get vault info
  getVaultInfo: async (readContract: any, vaultId: number) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getVaultInfo',
      args: [vaultId],
    });
  },

  // Get contact vault details
  getContactVaultDetails: async (readContract: any, contactAddress: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getContactVaultDetails',
      args: [contactAddress],
    });
  },

  // Get vault file info
  getVaultFileInfo: async (readContract: any, vaultId: number, fileId: number) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getVaultFileInfo',
      args: [vaultId, fileId],
    });
  },

  // Get vault authorized contacts
  getVaultAuthorizedContacts: async (readContract: any, vaultId: number) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getVaultAuthorizedContacts',
      args: [vaultId],
    });
  },

  // Get owner vault list
  getOwnerVaultList: async (readContract: any, owner: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getOwnerVaultList',
      args: [owner],
    });
  },

  // Check if vault is authorized
  isVaultAuthorized: async (readContract: any, vaultId: number, address: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'isVaultAuthorized',
      args: [vaultId, address],
    });
  },

  // Get contact list
  getContactList: async (readContract: any, owner: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getContactList',
      args: [owner],
    });
  },

  // Get contact list details
  getContactListDetails: async (readContract: any, owner: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getContactListDetails',
      args: [owner],
    });
  },

  // Get contact info
  getContactInfo: async (readContract: any, owner: string, contact: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getContactInfo',
      args: [owner, contact],
    });
  },

  // Update contact info
  updateContactInfo: async (writeContract: any, ownerAddress: string, firstName: string, lastName: string, email: string, phone: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'updateContactInfo',
      args: [ownerAddress, firstName, lastName, email, phone],
    });
  },

  // Get contact authorized vaults
  getContactAuthorizedVaults: async (readContract: any, ownerAddress: string, contactAddress: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getContactAuthorizedVaults',
      args: [ownerAddress, contactAddress],
    });
  },

  // Get vault file list
  getVaultFileList: async (readContract: any, vaultId: number) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getVaultFileList',
      args: [vaultId],
    });
  },

  // Get owner vault list details
  getOwnerVaultListDetails: async (readContract: any, owner: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFE_SIGNAL_REGISTRY_ABI,
      functionName: 'getOwnerVaultListDetails',
      args: [owner],
    });
  },
}; 