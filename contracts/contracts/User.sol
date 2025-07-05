// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title User Contract
 * @dev Manages user data structures for Oasis deployment
 */
contract User is Ownable, Pausable {
    
    struct UserData {
        address address_; // wallet address as identifier
        string firstName;
        string lastName;
        string birthDate;
        string email;
        string phone;
        bool isIdVerified;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // State variables
    mapping(address => UserData) private _users;
    mapping(address => bool) private _userExists;
    
    // Events
    event UserCreated(address indexed userAddress, string firstName, string lastName);
    event UserUpdated(address indexed userAddress);
    event IdVerificationSet(address indexed userAddress, bool isVerified);
    event UserDeleted(address indexed userAddress);

    // Modifiers
    modifier onlyUserExists(address userAddress) {
        require(_userExists[userAddress], "User does not exist");
        _;
    }

    modifier onlyUserOrAuthorized(address userAddress) {
        require(
            msg.sender == owner() || 
            msg.sender == userAddress,
            "Not authorized"
        );
        _;
    }

    // Constructor
    constructor() {
        // No initialization needed
    }

    /**
     * @dev Create a new user
     * @param firstName First name of the user
     * @param lastName Last name of the user
     * @param birthDate Birth date (ISO string format)
     * @param email Email address
     * @param phone Phone number
     */
    function createUser(
        string memory firstName,
        string memory lastName,
        string memory birthDate,
        string memory email,
        string memory phone
    ) external whenNotPaused returns (address) {
        require(bytes(firstName).length > 0, "First name cannot be empty");
        require(bytes(lastName).length > 0, "Last name cannot be empty");
        require(!_userExists[msg.sender], "User already exists");

        address userAddress = msg.sender;
        
        UserData memory newUser = UserData({
            address_: userAddress,
            firstName: firstName,
            lastName: lastName,
            birthDate: birthDate,
            email: email,
            phone: phone,
            isIdVerified: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        _users[userAddress] = newUser;
        _userExists[userAddress] = true;

        emit UserCreated(userAddress, firstName, lastName);
        return userAddress;
    }

    /**
     * @dev Update user information
     * @param userAddress User address
     * @param firstName New first name
     * @param lastName New last name
     * @param email New email
     * @param phone New phone
     */
    function updateUser(
        address userAddress,
        string memory firstName,
        string memory lastName,
        string memory email,
        string memory phone
    ) external onlyUserExists(userAddress) onlyUserOrAuthorized(userAddress) whenNotPaused {
        require(bytes(firstName).length > 0, "First name cannot be empty");
        require(bytes(lastName).length > 0, "Last name cannot be empty");

        _users[userAddress].firstName = firstName;
        _users[userAddress].lastName = lastName;
        _users[userAddress].email = email;
        _users[userAddress].phone = phone;
        _users[userAddress].updatedAt = block.timestamp;

        emit UserUpdated(userAddress);
    }

    /**
     * @dev Set ID verification status
     * @param userAddress User address
     * @param isVerified Verification status
     */
    function setIdVerification(
        address userAddress,
        bool isVerified
    ) external onlyUserExists(userAddress) onlyOwner whenNotPaused {
        _users[userAddress].isIdVerified = isVerified;
        _users[userAddress].updatedAt = block.timestamp;

        emit IdVerificationSet(userAddress, isVerified);
    }

    /**
     * @dev Get user data
     * @param userAddress User address
     * @return Complete user data
     */
    function getUser(address userAddress) external view onlyUserExists(userAddress) returns (UserData memory) {
        return _users[userAddress];
    }

    /**
     * @dev Check if user exists
     * @param userAddress User address
     * @return True if user exists
     */
    function userExists(address userAddress) external view returns (bool) {
        return _userExists[userAddress];
    }

    /**
     * @dev Get user verification status
     * @param userAddress User address
     * @return Verification status
     */
    function getIdVerification(address userAddress) external view onlyUserExists(userAddress) returns (bool) {
        return _users[userAddress].isIdVerified;
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