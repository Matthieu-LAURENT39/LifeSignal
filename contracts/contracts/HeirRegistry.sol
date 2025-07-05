// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IHeirRegistry.sol";
import "./interfaces/IVault.sol";
import "./libraries/Types.sol";
import "./libraries/LifeSignalErrors.sol";

/**
 * @title HeirRegistry
 * @dev Contract for managing inheritance beneficiaries and their shares
 */
contract HeirRegistry is IHeirRegistry, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    // Constants
    uint256 public constant MAX_HEIRS_DEFAULT = 10;
    uint96 public constant MIN_SHARE_DEFAULT = 100; // 1% in basis points
    uint96 public constant TOTAL_SHARES = 10000; // 100% in basis points

    // State variables
    mapping(address => Types.Heir[]) private vaultHeirs;
    mapping(address => mapping(address => uint256)) private heirIndices;
    mapping(address => uint256) private vaultTotalShares;
    mapping(address => bool) private authorizedVaults;
    
    uint256 public maxHeirs;
    uint96 public minimumShare;
    bool public requireFullDistribution;

    // Modifiers
    modifier onlyVaultOwner(address vault) {
        if (msg.sender != IVault(vault).getOwner()) revert LifeSignalErrors.NotOwner();
        _;
    }

    modifier onlyAuthorizedVault(address vault) {
        if (!authorizedVaults[vault]) revert LifeSignalErrors.NotAuthorized();
        _;
    }

    modifier validVault(address vault) {
        if (vault == address(0)) revert LifeSignalErrors.ZeroAddress();
        _;
    }

    modifier validHeir(address heir) {
        if (heir == address(0)) revert LifeSignalErrors.ZeroAddress();
        _;
    }

    modifier validShare(uint96 share) {
        if (share == 0) revert LifeSignalErrors.InvalidPercentage();
        if (share < minimumShare) revert LifeSignalErrors.HeirInvalidShare();
        _;
    }

    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        maxHeirs = MAX_HEIRS_DEFAULT;
        minimumShare = MIN_SHARE_DEFAULT;
        requireFullDistribution = true;
    }

    /**
     * @dev Add a new heir to a vault
     */
    function addHeir(
        address vault,
        address heir,
        uint96 sharePercentage,
        string calldata name,
        bytes calldata encryptedKey
    ) external override nonReentrant whenNotPaused validVault(vault) validHeir(heir) validShare(sharePercentage) onlyVaultOwner(vault) {
        // Check if heir already exists
        if (isHeir(vault, heir)) revert LifeSignalErrors.HeirAlreadyExists();
        
        // Check if heir is the vault owner
        if (heir == IVault(vault).getOwner()) revert LifeSignalErrors.HeirCannotBeOwner();
        
        // Check maximum heirs limit
        if (vaultHeirs[vault].length >= maxHeirs) revert LifeSignalErrors.MaximumHeirsReached();
        
        // Check total shares don't exceed 100%
        uint256 newTotalShares = vaultTotalShares[vault] + sharePercentage;
        if (newTotalShares > TOTAL_SHARES) revert LifeSignalErrors.TotalSharesExceed100Percent();
        
        // Add heir
        Types.Heir memory newHeir = Types.Heir({
            heirAddress: heir,
            sharePercentage: sharePercentage,
            encryptedKey: encryptedKey,
            hasClaimed: false,
            name: name,
            addedTimestamp: block.timestamp
        });
        
        vaultHeirs[vault].push(newHeir);
        heirIndices[vault][heir] = vaultHeirs[vault].length;
        vaultTotalShares[vault] = newTotalShares;
        
        emit HeirAdded(vault, IVault(vault).getOwner(), heir, sharePercentage, name, block.timestamp);
    }

    /**
     * @dev Remove an heir from a vault
     */
    function removeHeir(address vault, address heir) external override nonReentrant whenNotPaused validVault(vault) validHeir(heir) onlyVaultOwner(vault) {
        if (!isHeir(vault, heir)) revert LifeSignalErrors.HeirNotFound();
        
        uint256 index = heirIndices[vault][heir] - 1;
        Types.Heir[] storage heirs = vaultHeirs[vault];
        
        // Update total shares
        vaultTotalShares[vault] -= heirs[index].sharePercentage;
        
        // Remove heir by swapping with last element
        heirs[index] = heirs[heirs.length - 1];
        heirs.pop();
        
        // Update index mapping
        if (heirs.length > 0 && index < heirs.length) {
            heirIndices[vault][heirs[index].heirAddress] = index + 1;
        }
        delete heirIndices[vault][heir];
        
        emit HeirRemoved(vault, IVault(vault).getOwner(), heir, block.timestamp);
    }

    /**
     * @dev Update an heir's share percentage
     */
    function updateHeirShare(
        address vault,
        address heir,
        uint96 newSharePercentage
    ) external override nonReentrant whenNotPaused validVault(vault) validHeir(heir) validShare(newSharePercentage) onlyVaultOwner(vault) {
        if (!isHeir(vault, heir)) revert LifeSignalErrors.HeirNotFound();
        
        uint256 index = heirIndices[vault][heir] - 1;
        Types.Heir storage heirData = vaultHeirs[vault][index];
        
        // Calculate new total shares
        uint256 newTotalShares = vaultTotalShares[vault] - heirData.sharePercentage + newSharePercentage;
        if (newTotalShares > TOTAL_SHARES) revert LifeSignalErrors.TotalSharesExceed100Percent();
        
        // Update shares
        heirData.sharePercentage = newSharePercentage;
        vaultTotalShares[vault] = newTotalShares;
        
        emit HeirUpdated(vault, IVault(vault).getOwner(), heir, newSharePercentage, heirData.name, block.timestamp);
    }

    /**
     * @dev Update an heir's name
     */
    function updateHeirName(
        address vault,
        address heir,
        string calldata newName
    ) external override nonReentrant whenNotPaused validVault(vault) validHeir(heir) onlyVaultOwner(vault) {
        if (!isHeir(vault, heir)) revert LifeSignalErrors.HeirNotFound();
        
        uint256 index = heirIndices[vault][heir] - 1;
        Types.Heir storage heirData = vaultHeirs[vault][index];
        
        heirData.name = newName;
        
        emit HeirUpdated(vault, IVault(vault).getOwner(), heir, heirData.sharePercentage, newName, block.timestamp);
    }

    /**
     * @dev Update an heir's encrypted key
     */
    function updateEncryptedKey(
        address vault,
        address heir,
        bytes calldata newEncryptedKey
    ) external override nonReentrant whenNotPaused validVault(vault) validHeir(heir) onlyVaultOwner(vault) {
        if (!isHeir(vault, heir)) revert LifeSignalErrors.HeirNotFound();
        
        uint256 index = heirIndices[vault][heir] - 1;
        Types.Heir storage heirData = vaultHeirs[vault][index];
        
        heirData.encryptedKey = newEncryptedKey;
        
        emit EncryptedKeyUpdated(vault, heir, keccak256(newEncryptedKey), block.timestamp);
    }

    /**
     * @dev Mark an heir as having claimed their inheritance
     */
    function markAsClaimed(address vault, address heir) external override nonReentrant whenNotPaused validVault(vault) validHeir(heir) onlyAuthorizedVault(vault) {
        if (!isHeir(vault, heir)) revert LifeSignalErrors.HeirNotFound();
        
        uint256 index = heirIndices[vault][heir] - 1;
        Types.Heir storage heirData = vaultHeirs[vault][index];
        
        if (heirData.hasClaimed) revert LifeSignalErrors.HeirAlreadyClaimed();
        
        heirData.hasClaimed = true;
        
        // This will be populated by the vault contract during distribution
        Types.Asset[] memory emptyAssets;
        emit HeirClaimed(vault, heir, emptyAssets, block.timestamp);
    }

    /**
     * @dev Validate that total shares equal 100%
     */
    function validateShares(address vault) external view override validVault(vault) returns (bool) {
        uint256 totalShares = vaultTotalShares[vault];
        if (requireFullDistribution) {
            return totalShares == TOTAL_SHARES;
        } else {
            return totalShares <= TOTAL_SHARES;
        }
    }

    /**
     * @dev Get all heirs for a vault
     */
    function getHeirs(address vault) external view override validVault(vault) returns (Types.Heir[] memory) {
        return vaultHeirs[vault];
    }

    /**
     * @dev Get a specific heir's information
     */
    function getHeir(address vault, address heir) external view override validVault(vault) validHeir(heir) returns (Types.Heir memory) {
        if (!isHeir(vault, heir)) revert LifeSignalErrors.HeirNotFound();
        
        uint256 index = heirIndices[vault][heir] - 1;
        return vaultHeirs[vault][index];
    }

    /**
     * @dev Get the number of heirs for a vault
     */
    function getHeirCount(address vault) external view override validVault(vault) returns (uint256) {
        return vaultHeirs[vault].length;
    }

    /**
     * @dev Get total shares for a vault
     */
    function getTotalShares(address vault) external view override validVault(vault) returns (uint256) {
        return vaultTotalShares[vault];
    }

    /**
     * @dev Get an heir's share percentage
     */
    function getHeirShare(address vault, address heir) external view override validVault(vault) validHeir(heir) returns (uint96) {
        if (!isHeir(vault, heir)) revert LifeSignalErrors.HeirNotFound();
        
        uint256 index = heirIndices[vault][heir] - 1;
        return vaultHeirs[vault][index].sharePercentage;
    }

    /**
     * @dev Check if an address is an heir
     */
    function isHeir(address vault, address heir) public view override validVault(vault) validHeir(heir) returns (bool) {
        return heirIndices[vault][heir] > 0;
    }

    /**
     * @dev Check if an heir has claimed their inheritance
     */
    function hasClaimed(address vault, address heir) external view override validVault(vault) validHeir(heir) returns (bool) {
        if (!isHeir(vault, heir)) return false;
        
        uint256 index = heirIndices[vault][heir] - 1;
        return vaultHeirs[vault][index].hasClaimed;
    }

    /**
     * @dev Get unclaimed heirs for a vault
     */
    function getUnclaimedHeirs(address vault) external view override validVault(vault) returns (address[] memory) {
        Types.Heir[] memory heirs = vaultHeirs[vault];
        address[] memory unclaimed = new address[](heirs.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < heirs.length; i++) {
            if (!heirs[i].hasClaimed) {
                unclaimed[count] = heirs[i].heirAddress;
                count++;
            }
        }
        
        // Resize array
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = unclaimed[i];
        }
        
        return result;
    }

    /**
     * @dev Get claimed heirs for a vault
     */
    function getClaimedHeirs(address vault) external view override validVault(vault) returns (address[] memory) {
        Types.Heir[] memory heirs = vaultHeirs[vault];
        address[] memory claimed = new address[](heirs.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < heirs.length; i++) {
            if (heirs[i].hasClaimed) {
                claimed[count] = heirs[i].heirAddress;
                count++;
            }
        }
        
        // Resize array
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = claimed[i];
        }
        
        return result;
    }

    /**
     * @dev Get heirs sorted by share percentage (descending)
     */
    function getHeirsByShare(address vault) external view override validVault(vault) returns (Types.Heir[] memory) {
        Types.Heir[] memory heirs = vaultHeirs[vault];
        
        // Simple bubble sort (fine for small arrays)
        for (uint256 i = 0; i < heirs.length; i++) {
            for (uint256 j = 0; j < heirs.length - i - 1; j++) {
                if (heirs[j].sharePercentage < heirs[j + 1].sharePercentage) {
                    Types.Heir memory temp = heirs[j];
                    heirs[j] = heirs[j + 1];
                    heirs[j + 1] = temp;
                }
            }
        }
        
        return heirs;
    }

    /**
     * @dev Get encrypted key for an heir
     */
    function getEncryptedKey(address vault, address heir) external view override validVault(vault) validHeir(heir) returns (bytes memory) {
        if (!isHeir(vault, heir)) revert LifeSignalErrors.HeirNotFound();
        
        uint256 index = heirIndices[vault][heir] - 1;
        return vaultHeirs[vault][index].encryptedKey;
    }

    /**
     * @dev Calculate distribution of assets among heirs
     */
    function calculateDistribution(
        address vault,
        Types.Asset[] memory assets
    ) external view override validVault(vault) returns (Types.Distribution[] memory) {
        Types.Heir[] memory heirs = vaultHeirs[vault];
        Types.Distribution[] memory distributions = new Types.Distribution[](heirs.length);
        
        for (uint256 i = 0; i < heirs.length; i++) {
            Types.Asset[] memory heirAssets = new Types.Asset[](assets.length);
            
            for (uint256 j = 0; j < assets.length; j++) {
                heirAssets[j] = assets[j];
                // Calculate heir's share of this asset
                heirAssets[j].amount = (assets[j].amount * heirs[i].sharePercentage) / TOTAL_SHARES;
            }
            
            distributions[i] = Types.Distribution({
                heir: heirs[i].heirAddress,
                assets: heirAssets,
                timestamp: block.timestamp,
                transactionHash: bytes32(0) // Will be set during actual distribution
            });
        }
        
        return distributions;
    }

    // Administrative functions
    function setMaxHeirs(uint256 _maxHeirs) external override onlyRole(ADMIN_ROLE) {
        maxHeirs = _maxHeirs;
    }

    function setMinimumShare(uint96 _minimumShare) external override onlyRole(ADMIN_ROLE) {
        minimumShare = _minimumShare;
    }

    function setRequireFullDistribution(bool _required) external override onlyRole(ADMIN_ROLE) {
        requireFullDistribution = _required;
    }

    function pause() external override onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external override onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function addAuthorizedVault(address vault) external override onlyRole(ADMIN_ROLE) {
        authorizedVaults[vault] = true;
    }

    function removeAuthorizedVault(address vault) external override onlyRole(ADMIN_ROLE) {
        authorizedVaults[vault] = false;
    }

    function isAuthorizedVault(address vault) external view override returns (bool) {
        return authorizedVaults[vault];
    }
} 