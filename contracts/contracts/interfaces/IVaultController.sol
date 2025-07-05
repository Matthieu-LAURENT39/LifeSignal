// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/Types.sol";

/**
 * @title IVaultController Interface
 * @dev Interface for the VaultController contract that manages vault lifecycle
 */
interface IVaultController {
    // Events
    event VaultStateTransition(
        address indexed vault,
        address indexed owner,
        Types.VaultState fromState,
        Types.VaultState toState,
        uint256 timestamp
    );
    
    event DeathProofSubmitted(
        address indexed vault,
        address indexed submitter,
        bytes32 proofHash,
        uint256 timestamp
    );
    
    event InactivityDetected(
        address indexed vault,
        address indexed owner,
        uint256 lastActivity,
        uint256 threshold,
        uint256 timestamp
    );
    
    event DistributionInitiated(
        address indexed vault,
        address indexed owner,
        uint256 gracePeriodEnd,
        uint256 timestamp
    );
    
    event EmergencyOverride(
        address indexed vault,
        address indexed admin,
        string reason,
        uint256 timestamp
    );
    
    event BackupOwnerActivated(
        address indexed vault,
        address indexed backupOwner,
        uint256 timestamp
    );

    // Core Functions
    function checkVaultStatus(address vault) external;
    
    function processDeathProof(
        address vault,
        bytes32 proofHash,
        bytes calldata signature
    ) external;
    
    function checkInactivity(address vault) external;
    
    function initiateDistribution(address vault) external;
    
    function emergencyOverride(
        address vault,
        Types.VaultState newState,
        string calldata reason
    ) external;
    
    function activateBackupOwner(address vault) external;
    
    function cancelDistribution(address vault) external;

    // View Functions
    function getVaultState(address vault) external view returns (Types.VaultState);
    
    function getLastActivity(address vault) external view returns (uint256);
    
    function getGracePeriodEnd(address vault) external view returns (uint256);
    
    function isInactivityThresholdMet(address vault) external view returns (bool);
    
    function isGracePeriodExpired(address vault) external view returns (bool);
    
    function canDistribute(address vault) external view returns (bool);
    
    function getDeathOracle() external view returns (address);
    
    function getKeepAlive() external view returns (address);
    
    function getRequiredConfirmations() external view returns (uint256);

    // Administrative Functions
    function setDeathOracle(address newOracle) external;
    
    function setKeepAlive(address newKeepAlive) external;
    
    function setRequiredConfirmations(uint256 confirmations) external;
    
    function setGlobalConfiguration(Types.VaultConfig calldata config) external;
    
    function pause() external;
    
    function unpause() external;
    
    function addAdmin(address admin) external;
    
    function removeAdmin(address admin) external;
    
    function authorizeVault(address vault) external;
} 