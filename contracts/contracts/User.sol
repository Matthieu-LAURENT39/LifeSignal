// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract User {
    // Custom errors for gas optimization
    error Unauthorized();
    error InvalidAddress();
    error UserNotActive();
    error VaultNotFound();
    error ContactNotFound();
    error DuplicateVault();
    error DuplicateContact();
    error InvalidStatus();
    error DeathDeclarationNotFound();
    error VoteAlreadyExists();
    error VoteNotFound();

    // Status enum
    enum UserStatus {
        ACTIVE,
        VOTING_IN_PROGRESS,
        GRACE_PERIOD,
        DEAD
    }

    // Death declaration struct
    struct DeathDeclaration {
        address declaredBy;
        uint64 declaredAt;
        mapping(address => bool) votes;
        address[] voters;
        bool consensusReached;
        uint64 consensusReachedAt;
    }

    // User data struct
    struct UserData {
        address owner;
        string firstname;
        string lastname;
        string email;
        string birthDate;
        UserStatus status;
        uint64 graceInterval; // in hours
        uint64 createdAt;
        uint64 lastUpdated;
        bool hasVotingRight;
        bool isIdVerified;
    }

    UserData public userData;
    address[] public vaults;
    address[] public contacts;
    DeathDeclaration public deathDeclaration;
    bool public hasDeathDeclaration;

    // Events for better UX
    event VaultAdded(address indexed vault);
    event VaultRemoved(address indexed vault);
    event ContactAdded(address indexed contact);
    event ContactRemoved(address indexed contact);
    event UserStatusChanged(UserStatus status);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event DeathDeclarationCreated(address indexed declaredBy, uint64 declaredAt);
    event VoteCast(address indexed voter, bool voted, uint64 votedAt);
    event ConsensusReached(uint64 consensusReachedAt);
    event UserProfileUpdated(string firstname, string lastname, string email, string birthDate);
    event VotingRightsUpdated(bool hasVotingRight);
    event IdVerificationUpdated(bool isIdVerified);

    constructor(
        string memory _firstname,
        string memory _lastname,
        string memory _email
    ) payable {
        userData.owner = msg.sender;
        userData.firstname = _firstname;
        userData.lastname = _lastname;
        userData.email = _email;
        userData.birthDate = "";
        userData.status = UserStatus.ACTIVE;
        userData.graceInterval = 720 hours; // 30 days in hours
        userData.createdAt = uint64(block.timestamp);
        userData.lastUpdated = userData.createdAt;
        userData.hasVotingRight = true;
        userData.isIdVerified = false;
        hasDeathDeclaration = false;
    }

    // Optimized getters
    function getOwner() external view returns (address) {
        return userData.owner;
    }

    function getFirstname() external view returns (string memory) {
        return userData.firstname;
    }

    function getLastname() external view returns (string memory) {
        return userData.lastname;
    }

    function getEmail() external view returns (string memory) {
        return userData.email;
    }

    function getBirthDate() external view returns (string memory) {
        return userData.birthDate;
    }

    function getStatus() external view returns (UserStatus) {
        return userData.status;
    }

    function getGraceInterval() external view returns (uint64) {
        return userData.graceInterval;
    }

    function getCreatedAt() external view returns (uint64) {
        return userData.createdAt;
    }

    function getLastUpdated() external view returns (uint64) {
        return userData.lastUpdated;
    }

    function getHasVotingRight() external view returns (bool) {
        return userData.hasVotingRight;
    }

    function getIsIdVerified() external view returns (bool) {
        return userData.isIdVerified;
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

    function getContacts() external view returns (address[] memory) {
        return contacts;
    }

    function getContactCount() external view returns (uint256) {
        return contacts.length;
    }

    function getContactAtIndex(uint256 index) external view returns (address) {
        if (index >= contacts.length) revert ContactNotFound();
        return contacts[index];
    }

    function getDeathDeclaration() external view returns (
        address declaredBy,
        uint64 declaredAt,
        address[] memory voters,
        bool consensusReached,
        uint64 consensusReachedAt
    ) {
        if (!hasDeathDeclaration) revert DeathDeclarationNotFound();
        return (
            deathDeclaration.declaredBy,
            deathDeclaration.declaredAt,
            deathDeclaration.voters,
            deathDeclaration.consensusReached,
            deathDeclaration.consensusReachedAt
        );
    }

    function hasVoted(address voter) external view returns (bool) {
        if (!hasDeathDeclaration) revert DeathDeclarationNotFound();
        return deathDeclaration.votes[voter];
    }

    // Optimized setters with access control
    modifier onlyOwner() {
        if (msg.sender != userData.owner) revert Unauthorized();
        _;
    }

    modifier onlyActive() {
        if (userData.status != UserStatus.ACTIVE) revert UserNotActive();
        _;
    }

    modifier onlyContacts() {
        bool isContactFound = false;
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i] == msg.sender) {
                isContactFound = true;
                break;
            }
        }
        if (!isContactFound) revert Unauthorized();
        _;
    }

    modifier onlyVotingContacts() {
        bool isVotingContactFound = false;
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i] == msg.sender) {
                // Check if this contact has voting rights (would need to check their contract)
                isVotingContactFound = true;
                break;
            }
        }
        if (!isVotingContactFound) revert Unauthorized();
        _;
    }

    function setFirstname(string memory _firstname) external onlyOwner onlyActive {
        userData.firstname = _firstname;
        userData.lastUpdated = uint64(block.timestamp);
        emit UserProfileUpdated(_firstname, userData.lastname, userData.email, userData.birthDate);
    }

    function setLastname(string memory _lastname) external onlyOwner onlyActive {
        userData.lastname = _lastname;
        userData.lastUpdated = uint64(block.timestamp);
        emit UserProfileUpdated(userData.firstname, _lastname, userData.email, userData.birthDate);
    }

    function setEmail(string memory _email) external onlyOwner onlyActive {
        userData.email = _email;
        userData.lastUpdated = uint64(block.timestamp);
        emit UserProfileUpdated(userData.firstname, userData.lastname, _email, userData.birthDate);
    }

    function setBirthDate(string memory _birthDate) external onlyOwner onlyActive {
        userData.birthDate = _birthDate;
        userData.lastUpdated = uint64(block.timestamp);
        emit UserProfileUpdated(userData.firstname, userData.lastname, userData.email, _birthDate);
    }

    function setStatus(UserStatus _status) external onlyOwner {
        userData.status = _status;
        userData.lastUpdated = uint64(block.timestamp);
        emit UserStatusChanged(_status);
    }

    function setGraceInterval(uint64 _graceInterval) external onlyOwner onlyActive {
        userData.graceInterval = _graceInterval;
        userData.lastUpdated = uint64(block.timestamp);
    }

    function setHasVotingRight(bool _hasVotingRight) external onlyOwner onlyActive {
        userData.hasVotingRight = _hasVotingRight;
        userData.lastUpdated = uint64(block.timestamp);
        emit VotingRightsUpdated(_hasVotingRight);
    }

    function setIsIdVerified(bool _isIdVerified) external onlyOwner onlyActive {
        userData.isIdVerified = _isIdVerified;
        userData.lastUpdated = uint64(block.timestamp);
        emit IdVerificationUpdated(_isIdVerified);
    }

    function setOwner(address _newOwner) external onlyOwner onlyActive {
        if (_newOwner == address(0)) revert InvalidAddress();
        
        address oldOwner = userData.owner;
        userData.owner = _newOwner;
        userData.lastUpdated = uint64(block.timestamp);
        
        emit OwnerChanged(oldOwner, _newOwner);
    }

    function addVault(address _vault) external onlyOwner onlyActive {
        if (_vault == address(0)) revert InvalidAddress();
        
        // Check for duplicates
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i] == _vault) revert DuplicateVault();
        }
        
        vaults.push(_vault);
        userData.lastUpdated = uint64(block.timestamp);
        
        emit VaultAdded(_vault);
    }

    function removeVault(address _vault) external onlyOwner onlyActive {
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

    function addContact(address _contact) external onlyOwner onlyActive {
        if (_contact == address(0)) revert InvalidAddress();
        
        // Check for duplicates
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i] == _contact) revert DuplicateContact();
        }
        
        contacts.push(_contact);
        userData.lastUpdated = uint64(block.timestamp);
        
        emit ContactAdded(_contact);
    }

    function removeContact(address _contact) external onlyOwner onlyActive {
        if (_contact == address(0)) revert InvalidAddress();
        
        uint256 contactIndex = type(uint256).max;
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i] == _contact) {
                contactIndex = i;
                break;
            }
        }
        
        if (contactIndex == type(uint256).max) revert ContactNotFound();
        
        // Gas efficient removal: swap with last element and pop
        contacts[contactIndex] = contacts[contacts.length - 1];
        contacts.pop();
        
        userData.lastUpdated = uint64(block.timestamp);
        
        emit ContactRemoved(_contact);
    }

    function createDeathDeclaration() external onlyContacts {
        if (hasDeathDeclaration) revert DeathDeclarationNotFound(); // Already exists
        
        deathDeclaration.declaredBy = msg.sender;
        deathDeclaration.declaredAt = uint64(block.timestamp);
        deathDeclaration.consensusReached = false;
        deathDeclaration.consensusReachedAt = 0;
        
        hasDeathDeclaration = true;
        userData.status = UserStatus.VOTING_IN_PROGRESS;
        userData.lastUpdated = uint64(block.timestamp);
        
        emit DeathDeclarationCreated(msg.sender, uint64(block.timestamp));
    }

    function voteOnDeathDeclaration(bool _voted) external onlyContacts {
        if (!hasDeathDeclaration) revert DeathDeclarationNotFound();
        if (deathDeclaration.votes[msg.sender]) revert VoteAlreadyExists();
        
        deathDeclaration.votes[msg.sender] = _voted;
        deathDeclaration.voters.push(msg.sender);
        
        emit VoteCast(msg.sender, _voted, uint64(block.timestamp));
        
        // Check for consensus (simple majority)
        uint256 yesVotes = 0;
        uint256 totalVotes = deathDeclaration.voters.length;
        
        for (uint256 i = 0; i < totalVotes; i++) {
            if (deathDeclaration.votes[deathDeclaration.voters[i]]) {
                yesVotes++;
            }
        }
        
        if (yesVotes > totalVotes / 2) {
            deathDeclaration.consensusReached = true;
            deathDeclaration.consensusReachedAt = uint64(block.timestamp);
            userData.status = UserStatus.GRACE_PERIOD;
            
            emit ConsensusReached(uint64(block.timestamp));
        }
    }

    function finalizeDeathDeclaration() external onlyContacts {
        if (!hasDeathDeclaration) revert DeathDeclarationNotFound();
        if (!deathDeclaration.consensusReached) revert DeathDeclarationNotFound();
        
        uint64 gracePeriodEnd = deathDeclaration.consensusReachedAt + userData.graceInterval;
        if (block.timestamp < gracePeriodEnd) revert DeathDeclarationNotFound();
        
        userData.status = UserStatus.DEAD;
        userData.lastUpdated = uint64(block.timestamp);
        
        emit UserStatusChanged(UserStatus.DEAD);
    }

    // View function to get basic user data
    function getBasicUserData() external view returns (
        address owner,
        string memory firstname,
        string memory lastname,
        string memory email,
        string memory birthDate,
        UserStatus status,
        uint64 graceInterval,
        uint64 createdAt,
        uint64 lastUpdated,
        bool hasVotingRight,
        bool isIdVerified
    ) {
        return (
            userData.owner,
            userData.firstname,
            userData.lastname,
            userData.email,
            userData.birthDate,
            userData.status,
            userData.graceInterval,
            userData.createdAt,
            userData.lastUpdated,
            userData.hasVotingRight,
            userData.isIdVerified
        );
    }

    // View function to get vaults and contacts
    function getVaultsAndContacts() external view returns (
        address[] memory userVaults,
        address[] memory userContacts
    ) {
        return (vaults, contacts);
    }

    // View function to get death declaration status
    function getDeathDeclarationStatus() external view returns (bool hasDeathDecl) {
        return hasDeathDeclaration;
    }

    // View function to get all user data in one call (simplified)
    function getUserData() external view returns (
        address owner,
        string memory firstname,
        string memory lastname,
        string memory email,
        string memory birthDate,
        UserStatus status,
        uint64 graceInterval,
        uint64 createdAt,
        uint64 lastUpdated,
        bool hasVotingRight,
        bool isIdVerified,
        address[] memory userVaults,
        address[] memory userContacts,
        bool hasDeathDecl
    ) {
        return (
            userData.owner,
            userData.firstname,
            userData.lastname,
            userData.email,
            userData.birthDate,
            userData.status,
            userData.graceInterval,
            userData.createdAt,
            userData.lastUpdated,
            userData.hasVotingRight,
            userData.isIdVerified,
            vaults,
            contacts,
            hasDeathDeclaration
        );
    }

    // Check if address is a vault
    function isVault(address _vault) external view returns (bool) {
        for (uint256 i = 0; i < vaults.length; i++) {
            if (vaults[i] == _vault) return true;
        }
        return false;
    }

    // Check if address is a contact
    function isContact(address _contact) external view returns (bool) {
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i] == _contact) return true;
        }
        return false;
    }
}
