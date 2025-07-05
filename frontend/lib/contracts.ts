import { useReadContract, useWriteContract } from 'wagmi';

// Contract ABI for LifeSignalRegistry
export const LIFESIGNAL_REGISTRY_ABI = [
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
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
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
        "name": "_vaultId",
        "type": "address"
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
        "internalType": "address",
        "name": "_vaultId",
        "type": "address"
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
        "internalType": "address",
        "name": "_vaultId",
        "type": "address"
      }
    ],
    "name": "getVaultAuthorizedContacts",
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
    "name": "getOwnerVaultList",
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
        "name": "_vaultId",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_address",
        "type": "address"
      }
    ],
    "name": "isVaultAuthorized",
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
        "name": "_contact",
        "type": "address"
      }
    ],
    "name": "getContactAuthorizedVaults",
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
        "internalType": "uint256",
        "name": "_vaultId",
        "type": "uint256"
      }
    ],
    "name": "getVaultFileList",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
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
  }
] as const;

// Contract addresses
export const CONTRACT_ADDRESSES = {
  LIFESIGNAL_REGISTRY: '0xD11b3e853d3d1e4C5e7c11B11984528CD78D4733' as `0x${string}`,
} as const;

// Hook to use contract read functions
export function useLifeSignalRegistryRead(
  functionName: string,
  args?: readonly unknown[],
  options?: { enabled?: boolean }
) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFESIGNAL_REGISTRY_ABI,
    functionName: functionName as any,
    args: args as any,
    ...options,
  });
}

// Hook to use contract write functions
export function useLifeSignalRegistryWrite() {
  return useWriteContract();
}



// Utility function to convert days to seconds
export function daysToSeconds(days: number): bigint {
  return BigInt(days * 24 * 60 * 60);
}

// Utility function to convert seconds to days
export function secondsToDays(seconds: bigint): number {
  return Number(seconds) / (24 * 60 * 60);
}

// Contract interaction utilities
export const contractUtils = {
  // Register a new owner
  registerOwner: async (
    writeContract: any,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    graceInterval: number
  ) => {
    const graceIntervalSeconds = daysToSeconds(graceInterval);
    
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'registerOwner',
      args: [
        firstName,
        lastName,
        email,
        phone,
        graceIntervalSeconds
      ],
    });
  },
  
  // Add a new contact
  addContact: async (
    writeContract: any,
    contactAddress: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    hasVotingRight: boolean,
    authorizedVaults: bigint[]
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
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
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'sendHeartbeat',
      args: [],
    });
  },
  
  // Get owner info
  getOwnerInfo: async (readContract: any, ownerAddress: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getOwnerInfo',
      args: [ownerAddress],
    });
  },

  // Create a new vault
  createVault: async (
    writeContract: any,
    name: string,
    cypherIv: string,
    encryptionKey: string
  ) => {
    console.log('contractUtils.createVault called with:', { name, cypherIv, encryptionKey });
    
    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFESIGNAL_REGISTRY_ABI,
        functionName: 'createVault',
        args: [name, cypherIv, encryptionKey],
      });
      
      console.log('writeContract result:', result);
      return result;
    } catch (error) {
      console.error('Error in createVault contract call:', error);
      throw error;
    }
  },

  // Add a file to a vault
  addVaultFile: async (
    writeContract: any,
    vaultId: string,
    originalName: string,
    mimeType: string,
    cid: string,
    uploadDate: string
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'addVaultFile',
      args: [vaultId, originalName, mimeType, cid, uploadDate],
    });
  },

  // Authorize a contact to access a vault
  authorizeVaultContact: async (
    writeContract: any,
    vaultId: string,
    contact: string
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'authorizeVaultContact',
      args: [vaultId, contact],
    });
  },

  // Release a vault
  releaseVault: async (
    writeContract: any,
    vaultId: string
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'releaseVault',
      args: [vaultId],
    });
  },

    // Get vault information
  getVaultInfo: async (readContract: any, vaultId: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getVaultInfo',
      args: [vaultId],
    });
  },

  // Get contact's vault details
  getContactVaultDetails: async (readContract: any, contactAddress: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getContactVaultDetails',
      args: [contactAddress],
    });
  },

  // Get vault file information
  getVaultFileInfo: async (readContract: any, vaultId: string, fileId: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getVaultFileInfo',
      args: [vaultId, fileId],
    });
  },

  // Get vault's authorized contacts
  getVaultAuthorizedContacts: async (readContract: any, vaultId: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getVaultAuthorizedContacts',
      args: [vaultId],
    });
  },

  // Get owner's vault list
  getOwnerVaultList: async (readContract: any, owner: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getOwnerVaultList',
      args: [owner],
    });
  },

  // Check if address is authorized for vault
  isVaultAuthorized: async (readContract: any, vaultId: string, address: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'isVaultAuthorized',
      args: [vaultId, address],
    });
  },

  // Get contact list
  getContactList: async (readContract: any, owner: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getContactList',
      args: [owner],
    });
  },

  // Get detailed contact list
  getContactListDetails: async (readContract: any, owner: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getContactListDetails',
      args: [owner],
    });
  },

  // Get contact info
  getContactInfo: async (readContract: any, owner: string, contact: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getContactInfo',
      args: [owner, contact],
    });
  },

  // Update contact information
  updateContactInfo: async (
    writeContract: any,
    ownerAddress: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'updateContactInfo',
      args: [ownerAddress, firstName, lastName, email, phone],
    });
  },

  // Get contact's authorized vaults
  getContactAuthorizedVaults: async (readContract: any, ownerAddress: string, contactAddress: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getContactAuthorizedVaults',
      args: [ownerAddress, contactAddress],
    });
  },

  // Get vault file list
  getVaultFileList: async (readContract: any, vaultId: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getVaultFileList',
      args: [vaultId],
    });
  },

  // Get detailed vault list
  getOwnerVaultListDetails: async (readContract: any, owner: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getOwnerVaultListDetails',
      args: [owner],
    });
  }
}; 