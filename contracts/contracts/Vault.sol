// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IHeirRegistry.sol";
import "./interfaces/IVaultController.sol";
import "./libraries/Types.sol";
import "./libraries/LifeSignalErrors.sol";
import "./libraries/SafeTransfer.sol";

/**
 * @title Vault
 * @dev Individual vault contract that stores and manages inherited assets
 */
contract Vault is IVault, Ownable, Pausable, ReentrancyGuard, Initializable {
    using SafeTransfer for Types.Asset;

    // State variables
    Types.VaultState private vaultState;
    Types.VaultConfig private vaultConfig;
    Types.Asset[] private assets;
    
    address private heirRegistry;
    address private vaultController;
    
    uint256 private lastActivity;
    uint256 private gracePeriodEnd;
    bool private _isDistributed;
    
    mapping(address => mapping(uint256 => bool)) private assetExists;
    mapping(address => uint256[]) private tokenIds; // For ERC721/ERC1155
    mapping(Types.AssetType => uint256) private assetCounts;

    // Events
    event VaultInitialized(
        address indexed owner,
        address indexed heirRegistry,
        address indexed vaultController,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyController() {
        if (msg.sender != vaultController) revert LifeSignalErrors.NotController();
        _;
    }

    modifier onlyOwnerOrController() {
        if (msg.sender != owner() && msg.sender != vaultController) {
            revert LifeSignalErrors.NotAuthorized();
        }
        _;
    }

    modifier onlyActiveVault() {
        if (vaultState != Types.VaultState.Active) revert LifeSignalErrors.VaultNotActive();
        _;
    }

    modifier onlyDeceasedVault() {
        if (vaultState != Types.VaultState.Deceased) revert LifeSignalErrors.VaultNotDeceased();
        _;
    }

    modifier notDistributed() {
        if (_isDistributed) revert LifeSignalErrors.VaultAlreadyDistributed();
        _;
    }

    modifier validAmount(uint256 amount) {
        if (amount == 0) revert LifeSignalErrors.InvalidAmount();
        _;
    }

    modifier validToken(address token) {
        if (token == address(0)) revert LifeSignalErrors.ZeroAddress();
        _;
    }

    /**
     * @dev Constructor (for proxy pattern)
     */
    constructor() Ownable(msg.sender) {
        _disableInitializers();
    }

    /**
     * @dev Initialize the vault (called by factory)
     */
    function initialize(
        address _owner,
        address _heirRegistry,
        address _vaultController,
        Types.VaultConfig calldata _config
    ) external override initializer {
        if (_owner == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (_heirRegistry == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (_vaultController == address(0)) revert LifeSignalErrors.ZeroAddress();
        
        _transferOwnership(_owner);
        
        heirRegistry = _heirRegistry;
        vaultController = _vaultController;
        vaultConfig = _config;
        
        vaultState = Types.VaultState.Active;
        lastActivity = block.timestamp;
        _isDistributed = false;
        
        emit VaultInitialized(_owner, _heirRegistry, _vaultController, block.timestamp);
    }

    /**
     * @dev Deposit ETH into the vault
     */
    function depositETH() external payable override onlyOwner nonReentrant whenNotPaused onlyActiveVault validAmount(msg.value) {
        Types.Asset memory asset = Types.Asset({
            tokenAddress: address(0),
            amount: msg.value,
            tokenId: 0,
            assetType: Types.AssetType.ETH,
            depositTimestamp: block.timestamp
        });
        
        _addAsset(asset);
        _updateActivity();
        
        emit AssetDeposited(owner(), address(0), msg.value, 0, Types.AssetType.ETH);
    }

    /**
     * @dev Deposit ERC20 tokens into the vault
     */
    function depositERC20(address token, uint256 amount) external override onlyOwner nonReentrant whenNotPaused onlyActiveVault validToken(token) validAmount(amount) {
        SafeTransfer.safeTransferFromERC20(token, owner(), amount);
        
        Types.Asset memory asset = Types.Asset({
            tokenAddress: token,
            amount: amount,
            tokenId: 0,
            assetType: Types.AssetType.ERC20,
            depositTimestamp: block.timestamp
        });
        
        _addAsset(asset);
        _updateActivity();
        
        emit AssetDeposited(owner(), token, amount, 0, Types.AssetType.ERC20);
    }

    /**
     * @dev Deposit ERC721 NFT into the vault
     */
    function depositERC721(address token, uint256 tokenId) external override onlyOwner nonReentrant whenNotPaused onlyActiveVault validToken(token) {
        SafeTransfer.safeTransferFromERC721(token, owner(), tokenId);
        
        Types.Asset memory asset = Types.Asset({
            tokenAddress: token,
            amount: 1,
            tokenId: tokenId,
            assetType: Types.AssetType.ERC721,
            depositTimestamp: block.timestamp
        });
        
        _addAsset(asset);
        _updateActivity();
        
        emit AssetDeposited(owner(), token, 1, tokenId, Types.AssetType.ERC721);
    }

    /**
     * @dev Deposit ERC1155 tokens into the vault
     */
    function depositERC1155(address token, uint256 tokenId, uint256 amount) external override onlyOwner nonReentrant whenNotPaused onlyActiveVault validToken(token) validAmount(amount) {
        SafeTransfer.safeTransferFromERC1155(token, owner(), tokenId, amount);
        
        Types.Asset memory asset = Types.Asset({
            tokenAddress: token,
            amount: amount,
            tokenId: tokenId,
            assetType: Types.AssetType.ERC1155,
            depositTimestamp: block.timestamp
        });
        
        _addAsset(asset);
        _updateActivity();
        
        emit AssetDeposited(owner(), token, amount, tokenId, Types.AssetType.ERC1155);
    }

    /**
     * @dev Withdraw ETH from the vault
     */
    function withdrawETH(uint256 amount) external override onlyOwner nonReentrant whenNotPaused onlyActiveVault validAmount(amount) {
        if (address(this).balance < amount) revert LifeSignalErrors.InsufficientBalance();
        
        _removeAsset(address(0), amount, 0, Types.AssetType.ETH);
        _updateActivity();
        
        SafeTransfer.safeTransferETH(payable(owner()), amount);
        
        emit AssetWithdrawn(owner(), address(0), amount, 0, Types.AssetType.ETH);
    }

    /**
     * @dev Withdraw ERC20 tokens from the vault
     */
    function withdrawERC20(address token, uint256 amount) external override onlyOwner nonReentrant whenNotPaused onlyActiveVault validToken(token) validAmount(amount) {
        if (IERC20(token).balanceOf(address(this)) < amount) revert LifeSignalErrors.InsufficientBalance();
        
        _removeAsset(token, amount, 0, Types.AssetType.ERC20);
        _updateActivity();
        
        SafeTransfer.safeTransferERC20(token, owner(), amount);
        
        emit AssetWithdrawn(owner(), token, amount, 0, Types.AssetType.ERC20);
    }

    /**
     * @dev Withdraw ERC721 NFT from the vault
     */
    function withdrawERC721(address token, uint256 tokenId) external override onlyOwner nonReentrant whenNotPaused onlyActiveVault validToken(token) {
        if (IERC721(token).ownerOf(tokenId) != address(this)) revert LifeSignalErrors.AssetNotOwned();
        
        _removeAsset(token, 1, tokenId, Types.AssetType.ERC721);
        _updateActivity();
        
        SafeTransfer.safeTransferERC721(token, address(this), owner(), tokenId);
        
        emit AssetWithdrawn(owner(), token, 1, tokenId, Types.AssetType.ERC721);
    }

    /**
     * @dev Withdraw ERC1155 tokens from the vault
     */
    function withdrawERC1155(address token, uint256 tokenId, uint256 amount) external override onlyOwner nonReentrant whenNotPaused onlyActiveVault validToken(token) validAmount(amount) {
        if (IERC1155(token).balanceOf(address(this), tokenId) < amount) revert LifeSignalErrors.InsufficientBalance();
        
        _removeAsset(token, amount, tokenId, Types.AssetType.ERC1155);
        _updateActivity();
        
        SafeTransfer.safeTransferERC1155(token, address(this), owner(), tokenId, amount);
        
        emit AssetWithdrawn(owner(), token, amount, tokenId, Types.AssetType.ERC1155);
    }

    /**
     * @dev Distribute assets to heirs (called by controller)
     */
    function distributeToHeirs() external override onlyController nonReentrant whenNotPaused onlyDeceasedVault notDistributed {
        Types.Heir[] memory heirs = IHeirRegistry(heirRegistry).getHeirs(address(this));
        
        if (heirs.length == 0) revert LifeSignalErrors.HeirListEmpty();
        
        // Validate total shares
        if (!IHeirRegistry(heirRegistry).validateShares(address(this))) {
            revert LifeSignalErrors.TotalSharesBelow100Percent();
        }
        
        // Calculate and distribute assets
        for (uint256 i = 0; i < heirs.length; i++) {
            if (heirs[i].hasClaimed) continue;
            
            Types.Asset[] memory heirAssets = _calculateHeirAssets(heirs[i].sharePercentage);
            
            if (heirAssets.length > 0) {
                _transferAssetsToHeir(heirs[i].heirAddress, heirAssets);
                
                // Mark as claimed in registry
                IHeirRegistry(heirRegistry).markAsClaimed(address(this), heirs[i].heirAddress);
                
                emit AssetsDistributed(heirs[i].heirAddress, heirAssets, block.timestamp);
            }
        }
        
        _isDistributed = true;
        vaultState = Types.VaultState.Distributed;
        
        emit VaultStateChanged(Types.VaultState.Deceased, Types.VaultState.Distributed, block.timestamp);
    }

    /**
     * @dev Emergency withdraw (if enabled in config)
     */
    function emergencyWithdraw() external override onlyOwner nonReentrant whenNotPaused {
        if (!vaultConfig.allowEmergencyWithdraw) revert LifeSignalErrors.VaultEmergencyWithdrawDisabled();
        
        // Transfer all ETH
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            SafeTransfer.safeTransferETH(payable(owner()), ethBalance);
        }
        
        // Transfer all assets
        for (uint256 i = 0; i < assets.length; i++) {
            Types.Asset memory asset = assets[i];
            
            if (asset.assetType == Types.AssetType.ERC20) {
                SafeTransfer.safeTransferERC20(asset.tokenAddress, owner(), asset.amount);
            } else if (asset.assetType == Types.AssetType.ERC721) {
                SafeTransfer.safeTransferERC721(asset.tokenAddress, address(this), owner(), asset.tokenId);
            } else if (asset.assetType == Types.AssetType.ERC1155) {
                SafeTransfer.safeTransferERC1155(asset.tokenAddress, address(this), owner(), asset.tokenId, asset.amount);
            }
        }
        
        // Clear assets
        delete assets;
        
        emit EmergencyWithdrawal(owner(), msg.sender, block.timestamp);
    }

    // View Functions
    function getVaultState() external view override returns (Types.VaultState) {
        return vaultState;
    }

    function getOwner() external view override returns (address) {
        return owner();
    }

    function getHeirRegistry() external view override returns (address) {
        return heirRegistry;
    }

    function getVaultController() external view override returns (address) {
        return vaultController;
    }

    function getConfiguration() external view override returns (Types.VaultConfig memory) {
        return vaultConfig;
    }

    function getAssets() external view override returns (Types.Asset[] memory) {
        return assets;
    }

    function getAssetsByType(Types.AssetType assetType) external view override returns (Types.Asset[] memory) {
        uint256 count = 0;
        
        // Count assets of specified type
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i].assetType == assetType) {
                count++;
            }
        }
        
        // Create result array
        Types.Asset[] memory result = new Types.Asset[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i].assetType == assetType) {
                result[index] = assets[i];
                index++;
            }
        }
        
        return result;
    }

    function getTotalValue() external view override returns (uint256) {
        // This is a simplified calculation - in practice, you'd need price oracles
        uint256 totalValue = address(this).balance;
        
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i].assetType == Types.AssetType.ERC20) {
                totalValue += assets[i].amount; // Simplified - would need token price
            } else if (assets[i].assetType == Types.AssetType.ERC721) {
                totalValue += 1; // Simplified - would need NFT valuation
            } else if (assets[i].assetType == Types.AssetType.ERC1155) {
                totalValue += assets[i].amount; // Simplified - would need token price
            }
        }
        
        return totalValue;
    }

    function isDistributed() external view override returns (bool) {
        return _isDistributed;
    }

    function getLastActivity() external view override returns (uint256) {
        return lastActivity;
    }

    // Administrative Functions
    function updateConfiguration(Types.VaultConfig calldata newConfig) external override onlyOwnerOrController {
        vaultConfig = newConfig;
        emit ConfigurationUpdated(newConfig, block.timestamp);
    }

    function setVaultController(address newController) external override onlyOwner {
        if (newController == address(0)) revert LifeSignalErrors.ZeroAddress();
        vaultController = newController;
    }

    function setHeirRegistry(address newRegistry) external override onlyOwner {
        if (newRegistry == address(0)) revert LifeSignalErrors.ZeroAddress();
        heirRegistry = newRegistry;
    }

    function pause() external override onlyOwnerOrController {
        _pause();
    }

    function unpause() external override onlyOwnerOrController {
        _unpause();
    }

    function transferOwnership(address newOwner) public override(IVault, Ownable) onlyOwner {
        if (newOwner == address(0)) revert LifeSignalErrors.ZeroAddress();
        _transferOwnership(newOwner);
    }

    // Internal Functions
    function _addAsset(Types.Asset memory asset) internal {
        assets.push(asset);
        assetCounts[asset.assetType]++;
        
        if (asset.assetType == Types.AssetType.ERC721 || asset.assetType == Types.AssetType.ERC1155) {
            assetExists[asset.tokenAddress][asset.tokenId] = true;
            tokenIds[asset.tokenAddress].push(asset.tokenId);
        }
    }

    function _removeAsset(address tokenAddress, uint256 amount, uint256 tokenId, Types.AssetType assetType) internal {
        for (uint256 i = 0; i < assets.length; i++) {
            Types.Asset storage asset = assets[i];
            
            if (asset.tokenAddress == tokenAddress && asset.assetType == assetType) {
                if (assetType == Types.AssetType.ERC721 && asset.tokenId == tokenId) {
                    _removeAssetAtIndex(i);
                    break;
                } else if (assetType == Types.AssetType.ERC1155 && asset.tokenId == tokenId) {
                    if (asset.amount >= amount) {
                        asset.amount -= amount;
                        if (asset.amount == 0) {
                            _removeAssetAtIndex(i);
                        }
                    }
                    break;
                } else if (assetType == Types.AssetType.ERC20 || assetType == Types.AssetType.ETH) {
                    if (asset.amount >= amount) {
                        asset.amount -= amount;
                        if (asset.amount == 0) {
                            _removeAssetAtIndex(i);
                        }
                    }
                    break;
                }
            }
        }
    }

    function _removeAssetAtIndex(uint256 index) internal {
        Types.Asset memory asset = assets[index];
        
        assets[index] = assets[assets.length - 1];
        assets.pop();
        
        assetCounts[asset.assetType]--;
        
        if (asset.assetType == Types.AssetType.ERC721 || asset.assetType == Types.AssetType.ERC1155) {
            assetExists[asset.tokenAddress][asset.tokenId] = false;
        }
    }

    function _calculateHeirAssets(uint96 sharePercentage) internal view returns (Types.Asset[] memory) {
        Types.Asset[] memory heirAssets = new Types.Asset[](assets.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < assets.length; i++) {
            Types.Asset memory asset = assets[i];
            uint256 heirAmount = (asset.amount * sharePercentage) / 10000; // 10000 = 100%
            
            if (heirAmount > 0) {
                heirAssets[count] = Types.Asset({
                    tokenAddress: asset.tokenAddress,
                    amount: heirAmount,
                    tokenId: asset.tokenId,
                    assetType: asset.assetType,
                    depositTimestamp: asset.depositTimestamp
                });
                count++;
            }
        }
        
        // Resize array
        Types.Asset[] memory result = new Types.Asset[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = heirAssets[i];
        }
        
        return result;
    }

    function _transferAssetsToHeir(address heir, Types.Asset[] memory heirAssets) internal {
        for (uint256 i = 0; i < heirAssets.length; i++) {
            Types.Asset memory asset = heirAssets[i];
            
            if (asset.assetType == Types.AssetType.ETH) {
                SafeTransfer.safeTransferETH(payable(heir), asset.amount);
            } else if (asset.assetType == Types.AssetType.ERC20) {
                SafeTransfer.safeTransferERC20(asset.tokenAddress, heir, asset.amount);
            } else if (asset.assetType == Types.AssetType.ERC721) {
                SafeTransfer.safeTransferERC721(asset.tokenAddress, address(this), heir, asset.tokenId);
            } else if (asset.assetType == Types.AssetType.ERC1155) {
                SafeTransfer.safeTransferERC1155(asset.tokenAddress, address(this), heir, asset.tokenId, asset.amount);
            }
        }
    }

    function _updateActivity() internal {
        lastActivity = block.timestamp;
    }

    /**
     * @dev Update vault state (called by controller)
     */
    function _updateVaultState(Types.VaultState newState) external onlyController {
        Types.VaultState previousState = vaultState;
        vaultState = newState;
        
        if (newState == Types.VaultState.Pending) {
            gracePeriodEnd = block.timestamp + vaultConfig.gracePeriod;
        }
        
        emit VaultStateChanged(previousState, newState, block.timestamp);
    }

    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {
        // Only allow ETH deposits from owner or during distribution
        if (msg.sender != owner() && vaultState == Types.VaultState.Active) {
            revert LifeSignalErrors.NotOwner();
        }
    }
} 