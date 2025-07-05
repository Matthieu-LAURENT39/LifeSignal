// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IVaultController.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IHeirRegistry.sol";
import "./interfaces/IKeepAlive.sol";
import "./interfaces/IDeathOracle.sol";
import "./libraries/Types.sol";
import "./libraries/LifeSignalErrors.sol";

/**
 * @title VaultController
 * @dev Controller contract that manages vault lifecycle and state transitions
 */
contract VaultController is IVaultController, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // State variables
    address private deathOracle;
    address private keepAlive;
    uint256 private requiredConfirmations;
    Types.VaultConfig private globalConfig;
    
    mapping(address => Types.VaultState) private vaultStates;
    mapping(address => uint256) private gracePeriodEnds;
    mapping(address => bool) private emergencyLocks;
    mapping(address => Types.BackupOwner) private backupOwners;
    mapping(address => bool) private authorizedVaults;

    // Events
    event VaultAuthorized(address indexed vault, uint256 timestamp);
    event VaultUnauthorized(address indexed vault, uint256 timestamp);
    event GracePeriodStarted(address indexed vault, uint256 endTime, uint256 timestamp);
    event GracePeriodEnded(address indexed vault, uint256 timestamp);

    // Modifiers
    modifier onlyAuthorizedVault(address vault) {
        if (!authorizedVaults[vault]) revert LifeSignalErrors.VaultNotExists();
        _;
    }

    modifier validVault(address vault) {
        if (vault == address(0)) revert LifeSignalErrors.ZeroAddress();
        _;
    }

    modifier notEmergencyLocked(address vault) {
        if (emergencyLocks[vault]) revert LifeSignalErrors.ControllerEmergencyLockActive();
        _;
    }

    modifier onlyVaultOwner(address vault) {
        if (msg.sender != IVault(vault).getOwner()) revert LifeSignalErrors.NotOwner();
        _;
    }

    modifier onlyBackupOwner(address vault) {
        if (msg.sender != backupOwners[vault].backupAddress) revert LifeSignalErrors.NotBackupOwner();
        if (!backupOwners[vault].isActive) revert LifeSignalErrors.ControllerBackupOwnerNotActive();
        _;
    }

    /**
     * @dev Constructor
     */
    constructor(
        address _deathOracle,
        address _keepAlive,
        uint256 _requiredConfirmations
    ) {
        if (_deathOracle == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (_keepAlive == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (_requiredConfirmations == 0) revert LifeSignalErrors.ConfigInvalidConfirmationCount();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);

        deathOracle = _deathOracle;
        keepAlive = _keepAlive;
        requiredConfirmations = _requiredConfirmations;

        // Set default global configuration
        globalConfig = Types.VaultConfig({
            inactivityThreshold: 365 days,
            gracePeriod: 30 days,
            minimumStake: 0.1 ether,
            requiresDeathProof: false,
            allowEmergencyWithdraw: true
        });
    }

    /**
     * @dev Check vault status and update state if necessary
     */
    function checkVaultStatus(address vault) external override nonReentrant whenNotPaused validVault(vault) onlyAuthorizedVault(vault) notEmergencyLocked(vault) {
        Types.VaultState currentState = vaultStates[vault];
        
        if (currentState == Types.VaultState.Active) {
            // Check for inactivity
            if (isInactivityThresholdMet(vault)) {
                Types.VaultConfig memory config = IVault(vault).getConfiguration();
                
                if (config.requiresDeathProof) {
                    // Requires death proof, don't auto-transition
                    emit InactivityDetected(
                        vault,
                        IVault(vault).getOwner(),
                        IKeepAlive(keepAlive).getLastHeartbeatTimestamp(vault),
                        config.inactivityThreshold,
                        block.timestamp
                    );
                } else {
                    // Auto-transition to pending state
                    _transitionVaultState(vault, Types.VaultState.Pending);
                }
            }
        } else if (currentState == Types.VaultState.Pending) {
            // Check if grace period has expired
            if (isGracePeriodExpired(vault)) {
                _transitionVaultState(vault, Types.VaultState.Deceased);
            }
        }
    }

    /**
     * @dev Process a death proof submission
     */
    function processDeathProof(
        address vault,
        bytes32 proofHash,
        bytes calldata signature
    ) external override nonReentrant whenNotPaused validVault(vault) onlyAuthorizedVault(vault) notEmergencyLocked(vault) {
        // Verify death proof with oracle
        Types.DeathProofStatus status = IDeathOracle(deathOracle).getDeathProofStatus(vault, proofHash);
        
        if (status == Types.DeathProofStatus.Verified) {
            uint256 confirmations = IDeathOracle(deathOracle).getConfirmationsCount(vault, proofHash);
            
            if (confirmations >= requiredConfirmations) {
                Types.VaultState currentState = vaultStates[vault];
                
                if (currentState == Types.VaultState.Active) {
                    _transitionVaultState(vault, Types.VaultState.Pending);
                } else if (currentState == Types.VaultState.Pending) {
                    _transitionVaultState(vault, Types.VaultState.Deceased);
                }
                
                emit DeathProofSubmitted(vault, msg.sender, proofHash, block.timestamp);
            } else {
                revert LifeSignalErrors.DeathProofInsufficientConfirmations();
            }
        } else {
            revert LifeSignalErrors.DeathProofNotFound();
        }
    }

    /**
     * @dev Check inactivity and transition state if threshold is met
     */
    function checkInactivity(address vault) external override nonReentrant whenNotPaused validVault(vault) onlyAuthorizedVault(vault) notEmergencyLocked(vault) {
        if (!isInactivityThresholdMet(vault)) {
            revert LifeSignalErrors.ControllerInactivityThresholdNotMet();
        }

        Types.VaultState currentState = vaultStates[vault];
        
        if (currentState == Types.VaultState.Active) {
            Types.VaultConfig memory config = IVault(vault).getConfiguration();
            
            if (config.requiresDeathProof) {
                revert LifeSignalErrors.ControllerDeathProofRequired();
            }
            
            _transitionVaultState(vault, Types.VaultState.Pending);
            
            emit InactivityDetected(
                vault,
                IVault(vault).getOwner(),
                IKeepAlive(keepAlive).getLastHeartbeatTimestamp(vault),
                config.inactivityThreshold,
                block.timestamp
            );
        }
    }

    /**
     * @dev Initiate asset distribution to heirs
     */
    function initiateDistribution(address vault) external override nonReentrant whenNotPaused validVault(vault) onlyAuthorizedVault(vault) notEmergencyLocked(vault) {
        if (!canDistribute(vault)) revert LifeSignalErrors.ControllerDistributionNotReady();
        
        // Call vault to distribute assets
        IVault(vault).distributeToHeirs();
        
        // Update state
        vaultStates[vault] = Types.VaultState.Distributed;
        
        emit DistributionInitiated(
            vault,
            IVault(vault).getOwner(),
            gracePeriodEnds[vault],
            block.timestamp
        );
    }

    /**
     * @dev Emergency override vault state
     */
    function emergencyOverride(
        address vault,
        Types.VaultState newState,
        string calldata reason
    ) external override onlyRole(EMERGENCY_ROLE) validVault(vault) onlyAuthorizedVault(vault) {
        Types.VaultState previousState = vaultStates[vault];
        vaultStates[vault] = newState;
        
        // Update vault state directly
        IVault(vault)._updateVaultState(newState);
        
        emit EmergencyOverride(vault, msg.sender, reason, block.timestamp);
        emit VaultStateTransition(vault, IVault(vault).getOwner(), previousState, newState, block.timestamp);
    }

    /**
     * @dev Activate backup owner
     */
    function activateBackupOwner(address vault) external override nonReentrant whenNotPaused validVault(vault) onlyAuthorizedVault(vault) {
        Types.BackupOwner storage backup = backupOwners[vault];
        
        if (backup.backupAddress == address(0)) revert LifeSignalErrors.BackupOwnerNotSet();
        if (backup.isActive) revert LifeSignalErrors.BackupOwnerAlreadyActive();
        
        // Check if activation delay has passed
        if (block.timestamp < backup.lastActivityCheck + backup.activationDelay) {
            revert LifeSignalErrors.BackupOwnerActivationDelayNotMet();
        }
        
        // Check if vault owner is inactive
        if (!isInactivityThresholdMet(vault)) {
            revert LifeSignalErrors.LastActivityTooRecent();
        }
        
        backup.isActive = true;
        
        emit BackupOwnerActivated(vault, backup.backupAddress, block.timestamp);
    }

    /**
     * @dev Cancel distribution (backup owner or emergency)
     */
    function cancelDistribution(address vault) external override nonReentrant whenNotPaused validVault(vault) onlyAuthorizedVault(vault) {
        Types.VaultState currentState = vaultStates[vault];
        
        if (currentState != Types.VaultState.Pending && currentState != Types.VaultState.Deceased) {
            revert LifeSignalErrors.ControllerInvalidState();
        }
        
        // Check authorization
        bool isAuthorized = false;
        
        if (hasRole(EMERGENCY_ROLE, msg.sender)) {
            isAuthorized = true;
        } else if (backupOwners[vault].backupAddress == msg.sender && backupOwners[vault].isActive) {
            isAuthorized = true;
        }
        
        if (!isAuthorized) revert LifeSignalErrors.NotAuthorized();
        
        // Reset to active state
        _transitionVaultState(vault, Types.VaultState.Active);
        
        // Reset grace period
        gracePeriodEnds[vault] = 0;
        
        emit VaultStateTransition(vault, IVault(vault).getOwner(), currentState, Types.VaultState.Active, block.timestamp);
    }

    // View Functions
    function getVaultState(address vault) external view override validVault(vault) returns (Types.VaultState) {
        return vaultStates[vault];
    }

    function getLastActivity(address vault) external view override validVault(vault) returns (uint256) {
        return IVault(vault).getLastActivity();
    }

    function getGracePeriodEnd(address vault) external view override validVault(vault) returns (uint256) {
        return gracePeriodEnds[vault];
    }

    function isInactivityThresholdMet(address vault) public view override validVault(vault) returns (bool) {
        Types.VaultConfig memory config = IVault(vault).getConfiguration();
        uint256 lastActivity = IVault(vault).getLastActivity();
        
        return block.timestamp >= lastActivity + config.inactivityThreshold;
    }

    function isGracePeriodExpired(address vault) public view override validVault(vault) returns (bool) {
        uint256 gracePeriodEnd = gracePeriodEnds[vault];
        return gracePeriodEnd > 0 && block.timestamp >= gracePeriodEnd;
    }

    function canDistribute(address vault) public view override validVault(vault) returns (bool) {
        Types.VaultState currentState = vaultStates[vault];
        
        if (currentState != Types.VaultState.Deceased) return false;
        if (emergencyLocks[vault]) return false;
        
        // Check if grace period has expired
        return isGracePeriodExpired(vault);
    }

    function getDeathOracle() external view override returns (address) {
        return deathOracle;
    }

    function getKeepAlive() external view override returns (address) {
        return keepAlive;
    }

    function getRequiredConfirmations() external view override returns (uint256) {
        return requiredConfirmations;
    }

    // Administrative Functions
    function setDeathOracle(address newOracle) external override onlyRole(ADMIN_ROLE) {
        if (newOracle == address(0)) revert LifeSignalErrors.ZeroAddress();
        deathOracle = newOracle;
    }

    function setKeepAlive(address newKeepAlive) external override onlyRole(ADMIN_ROLE) {
        if (newKeepAlive == address(0)) revert LifeSignalErrors.ZeroAddress();
        keepAlive = newKeepAlive;
    }

    function setRequiredConfirmations(uint256 confirmations) external override onlyRole(ADMIN_ROLE) {
        if (confirmations == 0) revert LifeSignalErrors.ConfigInvalidConfirmationCount();
        requiredConfirmations = confirmations;
    }

    function setGlobalConfiguration(Types.VaultConfig calldata config) external override onlyRole(ADMIN_ROLE) {
        if (config.inactivityThreshold == 0) revert LifeSignalErrors.ConfigInvalidInactivityThreshold();
        if (config.gracePeriod == 0) revert LifeSignalErrors.ConfigInvalidGracePeriod();
        
        globalConfig = config;
    }

    function pause() external override onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external override onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function addAdmin(address admin) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ADMIN_ROLE, admin);
    }

    function removeAdmin(address admin) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ADMIN_ROLE, admin);
    }

    /**
     * @dev Authorize a vault to be managed by this controller
     */
    function authorizeVault(address vault) external onlyRole(ADMIN_ROLE) validVault(vault) {
        authorizedVaults[vault] = true;
        vaultStates[vault] = Types.VaultState.Active;
        
        emit VaultAuthorized(vault, block.timestamp);
    }

    /**
     * @dev Unauthorize a vault
     */
    function unauthorizeVault(address vault) external onlyRole(ADMIN_ROLE) validVault(vault) {
        authorizedVaults[vault] = false;
        
        emit VaultUnauthorized(vault, block.timestamp);
    }

    /**
     * @dev Set backup owner for a vault
     */
    function setBackupOwner(
        address vault,
        address backupAddress,
        uint256 activationDelay
    ) external validVault(vault) onlyVaultOwner(vault) {
        if (backupAddress == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (backupAddress == IVault(vault).getOwner()) revert LifeSignalErrors.BackupOwnerCannotBeOwner();
        if (activationDelay == 0) revert LifeSignalErrors.BackupOwnerInvalidActivation();
        
        backupOwners[vault] = Types.BackupOwner({
            backupAddress: backupAddress,
            activationDelay: activationDelay,
            lastActivityCheck: block.timestamp,
            isActive: false
        });
    }

    /**
     * @dev Set emergency lock on a vault
     */
    function setEmergencyLock(address vault, bool locked) external onlyRole(EMERGENCY_ROLE) validVault(vault) {
        emergencyLocks[vault] = locked;
    }

    /**
     * @dev Internal function to transition vault state
     */
    function _transitionVaultState(address vault, Types.VaultState newState) internal {
        Types.VaultState previousState = vaultStates[vault];
        vaultStates[vault] = newState;
        
        // Set grace period for pending state
        if (newState == Types.VaultState.Pending) {
            Types.VaultConfig memory config = IVault(vault).getConfiguration();
            gracePeriodEnds[vault] = block.timestamp + config.gracePeriod;
            
            emit GracePeriodStarted(vault, gracePeriodEnds[vault], block.timestamp);
        } else if (newState == Types.VaultState.Deceased) {
            emit GracePeriodEnded(vault, block.timestamp);
        }
        
        // Update vault state
        IVault(vault)._updateVaultState(newState);
        
        emit VaultStateTransition(vault, IVault(vault).getOwner(), previousState, newState, block.timestamp);
    }

    /**
     * @dev Get global configuration
     */
    function getGlobalConfiguration() external view returns (Types.VaultConfig memory) {
        return globalConfig;
    }

    /**
     * @dev Check if vault is authorized
     */
    function isVaultAuthorized(address vault) external view returns (bool) {
        return authorizedVaults[vault];
    }

    /**
     * @dev Get backup owner information
     */
    function getBackupOwner(address vault) external view returns (Types.BackupOwner memory) {
        return backupOwners[vault];
    }

    /**
     * @dev Check if vault is emergency locked
     */
    function isEmergencyLocked(address vault) external view returns (bool) {
        return emergencyLocks[vault];
    }
} 