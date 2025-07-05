// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "../interfaces/IDeathOracle.sol";
import "../interfaces/IVault.sol";
import "../libraries/Types.sol";
import "../libraries/LifeSignalErrors.sol";

/**
 * @title DeathOracle
 * @dev Contract for verifying death proofs through multiple oracle consensus
 */
contract DeathOracle is IDeathOracle, AccessControl, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Constants
    uint256 public constant MIN_REQUIRED_CONFIRMATIONS = 2;
    uint256 public constant MAX_REQUIRED_CONFIRMATIONS = 10;
    uint256 public constant DEFAULT_VERIFICATION_WINDOW = 7 days;
    uint256 public constant DEFAULT_STAKING_AMOUNT = 1 ether;
    uint256 public constant MAX_ORACLES = 20;

    // State variables
    mapping(address => mapping(bytes32 => Types.DeathProof)) private deathProofs;
    mapping(address => mapping(bytes32 => uint256)) private confirmationCounts;
    mapping(address => mapping(bytes32 => mapping(address => bool))) private oracleVotes;
    mapping(address => uint256) private oracleStakes;
    mapping(address => bool) private activeOracles;
    
    address[] private oracleList;
    Types.OracleConfig private oracleConfig;
    
    // Events for slashing
    event OracleSlashed(address indexed oracle, uint256 amount, string reason);
    event StakeWithdrawn(address indexed oracle, uint256 amount);

    // Modifiers
    modifier onlyActiveOracle() {
        if (!activeOracles[msg.sender]) revert LifeSignalErrors.OracleNotAuthorized();
        if (oracleStakes[msg.sender] < oracleConfig.stakingAmount) revert LifeSignalErrors.OracleInsufficientStake();
        _;
    }

    modifier validVault(address vault) {
        if (vault == address(0)) revert LifeSignalErrors.ZeroAddress();
        _;
    }

    modifier validProofHash(bytes32 proofHash) {
        if (proofHash == bytes32(0)) revert LifeSignalErrors.DeathProofInvalidDocument();
        _;
    }

    modifier proofExists(address vault, bytes32 proofHash) {
        if (deathProofs[vault][proofHash].submissionTimestamp == 0) revert LifeSignalErrors.DeathProofNotFound();
        _;
    }

    modifier proofNotExpired(address vault, bytes32 proofHash) {
        if (isProofExpired(vault, proofHash)) revert LifeSignalErrors.DeathProofExpired();
        _;
    }

    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        // Initialize default configuration
        oracleConfig = Types.OracleConfig({
            oracles: new address[](0),
            requiredConfirmations: MIN_REQUIRED_CONFIRMATIONS,
            verificationWindow: DEFAULT_VERIFICATION_WINDOW,
            stakingAmount: DEFAULT_STAKING_AMOUNT
        });
    }

    /**
     * @dev Submit a death proof
     */
    function submitDeathProof(
        address vault,
        bytes32 documentHash,
        string calldata ipfsHash,
        bytes calldata signature
    ) external override nonReentrant whenNotPaused validVault(vault) validProofHash(documentHash) {
        // Check if proof already exists
        if (deathProofs[vault][documentHash].submissionTimestamp != 0) {
            revert LifeSignalErrors.DeathProofAlreadySubmitted();
        }
        
        // Verify signature if provided
        if (signature.length > 0) {
            bytes32 messageHash = keccak256(abi.encodePacked(vault, documentHash, ipfsHash));
            address recovered = ECDSA.recover(messageHash.toEthSignedMessageHash(), signature);
            // Could add additional signature verification logic here
        }
        
        // Create death proof
        Types.DeathProof memory proof = Types.DeathProof({
            documentHash: documentHash,
            submitter: msg.sender,
            submissionTimestamp: block.timestamp,
            verificationDeadline: block.timestamp + oracleConfig.verificationWindow,
            status: Types.DeathProofStatus.Pending,
            signature: signature,
            ipfsHash: ipfsHash
        });
        
        deathProofs[vault][documentHash] = proof;
        confirmationCounts[vault][documentHash] = 0;
        
        emit DeathProofSubmitted(
            vault,
            msg.sender,
            documentHash,
            ipfsHash,
            proof.verificationDeadline,
            block.timestamp
        );
    }

    /**
     * @dev Verify a death proof (oracle function)
     */
    function verifyDeathProof(
        address vault,
        bytes32 proofHash,
        bool isValid,
        string calldata reason
    ) external override nonReentrant whenNotPaused validVault(vault) validProofHash(proofHash) proofExists(vault, proofHash) proofNotExpired(vault, proofHash) onlyActiveOracle {
        Types.DeathProof storage proof = deathProofs[vault][proofHash];
        
        // Check if proof is already finalized
        if (proof.status != Types.DeathProofStatus.Pending) {
            revert LifeSignalErrors.DeathProofAlreadyVerified();
        }
        
        // Check if oracle has already voted
        if (oracleVotes[vault][proofHash][msg.sender]) {
            revert LifeSignalErrors.OracleAlreadyVoted();
        }
        
        // Record vote
        oracleVotes[vault][proofHash][msg.sender] = true;
        
        if (isValid) {
            confirmationCounts[vault][proofHash]++;
            
            emit DeathProofVerified(
                vault,
                proofHash,
                msg.sender,
                confirmationCounts[vault][proofHash],
                block.timestamp
            );
            
            // Check if we have enough confirmations
            if (confirmationCounts[vault][proofHash] >= oracleConfig.requiredConfirmations) {
                proof.status = Types.DeathProofStatus.Verified;
            }
        } else {
            emit DeathProofRejected(vault, proofHash, msg.sender, reason, block.timestamp);
        }
    }

    /**
     * @dev Reject a death proof (oracle function)
     */
    function rejectDeathProof(
        address vault,
        bytes32 proofHash,
        string calldata reason
    ) external override nonReentrant whenNotPaused validVault(vault) validProofHash(proofHash) proofExists(vault, proofHash) proofNotExpired(vault, proofHash) onlyActiveOracle {
        Types.DeathProof storage proof = deathProofs[vault][proofHash];
        
        if (proof.status != Types.DeathProofStatus.Pending) {
            revert LifeSignalErrors.DeathProofAlreadyVerified();
        }
        
        if (oracleVotes[vault][proofHash][msg.sender]) {
            revert LifeSignalErrors.OracleAlreadyVoted();
        }
        
        oracleVotes[vault][proofHash][msg.sender] = true;
        proof.status = Types.DeathProofStatus.Rejected;
        
        emit DeathProofRejected(vault, proofHash, msg.sender, reason, block.timestamp);
    }

    /**
     * @dev Finalize a death proof (anyone can call after verification window)
     */
    function finalizeDeathProof(address vault, bytes32 proofHash) external override nonReentrant whenNotPaused validVault(vault) validProofHash(proofHash) proofExists(vault, proofHash) {
        Types.DeathProof storage proof = deathProofs[vault][proofHash];
        
        if (proof.status != Types.DeathProofStatus.Pending) {
            return; // Already finalized
        }
        
        if (block.timestamp <= proof.verificationDeadline) {
            revert LifeSignalErrors.DeathProofVerificationWindowExpired();
        }
        
        // Check if minimum confirmations reached
        if (confirmationCounts[vault][proofHash] >= oracleConfig.requiredConfirmations) {
            proof.status = Types.DeathProofStatus.Verified;
        } else {
            proof.status = Types.DeathProofStatus.Expired;
            emit DeathProofExpired(vault, proofHash, block.timestamp);
        }
    }

    /**
     * @dev Get death proof information
     */
    function getDeathProof(
        address vault,
        bytes32 proofHash
    ) external view override validVault(vault) validProofHash(proofHash) returns (Types.DeathProof memory) {
        return deathProofs[vault][proofHash];
    }

    /**
     * @dev Get death proof status
     */
    function getDeathProofStatus(
        address vault,
        bytes32 proofHash
    ) external view override validVault(vault) validProofHash(proofHash) returns (Types.DeathProofStatus) {
        return deathProofs[vault][proofHash].status;
    }

    /**
     * @dev Get confirmation count for a proof
     */
    function getConfirmationsCount(
        address vault,
        bytes32 proofHash
    ) external view override validVault(vault) validProofHash(proofHash) returns (uint256) {
        return confirmationCounts[vault][proofHash];
    }

    /**
     * @dev Check if oracle has voted on a proof
     */
    function hasOracleVoted(
        address vault,
        bytes32 proofHash,
        address oracle
    ) external view override validVault(vault) validProofHash(proofHash) returns (bool) {
        return oracleVotes[vault][proofHash][oracle];
    }

    /**
     * @dev Check if proof is expired
     */
    function isProofExpired(
        address vault,
        bytes32 proofHash
    ) public view override validVault(vault) validProofHash(proofHash) returns (bool) {
        Types.DeathProof memory proof = deathProofs[vault][proofHash];
        if (proof.submissionTimestamp == 0) return false;
        
        return block.timestamp > proof.verificationDeadline;
    }

    /**
     * @dev Get required confirmations
     */
    function getRequiredConfirmations() external view override returns (uint256) {
        return oracleConfig.requiredConfirmations;
    }

    /**
     * @dev Get verification window
     */
    function getVerificationWindow() external view override returns (uint256) {
        return oracleConfig.verificationWindow;
    }

    /**
     * @dev Get oracle stake amount
     */
    function getOracleStake(address oracle) external view override returns (uint256) {
        return oracleStakes[oracle];
    }

    /**
     * @dev Check if address is an active oracle
     */
    function isOracle(address oracle) external view override returns (bool) {
        return activeOracles[oracle];
    }

    /**
     * @dev Get list of active oracles
     */
    function getActiveOracles() external view override returns (address[] memory) {
        return oracleList;
    }

    /**
     * @dev Get oracle configuration
     */
    function getOracleConfiguration() external view override returns (Types.OracleConfig memory) {
        return oracleConfig;
    }

    // Oracle Management Functions
    function addOracle(address oracle) external override onlyRole(ADMIN_ROLE) {
        if (oracle == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (activeOracles[oracle]) revert LifeSignalErrors.OracleAlreadyVoted(); // Oracle already exists
        if (oracleList.length >= MAX_ORACLES) revert LifeSignalErrors.ConfigInvalidOracleCount();
        
        activeOracles[oracle] = true;
        oracleList.push(oracle);
        _grantRole(ORACLE_ROLE, oracle);
        
        emit OracleAdded(oracle, 0, block.timestamp);
    }

    function removeOracle(address oracle) external override onlyRole(ADMIN_ROLE) {
        if (!activeOracles[oracle]) revert LifeSignalErrors.OracleNotAuthorized();
        
        activeOracles[oracle] = false;
        _revokeRole(ORACLE_ROLE, oracle);
        
        // Remove from oracle list
        for (uint256 i = 0; i < oracleList.length; i++) {
            if (oracleList[i] == oracle) {
                oracleList[i] = oracleList[oracleList.length - 1];
                oracleList.pop();
                break;
            }
        }
        
        emit OracleRemoved(oracle, block.timestamp);
    }

    function stakeForOracle() external payable override nonReentrant {
        if (msg.value == 0) revert LifeSignalErrors.InvalidAmount();
        if (!activeOracles[msg.sender]) revert LifeSignalErrors.OracleNotAuthorized();
        
        oracleStakes[msg.sender] += msg.value;
        
        emit OracleAdded(msg.sender, msg.value, block.timestamp);
    }

    function withdrawStake() external override nonReentrant {
        if (!activeOracles[msg.sender]) revert LifeSignalErrors.OracleNotAuthorized();
        
        uint256 stake = oracleStakes[msg.sender];
        if (stake == 0) revert LifeSignalErrors.StakingNotStaked();
        
        oracleStakes[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: stake}("");
        if (!success) revert LifeSignalErrors.TransferFailed();
        
        emit StakeWithdrawn(msg.sender, stake);
    }

    function slashOracle(address oracle, uint256 amount, string calldata reason) external override onlyRole(ADMIN_ROLE) {
        if (!activeOracles[oracle]) revert LifeSignalErrors.OracleNotAuthorized();
        if (oracleStakes[oracle] < amount) revert LifeSignalErrors.StakingInsufficientAmount();
        
        oracleStakes[oracle] -= amount;
        
        emit OracleStakeSlashed(oracle, amount, reason, block.timestamp);
    }

    // Administrative Functions
    function updateOracleConfiguration(Types.OracleConfig calldata newConfig) external override onlyRole(ADMIN_ROLE) {
        if (newConfig.requiredConfirmations < MIN_REQUIRED_CONFIRMATIONS || 
            newConfig.requiredConfirmations > MAX_REQUIRED_CONFIRMATIONS) {
            revert LifeSignalErrors.ConfigInvalidConfirmationCount();
        }
        
        oracleConfig = newConfig;
        
        emit ConfigurationUpdated(newConfig, block.timestamp);
    }

    function setRequiredConfirmations(uint256 confirmations) external override onlyRole(ADMIN_ROLE) {
        if (confirmations < MIN_REQUIRED_CONFIRMATIONS || confirmations > MAX_REQUIRED_CONFIRMATIONS) {
            revert LifeSignalErrors.ConfigInvalidConfirmationCount();
        }
        
        oracleConfig.requiredConfirmations = confirmations;
    }

    function setVerificationWindow(uint256 window) external override onlyRole(ADMIN_ROLE) {
        if (window == 0) revert LifeSignalErrors.ConfigInvalidVerificationWindow();
        
        oracleConfig.verificationWindow = window;
    }

    function setStakingAmount(uint256 amount) external override onlyRole(ADMIN_ROLE) {
        if (amount == 0) revert LifeSignalErrors.ConfigInvalidStakingAmount();
        
        oracleConfig.stakingAmount = amount;
    }

    function pause() external override onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external override onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function emergencyReject(address vault, bytes32 proofHash, string calldata reason) external override onlyRole(EMERGENCY_ROLE) {
        if (deathProofs[vault][proofHash].submissionTimestamp == 0) revert LifeSignalErrors.DeathProofNotFound();
        
        deathProofs[vault][proofHash].status = Types.DeathProofStatus.Rejected;
        
        emit DeathProofRejected(vault, proofHash, msg.sender, reason, block.timestamp);
    }

    function emergencyApprove(address vault, bytes32 proofHash, string calldata reason) external override onlyRole(EMERGENCY_ROLE) {
        if (deathProofs[vault][proofHash].submissionTimestamp == 0) revert LifeSignalErrors.DeathProofNotFound();
        
        deathProofs[vault][proofHash].status = Types.DeathProofStatus.Verified;
        
        emit DeathProofVerified(vault, proofHash, msg.sender, type(uint256).max, block.timestamp);
    }

    /**
     * @dev Allow contract to receive ETH for oracle staking
     */
    receive() external payable {}
} 