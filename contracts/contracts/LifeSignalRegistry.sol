// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

/**
 * @title LifeSignalRegistry
 * @dev Manages owner registration, contacts, and death declarations with privacy features
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
    }

    struct Contact {
        bool hasVotingRight;
        bool isVerified;
        bool exists;
    }

    struct DeathDeclaration {
        address initiator;
        uint256 startTime;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 totalVotingContacts;
        bool isActive;
        bool consensusReached;
        mapping(address => bool) hasVoted;
        mapping(address => bool) vote; // true = for death, false = against
    }

    // State variables
    mapping(address => Owner) private owners;
    mapping(address => mapping(address => Contact)) private contacts; // owner => contact => Contact
    mapping(address => DeathDeclaration) private deathDeclarations;
    
    // Events
    event OwnerRegistered(address indexed owner, string firstName, string lastName);
    event ContactAdded(address indexed owner, address indexed contact, bool hasVotingRight);
    event ContactVerified(address indexed owner, address indexed contact);
    event HeartbeatSent(address indexed owner, uint256 timestamp);
    event DeathDeclared(address indexed owner, address indexed declaredBy, uint256 timestamp);
    event VoteCast(address indexed owner, address indexed voter, bool vote);
    event ConsensusReached(address indexed owner, bool isDeceased, uint256 timestamp);

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
        require(contacts[owner][msg.sender].isVerified, "Contact not verified");
        require(contacts[owner][msg.sender].hasVotingRight, "No voting rights");
        _;
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
            contactList: new address[](0)
        });

        emit OwnerRegistered(msg.sender, _firstName, _lastName);
    }

    /**
     * @dev Add a contact to the owner's list
     */
    function addContact(
        address _contact,
        bool _hasVotingRight
    ) external onlyRegistered {
        require(_contact != msg.sender, "Cannot add yourself as contact");
        require(!contacts[msg.sender][_contact].exists, "Contact already exists");

        contacts[msg.sender][_contact] = Contact({
            hasVotingRight: _hasVotingRight,
            isVerified: false,
            exists: true
        });

        owners[msg.sender].contactList.push(_contact);
        emit ContactAdded(msg.sender, _contact, _hasVotingRight);
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
     * @dev Send heartbeat to prove owner is alive
     */
    function sendHeartbeat() external onlyRegistered {
        require(!owners[msg.sender].isDeceased, "Owner is already deceased");
        
        owners[msg.sender].lastHeartbeat = block.timestamp;
        
        // Cancel any active death declaration
        if (deathDeclarations[msg.sender].isActive) {
            deathDeclarations[msg.sender].isActive = false;
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
            if (contacts[_owner][contactAddr].isVerified && 
                contacts[_owner][contactAddr].hasVotingRight) {
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
     * @dev Internal function to check if consensus is reached
     */
    function _checkConsensus(address _owner) internal {
        DeathDeclaration storage declaration = deathDeclarations[_owner];
        // uint256 totalVotes = declaration.votesFor + declaration.votesAgainst;
        uint256 requiredVotes = (declaration.totalVotingContacts * 50) / 100 + 1; // Majority

        if (declaration.votesFor >= requiredVotes) {
            // Death confirmed
            owners[_owner].isDeceased = true;
            declaration.isActive = false;
            declaration.consensusReached = true;
            emit ConsensusReached(_owner, true, block.timestamp);
        } else if (declaration.votesAgainst >= requiredVotes) {
            // Death rejected
            declaration.isActive = false;
            declaration.consensusReached = true;
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
        bool hasVotingRight,
        bool isVerified,
        bool exists
    ) {
        Contact storage contact = contacts[_owner][_contact];
        return (
            contact.hasVotingRight,
            contact.isVerified,
            contact.exists
        );
    }

    function getDeathDeclarationStatus(address _owner) external view returns (
        bool isActive,
        uint256 startTime,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 totalVotingContacts,
        bool consensusReached
    ) {
        DeathDeclaration storage declaration = deathDeclarations[_owner];
        return (
            declaration.isActive,
            declaration.startTime,
            declaration.votesFor,
            declaration.votesAgainst,
            declaration.totalVotingContacts,
            declaration.consensusReached
        );
    }

    function getContactList(address _owner) external view returns (address[] memory) {
        return owners[_owner].contactList;
    }

    function hasVoted(address _owner, address _voter) external view returns (bool) {
        return deathDeclarations[_owner].hasVoted[_voter];
    }

    function getVote(address _owner, address _voter) external view returns (bool) {
        require(deathDeclarations[_owner].hasVoted[_voter], "Voter has not voted");
        return deathDeclarations[_owner].vote[_voter];
    }
} 