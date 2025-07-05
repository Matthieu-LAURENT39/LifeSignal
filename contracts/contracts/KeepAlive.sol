// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./interfaces/IKeepAlive.sol";
import "./interfaces/IVault.sol";
import "./libraries/Types.sol";
import "./libraries/LifeSignalErrors.sol";

/**
 * @title KeepAlive
 * @dev Contract for managing proof-of-life signals from vault owners
 */
contract KeepAlive is IKeepAlive, AccessControl, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Constants
    uint256 public constant MIN_HEARTBEAT_INTERVAL_DEFAULT = 1 hours;
    uint256 public constant MAX_DEVICES_PER_OWNER_DEFAULT = 5;
    uint256 public constant MAX_HEARTBEAT_HISTORY = 100;

    // State variables
    mapping(address => Types.Heartbeat) private lastHeartbeats;
    mapping(address => Types.Heartbeat[]) private heartbeatHistory;
    mapping(address => address[]) private authorizedDevices;
    mapping(address => mapping(address => bool)) private deviceAuthorization;
    mapping(address => uint256) private lastHeartbeatTime;
    
    uint256 public minHeartbeatInterval;
    uint256 public maxDevicesPerOwner;

    // Modifiers
    modifier onlyVaultOwner(address vault) {
        if (msg.sender != IVault(vault).getOwner()) revert LifeSignalErrors.NotOwner();
        _;
    }

    modifier validVault(address vault) {
        if (vault == address(0)) revert LifeSignalErrors.ZeroAddress();
        _;
    }

    modifier validDevice(address device) {
        if (device == address(0)) revert LifeSignalErrors.ZeroAddress();
        _;
    }

    modifier canHeartbeat(address vault) {
        if (block.timestamp < lastHeartbeatTime[vault] + minHeartbeatInterval) {
            revert LifeSignalErrors.HeartbeatTooEarly();
        }
        _;
    }

    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        minHeartbeatInterval = MIN_HEARTBEAT_INTERVAL_DEFAULT;
        maxDevicesPerOwner = MAX_DEVICES_PER_OWNER_DEFAULT;
    }

    /**
     * @dev Send a heartbeat signal
     */
    function heartbeat(address vault) external override nonReentrant whenNotPaused validVault(vault) canHeartbeat(vault) onlyVaultOwner(vault) {
        _recordHeartbeat(vault, bytes32(0), address(0));
    }

    /**
     * @dev Send a heartbeat signal with a message
     */
    function heartbeatWithMessage(
        address vault,
        bytes32 messageHash
    ) external override nonReentrant whenNotPaused validVault(vault) canHeartbeat(vault) onlyVaultOwner(vault) {
        _recordHeartbeat(vault, messageHash, address(0));
    }

    /**
     * @dev Send a heartbeat signal from an authorized device
     */
    function heartbeatFromDevice(
        address vault,
        address owner,
        bytes32 messageHash,
        bytes calldata signature
    ) external override nonReentrant whenNotPaused validVault(vault) canHeartbeat(vault) {
        if (owner == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (IVault(vault).getOwner() != owner) revert LifeSignalErrors.NotOwner();
        
        // Verify device authorization
        if (!deviceAuthorization[owner][msg.sender]) {
            revert LifeSignalErrors.HeartbeatFromUnauthorizedDevice();
        }
        
        // Verify signature (optional additional security)
        if (signature.length > 0) {
            bytes32 messageToSign = keccak256(abi.encodePacked(vault, messageHash, block.timestamp));
            address recovered = ECDSA.recover(messageToSign.toEthSignedMessageHash(), signature);
            if (recovered != owner) revert LifeSignalErrors.InvalidSignature();
        }
        
        _recordHeartbeat(vault, messageHash, msg.sender);
    }

    /**
     * @dev Authorize a device to send heartbeats
     */
    function authorizeDevice(address device) external override nonReentrant whenNotPaused validDevice(device) {
        if (deviceAuthorization[msg.sender][device]) {
            revert LifeSignalErrors.HeartbeatFromUnauthorizedDevice(); // Device already authorized
        }
        
        if (authorizedDevices[msg.sender].length >= maxDevicesPerOwner) {
            revert LifeSignalErrors.MaximumHeirsReached(); // Reusing error for max devices
        }
        
        deviceAuthorization[msg.sender][device] = true;
        authorizedDevices[msg.sender].push(device);
        
        emit DeviceAuthorized(msg.sender, device, block.timestamp);
    }

    /**
     * @dev Revoke device authorization
     */
    function revokeDevice(address device) external override nonReentrant whenNotPaused validDevice(device) {
        if (!deviceAuthorization[msg.sender][device]) {
            revert LifeSignalErrors.HeartbeatFromUnauthorizedDevice(); // Device not authorized
        }
        
        deviceAuthorization[msg.sender][device] = false;
        
        // Remove from authorized devices array
        address[] storage devices = authorizedDevices[msg.sender];
        for (uint256 i = 0; i < devices.length; i++) {
            if (devices[i] == device) {
                devices[i] = devices[devices.length - 1];
                devices.pop();
                break;
            }
        }
        
        emit DeviceRevoked(msg.sender, device, block.timestamp);
    }

    /**
     * @dev Get the last heartbeat for a vault
     */
    function getLastHeartbeat(address vault) external view override validVault(vault) returns (Types.Heartbeat memory) {
        return lastHeartbeats[vault];
    }

    /**
     * @dev Get the timestamp of the last heartbeat
     */
    function getLastHeartbeatTimestamp(address vault) external view override validVault(vault) returns (uint256) {
        return lastHeartbeats[vault].timestamp;
    }

    /**
     * @dev Check if a vault is active based on threshold
     */
    function isActive(address vault, uint256 threshold) external view override validVault(vault) returns (bool) {
        uint256 lastTimestamp = lastHeartbeats[vault].timestamp;
        if (lastTimestamp == 0) return false;
        
        return block.timestamp <= lastTimestamp + threshold;
    }

    /**
     * @dev Get the duration of inactivity
     */
    function getInactivityDuration(address vault) external view override validVault(vault) returns (uint256) {
        uint256 lastTimestamp = lastHeartbeats[vault].timestamp;
        if (lastTimestamp == 0) return type(uint256).max;
        
        return block.timestamp > lastTimestamp ? block.timestamp - lastTimestamp : 0;
    }

    /**
     * @dev Get authorized devices for an owner
     */
    function getAuthorizedDevices(address owner) external view override returns (address[] memory) {
        return authorizedDevices[owner];
    }

    /**
     * @dev Check if a device is authorized for an owner
     */
    function isDeviceAuthorized(address owner, address device) external view override returns (bool) {
        return deviceAuthorization[owner][device];
    }

    /**
     * @dev Get heartbeat history for a vault
     */
    function getHeartbeatHistory(
        address vault,
        uint256 limit
    ) external view override validVault(vault) returns (Types.Heartbeat[] memory) {
        Types.Heartbeat[] storage history = heartbeatHistory[vault];
        uint256 length = history.length;
        
        if (limit == 0 || limit > length) {
            limit = length;
        }
        
        Types.Heartbeat[] memory result = new Types.Heartbeat[](limit);
        
        // Return most recent heartbeats first
        for (uint256 i = 0; i < limit; i++) {
            result[i] = history[length - 1 - i];
        }
        
        return result;
    }

    /**
     * @dev Get total number of heartbeats for a vault
     */
    function getHeartbeatCount(address vault) external view override validVault(vault) returns (uint256) {
        return heartbeatHistory[vault].length;
    }

    /**
     * @dev Internal function to record a heartbeat
     */
    function _recordHeartbeat(address vault, bytes32 messageHash, address deviceAddress) internal {
        Types.Heartbeat memory newHeartbeat = Types.Heartbeat({
            timestamp: block.timestamp,
            messageHash: messageHash,
            deviceAddress: deviceAddress,
            blockNumber: block.number
        });
        
        // Update last heartbeat
        lastHeartbeats[vault] = newHeartbeat;
        lastHeartbeatTime[vault] = block.timestamp;
        
        // Add to history
        heartbeatHistory[vault].push(newHeartbeat);
        
        // Limit history size
        if (heartbeatHistory[vault].length > MAX_HEARTBEAT_HISTORY) {
            Types.Heartbeat[] storage history = heartbeatHistory[vault];
            for (uint256 i = 0; i < history.length - 1; i++) {
                history[i] = history[i + 1];
            }
            history.pop();
        }
        
        address owner = IVault(vault).getOwner();
        emit Heartbeat(owner, vault, block.timestamp, messageHash, deviceAddress);
    }

    // Administrative functions
    function setMinHeartbeatInterval(uint256 interval) external override onlyRole(ADMIN_ROLE) {
        minHeartbeatInterval = interval;
    }

    function setMaxDevicesPerOwner(uint256 maxDevices) external override onlyRole(ADMIN_ROLE) {
        maxDevicesPerOwner = maxDevices;
    }

    function pause() external override onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external override onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function emergencyHeartbeat(address vault) external override onlyRole(EMERGENCY_ROLE) validVault(vault) {
        _recordHeartbeat(vault, keccak256("EMERGENCY_HEARTBEAT"), address(0));
    }
} 