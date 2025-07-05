// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/Types.sol";

/**
 * @title IVault Interface
 * @dev Interface for the Vault contract that stores and manages inherited assets
 */
interface IVault {
    // Events
    event AssetDeposited(
        address indexed owner,
        address indexed tokenAddress,
        uint256 amount,
        uint256 tokenId,
        Types.AssetType assetType
    );
    
    event AssetWithdrawn(
        address indexed owner,
        address indexed tokenAddress,
        uint256 amount,
        uint256 tokenId,
        Types.AssetType assetType
    );
    
    event AssetsDistributed(
        address indexed heir,
        Types.Asset[] assets,
        uint256 timestamp
    );
    
    event VaultStateChanged(
        Types.VaultState previousState,
        Types.VaultState newState,
        uint256 timestamp
    );
    
    event EmergencyWithdrawal(
        address indexed owner,
        address indexed emergency_contact,
        uint256 timestamp
    );
    
    event ConfigurationUpdated(
        Types.VaultConfig newConfig,
        uint256 timestamp
    );

    // Core Functions
    function initialize(
        address owner,
        address heirRegistry,
        address vaultController,
        Types.VaultConfig calldata config
    ) external;
    
    function depositETH() external payable;
    
    function depositERC20(address token, uint256 amount) external;
    
    function depositERC721(address token, uint256 tokenId) external;
    
    function depositERC1155(address token, uint256 tokenId, uint256 amount) external;
    
    function withdrawETH(uint256 amount) external;
    
    function withdrawERC20(address token, uint256 amount) external;
    
    function withdrawERC721(address token, uint256 tokenId) external;
    
    function withdrawERC1155(address token, uint256 tokenId, uint256 amount) external;
    
    function distributeToHeirs() external;
    
    function emergencyWithdraw() external;

    // View Functions
    function getVaultState() external view returns (Types.VaultState);
    
    function getOwner() external view returns (address);
    
    function getHeirRegistry() external view returns (address);
    
    function getVaultController() external view returns (address);
    
    function getConfiguration() external view returns (Types.VaultConfig memory);
    
    function getAssets() external view returns (Types.Asset[] memory);
    
    function getAssetsByType(Types.AssetType assetType) external view returns (Types.Asset[] memory);
    
    function getTotalValue() external view returns (uint256);
    
    function isDistributed() external view returns (bool);
    
    function getLastActivity() external view returns (uint256);

    // Administrative Functions
    function updateConfiguration(Types.VaultConfig calldata newConfig) external;
    
    function setVaultController(address newController) external;
    
    function setHeirRegistry(address newRegistry) external;
    
    function _updateVaultState(Types.VaultState newState) external;
    
    function pause() external;
    
    function unpause() external;
    
    function transferOwnership(address newOwner) external;
} 