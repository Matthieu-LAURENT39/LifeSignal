// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract User {
    // Custom errors for gas optimization
    error Unauthorized();
    error InvalidAddress();
    error UserNotAlive();
    error VaultNotFound();
    error DuplicateVault();

    // Packed struct for gas optimization
    struct UserData {
        address payable owner;
        uint64 createdAt;
        uint64 lastUpdated;
        bool alive;
    }

    UserData public userData;
    address[] public vaults;

    // Events for better UX
    event VaultAdded(address indexed vault);
    event VaultRemoved(address indexed vault);
    event UserStatusChanged(bool alive);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    constructor(uint _unlockTime) payable {
        userData.owner = payable(msg.sender);
        userData.createdAt = uint64(block.timestamp);
        userData.lastUpdated = userData.createdAt;
        userData.alive = true;
    }

    // Optimized getters
    function getOwner() external view returns (address payable) {
        return userData.owner;
    }

    function getCreatedAt() external view returns (uint64) {
        return userData.createdAt;
    }

    function getLastUpdated() external view returns (uint64) {
        return userData.lastUpdated;
    }

    function isAlive() external view returns (bool) {
        return userData.alive;
    }

    function getVaults() external view returns (address[] memory) {
        return vaults;
    }

    function getVaultCount() external view returns (uint256) {
        return vaults.length;
    }

    function getVaultAtIndex(uint256 index) external view returns (address) {
        if (index >= vaults.length) revert VaultNotFound();
        return vaults[index];
    }

    // Optimized setters with access control
    modifier onlyOwner() {
        if (msg.sender != userData.owner) revert Unauthorized();
        _;
    }

    modifier onlyAlive() {
        if (!userData.alive) revert UserNotAlive();
        _;
    }

    function setAlive(bool _alive) external onlyOwner {
        userData.alive = _alive;
        userData.lastUpdated = uint64(block.timestamp);
        emit UserStatusChanged(_alive);
    }

    function setOwner(address payable _newOwner) external onlyOwner onlyAlive {
        if (_newOwner == address(0)) revert InvalidAddress();
        
        address oldOwner = userData.owner;
        userData.owner = _newOwner;
        userData.lastUpdated = uint64(block.timestamp);
        
        emit OwnerChanged(oldOwner, _newOwner);
    }

    function addVault(address _vault) external onlyOwner onlyAlive {
        if (_vault == address(0)) revert InvalidAddress();
        
        // Check for duplicates
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i] == _vault) revert DuplicateVault();
        }
        
        vaults.push(_vault);
        userData.lastUpdated = uint64(block.timestamp);
        
        emit VaultAdded(_vault);
    }

    function removeVault(address _vault) external onlyOwner onlyAlive {
        if (_vault == address(0)) revert InvalidAddress();
        
        uint256 vaultIndex = type(uint256).max;
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i] == _vault) {
                vaultIndex = i;
                break;
            }
        }
        
        if (vaultIndex == type(uint256).max) revert VaultNotFound();
        
        // Gas efficient removal: swap with last element and pop
        vaults[vaultIndex] = vaults[vaults.length - 1];
        vaults.pop();
        
        userData.lastUpdated = uint64(block.timestamp);
        
        emit VaultRemoved(_vault);
    }

    function updateLastUpdated() external onlyOwner {
        userData.lastUpdated = uint64(block.timestamp);
    }

    // Batch operations for gas efficiency
    function addMultipleVaults(address[] calldata _vaults) external onlyOwner onlyAlive {
        uint256 length = _vaults.length;
        for (uint256 i = 0; i < length; i++) {
            address vault = _vaults[i];
            if (vault == address(0)) revert InvalidAddress();
            
            // Check for duplicates within the batch
            for (uint256 j = 0; j < i; j++) {
                if (_vaults[j] == vault) revert DuplicateVault();
            }
            
            // Check for duplicates with existing vaults
            for (uint256 k = 0; k < vaults.length; k++) {
                if (vaults[k] == vault) revert DuplicateVault();
            }
            
            vaults.push(vault);
            emit VaultAdded(vault);
        }
        
        userData.lastUpdated = uint64(block.timestamp);
    }

    // View function to get all user data in one call
    function getUserData() external view returns (
        address payable owner,
        uint64 createdAt,
        uint64 lastUpdated,
        bool alive,
        address[] memory userVaults
    ) {
        return (
            userData.owner,
            userData.createdAt,
            userData.lastUpdated,
            userData.alive,
            vaults
        );
    }

    // Check if address is a vault
    function isVault(address _vault) external view returns (bool) {
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i] == _vault) return true;
        }
        return false;
    }
}
