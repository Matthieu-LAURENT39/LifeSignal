// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Vault Contract
 * @dev Manages vault data structures and file management for Oasis deployment
 */
contract Vault is Ownable, Pausable {
    
    struct VaultFile {
        string id;
        string originalName;
        string mimeType;
        string cid; // IPFS CID
        uint256 uploadDate;
    }

    struct VaultCypher {
        string iv; // Initialization Vector
        string encryptionKey; // Encrypted key
    }

    struct VaultData {
        string id;
        string name;
        address owner; // vault owner address
        VaultFile[] files;
        address[] contacts; // contact addresses with access
        bool isReleased;
        VaultCypher cypher;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // State variables
    mapping(string => VaultData) private _vaults;
    mapping(string => bool) private _vaultExists;
    mapping(address => string[]) private _ownerVaults; // owner address => vault IDs
    mapping(address => string[]) private _contactVaults; // contact address => vault IDs they have access to
    
    // Events
    event VaultCreated(string indexed vaultId, string name, address indexed owner);
    event VaultUpdated(string indexed vaultId);
    event VaultReleased(string indexed vaultId);
    event FileAdded(string indexed vaultId, string fileId, string originalName);
    event FileRemoved(string indexed vaultId, string fileId);
    event ContactAdded(string indexed vaultId, address indexed contactAddress);
    event ContactRemoved(string indexed vaultId, address indexed contactAddress);
    event VaultDeleted(string indexed vaultId);

    // Modifiers
    modifier onlyVaultExists(string memory vaultId) {
        require(_vaultExists[vaultId], "Vault does not exist");
        _;
    }

    modifier onlyVaultOwner(string memory vaultId) {
        require(_vaults[vaultId].owner == msg.sender, "Not vault owner");
        _;
    }

    modifier onlyVaultOwnerOrAuthorized(string memory vaultId) {
        require(
            msg.sender == owner() || 
            msg.sender == _vaults[vaultId].owner,
            "Not authorized"
        );
        _;
    }

    modifier onlyVaultAccess(string memory vaultId) {
        require(
            msg.sender == owner() || 
            msg.sender == _vaults[vaultId].owner ||
            _hasVaultAccess(vaultId, msg.sender),
            "No vault access"
        );
        _;
    }

    // Constructor
    constructor() {
        // No initialization needed
    }

    /**
     * @dev Create a new vault
     * @param vaultId Unique vault identifier
     * @param name Vault name
     * @param iv Initialization vector
     * @param encryptionKey Encrypted key
     */
    function createVault(
        string memory vaultId,
        string memory name,
        string memory iv,
        string memory encryptionKey
    ) external whenNotPaused returns (string memory) {
        require(bytes(vaultId).length > 0, "Vault ID cannot be empty");
        require(bytes(name).length > 0, "Vault name cannot be empty");
        require(bytes(iv).length > 0, "IV cannot be empty");
        require(bytes(encryptionKey).length > 0, "Encryption key cannot be empty");
        require(!_vaultExists[vaultId], "Vault already exists");

        address vaultOwner = msg.sender;
        
        VaultData memory newVault = VaultData({
            id: vaultId,
            name: name,
            owner: vaultOwner,
            files: new VaultFile[](0),
            contacts: new address[](0),
            isReleased: false,
            cypher: VaultCypher({
                iv: iv,
                encryptionKey: encryptionKey
            }),
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        _vaults[vaultId] = newVault;
        _vaultExists[vaultId] = true;
        _ownerVaults[vaultOwner].push(vaultId);

        emit VaultCreated(vaultId, name, vaultOwner);
        return vaultId;
    }

    /**
     * @dev Update vault information
     * @param vaultId Vault ID
     * @param name New vault name
     */
    function updateVault(
        string memory vaultId,
        string memory name
    ) external onlyVaultExists(vaultId) onlyVaultOwner(vaultId) whenNotPaused {
        require(bytes(name).length > 0, "Vault name cannot be empty");

        _vaults[vaultId].name = name;
        _vaults[vaultId].updatedAt = block.timestamp;

        emit VaultUpdated(vaultId);
    }

    /**
     * @dev Add file to vault
     * @param vaultId Vault ID
     * @param fileId File ID
     * @param originalName Original file name
     * @param mimeType MIME type
     * @param cid IPFS CID
     */
    function addFile(
        string memory vaultId,
        string memory fileId,
        string memory originalName,
        string memory mimeType,
        string memory cid
    ) external onlyVaultExists(vaultId) onlyVaultOwner(vaultId) whenNotPaused {
        require(bytes(fileId).length > 0, "File ID cannot be empty");
        require(bytes(originalName).length > 0, "Original name cannot be empty");
        require(bytes(cid).length > 0, "CID cannot be empty");

        VaultFile memory newFile = VaultFile({
            id: fileId,
            originalName: originalName,
            mimeType: mimeType,
            cid: cid,
            uploadDate: block.timestamp
        });

        _vaults[vaultId].files.push(newFile);
        _vaults[vaultId].updatedAt = block.timestamp;

        emit FileAdded(vaultId, fileId, originalName);
    }

    /**
     * @dev Remove file from vault
     * @param vaultId Vault ID
     * @param fileId File ID to remove
     */
    function removeFile(
        string memory vaultId,
        string memory fileId
    ) external onlyVaultExists(vaultId) onlyVaultOwner(vaultId) whenNotPaused {
        VaultFile[] storage files = _vaults[vaultId].files;
        
        for (uint256 i = 0; i < files.length; i++) {
            if (keccak256(bytes(files[i].id)) == keccak256(bytes(fileId))) {
                files[i] = files[files.length - 1];
                files.pop();
                break;
            }
        }

        _vaults[vaultId].updatedAt = block.timestamp;
        emit FileRemoved(vaultId, fileId);
    }

    /**
     * @dev Add contact to vault
     * @param vaultId Vault ID
     * @param contactAddress Contact address to add
     */
    function addContact(
        string memory vaultId,
        address contactAddress
    ) external onlyVaultExists(vaultId) onlyVaultOwner(vaultId) whenNotPaused {
        require(contactAddress != address(0), "Invalid contact address");
        require(!_hasVaultAccess(vaultId, contactAddress), "Contact already has access");

        _vaults[vaultId].contacts.push(contactAddress);
        _contactVaults[contactAddress].push(vaultId);
        _vaults[vaultId].updatedAt = block.timestamp;

        emit ContactAdded(vaultId, contactAddress);
    }

    /**
     * @dev Remove contact from vault
     * @param vaultId Vault ID
     * @param contactAddress Contact address to remove
     */
    function removeContact(
        string memory vaultId,
        address contactAddress
    ) external onlyVaultExists(vaultId) onlyVaultOwner(vaultId) whenNotPaused {
        require(_hasVaultAccess(vaultId, contactAddress), "Contact does not have access");

        // Remove from vault contacts
        address[] storage contacts = _vaults[vaultId].contacts;
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i] == contactAddress) {
                contacts[i] = contacts[contacts.length - 1];
                contacts.pop();
                break;
            }
        }

        // Remove from contact's vault list
        string[] storage contactVaults = _contactVaults[contactAddress];
        for (uint256 i = 0; i < contactVaults.length; i++) {
            if (keccak256(bytes(contactVaults[i])) == keccak256(bytes(vaultId))) {
                contactVaults[i] = contactVaults[contactVaults.length - 1];
                contactVaults.pop();
                break;
            }
        }

        _vaults[vaultId].updatedAt = block.timestamp;
        emit ContactRemoved(vaultId, contactAddress);
    }

    /**
     * @dev Release vault (make it accessible to contacts)
     * @param vaultId Vault ID
     */
    function releaseVault(
        string memory vaultId
    ) external onlyVaultExists(vaultId) onlyVaultOwner(vaultId) whenNotPaused {
        require(!_vaults[vaultId].isReleased, "Vault is already released");

        _vaults[vaultId].isReleased = true;
        _vaults[vaultId].updatedAt = block.timestamp;

        emit VaultReleased(vaultId);
    }

    /**
     * @dev Update vault encryption
     * @param vaultId Vault ID
     * @param iv New initialization vector
     * @param encryptionKey New encrypted key
     */
    function updateVaultEncryption(
        string memory vaultId,
        string memory iv,
        string memory encryptionKey
    ) external onlyVaultExists(vaultId) onlyVaultOwner(vaultId) whenNotPaused {
        require(bytes(iv).length > 0, "IV cannot be empty");
        require(bytes(encryptionKey).length > 0, "Encryption key cannot be empty");

        _vaults[vaultId].cypher.iv = iv;
        _vaults[vaultId].cypher.encryptionKey = encryptionKey;
        _vaults[vaultId].updatedAt = block.timestamp;

        emit VaultUpdated(vaultId);
    }

    /**
     * @dev Get vault data
     * @param vaultId Vault ID
     * @return Complete vault data
     */
    function getVault(string memory vaultId) external view onlyVaultExists(vaultId) onlyVaultAccess(vaultId) returns (VaultData memory) {
        return _vaults[vaultId];
    }

    /**
     * @dev Check if vault exists
     * @param vaultId Vault ID
     * @return True if vault exists
     */
    function vaultExists(string memory vaultId) external view returns (bool) {
        return _vaultExists[vaultId];
    }

    /**
     * @dev Get vault owner
     * @param vaultId Vault ID
     * @return Vault owner address
     */
    function getVaultOwner(string memory vaultId) external view onlyVaultExists(vaultId) returns (address) {
        return _vaults[vaultId].owner;
    }

    /**
     * @dev Get vault files count
     * @param vaultId Vault ID
     * @return Number of files
     */
    function getVaultFilesCount(string memory vaultId) external view onlyVaultExists(vaultId) onlyVaultAccess(vaultId) returns (uint256) {
        return _vaults[vaultId].files.length;
    }

    /**
     * @dev Get vault file by index
     * @param vaultId Vault ID
     * @param index File index
     * @return Vault file data
     */
    function getVaultFile(string memory vaultId, uint256 index) external view onlyVaultExists(vaultId) onlyVaultAccess(vaultId) returns (VaultFile memory) {
        require(index < _vaults[vaultId].files.length, "File index out of bounds");
        return _vaults[vaultId].files[index];
    }

    /**
     * @dev Get vault contacts count
     * @param vaultId Vault ID
     * @return Number of contacts
     */
    function getVaultContactsCount(string memory vaultId) external view onlyVaultExists(vaultId) onlyVaultAccess(vaultId) returns (uint256) {
        return _vaults[vaultId].contacts.length;
    }

    /**
     * @dev Get vault contact by index
     * @param vaultId Vault ID
     * @param index Contact index
     * @return Contact address
     */
    function getVaultContact(string memory vaultId, uint256 index) external view onlyVaultExists(vaultId) onlyVaultAccess(vaultId) returns (address) {
        require(index < _vaults[vaultId].contacts.length, "Contact index out of bounds");
        return _vaults[vaultId].contacts[index];
    }

    /**
     * @dev Get all vaults for an owner
     * @param ownerAddress Owner address
     * @return Array of vault IDs
     */
    function getOwnerVaults(address ownerAddress) external view returns (string[] memory) {
        return _ownerVaults[ownerAddress];
    }

    /**
     * @dev Get all vaults for a contact
     * @param contactAddress Contact address
     * @return Array of vault IDs
     */
    function getContactVaults(address contactAddress) external view returns (string[] memory) {
        return _contactVaults[contactAddress];
    }

    /**
     * @dev Check if address has access to vault
     * @param vaultId Vault ID
     * @param userAddress User address
     * @return True if user has access
     */
    function hasVaultAccess(string memory vaultId, address userAddress) external view returns (bool) {
        return _hasVaultAccess(vaultId, userAddress);
    }

    /**
     * @dev Internal function to check vault access
     * @param vaultId Vault ID
     * @param userAddress User address
     * @return True if user has access
     */
    function _hasVaultAccess(string memory vaultId, address userAddress) internal view returns (bool) {
        if (!_vaultExists[vaultId]) return false;
        
        VaultData storage vault = _vaults[vaultId];
        if (userAddress == vault.owner) return true;
        
        for (uint256 i = 0; i < vault.contacts.length; i++) {
            if (vault.contacts[i] == userAddress) return true;
        }
        
        return false;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
} 