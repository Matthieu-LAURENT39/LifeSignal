// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

/**
 * @title LifeSignalRegistry
 * @dev Manages owner registration, contacts, vaults, and death declarations with privacy features
 */
contract LifeSignalRegistry {
    
    // Structures
    struct Owner {
        address addr;
        string firstName;
        string lastName;
        string email;
        string phone;
        uint256 lastHeartbeat;
        uint256 graceInterval; // in seconds
        bool isDeceased;
        bool exists;
        address[] contactList;
        uint256[] vaultList; // Changed from address[] to uint256[]
    }

    struct Contact {
        address addr;
        string firstName;
        string lastName;
        string email;
        string phone;
        bool hasVotingRight;
        bool isVerified;
        bool exists;
        uint256[] authorizedVaults; // Changed from address[] to uint256[]
    }

    struct Vault {
        uint256 id; // unique vault ID
        string name;
        address owner;
        bool isReleased;
        string cypherIv;
        string encryptionKey;
        bool exists;
        address[] authorizedContacts;
        uint256[] fileIds; // Changed from string[] to uint256[]
    }

    struct VaultFile {
        uint256 id; // unique file ID
        string originalName;
        string mimeType;
        string cid;
        string uploadDate;
        bool exists;
    }

    struct ContactVaultDetails {
        uint256 vaultId;
        string vaultName;
        address vaultOwner;
        bool isReleased;
        string cypherIv;
        string encryptionKey;
        uint256[] fileIds;
    }

    struct DeathDeclaration {
        address initiator;
        uint256 startTime;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 totalVotingContacts;
        bool isActive;
        bool consensusReached;
        uint256 gracePeriodEnd; // Timestamp when grace period ends
        bool isInGracePeriod; // True when consensus reached but grace period active
        mapping(address => bool) hasVoted;
        mapping(address => bool) vote; // true = for death, false = against
    }

    // State variables
    mapping(address => Owner) private owners;
    mapping(address => mapping(address => Contact)) private contacts; // owner => contact => Contact
    mapping(uint256 => Vault) private vaults; // vault ID => Vault
    mapping(uint256 => mapping(uint256 => VaultFile)) private vaultFiles; // vault ID => file ID => VaultFile
    mapping(address => DeathDeclaration) private deathDeclarations;
    mapping(address => ContactVaultDetails[]) private contactVaultDetails; // contact address => array of vault details
    uint256 private vaultCounter = 0; // Counter for generating unique vault IDs
    uint256 private fileCounter = 0; // Counter for generating unique file IDs
    
    // Events
    event OwnerRegistered(address indexed owner, string firstName, string lastName);
    event ContactAdded(address indexed owner, address indexed contact, string firstName, string lastName, bool hasVotingRight);
    event ContactVerified(address indexed owner, address indexed contact);
    event HeartbeatSent(address indexed owner, uint256 timestamp);
    event DeathDeclared(address indexed owner, address indexed declaredBy, uint256 timestamp);
    event VoteCast(address indexed owner, address indexed voter, bool vote);
    event ConsensusReached(address indexed owner, bool isDeceased, uint256 timestamp);
    event GracePeriodStarted(address indexed owner, uint256 gracePeriodEnd);
    event VaultCreated(uint256 indexed vaultId, address indexed owner, string name);
    event VaultFileAdded(uint256 indexed vaultId, uint256 fileId, string originalName);
    event VaultReleased(uint256 indexed vaultId, address indexed owner);
    event VaultContactAuthorized(uint256 indexed vaultId, address indexed contact);

    // Modifiers
    modifier onlyRegistered() {
        require(owners[msg.sender].exists, "Owner not registered");
        _;
    }

    modifier onlyContact(address owner) {
        require(contacts[owner][msg.sender].exists, "Not a contact of this owner");
        _;
    }

    modifier onlyVerifiedContact(address owner) {
        require(contacts[owner][msg.sender].exists, "Not a contact of this owner");
        require(contacts[owner][msg.sender].isVerified, "Contact not verified");
        _;
    }

    modifier onlyVotingContact(address owner) {
        require(contacts[owner][msg.sender].exists, "Not a contact of this owner");
        // Removed verification requirement for POC
        // require(contacts[owner][msg.sender].isVerified, "Contact not verified");
        require(contacts[owner][msg.sender].hasVotingRight, "No voting rights");
        _;
    }

    modifier onlyVaultOwner(uint256 vaultId) {
        require(vaults[vaultId].exists, "Vault does not exist");
        require(vaults[vaultId].owner == msg.sender, "Not vault owner");
        _;
    }

    modifier onlyVaultAuthorized(uint256 vaultId) {
        require(vaults[vaultId].exists, "Vault does not exist");
        require(vaults[vaultId].owner == msg.sender || _isAuthorizedContact(vaultId, msg.sender), "Not authorized");
        _;
    }

    // Internal helper function
    function _isAuthorizedContact(uint256 vaultId, address contact) internal view returns (bool) {
        Vault storage vault = vaults[vaultId];
        for (uint i = 0; i < vault.authorizedContacts.length; i++) {
            if (vault.authorizedContacts[i] == contact) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Register as an owner
     */
    function registerOwner(
        string calldata _firstName,
        string calldata _lastName,
        string calldata _email,
        string calldata _phone,
        uint256 _graceInterval
    ) external {
        require(!owners[msg.sender].exists, "Owner already registered");
        require(_graceInterval >= 1 days, "Grace interval too short");
        require(_graceInterval <= 365 days, "Grace interval too long");

        owners[msg.sender] = Owner({
            addr: msg.sender,
            firstName: _firstName,
            lastName: _lastName,
            email: _email,
            phone: _phone,
            lastHeartbeat: block.timestamp,
            graceInterval: _graceInterval,
            isDeceased: false,
            exists: true,
            contactList: new address[](0),
            vaultList: new uint256[](0)
        });

        emit OwnerRegistered(msg.sender, _firstName, _lastName);
    }

    /**
     * @dev Add a contact to the owner's list
     */
    function addContact(
        address _contact,
        string calldata _firstName,
        string calldata _lastName,
        string calldata _email,
        string calldata _phone,
        bool _hasVotingRight,
        uint256[] calldata _authorizedVaults
    ) external onlyRegistered {
        require(_contact != msg.sender, "Cannot add yourself as contact");
        require(!contacts[msg.sender][_contact].exists, "Contact already exists");

        contacts[msg.sender][_contact] = Contact({
            addr: _contact,
            firstName: _firstName,
            lastName: _lastName,
            email: _email,
            phone: _phone,
            hasVotingRight: _hasVotingRight,
            isVerified: true, // Auto-verified for POC
            exists: true,
            authorizedVaults: new uint256[](0)
        });

        owners[msg.sender].contactList.push(_contact);
        
        // Authorize contact for specified vaults
        for (uint i = 0; i < _authorizedVaults.length; i++) {
            uint256 vaultId = _authorizedVaults[i];
            require(vaults[vaultId].exists, "Vault does not exist");
            require(vaults[vaultId].owner == msg.sender, "Not vault owner");
            require(!_isAuthorizedContact(vaultId, _contact), "Contact already authorized for this vault");
            
            vaults[vaultId].authorizedContacts.push(_contact);
            contacts[msg.sender][_contact].authorizedVaults.push(vaultId);
            
            // Add vault details to contact's vault details mapping
            Vault storage vault = vaults[vaultId];
            ContactVaultDetails memory newDetail = ContactVaultDetails({
                vaultId: vaultId,
                vaultName: vault.name,
                vaultOwner: vault.owner,
                isReleased: vault.isReleased,
                cypherIv: vault.cypherIv,
                encryptionKey: vault.encryptionKey,
                fileIds: vault.fileIds
            });
            contactVaultDetails[_contact].push(newDetail);
            
            emit VaultContactAuthorized(vaultId, _contact);
        }
        
        emit ContactAdded(msg.sender, _contact, _firstName, _lastName, _hasVotingRight);
    }

    /**
     * @dev Verify a contact (called by the contact themselves)
     */
    function verifyContact(address _owner) external onlyContact(_owner) {
        require(!contacts[_owner][msg.sender].isVerified, "Already verified");
        contacts[_owner][msg.sender].isVerified = true;
        emit ContactVerified(_owner, msg.sender);
    }

    /**
     * @dev Update contact information (called by the contact themselves)
     */
    function updateContactInfo(
        address _owner,
        string calldata _firstName,
        string calldata _lastName,
        string calldata _email,
        string calldata _phone
    ) external onlyContact(_owner) {
        Contact storage contact = contacts[_owner][msg.sender];
        contact.firstName = _firstName;
        contact.lastName = _lastName;
        contact.email = _email;
        contact.phone = _phone;
    }

    /**
     * @dev Send heartbeat to prove owner is alive
     */
    function sendHeartbeat() external onlyRegistered {
        require(!owners[msg.sender].isDeceased, "Owner is already deceased");
        
        owners[msg.sender].lastHeartbeat = block.timestamp;
        
        DeathDeclaration storage declaration = deathDeclarations[msg.sender];
        
        // Cancel any active death declaration or grace period
        if (declaration.isActive || declaration.isInGracePeriod) {
            declaration.isActive = false;
            declaration.isInGracePeriod = false;
            declaration.consensusReached = false;
            declaration.gracePeriodEnd = 0;
            emit ConsensusReached(msg.sender, false, block.timestamp);
        }

        emit HeartbeatSent(msg.sender, block.timestamp);
    }

    /**
     * @dev Initiate death declaration voting
     */
    function declareDeceased(address _owner) external onlyVotingContact(_owner) {
        require(owners[_owner].exists, "Owner not registered");
        require(!owners[_owner].isDeceased, "Owner already deceased");
        require(!deathDeclarations[_owner].isActive, "Death declaration already active");

        // Count total voting contacts
        uint256 votingContacts = 0;
        for (uint i = 0; i < owners[_owner].contactList.length; i++) {
            address contactAddr = owners[_owner].contactList[i];
            // Removed verification requirement for POC - only check voting rights
            if (contacts[_owner][contactAddr].hasVotingRight) {
                votingContacts++;
            }
        }

        require(votingContacts > 0, "No voting contacts available");

        // Initialize death declaration
        DeathDeclaration storage declaration = deathDeclarations[_owner];
        declaration.initiator = msg.sender;
        declaration.startTime = block.timestamp;
        declaration.votesFor = 1; // Initiator votes for death
        declaration.votesAgainst = 0;
        declaration.totalVotingContacts = votingContacts;
        declaration.isActive = true;
        declaration.consensusReached = false;
        declaration.isInGracePeriod = false;
        declaration.gracePeriodEnd = 0;
        declaration.hasVoted[msg.sender] = true;
        declaration.vote[msg.sender] = true;

        emit DeathDeclared(_owner, msg.sender, block.timestamp);
        emit VoteCast(_owner, msg.sender, true);

        // Check if consensus is reached immediately
        _checkConsensus(_owner);
    }

    /**
     * @dev Vote on death declaration
     */
    function voteOnDeathDeclaration(address _owner, bool _vote) external onlyVotingContact(_owner) {
        require(deathDeclarations[_owner].isActive, "No active death declaration");
        require(!deathDeclarations[_owner].hasVoted[msg.sender], "Already voted");

        DeathDeclaration storage declaration = deathDeclarations[_owner];
        declaration.hasVoted[msg.sender] = true;
        declaration.vote[msg.sender] = _vote;

        if (_vote) {
            declaration.votesFor++;
        } else {
            declaration.votesAgainst++;
        }

        emit VoteCast(_owner, msg.sender, _vote);
        _checkConsensus(_owner);
    }

    /**
     * @dev Finalize death declaration after grace period expires
     */
    function finalizeDeathDeclaration(address _owner) external {
        DeathDeclaration storage declaration = deathDeclarations[_owner];
        require(declaration.isInGracePeriod, "Not in grace period");
        require(block.timestamp >= declaration.gracePeriodEnd, "Grace period not yet expired");
        require(!owners[_owner].isDeceased, "Owner already deceased");

        // Finalize death
        owners[_owner].isDeceased = true;
        declaration.isActive = false;
        declaration.isInGracePeriod = false;
        
        emit ConsensusReached(_owner, true, block.timestamp);
    }

    /**
     * @dev Check if grace period has expired and auto-finalize if needed
     */
    function checkGracePeriodExpiry(address _owner) external view returns (bool expired, bool canFinalize) {
        DeathDeclaration storage declaration = deathDeclarations[_owner];
        expired = declaration.isInGracePeriod && block.timestamp >= declaration.gracePeriodEnd;
        canFinalize = expired && !owners[_owner].isDeceased;
        return (expired, canFinalize);
    }

    /**
     * @dev Internal function to check if consensus is reached
     */
    function _checkConsensus(address _owner) internal {
        DeathDeclaration storage declaration = deathDeclarations[_owner];
        uint256 requiredVotes = (declaration.totalVotingContacts * 50) / 100 + 1; // Majority

        if (declaration.votesFor >= requiredVotes) {
            // Death consensus reached - start 30 second grace period
            declaration.consensusReached = true;
            declaration.isInGracePeriod = true;
            declaration.gracePeriodEnd = block.timestamp + 30; // 30 second grace period
            emit ConsensusReached(_owner, true, block.timestamp);
            emit GracePeriodStarted(_owner, declaration.gracePeriodEnd);
        } else if (declaration.votesAgainst >= requiredVotes) {
            // Death rejected
            declaration.isActive = false;
            declaration.consensusReached = true;
            declaration.isInGracePeriod = false;
            emit ConsensusReached(_owner, false, block.timestamp);
        }
        // If neither condition is met, voting continues
    }

    // View functions
    function getOwnerInfo(address _owner) external view returns (
        string memory firstName,
        string memory lastName,
        uint256 lastHeartbeat,
        uint256 graceInterval,
        bool isDeceased,
        bool exists
    ) {
        Owner storage owner = owners[_owner];
        return (
            owner.firstName,
            owner.lastName,
            owner.lastHeartbeat,
            owner.graceInterval,
            owner.isDeceased,
            owner.exists
        );
    }

    function getContactInfo(address _owner, address _contact) external view returns (
        address addr,
        string memory firstName,
        string memory lastName,
        string memory email,
        string memory phone,
        bool hasVotingRight,
        bool isVerified,
        bool exists
    ) {
        Contact storage contact = contacts[_owner][_contact];
        return (
            contact.addr,
            contact.firstName,
            contact.lastName,
            contact.email,
            contact.phone,
            contact.hasVotingRight,
            contact.isVerified,
            contact.exists
        );
    }

    function getDeathDeclarationStatus(address _owner) external view returns (
        bool isActive,
        bool isDeceased,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 totalVotingContacts,
        bool consensusReached,
        bool isInGracePeriod,
        uint256 gracePeriodEnd
    ) {
        DeathDeclaration storage declaration = deathDeclarations[_owner];
        return (
            declaration.isActive,
            owners[_owner].isDeceased,
            declaration.votesFor,
            declaration.votesAgainst,
            declaration.totalVotingContacts,
            declaration.consensusReached,
            declaration.isInGracePeriod,
            declaration.gracePeriodEnd
        );
    }

    function getContactList(address _owner) external view returns (address[] memory) {
        return owners[_owner].contactList;
    }

    /**
     * @dev Get detailed contact list with all contact information
     */
    function getContactListDetails(address _owner) external view returns (
        address[] memory contactAddresses,
        string[] memory firstNames,
        string[] memory lastNames,
        string[] memory emails,
        string[] memory phones,
        bool[] memory hasVotingRights,
        bool[] memory isVerified
    ) {
        address[] memory contactList = owners[_owner].contactList;
        uint256 length = contactList.length;
        
        contactAddresses = new address[](length);
        firstNames = new string[](length);
        lastNames = new string[](length);
        emails = new string[](length);
        phones = new string[](length);
        hasVotingRights = new bool[](length);
        isVerified = new bool[](length);
        
        for (uint256 i = 0; i < length; i++) {
            address contactAddr = contactList[i];
            Contact storage contact = contacts[_owner][contactAddr];
            
            contactAddresses[i] = contact.addr;
            firstNames[i] = contact.firstName;
            lastNames[i] = contact.lastName;
            emails[i] = contact.email;
            phones[i] = contact.phone;
            hasVotingRights[i] = contact.hasVotingRight;
            isVerified[i] = contact.isVerified;
        }
    }

    function hasVoted(address _owner, address _voter) external view returns (bool) {
        return deathDeclarations[_owner].hasVoted[_voter];
    }

    function getVote(address _owner, address _voter) external view returns (bool) {
        require(deathDeclarations[_owner].hasVoted[_voter], "Voter has not voted");
        return deathDeclarations[_owner].vote[_voter];
    }

    /**
     * @dev Get contact's authorized vaults
     */
    function getContactAuthorizedVaults(address _owner, address _contact) external view returns (uint256[] memory) {
        Contact storage contact = contacts[_owner][_contact];
        return contact.authorizedVaults;
    }

    // Vault Management Functions

    /**
     * @dev Create a new vault
     */
    function createVault(
        string calldata _name,
        string calldata _cypherIv,
        string calldata _encryptionKey
    ) external onlyRegistered returns (uint256) {
        uint256 vaultId = vaultCounter;
        require(!vaults[vaultId].exists, "Vault already exists");

        vaults[vaultId] = Vault({
            id: vaultId,
            name: _name,
            owner: msg.sender,
            isReleased: false,
            cypherIv: _cypherIv,
            encryptionKey: _encryptionKey,
            exists: true,
            authorizedContacts: new address[](0),
            fileIds: new uint256[](0)
        });

        owners[msg.sender].vaultList.push(vaultId);
        vaultCounter++;
        
        emit VaultCreated(vaultId, msg.sender, _name);
        return vaultId;
    }

    /**
     * @dev Add a file to a vault
     */
    function addVaultFile(
        uint256 _vaultId,
        string calldata _originalName,
        string calldata _mimeType,
        string calldata _cid,
        string calldata _uploadDate
    ) external onlyVaultOwner(_vaultId) returns (uint256) {
        uint256 fileId = fileCounter;
        require(!vaultFiles[_vaultId][fileId].exists, "File already exists");

        vaultFiles[_vaultId][fileId] = VaultFile({
            id: fileId,
            originalName: _originalName,
            mimeType: _mimeType,
            cid: _cid,
            uploadDate: _uploadDate,
            exists: true
        });

        vaults[_vaultId].fileIds.push(fileId);
        fileCounter++;
        
        emit VaultFileAdded(_vaultId, fileId, _originalName);
        return fileId;
    }

    /**
     * @dev Authorize a contact to access a vault
     */
    function authorizeVaultContact(
        uint256 _vaultId,
        address _contact
    ) external onlyVaultOwner(_vaultId) {
        require(contacts[msg.sender][_contact].exists, "Contact does not exist");
        require(!_isAuthorizedContact(_vaultId, _contact), "Contact already authorized");

        vaults[_vaultId].authorizedContacts.push(_contact);
        
        // Add vault to contact's authorized vaults list
        contacts[msg.sender][_contact].authorizedVaults.push(_vaultId);
        
        // Add vault details to contact's vault details mapping
        Vault storage vault = vaults[_vaultId];
        ContactVaultDetails memory newDetail = ContactVaultDetails({
            vaultId: _vaultId,
            vaultName: vault.name,
            vaultOwner: vault.owner,
            isReleased: vault.isReleased,
            cypherIv: vault.cypherIv,
            encryptionKey: vault.encryptionKey,
            fileIds: vault.fileIds
        });
        contactVaultDetails[_contact].push(newDetail);
        
        emit VaultContactAuthorized(_vaultId, _contact);
    }

    /**
     * @dev Release a vault (called when owner is deceased)
     */
    function releaseVault(uint256 _vaultId) external onlyVaultAuthorized(_vaultId) {
        require(!vaults[_vaultId].isReleased, "Vault already released");
        require(owners[vaults[_vaultId].owner].isDeceased, "Owner not deceased");

        vaults[_vaultId].isReleased = true;
        emit VaultReleased(_vaultId, vaults[_vaultId].owner);
    }

    /**
     * @dev Get vault information
     */
    function getVaultInfo(uint256 _vaultId) external view returns (
        uint256 id,
        string memory name,
        address owner,
        bool isReleased,
        string memory cypherIv,
        string memory encryptionKey,
        uint256[] memory fileIds,
        address[] memory authorizedContacts,
        bool exists
    ) {
        Vault storage vault = vaults[_vaultId];
        return (
            vault.id,
            vault.name,
            vault.owner,
            vault.isReleased,
            vault.cypherIv,
            vault.encryptionKey,
            vault.fileIds,
            vault.authorizedContacts,
            vault.exists
        );
    }

    /**
     * @dev Get vault file information
     */
    function getVaultFileInfo(uint256 _vaultId, uint256 _fileId) external view returns (
        string memory originalName,
        string memory mimeType,
        string memory cid,
        string memory uploadDate,
        bool exists
    ) {
        VaultFile storage file = vaultFiles[_vaultId][_fileId];
        return (
            file.originalName,
            file.mimeType,
            file.cid,
            file.uploadDate,
            file.exists
        );
    }

    /**
     * @dev Get vault's authorized contacts
     */
    function getVaultAuthorizedContacts(uint256 _vaultId) external view returns (address[] memory) {
        return vaults[_vaultId].authorizedContacts;
    }

    /**
     * @dev Get owner's vault list
     */
    function getOwnerVaultList(address _owner) external view returns (uint256[] memory) {
        return owners[_owner].vaultList;
    }

    /**
     * @dev Get detailed vault list with all vault information
     */
    function getOwnerVaultListDetails(address _owner) external view returns (
        uint256[] memory vaultIds,
        string[] memory names,
        address[] memory vaultOwners,
        bool[] memory isReleased,
        string[] memory cypherIvs,
        string[] memory encryptionKeys,
        uint256[][] memory fileIds,
        address[][] memory authorizedContacts
    ) {
        uint256[] memory vaultList = owners[_owner].vaultList;
        uint256 length = vaultList.length;
        
        vaultIds = new uint256[](length);
        names = new string[](length);
        vaultOwners = new address[](length);
        isReleased = new bool[](length);
        cypherIvs = new string[](length);
        encryptionKeys = new string[](length);
        fileIds = new uint256[][](length);
        authorizedContacts = new address[][](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 vaultId = vaultList[i];
            Vault storage vault = vaults[vaultId];
            
            vaultIds[i] = vault.id;
            names[i] = vault.name;
            vaultOwners[i] = vault.owner;
            isReleased[i] = vault.isReleased;
            cypherIvs[i] = vault.cypherIv;
            encryptionKeys[i] = vault.encryptionKey;
            fileIds[i] = vault.fileIds;
            authorizedContacts[i] = vault.authorizedContacts;
        }
    }

    /**
     * @dev Check if address is authorized for vault
     */
    function isVaultAuthorized(uint256 _vaultId, address _address) external view returns (bool) {
        return _isAuthorizedContact(_vaultId, _address);
    }

    /**
     * @dev Get vault file list
     */
    function getVaultFileList(uint256 _vaultId) external view returns (uint256[] memory) {
        return vaults[_vaultId].fileIds;
    }

    /**
     * @dev Get contact's vault details
     */
    function getContactVaultDetails(address _contact) external view returns (
        uint256[] memory vaultIds,
        string[] memory vaultNames,
        address[] memory vaultOwners,
        bool[] memory isReleased,
        string[] memory cypherIvs,
        string[] memory encryptionKeys,
        uint256[][] memory fileIds
    ) {
        ContactVaultDetails[] storage details = contactVaultDetails[_contact];
        uint256 length = details.length;
        
        vaultIds = new uint256[](length);
        vaultNames = new string[](length);
        vaultOwners = new address[](length);
        isReleased = new bool[](length);
        cypherIvs = new string[](length);
        encryptionKeys = new string[](length);
        fileIds = new uint256[][](length);
        
        for (uint256 i = 0; i < length; i++) {
            ContactVaultDetails storage detail = details[i];
            vaultIds[i] = detail.vaultId;
            vaultNames[i] = detail.vaultName;
            vaultOwners[i] = detail.vaultOwner;
            isReleased[i] = detail.isReleased;
            cypherIvs[i] = detail.cypherIv;
            encryptionKeys[i] = detail.encryptionKey;
            fileIds[i] = detail.fileIds;
        }
    }
} 