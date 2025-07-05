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
  }
] as const;

// Contract addresses
export const CONTRACT_ADDRESSES = {
  LIFESIGNAL_REGISTRY: '0xf64c07E6D898e665ffAABd937890C7ee7EC4f7A8' as `0x${string}`,
} as const;

// Hook to use contract read functions
export function useLifeSignalRegistryRead() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
    abi: LIFESIGNAL_REGISTRY_ABI,
  });
}

// Hook to use contract write functions
export function useLifeSignalRegistryWrite() {
  return useWriteContract();
}

// Utility function to encrypt data for Sapphire
export async function encryptForSapphire(data: string): Promise<string> {
  try {
    // For Oasis Sapphire compatibility, we'll use a simple encoding
    // that can be processed by the confidential computing environment
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    
    // Create a simple encryption using XOR with a key
    // This is a placeholder - in production you'd use proper Sapphire encryption
    const key = new Uint8Array([0x1a, 0x2b, 0x3c, 0x4d, 0x5e, 0x6f, 0x7a, 0x8b]);
    const encrypted = new Uint8Array(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ key[i % key.length];
    }
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...encrypted));
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback to base64 encoding
    return btoa(unescape(encodeURIComponent(data)));
  }
}

// Utility function to decrypt data from Sapphire
export async function decryptFromSapphire(encryptedData: string): Promise<string> {
  try {
    // Convert from base64 to Uint8Array
    const encryptedBytes = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Decrypt using the same XOR key
    const key = new Uint8Array([0x1a, 0x2b, 0x3c, 0x4d, 0x5e, 0x6f, 0x7a, 0x8b]);
    const decrypted = new Uint8Array(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ key[i % key.length];
    }
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Fallback to base64 decoding
    try {
      return decodeURIComponent(escape(atob(encryptedData)));
    } catch {
      return encryptedData;
    }
  }
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
    
    // Encrypt sensitive data
    const encryptedFirstName = await encryptForSapphire(firstName);
    const encryptedLastName = await encryptForSapphire(lastName);
    const encryptedEmail = await encryptForSapphire(email);
    const encryptedPhone = await encryptForSapphire(phone);
    
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'registerOwner',
      args: [
        encryptedFirstName,
        encryptedLastName,
        encryptedEmail,
        encryptedPhone,
        graceIntervalSeconds
      ],
    });
  },
  
  // Add a new contact
  addContact: async (
    writeContract: any,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    hasVotingRight: boolean
  ) => {
    // Encrypt sensitive data
    const encryptedFirstName = await encryptForSapphire(firstName);
    const encryptedLastName = await encryptForSapphire(lastName);
    const encryptedEmail = await encryptForSapphire(email);
    const encryptedPhone = await encryptForSapphire(phone);
    
    return writeContract({
      address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
      abi: LIFESIGNAL_REGISTRY_ABI,
      functionName: 'addContact',
      args: [
        encryptedFirstName,
        encryptedLastName,
        encryptedEmail,
        encryptedPhone,
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
  }
}; 