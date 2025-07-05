export interface VaultFile {
  id: string;
  originalName: string;
  mimeType: string;
  cid: string;
  uploadDate: string;
}

export interface Vault {
  id: string;
  name: string;
  owner: string; // address
  files: VaultFile[];
  contacts: Contact[];
  isReleased: boolean;
  cypher: {
    iv: string;
    encryptionKey: string;
  };
}

export interface Contact {
  id: string;
  address: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  email?: string;
  hasVotingRight: boolean;
  isIdVerified: boolean;
  vaults: Vault[]; // cross ref
  user: User;      // back ref
}

export interface User {
  id: string;
  address: string;
  name: string;
  email?: string;
  status: 'active' | 'voting_in_progress' | 'grace_period' | 'dead';
  graceInterval: number; // days
  deathDeclaration: {
    declaredBy: string;
    declaredAt: string;
    votes: { contactId: string; voted: boolean; votedAt: string }[];
    consensusReached: boolean;
    consensusReachedAt?: string;
  } | null;
  vaults: Vault[];
  contacts: Contact[];
}

// Circular type references require TypeScript's type merging.
// We declare interfaces first, then add property types that reference others.
// Above ordering works because TypeScript hoists type names. 