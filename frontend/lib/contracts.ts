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
        "internalType": "bool",
        "name": "_hasVotingRight",
        "type": "bool"
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
        "internalType": "address",
        "name": "_vaultId",
        "type": "address"
      },
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
      },
      {
        "internalType": "string",
        "name": "_fileId",
        "type": "string"
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
        "internalType": "address",
        "name": "_vaultId",
        "type": "address"
      }
    ],
    "name": "getVaultInfo",
    "outputs": [
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
      },
      {
        "internalType": "string",
        "name": "_fileId",
        "type": "string"
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
  }
] as const;

// Contract addresses
export const CONTRACT_ADDRESSES = {
  LIFESIGNAL_REGISTRY: '0x2449E7b5a5e252A2B5890d0537649738E7c953Eb' as `0x${string}`,
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
    hasVotingRight: boolean
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'addContact',
      args: [
        contactAddress,
        hasVotingRight
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
    vaultId: string,
    name: string,
    cypherIv: string,
    encryptionKey: string
  ) => {
    console.log('contractUtils.createVault called with:', { vaultId, name, cypherIv, encryptionKey });
    
    try {
      const result = await writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFESIGNAL_REGISTRY_ABI,
        functionName: 'createVault',
        args: [vaultId, name, cypherIv, encryptionKey],
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
    fileId: string,
    originalName: string,
    mimeType: string,
    cid: string,
    uploadDate: string
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'addVaultFile',
      args: [vaultId, fileId, originalName, mimeType, cid, uploadDate],
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

  // Get contact info
  getContactInfo: async (readContract: any, owner: string, contact: string) => {
    return readContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'getContactInfo',
      args: [owner, contact],
    });
  }
}; 