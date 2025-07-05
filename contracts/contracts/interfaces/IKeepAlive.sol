// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/Types.sol";

/**
 * @title IKeepAlive Interface
 * @dev Interface for the KeepAlive contract that manages proof-of-life signals
 */
interface IKeepAlive {
    // Events
    event Heartbeat(
        address indexed owner,
        address indexed vault,
        uint256 timestamp,
        bytes32 messageHash,
        address deviceAddress
    );
    
    event DeviceAuthorized(
        address indexed owner,
        address indexed device,
        uint256 timestamp
    );
    
    event DeviceRevoked(
        address indexed owner,
        address indexed device,
        uint256 timestamp
    );
    
    event InactivityDetected(
        address indexed owner,
        address indexed vault,
        uint256 lastHeartbeat,
        uint256 threshold,
        uint256 timestamp
    );
    
    event ActivityResumed(
        address indexed owner,
        address indexed vault,
        uint256 timestamp
    );

    // Core Functions
    function heartbeat(address vault) external;
    
    function heartbeatWithMessage(
        address vault,
        bytes32 messageHash
    ) external;
    
    function heartbeatFromDevice(
        address vault,
        address owner,
        bytes32 messageHash,
        bytes calldata signature
    ) external;
    
    function authorizeDevice(address device) external;
    
    function revokeDevice(address device) external;

    // View Functions
    function getLastHeartbeat(address vault) external view returns (Types.Heartbeat memory);
    
    function getLastHeartbeatTimestamp(address vault) external view returns (uint256);
    
    function isActive(address vault, uint256 threshold) external view returns (bool);
    
    function getInactivityDuration(address vault) external view returns (uint256);
    
    function getAuthorizedDevices(address owner) external view returns (address[] memory);
    
    function isDeviceAuthorized(address owner, address device) external view returns (bool);
    
    function getHeartbeatHistory(
        address vault,
        uint256 limit
    ) external view returns (Types.Heartbeat[] memory);
    
    function getHeartbeatCount(address vault) external view returns (uint256);

    // Administrative Functions
    function setMinHeartbeatInterval(uint256 interval) external;
    
    function setMaxDevicesPerOwner(uint256 maxDevices) external;
    
    function pause() external;
    
    function unpause() external;
    
    function emergencyHeartbeat(address vault) external;
} 