// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Errors Library for LifeSignal
 * @dev Defines all custom errors used across the LifeSignal contracts
 */
library LifeSignalErrors {
    // === GENERAL ERRORS ===
    error ZeroAddress();
    error InvalidAmount();
    error InvalidPercentage();
    error InvalidTimestamp();
    error InvalidIndex();
    error ArrayLengthMismatch();
    error InsufficientBalance();
    error TransferFailed();
    error InvalidSignature();
    error InvalidNonce();
    error ExpiredTransaction();

    // === ACCESS CONTROL ERRORS ===
    error NotOwner();
    error NotHeir();
    error NotController();
    error NotOracle();
    error NotAuthorized();
    error NotBackupOwner();
    error NotEmergencyContact();
    error UnauthorizedCaller();

    // === VAULT ERRORS ===
    error VaultNotActive();
    error VaultNotPending();
    error VaultNotDeceased();
    error VaultAlreadyDistributed();
    error VaultNotExists();
    error VaultAlreadyExists();
    error VaultNotInitialized();
    error VaultConfigurationInvalid();
    error VaultLocked();
    error VaultNotLocked();
    error VaultEmergencyWithdrawDisabled();

    // === HEIR REGISTRY ERRORS ===
    error HeirNotFound();
    error HeirAlreadyExists();
    error HeirAlreadyClaimed();
    error HeirInvalidShare();
    error HeirShareExceedsLimit();
    error HeirListEmpty();
    error HeirCannotBeOwner();
    error HeirInvalidEncryptedKey();
    error TotalSharesExceed100Percent();
    error TotalSharesBelow100Percent();
    error MaximumHeirsReached();

    // === KEEP ALIVE ERRORS ===
    error HeartbeatTooEarly();
    error HeartbeatExpired();
    error HeartbeatFromUnauthorizedDevice();
    error HeartbeatInvalidMessage();
    error ActivityThresholdNotMet();
    error LastActivityTooRecent();

    // === DEATH ORACLE ERRORS ===
    error DeathProofNotFound();
    error DeathProofAlreadySubmitted();
    error DeathProofAlreadyVerified();
    error DeathProofExpired();
    error DeathProofInvalidDocument();
    error DeathProofInvalidSubmitter();
    error DeathProofInsufficientConfirmations();
    error DeathProofVerificationWindowExpired();
    error DeathProofAlreadyRejected();
    error OracleNotStaked();
    error OracleAlreadyVoted();
    error OracleInvalidVote();
    error OracleInsufficientStake();
    error OracleNotAuthorized();

    // === VAULT CONTROLLER ERRORS ===
    error ControllerNotInitialized();
    error ControllerInvalidState();
    error ControllerDistributionNotReady();
    error ControllerGracePeriodNotExpired();
    error ControllerInactivityThresholdNotMet();
    error ControllerDeathProofRequired();
    error ControllerEmergencyLockActive();
    error ControllerBackupOwnerNotActive();

    // === FACTORY ERRORS ===
    error FactoryImplementationNotSet();
    error FactoryVaultCreationFailed();
    error FactoryInvalidParameters();
    error FactoryOwnerAlreadyHasVault();
    error FactoryBeaconNotUpgradeable();

    // === ASSET ERRORS ===
    error AssetNotSupported();
    error AssetTransferFailed();
    error AssetInsufficientAmount();
    error AssetInvalidTokenId();
    error AssetNotOwned();
    error AssetAlreadyDistributed();
    error AssetLocked();
    error AssetInvalidType();

    // === DISTRIBUTION ERRORS ===
    error DistributionNotAuthorized();
    error DistributionAlreadyCompleted();
    error DistributionInvalidHeir();
    error DistributionCalculationError();
    error DistributionTransferFailed();
    error DistributionGracePeriodActive();
    error DistributionNoAssetsToDistribute();
    error DistributionEmergencyLockActive();

    // === CONFIGURATION ERRORS ===
    error ConfigInvalidInactivityThreshold();
    error ConfigInvalidGracePeriod();
    error ConfigInvalidStakingAmount();
    error ConfigInvalidOracleCount();
    error ConfigInvalidConfirmationCount();
    error ConfigInvalidVerificationWindow();
    error ConfigNotInitialized();
    error ConfigAlreadyInitialized();

    // === EMERGENCY ERRORS ===
    error EmergencyNotActive();
    error EmergencyAlreadyActive();
    error EmergencyContactNotAuthorized();
    error EmergencyWithdrawNotAllowed();
    error EmergencyTimeoutNotReached();
    error EmergencyInvalidReason();

    // === BACKUP OWNER ERRORS ===
    error BackupOwnerNotSet();
    error BackupOwnerAlreadyActive();
    error BackupOwnerActivationDelayNotMet();
    error BackupOwnerCannotBeOwner();
    error BackupOwnerCannotBeHeir();
    error BackupOwnerInvalidActivation();

    // === STAKING ERRORS ===
    error StakingInsufficientAmount();
    error StakingAlreadyStaked();
    error StakingNotStaked();
    error StakingLockPeriodNotExpired();
    error StakingSlashingInProgress();
    error StakingInvalidReward();

    // === GOVERNANCE ERRORS ===
    error GovernanceNotInitialized();
    error GovernanceInvalidProposal();
    error GovernanceInsufficientVotes();
    error GovernanceProposalExpired();
    error GovernanceAlreadyExecuted();
    error GovernanceInvalidExecutor();

    // === CRYPTOGRAPHY ERRORS ===
    error CryptoInvalidKeyLength();
    error CryptoInvalidEncryption();
    error CryptoDecryptionFailed();
    error CryptoInvalidHash();
    error CryptoKeyAlreadyRevealed();
    error CryptoInvalidProof();

    // === NETWORK ERRORS ===
    error NetworkInvalidChainId();
    error NetworkInvalidBlock();
    error NetworkInvalidGasPrice();
    error NetworkTransactionReverted();
    error NetworkInsufficientGas();

    // === UPGRADE ERRORS ===
    error UpgradeNotAuthorized();
    error UpgradeInvalidImplementation();
    error UpgradeIncompatibleVersion();
    error UpgradeInProgress();
    error UpgradeNotRequired();
} 