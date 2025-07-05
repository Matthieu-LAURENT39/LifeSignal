// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/**
 * @title GracePeriodAutomation
 * @dev Chainlink automation contract for Sepolia that coordinates with Oasis Sapphire via relay
 */
contract GracePeriodAutomation is AutomationCompatibleInterface {
    
    // Relay address that can execute cross-chain operations
    address public relayAddress;
    
    // Mapping to track grace period start times for each owner
    mapping(address => uint256) public gracePeriodStart;
    
    // Mapping to track if owner has pinged during grace period
    mapping(address => bool) public hasPinged;
    
    // Mapping to track if grace period has been processed for an owner
    mapping(address => bool) public processedGracePeriod;
    
    // Mapping to store owner data from Sapphire (cached for automation)
    mapping(address => OwnerData) public ownerDataCache;
    
    // Events for relay to listen to
    event GracePeriodStarted(address indexed ownerAddress, uint256 startTime, uint256 graceInterval);
    event OwnerPinged(address indexed ownerAddress, uint256 pingTime);
    event GracePeriodProcessed(address indexed ownerAddress, bool isDead, uint256 processTime);
    event OwnerDataUpdated(address indexed ownerAddress, uint256 graceInterval, bool isDeceased);
    event RelayAddressUpdated(address indexed oldRelay, address indexed newRelay);
    
    struct OwnerData {
        uint256 graceInterval;
        bool isDeceased;
        bool exists;
        uint256 lastUpdate;
    }
    
    // Modifiers
    modifier onlyRelay() {
        require(msg.sender == relayAddress, "Only relay can call this function");
        _;
    }
    
    constructor(address _relayAddress) {
        relayAddress = _relayAddress;
    }
    
    /**
     * @dev Update relay address (only current relay can update)
     */
    function updateRelayAddress(address _newRelayAddress) external onlyRelay {
        address oldRelay = relayAddress;
        relayAddress = _newRelayAddress;
        emit RelayAddressUpdated(oldRelay, _newRelayAddress);
    }
    
    /**
     * @dev Update owner data from Sapphire (called by relay)
     */
    function updateOwnerData(
        address ownerAddress,
        uint256 graceInterval,
        bool isDeceased,
        bool exists
    ) external onlyRelay {
        ownerDataCache[ownerAddress] = OwnerData({
            graceInterval: graceInterval,
            isDeceased: isDeceased,
            exists: exists,
            lastUpdate: block.timestamp
        });
        
        emit OwnerDataUpdated(ownerAddress, graceInterval, isDeceased);
    }
    
    /**
     * @dev Start grace period for an owner (called by relay after death declaration consensus)
     */
    function startGracePeriod(address ownerAddress) external onlyRelay {
        require(ownerDataCache[ownerAddress].exists, "Owner does not exist");
        require(!ownerDataCache[ownerAddress].isDeceased, "Owner is already deceased");
        require(gracePeriodStart[ownerAddress] == 0, "Grace period already started");
        
        gracePeriodStart[ownerAddress] = block.timestamp;
        hasPinged[ownerAddress] = false;
        processedGracePeriod[ownerAddress] = false;
        
        emit GracePeriodStarted(ownerAddress, block.timestamp, ownerDataCache[ownerAddress].graceInterval);
    }
    
    /**
     * @dev Record owner ping (called by relay when owner sends heartbeat on Sapphire)
     */
    function recordPing(address ownerAddress) external onlyRelay {
        require(ownerDataCache[ownerAddress].exists, "Owner does not exist");
        require(!ownerDataCache[ownerAddress].isDeceased, "Owner is already deceased");
        require(gracePeriodStart[ownerAddress] > 0, "Grace period not started");
        require(!processedGracePeriod[ownerAddress], "Grace period already processed");
        
        hasPinged[ownerAddress] = true;
        
        emit OwnerPinged(ownerAddress, block.timestamp);
    }
    
    /**
     * @dev Check if upkeep is needed
     * @param checkData Additional data for the check (owner address)
     * @return upkeepNeeded Whether upkeep is needed
     * @return performData Data to pass to performUpkeep
     */
    function checkUpkeep(bytes calldata checkData) external view override returns (bool upkeepNeeded, bytes memory performData) {
        if (checkData.length == 0) {
            return (false, "");
        }
        
        address ownerAddress = abi.decode(checkData, (address));
        
        // Check if owner exists and is not deceased
        OwnerData memory ownerData = ownerDataCache[ownerAddress];
        if (!ownerData.exists || ownerData.isDeceased) {
            return (false, "");
        }
        
        // Check if grace period has been started
        if (gracePeriodStart[ownerAddress] == 0) {
            return (false, "");
        }
        
        // Check if grace period has already been processed
        if (processedGracePeriod[ownerAddress]) {
            return (false, "");
        }
        
        // Check if grace period has ended
        uint256 graceEndTime = gracePeriodStart[ownerAddress] + ownerData.graceInterval;
        if (block.timestamp >= graceEndTime) {
            return (true, checkData);
        }
        
        return (false, "");
    }
    
    /**
     * @dev Perform the upkeep
     * @param performData Data from checkUpkeep (owner address)
     */
    function performUpkeep(bytes calldata performData) external override {
        address ownerAddress = abi.decode(performData, (address));
        
        // Verify conditions again
        OwnerData memory ownerData = ownerDataCache[ownerAddress];
        require(ownerData.exists, "Owner does not exist");
        require(!ownerData.isDeceased, "Owner is already deceased");
        require(gracePeriodStart[ownerAddress] > 0, "Grace period not started");
        require(!processedGracePeriod[ownerAddress], "Grace period already processed");
        
        uint256 graceEndTime = gracePeriodStart[ownerAddress] + ownerData.graceInterval;
        require(block.timestamp >= graceEndTime, "Grace period not yet over");
        
        // Mark as processed
        processedGracePeriod[ownerAddress] = true;
        
        // Determine if owner is dead based on ping status
        bool isDead = !hasPinged[ownerAddress];
        
        emit GracePeriodProcessed(ownerAddress, isDead, block.timestamp);
    }

    
    /**
     * @dev Check if grace period has ended for an owner
     */
    function checkGracePeriodEnd(address ownerAddress) external view returns (bool hasEnded, uint256 endTime) {
        if (gracePeriodStart[ownerAddress] == 0) {
            return (false, 0);
        }
        
        OwnerData memory ownerData = ownerDataCache[ownerAddress];
        uint256 graceEndTime = gracePeriodStart[ownerAddress] + ownerData.graceInterval;
        
        return (block.timestamp >= graceEndTime, graceEndTime);
    }
    
    /**
     * @dev Get owner data from cache
     */
    function getOwnerData(address ownerAddress) external view returns (
        uint256 graceInterval,
        bool isDeceased,
        bool exists,
        uint256 lastUpdate
    ) {
        OwnerData memory ownerData = ownerDataCache[ownerAddress];
        return (
            ownerData.graceInterval,
            ownerData.isDeceased,
            ownerData.exists,
            ownerData.lastUpdate
        );
    }
} 