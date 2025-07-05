// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./User.sol";
import "./Owner.sol";
import "./Contact.sol";
import "./Vault.sol";

/**
 * @title LifeSignal Contract
 * @dev Main contract that orchestrates all other contracts for Oasis deployment
 */
contract LifeSignal is Ownable, Pausable {
    
    // Contract instances
    User public userContract;
    Owner public ownerContract;
    Contact public contactContract;
    Vault public vaultContract;
    
    // Events
    event ContractsInitialized(address userContract, address ownerContract, address contactContract, address vaultContract);
    event UserRegistered(address indexed userAddress, string firstName, string lastName);
    event OwnerRegistered(address indexed ownerAddress, string firstName, string lastName);
    event ContactRegistered(address indexed contactAddress, address indexed ownerAddress);
    event VaultCreated(string indexed vaultId, address indexed ownerAddress);
    
    // Modifiers
    modifier contractsInitialized() {
        require(address(userContract) != address(0), "Contracts not initialized");
        require(address(ownerContract) != address(0), "Contracts not initialized");
        require(address(contactContract) != address(0), "Contracts not initialized");
        require(address(vaultContract) != address(0), "Contracts not initialized");
        _;
    }

    // Constructor
    constructor() {
        // Contracts will be set after deployment
    }

    /**
     * @dev Initialize contract addresses
     * @param _userContract User contract address
     * @param _ownerContract Owner contract address
     * @param _contactContract Contact contract address
     * @param _vaultContract Vault contract address
     */
    function initializeContracts(
        address _userContract,
        address _ownerContract,
        address _contactContract,
        address _vaultContract
    ) external onlyOwner {
        require(_userContract != address(0), "Invalid user contract address");
        require(_ownerContract != address(0), "Invalid owner contract address");
        require(_contactContract != address(0), "Invalid contact contract address");
        require(_vaultContract != address(0), "Invalid vault contract address");

        userContract = User(_userContract);
        ownerContract = Owner(_ownerContract);
        contactContract = Contact(_contactContract);
        vaultContract = Vault(_vaultContract);

        emit ContractsInitialized(_userContract, _ownerContract, _contactContract, _vaultContract);
    }

    /**
     * @dev Register a new user
     * @param firstName First name
     * @param lastName Last name
     * @param birthDate Birth date
     * @param email Email
     * @param phone Phone
     */
    function registerUser(
        string memory firstName,
        string memory lastName,
        string memory birthDate,
        string memory email,
        string memory phone
    ) external whenNotPaused contractsInitialized returns (address) {
        address userAddress = userContract.createUser(
            firstName,
            lastName,
            birthDate,
            email,
            phone
        );

        emit UserRegistered(userAddress, firstName, lastName);
        return userAddress;
    }

    /**
     * @dev Register a new owner
     * @param firstName First name
     * @param lastName Last name
     * @param birthDate Birth date
     * @param email Email
     * @param phone Phone
     * @param graceInterval Grace interval in days
     */
    function registerOwner(
        string memory firstName,
        string memory lastName,
        string memory birthDate,
        string memory email,
        string memory phone,
        uint256 graceInterval
    ) external whenNotPaused contractsInitialized returns (address) {
        address ownerAddress = ownerContract.createOwner(
            firstName,
            lastName,
            birthDate,
            email,
            phone,
            graceInterval
        );

        emit OwnerRegistered(ownerAddress, firstName, lastName);
        return ownerAddress;
    }

    /**
     * @dev Register a new contact
     * @param firstName First name
     * @param lastName Last name
     * @param birthDate Birth date
     * @param email Email
     * @param phone Phone
     * @param ownerAddress Owner address
     */
    function registerContact(
        string memory firstName,
        string memory lastName,
        string memory birthDate,
        string memory email,
        string memory phone,
        address ownerAddress
    ) external whenNotPaused contractsInitialized returns (address) {
        address contactAddress = contactContract.createContact(
            firstName,
            lastName,
            birthDate,
            email,
            phone,
            ownerAddress
        );

        emit ContactRegistered(contactAddress, ownerAddress);
        return contactAddress;
    }

    /**
     * @dev Create a new vault
     * @param vaultId Vault ID
     * @param name Vault name
     * @param iv Initialization vector
     * @param encryptionKey Encrypted key
     */
    function createVault(
        string memory vaultId,
        string memory name,
        string memory iv,
        string memory encryptionKey
    ) external whenNotPaused contractsInitialized returns (string memory) {
        string memory createdVaultId = vaultContract.createVault(
            vaultId,
            name,
            iv,
            encryptionKey
        );

        emit VaultCreated(createdVaultId, msg.sender);
        return createdVaultId;
    }

    /**
     * @dev Get user data
     * @param userAddress User address
     * @return User data
     */
    function getUser(address userAddress) external view contractsInitialized returns (User.UserData memory) {
        return userContract.getUser(userAddress);
    }

    /**
     * @dev Get owner data
     * @param ownerAddress Owner address
     * @return Owner data
     */
    function getOwner(address ownerAddress) external view contractsInitialized returns (Owner.OwnerData memory) {
        return ownerContract.getOwner(ownerAddress);
    }

    /**
     * @dev Get contact data
     * @param contactAddress Contact address
     * @return Contact data
     */
    function getContact(address contactAddress) external view contractsInitialized returns (Contact.ContactData memory) {
        return contactContract.getContact(contactAddress);
    }

    /**
     * @dev Get vault data
     * @param vaultId Vault ID
     * @return Vault data
     */
    function getVault(string memory vaultId) external view contractsInitialized returns (Vault.VaultData memory) {
        return vaultContract.getVault(vaultId);
    }

    /**
     * @dev Check if user exists
     * @param userAddress User address
     * @return True if user exists
     */
    function userExists(address userAddress) external view contractsInitialized returns (bool) {
        return userContract.userExists(userAddress);
    }

    /**
     * @dev Check if owner exists
     * @param ownerAddress Owner address
     * @return True if owner exists
     */
    function ownerExists(address ownerAddress) external view contractsInitialized returns (bool) {
        return ownerContract.ownerExists(ownerAddress);
    }

    /**
     * @dev Check if contact exists
     * @param contactAddress Contact address
     * @return True if contact exists
     */
    function contactExists(address contactAddress) external view contractsInitialized returns (bool) {
        return contactContract.contactExists(contactAddress);
    }

    /**
     * @dev Check if vault exists
     * @param vaultId Vault ID
     * @return True if vault exists
     */
    function vaultExists(string memory vaultId) external view contractsInitialized returns (bool) {
        return vaultContract.vaultExists(vaultId);
    }

    /**
     * @dev Get owner status
     * @param ownerAddress Owner address
     * @return Owner status
     */
    function getOwnerStatus(address ownerAddress) external view contractsInitialized returns (Owner.OwnerStatus) {
        return ownerContract.getOwnerStatus(ownerAddress);
    }

    /**
     * @dev Get owner contacts
     * @param ownerAddress Owner address
     * @return Array of contact addresses
     */
    function getOwnerContacts(address ownerAddress) external view contractsInitialized returns (address[] memory) {
        return contactContract.getOwnerContacts(ownerAddress);
    }

    /**
     * @dev Get owner vaults
     * @param ownerAddress Owner address
     * @return Array of vault IDs
     */
    function getOwnerVaults(address ownerAddress) external view contractsInitialized returns (string[] memory) {
        return vaultContract.getOwnerVaults(ownerAddress);
    }

    /**
     * @dev Get contact vaults
     * @param contactAddress Contact address
     * @return Array of vault IDs
     */
    function getContactVaults(address contactAddress) external view contractsInitialized returns (string[] memory) {
        return vaultContract.getContactVaults(contactAddress);
    }

    /**
     * @dev Check vault access
     * @param vaultId Vault ID
     * @param userAddress User address
     * @return True if user has access
     */
    function hasVaultAccess(string memory vaultId, address userAddress) external view contractsInitialized returns (bool) {
        return vaultContract.hasVaultAccess(vaultId, userAddress);
    }

    /**
     * @dev Update user information
     * @param userAddress User address
     * @param firstName First name
     * @param lastName Last name
     * @param email Email
     * @param phone Phone
     */
    function updateUser(
        address userAddress,
        string memory firstName,
        string memory lastName,
        string memory email,
        string memory phone
    ) external whenNotPaused contractsInitialized {
        userContract.updateUser(userAddress, firstName, lastName, email, phone);
    }

    /**
     * @dev Update owner information
     * @param ownerAddress Owner address
     * @param firstName First name
     * @param lastName Last name
     * @param email Email
     * @param phone Phone
     */
    function updateOwner(
        address ownerAddress,
        string memory firstName,
        string memory lastName,
        string memory email,
        string memory phone
    ) external whenNotPaused contractsInitialized {
        ownerContract.updateOwner(ownerAddress, firstName, lastName, email, phone);
    }

    /**
     * @dev Update contact information
     * @param contactAddress Contact address
     * @param firstName First name
     * @param lastName Last name
     * @param email Email
     * @param phone Phone
     */
    function updateContact(
        address contactAddress,
        string memory firstName,
        string memory lastName,
        string memory email,
        string memory phone
    ) external whenNotPaused contractsInitialized {
        contactContract.updateContact(contactAddress, firstName, lastName, email, phone);
    }

    /**
     * @dev Add file to vault
     * @param vaultId Vault ID
     * @param fileId File ID
     * @param originalName Original name
     * @param mimeType MIME type
     * @param cid IPFS CID
     */
    function addFileToVault(
        string memory vaultId,
        string memory fileId,
        string memory originalName,
        string memory mimeType,
        string memory cid
    ) external whenNotPaused contractsInitialized {
        vaultContract.addFile(vaultId, fileId, originalName, mimeType, cid);
    }

    /**
     * @dev Add contact to vault
     * @param vaultId Vault ID
     * @param contactAddress Contact address
     */
    function addContactToVault(
        string memory vaultId,
        address contactAddress
    ) external whenNotPaused contractsInitialized {
        vaultContract.addContact(vaultId, contactAddress);
    }

    /**
     * @dev Release vault
     * @param vaultId Vault ID
     */
    function releaseVault(string memory vaultId) external whenNotPaused contractsInitialized {
        vaultContract.releaseVault(vaultId);
    }

    /**
     * @dev Create death declaration
     * @param ownerAddress Owner address
     * @param declaredBy Declarer ID
     */
    function createDeathDeclaration(
        address ownerAddress,
        string memory declaredBy
    ) external whenNotPaused contractsInitialized {
        ownerContract.createDeathDeclaration(ownerAddress, declaredBy);
    }

    /**
     * @dev Cast death vote
     * @param ownerAddress Owner address
     * @param contactId Contact ID
     * @param voted Vote
     */
    function castDeathVote(
        address ownerAddress,
        string memory contactId,
        bool voted
    ) external whenNotPaused contractsInitialized {
        ownerContract.castDeathVote(ownerAddress, contactId, voted);
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