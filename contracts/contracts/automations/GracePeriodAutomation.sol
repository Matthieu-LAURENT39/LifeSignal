// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "../Owner.sol";

contract GracePeriodAutomation is AutomationCompatibleInterface {
    Owner public ownerContract;
    
    // Mapping to track grace period start times for each owner
    mapping(address => uint256) public gracePeriodStart;
    
    // Mapping to track if owner has pinged during grace period
    mapping(address => bool) public hasPinged;
    
    // Mapping to track if grace period has been processed for an owner
    mapping(address => bool) public processedGracePeriod;
    
    // Events
    event GracePeriodStarted(address indexed ownerAddress, uint256 startTime);
    event OwnerPinged(address indexed ownerAddress, uint256 pingTime);
    event GracePeriodProcessed(address indexed ownerAddress, bool isDead, uint256 processTime);
    
    constructor(address _ownerContract) {
        ownerContract = Owner(_ownerContract);
    }
    
    /**
     * @dev Start grace period for an owner
     * @param ownerAddress The owner's address
     */
    function startGracePeriod(address ownerAddress) external {
        require(ownerContract.ownerExists(ownerAddress), "Owner does not exist");
        require(ownerContract.getOwnerStatus(ownerAddress) == Owner.OwnerStatus.GRACE_PERIOD, "Owner not in grace period");
        require(gracePeriodStart[ownerAddress] == 0, "Grace period already started");
        
        gracePeriodStart[ownerAddress] = block.timestamp;
        hasPinged[ownerAddress] = false;
        processedGracePeriod[ownerAddress] = false;
        
        emit GracePeriodStarted(ownerAddress, block.timestamp);
    }
    
    /**
     * @dev Allow owner to ping during grace period
     * @param ownerAddress The owner's address
     */
    function ping(address ownerAddress) external {
        require(msg.sender == ownerAddress, "Only owner can ping");
        require(ownerContract.ownerExists(ownerAddress), "Owner does not exist");
        require(ownerContract.getOwnerStatus(ownerAddress) == Owner.OwnerStatus.GRACE_PERIOD, "Owner not in grace period");
        require(gracePeriodStart[ownerAddress] > 0, "Grace period not started");
        require(!processedGracePeriod[ownerAddress], "Grace period already processed");
        
        hasPinged[ownerAddress] = true;
        
        emit OwnerPinged(ownerAddress, block.timestamp);
    }
    
    /**
     * @dev Check if upkeep is needed
     * @param checkData Additional data for the check
     * @return upkeepNeeded Whether upkeep is needed
     * @return performData Data to pass to performUpkeep
     */
    function checkUpkeep(bytes calldata checkData) external view override returns (bool upkeepNeeded, bytes memory performData) {
        // Get all owners in grace period
        // Note: In a real implementation, you might want to maintain a list of owners in grace period
        // For this example, we'll check a specific owner address passed in checkData
        if (checkData.length == 0) {
            return (false, "");
        }
        
        address ownerAddress = abi.decode(checkData, (address));
        
        // Check if owner exists and is in grace period
        if (!ownerContract.ownerExists(ownerAddress)) {
            return (false, "");
        }
        
        if (ownerContract.getOwnerStatus(ownerAddress) != Owner.OwnerStatus.GRACE_PERIOD) {
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
        
        // Get owner's grace interval
        Owner.OwnerData memory ownerData = ownerContract.getOwner(ownerAddress);
        uint256 graceInterval = ownerData.graceInterval * 1 days; // Convert days to seconds
        uint256 graceEndTime = gracePeriodStart[ownerAddress] + graceInterval;
        
        // Check if grace period has ended
        if (block.timestamp >= graceEndTime) {
            return (true, checkData);
        }
        
        return (false, "");
    }
    
    /**
     * @dev Perform the upkeep
     * @param performData Data from checkUpkeep
     */
    function performUpkeep(bytes calldata performData) external override {
        address ownerAddress = abi.decode(performData, (address));
        
        // Verify conditions again
        require(ownerContract.ownerExists(ownerAddress), "Owner does not exist");
        require(ownerContract.getOwnerStatus(ownerAddress) == Owner.OwnerStatus.GRACE_PERIOD, "Owner not in grace period");
        require(gracePeriodStart[ownerAddress] > 0, "Grace period not started");
        require(!processedGracePeriod[ownerAddress], "Grace period already processed");
        
        // Get owner's grace interval
        Owner.OwnerData memory ownerData = ownerContract.getOwner(ownerAddress);
        uint256 graceInterval = ownerData.graceInterval * 1 days; // Convert days to seconds
        uint256 graceEndTime = gracePeriodStart[ownerAddress] + graceInterval;
        
        require(block.timestamp >= graceEndTime, "Grace period not yet over");
        
        // Mark as processed
        processedGracePeriod[ownerAddress] = true;
        
        // Determine if owner is dead based on ping status
        bool isDead = !hasPinged[ownerAddress];
        
        if (isDead) {
            // Mark owner as dead
            ownerContract.markAsDead(ownerAddress);
        } else {
            // Return owner to active status
            ownerContract.updateOwnerStatus(ownerAddress, Owner.OwnerStatus.ACTIVE);
        }
        
        emit GracePeriodProcessed(ownerAddress, isDead, block.timestamp);
    }
}
