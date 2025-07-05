// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Contact Contract
 * @dev Manages contact data structures for Oasis deployment
 */
contract Contact is Ownable, Pausable {
    
    struct ContactData {
        address address_; // wallet address as identifier
        string firstName;
        string lastName;
        string birthDate;
        string email;
        string phone;
        bool isIdVerified;
        bool hasVotingRight;
        address ownerAddress; // reference to the owner
        uint256 createdAt;
        uint256 updatedAt;
    }

    // State variables
    mapping(address => ContactData) private _contacts;
    mapping(address => bool) private _contactExists;
    mapping(address => address[]) private _ownerContacts; // owner address => contact addresses
    
    // Events
    event ContactCreated(address indexed contactAddress, string firstName, string lastName, address indexed ownerAddress);
    event ContactUpdated(address indexed contactAddress);
    event VotingRightsSet(address indexed contactAddress, bool hasVotingRight);
    event ContactDeleted(address indexed contactAddress);
    event ContactAddedToOwner(address indexed contactAddress, address indexed ownerAddress);
    event ContactRemovedFromOwner(address indexed contactAddress, address indexed ownerAddress);

    // Modifiers
    modifier onlyContactExists(address contactAddress) {
        require(_contactExists[contactAddress], "Contact does not exist");
        _;
    }

    modifier onlyContactOrAuthorized(address contactAddress) {
        require(
            msg.sender == owner() || 
            msg.sender == contactAddress ||
            msg.sender == _contacts[contactAddress].ownerAddress,
            "Not authorized"
        );
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
     * @dev Create a new contact
     * @param firstName First name of the contact
     * @param lastName Last name of the contact
     * @param birthDate Birth date (ISO string format)
     * @param email Email address
     * @param phone Phone number
     * @param ownerAddress Address of the owner who is adding this contact
     */
    function createContact(
        string memory firstName,
        string memory lastName,
        string memory birthDate,
        string memory email,
        string memory phone,
        address ownerAddress
    ) external whenNotPaused returns (address) {
        require(bytes(firstName).length > 0, "First name cannot be empty");
        require(bytes(lastName).length > 0, "Last name cannot be empty");
        require(ownerAddress != address(0), "Invalid owner address");
        require(!_contactExists[msg.sender], "Contact already exists");

        address contactAddress = msg.sender;
        
        ContactData memory newContact = ContactData({
            address_: contactAddress,
            firstName: firstName,
            lastName: lastName,
            birthDate: birthDate,
            email: email,
            phone: phone,
            isIdVerified: false,
            hasVotingRight: true, // Default to true
            ownerAddress: ownerAddress,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        _contacts[contactAddress] = newContact;
        _contactExists[contactAddress] = true;
        _ownerContacts[ownerAddress].push(contactAddress);

        emit ContactCreated(contactAddress, firstName, lastName, ownerAddress);
        emit ContactAddedToOwner(contactAddress, ownerAddress);
        return contactAddress;
    }

    /**
     * @dev Update contact information
     * @param contactAddress Contact address
     * @param firstName New first name
     * @param lastName New last name
     * @param email New email
     * @param phone New phone
     */
    function updateContact(
        address contactAddress,
        string memory firstName,
        string memory lastName,
        string memory email,
        string memory phone
    ) external onlyContactExists(contactAddress) onlyContactOrAuthorized(contactAddress) whenNotPaused {
        require(bytes(firstName).length > 0, "First name cannot be empty");
        require(bytes(lastName).length > 0, "Last name cannot be empty");

        _contacts[contactAddress].firstName = firstName;
        _contacts[contactAddress].lastName = lastName;
        _contacts[contactAddress].email = email;
        _contacts[contactAddress].phone = phone;
        _contacts[contactAddress].updatedAt = block.timestamp;

        emit ContactUpdated(contactAddress);
    }

    /**
     * @dev Set ID verification status
     * @param contactAddress Contact address
     * @param isVerified Verification status
     */
    function setIdVerification(
        address contactAddress,
        bool isVerified
    ) external onlyContactExists(contactAddress) onlyOwner whenNotPaused {
        _contacts[contactAddress].isIdVerified = isVerified;
        _contacts[contactAddress].updatedAt = block.timestamp;
    }

    /**
     * @dev Set voting rights
     * @param contactAddress Contact address
     * @param hasVotingRight Voting rights status
     */
    function setVotingRights(
        address contactAddress,
        bool hasVotingRight
    ) external onlyContactExists(contactAddress) onlyOwner whenNotPaused {
        _contacts[contactAddress].hasVotingRight = hasVotingRight;
        _contacts[contactAddress].updatedAt = block.timestamp;

        emit VotingRightsSet(contactAddress, hasVotingRight);
    }

    /**
     * @dev Get contact data
     * @param contactAddress Contact address
     * @return Complete contact data
     */
    function getContact(address contactAddress) external view onlyContactExists(contactAddress) returns (ContactData memory) {
        return _contacts[contactAddress];
    }

    /**
     * @dev Check if contact exists
     * @param contactAddress Contact address
     * @return True if contact exists
     */
    function contactExists(address contactAddress) external view returns (bool) {
        return _contactExists[contactAddress];
    }

    /**
     * @dev Get contact verification status
     * @param contactAddress Contact address
     * @return Verification status
     */
    function getIdVerification(address contactAddress) external view onlyContactExists(contactAddress) returns (bool) {
        return _contacts[contactAddress].isIdVerified;
    }

    /**
     * @dev Get contact voting rights
     * @param contactAddress Contact address
     * @return Voting rights status
     */
    function getVotingRights(address contactAddress) external view onlyContactExists(contactAddress) returns (bool) {
        return _contacts[contactAddress].hasVotingRight;
    }

    /**
     * @dev Get contact's owner address
     * @param contactAddress Contact address
     * @return Owner address
     */
    function getContactOwner(address contactAddress) external view onlyContactExists(contactAddress) returns (address) {
        return _contacts[contactAddress].ownerAddress;
    }

    /**
     * @dev Get all contacts for an owner
     * @param ownerAddress Owner address
     * @return Array of contact addresses
     */
    function getOwnerContacts(address ownerAddress) external view returns (address[] memory) {
        return _ownerContacts[ownerAddress];
    }

    /**
     * @dev Get owner contacts count
     * @param ownerAddress Owner address
     * @return Number of contacts
     */
    function getOwnerContactsCount(address ownerAddress) external view returns (uint256) {
        return _ownerContacts[ownerAddress].length;
    }

    /**
     * @dev Remove contact from owner (only owner can do this)
     * @param contactAddress Contact address to remove
     */
    function removeContactFromOwner(
        address contactAddress
    ) external onlyContactExists(contactAddress) onlyOwnerOrAuthorized(_contacts[contactAddress].ownerAddress) whenNotPaused {
        address ownerAddress = _contacts[contactAddress].ownerAddress;
        
        // Remove from owner's contact list
        address[] storage contacts = _ownerContacts[ownerAddress];
        for (uint256 i = 0; i < contacts.length; i++) {
            if (contacts[i] == contactAddress) {
                contacts[i] = contacts[contacts.length - 1];
                contacts.pop();
                break;
            }
        }

        emit ContactRemovedFromOwner(contactAddress, ownerAddress);
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