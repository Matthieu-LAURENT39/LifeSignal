// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/Types.sol";

/**
 * @title IDeathOracle Interface
 * @dev Interface for the DeathOracle contract that verifies death proofs
 */
interface IDeathOracle {
    // Events
    event DeathProofSubmitted(
        address indexed vault,
        address indexed submitter,
        bytes32 indexed proofHash,
        string ipfsHash,
        uint256 verificationDeadline,
        uint256 timestamp
    );
    
    event DeathProofVerified(
        address indexed vault,
        bytes32 indexed proofHash,
        address indexed oracle,
        uint256 confirmationsCount,
        uint256 timestamp
    );
    
    event DeathProofRejected(
        address indexed vault,
        bytes32 indexed proofHash,
        address indexed oracle,
        string reason,
        uint256 timestamp
    );
    
    event DeathProofExpired(
        address indexed vault,
        bytes32 indexed proofHash,
        uint256 timestamp
    );
    
    event OracleAdded(
        address indexed oracle,
        uint256 stakingAmount,
        uint256 timestamp
    );
    
    event OracleRemoved(
        address indexed oracle,
        uint256 timestamp
    );
    
    event OracleStakeSlashed(
        address indexed oracle,
        uint256 slashedAmount,
        string reason,
        uint256 timestamp
    );
    
    event ConfigurationUpdated(
        Types.OracleConfig newConfig,
        uint256 timestamp
    );

    // Core Functions
    function submitDeathProof(
        address vault,
        bytes32 documentHash,
        string calldata ipfsHash,
        bytes calldata signature
    ) external;
    
    function verifyDeathProof(
        address vault,
        bytes32 proofHash,
        bool isValid,
        string calldata reason
    ) external;
    
    function rejectDeathProof(
        address vault,
        bytes32 proofHash,
        string calldata reason
    ) external;
    
    function finalizeDeathProof(address vault, bytes32 proofHash) external;

    // View Functions
    function getDeathProof(
        address vault,
        bytes32 proofHash
    ) external view returns (Types.DeathProof memory);
    
    function getDeathProofStatus(
        address vault,
        bytes32 proofHash
    ) external view returns (Types.DeathProofStatus);
    
    function getConfirmationsCount(
        address vault,
        bytes32 proofHash
    ) external view returns (uint256);
    
    function hasOracleVoted(
        address vault,
        bytes32 proofHash,
        address oracle
    ) external view returns (bool);
    
    function isProofExpired(
        address vault,
        bytes32 proofHash
    ) external view returns (bool);
    
    function getRequiredConfirmations() external view returns (uint256);
    
    function getVerificationWindow() external view returns (uint256);
    
    function getOracleStake(address oracle) external view returns (uint256);
    
    function isOracle(address oracle) external view returns (bool);
    
    function getActiveOracles() external view returns (address[] memory);
    
    function getOracleConfiguration() external view returns (Types.OracleConfig memory);

    // Oracle Management Functions
    function addOracle(address oracle) external;
    
    function removeOracle(address oracle) external;
    
    function stakeForOracle() external payable;
    
    function withdrawStake() external;
    
    function slashOracle(address oracle, uint256 amount, string calldata reason) external;

    // Administrative Functions
    function updateOracleConfiguration(Types.OracleConfig calldata newConfig) external;
    
    function setRequiredConfirmations(uint256 confirmations) external;
    
    function setVerificationWindow(uint256 window) external;
    
    function setStakingAmount(uint256 amount) external;
    
    function pause() external;
    
    function unpause() external;
    
    function emergencyReject(address vault, bytes32 proofHash, string calldata reason) external;
    
    function emergencyApprove(address vault, bytes32 proofHash, string calldata reason) external;
} 