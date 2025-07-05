// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Types Library for LifeSignal
 * @dev Defines all the data structures used across the LifeSignal contracts
 */
library Types {
    /**
     * @dev Represents the different states of a vault
     */
    enum VaultState {
        Active,      // Vault is active and owner can interact
        Pending,     // Grace period after inactivity/death proof
        Deceased,    // Owner confirmed deceased, distribution can begin
        Distributed  // Assets have been distributed to heirs
    }

    /**
     * @dev Represents the status of a death proof
     */
    enum DeathProofStatus {
        Pending,     // Proof submitted but not yet verified
        Verified,    // Proof verified and accepted
        Rejected,    // Proof rejected or invalid
        Expired      // Proof expired without verification
    }

    /**
     * @dev Represents an heir in the inheritance system
     */
    struct Heir {
        address heirAddress;      // Address of the heir
        uint96 sharePercentage;   // Percentage of inheritance (basis points, 10000 = 100%)
        bytes encryptedKey;       // Encrypted private key for heir (optional)
        bool hasClaimed;          // Whether heir has claimed their share
        string name;              // Optional name for the heir
        uint256 addedTimestamp;   // When heir was added
    }

    /**
     * @dev Represents a vault's configuration
     */
    struct VaultConfig {
        uint256 inactivityThreshold;  // Time in seconds after which vault is considered inactive
        uint256 gracePeriod;          // Time in seconds before distribution begins after death/inactivity
        uint256 minimumStake;         // Minimum stake required for certain operations
        bool requiresDeathProof;      // Whether death proof is required or inactivity is sufficient
        bool allowEmergencyWithdraw;  // Whether emergency withdrawals are allowed
    }

    /**
     * @dev Represents a death proof submission
     */
    struct DeathProof {
        bytes32 documentHash;         // Hash of the death certificate/document
        address submitter;            // Address of who submitted the proof
        uint256 submissionTimestamp;  // When proof was submitted
        uint256 verificationDeadline; // Deadline for verification
        DeathProofStatus status;      // Current status of the proof
        bytes signature;              // Optional signature for verification
        string ipfsHash;              // IPFS hash of supporting documents
    }

    /**
     * @dev Represents a heartbeat/proof-of-life record
     */
    struct Heartbeat {
        uint256 timestamp;            // When the heartbeat was recorded
        bytes32 messageHash;          // Hash of any message included with heartbeat
        address deviceAddress;        // Address of device that sent heartbeat (optional)
        uint256 blockNumber;          // Block number when heartbeat was recorded
    }

    /**
     * @dev Represents an asset in the vault
     */
    struct Asset {
        address tokenAddress;         // Address of the token (address(0) for ETH)
        uint256 amount;               // Amount of the asset
        uint256 tokenId;              // Token ID for NFTs (0 for fungible tokens)
        AssetType assetType;          // Type of the asset
        uint256 depositTimestamp;     // When asset was deposited
    }

    /**
     * @dev Types of assets that can be stored
     */
    enum AssetType {
        ETH,        // Native ETH
        ERC20,      // ERC-20 tokens
        ERC721,     // ERC-721 NFTs
        ERC1155     // ERC-1155 multi-tokens
    }

    /**
     * @dev Represents a distribution event
     */
    struct Distribution {
        address heir;                 // Address of the heir
        Asset[] assets;               // Assets distributed
        uint256 timestamp;            // When distribution occurred
        bytes32 transactionHash;      // Hash of the distribution transaction
    }

    /**
     * @dev Oracle configuration for death verification
     */
    struct OracleConfig {
        address[] oracles;            // List of oracle addresses
        uint256 requiredConfirmations; // Number of confirmations required
        uint256 verificationWindow;   // Time window for verification
        uint256 stakingAmount;        // Amount oracles must stake
    }

    /**
     * @dev Emergency contact information
     */
    struct EmergencyContact {
        address contactAddress;       // Address of emergency contact
        string name;                  // Name of contact
        string relationship;          // Relationship to owner
        bool canCancelDistribution;   // Whether contact can cancel distribution
        uint256 addedTimestamp;       // When contact was added
    }

    /**
     * @dev Backup owner configuration
     */
    struct BackupOwner {
        address backupAddress;        // Address of backup owner
        uint256 activationDelay;      // Delay before backup owner can act
        uint256 lastActivityCheck;    // Last time backup owner checked activity
        bool isActive;                // Whether backup owner is currently active
    }
} 