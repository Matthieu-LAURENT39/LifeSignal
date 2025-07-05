// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/Types.sol";

/**
 * @title IHeirRegistry Interface
 * @dev Interface for the HeirRegistry contract that manages inheritance beneficiaries
 */
interface IHeirRegistry {
    // Events
    event HeirAdded(
        address indexed vault,
        address indexed owner,
        address indexed heir,
        uint96 sharePercentage,
        string name,
        uint256 timestamp
    );
    
    event HeirRemoved(
        address indexed vault,
        address indexed owner,
        address indexed heir,
        uint256 timestamp
    );
    
    event HeirUpdated(
        address indexed vault,
        address indexed owner,
        address indexed heir,
        uint96 newSharePercentage,
        string newName,
        uint256 timestamp
    );
    
    event HeirClaimed(
        address indexed vault,
        address indexed heir,
        Types.Asset[] assets,
        uint256 timestamp
    );
    
    event EncryptedKeyUpdated(
        address indexed vault,
        address indexed heir,
        bytes32 keyHash,
        uint256 timestamp
    );
    
    event SharesValidated(
        address indexed vault,
        uint256 totalShares,
        uint256 heirCount,
        uint256 timestamp
    );

    // Core Functions
    function addHeir(
        address vault,
        address heir,
        uint96 sharePercentage,
        string calldata name,
        bytes calldata encryptedKey
    ) external;
    
    function removeHeir(address vault, address heir) external;
    
    function updateHeirShare(
        address vault,
        address heir,
        uint96 newSharePercentage
    ) external;
    
    function updateHeirName(
        address vault,
        address heir,
        string calldata newName
    ) external;
    
    function updateEncryptedKey(
        address vault,
        address heir,
        bytes calldata newEncryptedKey
    ) external;
    
    function markAsClaimed(address vault, address heir) external;
    
    function validateShares(address vault) external view returns (bool);

    // View Functions
    function getHeirs(address vault) external view returns (Types.Heir[] memory);
    
    function getHeir(address vault, address heir) external view returns (Types.Heir memory);
    
    function getHeirCount(address vault) external view returns (uint256);
    
    function getTotalShares(address vault) external view returns (uint256);
    
    function getHeirShare(address vault, address heir) external view returns (uint96);
    
    function isHeir(address vault, address heir) external view returns (bool);
    
    function hasClaimed(address vault, address heir) external view returns (bool);
    
    function getUnclaimedHeirs(address vault) external view returns (address[] memory);
    
    function getClaimedHeirs(address vault) external view returns (address[] memory);
    
    function getHeirsByShare(address vault) external view returns (Types.Heir[] memory);
    
    function getEncryptedKey(address vault, address heir) external view returns (bytes memory);
    
    function calculateDistribution(
        address vault,
        Types.Asset[] memory assets
    ) external view returns (Types.Distribution[] memory);

    // Administrative Functions
    function setMaxHeirs(uint256 maxHeirs) external;
    
    function setMinimumShare(uint96 minimumShare) external;
    
    function setRequireFullDistribution(bool required) external;
    
    function pause() external;
    
    function unpause() external;
    
    function addAuthorizedVault(address vault) external;
    
    function removeAuthorizedVault(address vault) external;
    
    function isAuthorizedVault(address vault) external view returns (bool);
} 