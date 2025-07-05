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
  files?: VaultFile[];
  contacts?: User[];
  isReleased: boolean;
  cypher: {
    iv: string;
    encryptionKey: string;
  };
}

export interface User {
  id: string;
  address?: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  isIdVerified: boolean;
}

export interface Contact extends User {
  hasVotingRight: boolean;
  vaults?: Vault[];
  owner: Owner;
}

export interface Owner extends User {
  status: 'active' | 'voting_in_progress' | 'grace_period' | 'dead';
  graceInterval: number; // days
  birthDate?: string;
  hasVotingRight: boolean;
  isIdVerified: boolean;
  deathDeclaration: {
    declaredBy: string;
    declaredAt: string;
    votes: { contactId: string; voted: boolean; votedAt: string }[];
    consensusReached: boolean;
    consensusReachedAt?: string;
  } | null;
  vaults?: Vault[];
  contacts?: User[];
}

// Circular type references require TypeScript's type merging.
// We declare interfaces first, then add property types that reference others.
// Above ordering works because TypeScript hoists type names. 