// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Owner Contract
 * @dev Manages owner data structures and lifecycle for Oasis deployment
 */
contract Owner is Ownable, Pausable {

    // Enums
    enum OwnerStatus {
        ACTIVE,
        VOTING_IN_PROGRESS,
        GRACE_PERIOD,
        DEAD
    }

    // Structs
    struct DeathVote {
        string contactId;
        bool voted;
        uint256 votedAt;
    }

    struct DeathDeclaration {
        string declaredBy;
        uint256 declaredAt;
        DeathVote[] votes;
        bool consensusReached;
        uint256 consensusReachedAt;
    }

    struct OwnerData {
        address address_; // wallet address as identifier
        string firstName;
        string lastName;
        string birthDate;
        string email;
        string phone;
        bool isIdVerified;
        OwnerStatus status;
        uint256 graceInterval; // in days
        bool hasVotingRight;
        DeathDeclaration deathDeclaration;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // State variables
    mapping(address => OwnerData) private _owners;
    mapping(address => bool) private _ownerExists;
    
    // Events
    event OwnerCreated(address indexed ownerAddress, string firstName, string lastName);
    event OwnerUpdated(address indexed ownerAddress);
    event OwnerStatusChanged(address indexed ownerAddress, OwnerStatus oldStatus, OwnerStatus newStatus);
    event DeathDeclarationCreated(address indexed ownerAddress, string declaredBy);
    event DeathVoteCast(address indexed ownerAddress, string contactId, bool voted);
    event DeathConsensusReached(address indexed ownerAddress, bool consensusReached);
    event OwnerDeleted(address indexed ownerAddress);

    // Modifiers
    modifier onlyOwnerExists(address ownerAddress) {
        require(_ownerExists[ownerAddress], "Owner does not exist");
        _;
    }

    modifier onlyOwnerOrAuthorized(address ownerAddress) {
        require(
            msg.sender == owner() || 
            msg.sender == ownerAddress,
            "Not authorized"
        );
        _;
    }

    // Constructor
    constructor() {
        // No initialization needed
    }

    /**
     * @dev Create a new owner
     * @param firstName First name of the owner
     * @param lastName Last name of the owner
     * @param birthDate Birth date (ISO string format)
     * @param email Email address
     * @param phone Phone number
     * @param graceInterval Grace interval in days
     */
    function createOwner(
        string memory firstName,
        string memory lastName,
        string memory birthDate,
        string memory email,
        string memory phone,
        uint256 graceInterval
    ) external whenNotPaused returns (address) {
        require(bytes(firstName).length > 0, "First name cannot be empty");
        require(bytes(lastName).length > 0, "Last name cannot be empty");
        require(graceInterval > 0, "Grace interval must be greater than 0");
        require(!_ownerExists[msg.sender], "Owner already exists");

        address ownerAddress = msg.sender;
        
        OwnerData memory newOwner = OwnerData({
            address_: ownerAddress,
            firstName: firstName,
            lastName: lastName,
            birthDate: birthDate,
            email: email,
            phone: phone,
            isIdVerified: false,
            status: OwnerStatus.ACTIVE,
            graceInterval: graceInterval,
            hasVotingRight: true,
            deathDeclaration: DeathDeclaration({
                declaredBy: "",
                declaredAt: 0,
                votes: new DeathVote[](0),
                consensusReached: false,
                consensusReachedAt: 0
            }),
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        _owners[ownerAddress] = newOwner;
        _ownerExists[ownerAddress] = true;

        emit OwnerCreated(ownerAddress, firstName, lastName);
        return ownerAddress;
    }

    /**
     * @dev Update owner information
     * @param ownerAddress Owner address
     * @param firstName New first name
     * @param lastName New last name
     * @param email New email
     * @param phone New phone
     */
    function updateOwner(
        address ownerAddress,
        string memory firstName,
        string memory lastName,
        string memory email,
        string memory phone
    ) external onlyOwnerExists(ownerAddress) onlyOwnerOrAuthorized(ownerAddress) whenNotPaused {
        require(bytes(firstName).length > 0, "First name cannot be empty");
        require(bytes(lastName).length > 0, "Last name cannot be empty");

        _owners[ownerAddress].firstName = firstName;
        _owners[ownerAddress].lastName = lastName;
        _owners[ownerAddress].email = email;
        _owners[ownerAddress].phone = phone;
        _owners[ownerAddress].updatedAt = block.timestamp;

        emit OwnerUpdated(ownerAddress);
    }

    /**
     * @dev Update owner status
     * @param ownerAddress Owner address
     * @param newStatus New status
     */
    function updateOwnerStatus(
        address ownerAddress,
        OwnerStatus newStatus
    ) external onlyOwnerExists(ownerAddress) onlyOwnerOrAuthorized(ownerAddress) whenNotPaused {
        OwnerStatus oldStatus = _owners[ownerAddress].status;
        _owners[ownerAddress].status = newStatus;
        _owners[ownerAddress].updatedAt = block.timestamp;

        emit OwnerStatusChanged(ownerAddress, oldStatus, newStatus);
    }

    /**
     * @dev Set ID verification status
     * @param ownerAddress Owner address
     * @param isVerified Verification status
     */
    function setIdVerification(
        address ownerAddress,
        bool isVerified
    ) external onlyOwnerExists(ownerAddress) onlyOwner whenNotPaused {
        _owners[ownerAddress].isIdVerified = isVerified;
        _owners[ownerAddress].updatedAt = block.timestamp;
    }

    /**
     * @dev Set voting rights
     * @param ownerAddress Owner address
     * @param hasVotingRight Voting rights status
     */
    function setVotingRights(
        address ownerAddress,
        bool hasVotingRight
    ) external onlyOwnerExists(ownerAddress) onlyOwner whenNotPaused {
        _owners[ownerAddress].hasVotingRight = hasVotingRight;
        _owners[ownerAddress].updatedAt = block.timestamp;
    }

    /**
     * @dev Update grace interval
     * @param ownerAddress Owner address
     * @param graceInterval New grace interval in days
     */
    function updateGraceInterval(
        address ownerAddress,
        uint256 graceInterval
    ) external onlyOwnerExists(ownerAddress) onlyOwnerOrAuthorized(ownerAddress) whenNotPaused {
        require(graceInterval > 0, "Grace interval must be greater than 0");
        _owners[ownerAddress].graceInterval = graceInterval;
        _owners[ownerAddress].updatedAt = block.timestamp;
    }

    /**
     * @dev Create death declaration
     * @param ownerAddress Owner address
     * @param declaredBy Declarer ID
     */
    function createDeathDeclaration(
        address ownerAddress,
        string memory declaredBy
    ) external onlyOwnerExists(ownerAddress) whenNotPaused {
        require(_owners[ownerAddress].status != OwnerStatus.DEAD, "Owner is already dead");
        
        _owners[ownerAddress].deathDeclaration.declaredBy = declaredBy;
        _owners[ownerAddress].deathDeclaration.declaredAt = block.timestamp;
        _owners[ownerAddress].status = OwnerStatus.VOTING_IN_PROGRESS;
        _owners[ownerAddress].updatedAt = block.timestamp;

        emit DeathDeclarationCreated(ownerAddress, declaredBy);
        emit OwnerStatusChanged(ownerAddress, OwnerStatus.ACTIVE, OwnerStatus.VOTING_IN_PROGRESS);
    }

    /**
     * @dev Cast death vote
     * @param ownerAddress Owner address
     * @param contactId Contact ID
     * @param voted Vote (true for death confirmed, false for death denied)
     */
    function castDeathVote(
        address ownerAddress,
        string memory contactId,
        bool voted
    ) external onlyOwnerExists(ownerAddress) whenNotPaused {
        require(_owners[ownerAddress].status == OwnerStatus.VOTING_IN_PROGRESS, "Not in voting phase");
        
        DeathVote memory newVote = DeathVote({
            contactId: contactId,
            voted: voted,
            votedAt: block.timestamp
        });

        _owners[ownerAddress].deathDeclaration.votes.push(newVote);
        _owners[ownerAddress].updatedAt = block.timestamp;

        emit DeathVoteCast(ownerAddress, contactId, voted);
    }

    /**
     * @dev Process death consensus
     * @param ownerAddress Owner address
     * @param consensusReached Whether consensus was reached
     */
    function processDeathConsensus(
        address ownerAddress,
        bool consensusReached
    ) external onlyOwnerExists(ownerAddress) onlyOwner whenNotPaused {
        require(_owners[ownerAddress].status == OwnerStatus.VOTING_IN_PROGRESS, "Not in voting phase");
        
        _owners[ownerAddress].deathDeclaration.consensusReached = consensusReached;
        _owners[ownerAddress].deathDeclaration.consensusReachedAt = block.timestamp;
        
        if (consensusReached) {
            _owners[ownerAddress].status = OwnerStatus.GRACE_PERIOD;
            emit OwnerStatusChanged(ownerAddress, OwnerStatus.VOTING_IN_PROGRESS, OwnerStatus.GRACE_PERIOD);
        } else {
            _owners[ownerAddress].status = OwnerStatus.ACTIVE;
            emit OwnerStatusChanged(ownerAddress, OwnerStatus.VOTING_IN_PROGRESS, OwnerStatus.ACTIVE);
        }

        _owners[ownerAddress].updatedAt = block.timestamp;
        emit DeathConsensusReached(ownerAddress, consensusReached);
    }

    /**
     * @dev Mark owner as dead (after grace period)
     * @param ownerAddress Owner address
     */
    function markAsDead(
        address ownerAddress
    ) external onlyOwnerExists(ownerAddress) onlyOwner whenNotPaused {
        require(_owners[ownerAddress].status == OwnerStatus.GRACE_PERIOD, "Not in grace period");
        
        _owners[ownerAddress].status = OwnerStatus.DEAD;
        _owners[ownerAddress].updatedAt = block.timestamp;

        emit OwnerStatusChanged(ownerAddress, OwnerStatus.GRACE_PERIOD, OwnerStatus.DEAD);
    }

    /**
     * @dev Get owner data
     * @param ownerAddress Owner address
     * @return Complete owner data
     */
    function getOwner(address ownerAddress) external view onlyOwnerExists(ownerAddress) returns (OwnerData memory) {
        return _owners[ownerAddress];
    }

    /**
     * @dev Check if owner exists
     * @param ownerAddress Owner address
     * @return True if owner exists
     */
    function ownerExists(address ownerAddress) external view returns (bool) {
        return _ownerExists[ownerAddress];
    }

    /**
     * @dev Get owner status
     * @param ownerAddress Owner address
     * @return Owner status
     */
    function getOwnerStatus(address ownerAddress) external view onlyOwnerExists(ownerAddress) returns (OwnerStatus) {
        return _owners[ownerAddress].status;
    }

    /**
     * @dev Get death declaration
     * @param ownerAddress Owner address
     * @return Death declaration data
     */
    function getDeathDeclaration(address ownerAddress) external view onlyOwnerExists(ownerAddress) returns (DeathDeclaration memory) {
        return _owners[ownerAddress].deathDeclaration;
    }

    /**
     * @dev Get death votes count
     * @param ownerAddress Owner address
     * @return Number of votes
     */
    function getDeathVotesCount(address ownerAddress) external view onlyOwnerExists(ownerAddress) returns (uint256) {
        return _owners[ownerAddress].deathDeclaration.votes.length;
    }

    /**
     * @dev Get death vote by index
     * @param ownerAddress Owner address
     * @param index Vote index
     * @return Death vote data
     */
    function getDeathVote(address ownerAddress, uint256 index) external view onlyOwnerExists(ownerAddress) returns (DeathVote memory) {
        require(index < _owners[ownerAddress].deathDeclaration.votes.length, "Vote index out of bounds");
        return _owners[ownerAddress].deathDeclaration.votes[index];
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