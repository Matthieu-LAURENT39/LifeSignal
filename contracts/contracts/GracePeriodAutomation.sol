// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "./LifeSignalRegistry.sol";

contract GracePeriodAutomation is AutomationCompatibleInterface {
    LifeSignalRegistry public registry;
    
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
    
    constructor(address _registry) {
        registry = LifeSignalRegistry(_registry);
    }
    
    /**
     * @dev Start grace period for an owner after death declaration consensus
     * @param ownerAddress The owner's address
     */
    function startGracePeriod(address ownerAddress) external {
        // Check if owner exists in registry
        (,,,, bool isDeceased, bool exists) = registry.getOwnerInfo(ownerAddress);
        require(exists, "Owner does not exist in registry");
        require(!isDeceased, "Owner is already deceased");
        
        // Check if there's an active death declaration with consensus reached
        (bool isActive, , , , , bool consensusReached) = registry.getDeathDeclarationStatus(ownerAddress);
        require(isActive && consensusReached, "No active death declaration with consensus");
        
        require(gracePeriodStart[ownerAddress] == 0, "Grace period already started");
        
        gracePeriodStart[ownerAddress] = block.timestamp;
        hasPinged[ownerAddress] = false;
        processedGracePeriod[ownerAddress] = false;
        
        emit GracePeriodStarted(ownerAddress, block.timestamp);
    }
    
    /**
     * @dev Allow owner to ping during grace period (send heartbeat)
     * @param ownerAddress The owner's address
     */
    function ping(address ownerAddress) external {
        require(msg.sender == ownerAddress, "Only owner can ping");
        
        // Check if owner exists in registry
        (,,,, bool isDeceased, bool exists) = registry.getOwnerInfo(ownerAddress);
        require(exists, "Owner does not exist in registry");
        require(!isDeceased, "Owner is already deceased");
        
        require(gracePeriodStart[ownerAddress] > 0, "Grace period not started");
        require(!processedGracePeriod[ownerAddress], "Grace period already processed");
        
        // Send heartbeat through registry
        registry.sendHeartbeat();
        
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
        
        // Check if owner exists in registry
        (,,,, bool isDeceased, bool exists) = registry.getOwnerInfo(ownerAddress);
        if (!exists || isDeceased) {
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
        (,,, uint256 graceInterval,,) = registry.getOwnerInfo(ownerAddress);
        uint256 graceEndTime = gracePeriodStart[ownerAddress] + graceInterval;
        
        // Check if grace period has ended
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
        (,,,, bool isDeceased, bool exists) = registry.getOwnerInfo(ownerAddress);
        require(exists, "Owner does not exist in registry");
        require(!isDeceased, "Owner is already deceased");
        require(gracePeriodStart[ownerAddress] > 0, "Grace period not started");
        require(!processedGracePeriod[ownerAddress], "Grace period already processed");
        
        // Get owner's grace interval
        (,,, uint256 graceInterval,,) = registry.getOwnerInfo(ownerAddress);
        uint256 graceEndTime = gracePeriodStart[ownerAddress] + graceInterval;
        
        require(block.timestamp >= graceEndTime, "Grace period not yet over");
        
        // Mark as processed
        processedGracePeriod[ownerAddress] = true;
        
        // Determine if owner is dead based on ping status
        bool isDead = !hasPinged[ownerAddress];
        
        if (isDead) {
            // Mark owner as deceased by initiating a death declaration
            // Note: In a real scenario, you might want to have a special function in the registry
            // to mark an owner as deceased after grace period timeout
            // For now, we'll emit an event and the registry can be updated accordingly
            emit GracePeriodProcessed(ownerAddress, true, block.timestamp);
        } else {
            // Owner pinged, so they are alive
            emit GracePeriodProcessed(ownerAddress, false, block.timestamp);
        }
    }
    
    
    /**
     * @dev Check if grace period has ended for an owner
     * @param ownerAddress The owner's address
     * @return hasEnded Whether grace period has ended
     * @return endTime When grace period ends/will end
     */
    function checkGracePeriodEnd(address ownerAddress) external view returns (bool hasEnded, uint256 endTime) {
        if (gracePeriodStart[ownerAddress] == 0) {
            return (false, 0);
        }
        
        (,,, uint256 graceInterval,,) = registry.getOwnerInfo(ownerAddress);
        uint256 graceEndTime = gracePeriodStart[ownerAddress] + graceInterval;
        
        return (block.timestamp >= graceEndTime, graceEndTime);
    }
    
    /**
     * @dev Emergency function to mark owner as deceased after grace period timeout
     * This function should only be called by authorized parties
     * @param ownerAddress The owner's address
     */
    function markOwnerAsDeceased(address ownerAddress) external {
        require(processedGracePeriod[ownerAddress], "Grace period not processed");
        require(!hasPinged[ownerAddress], "Owner has pinged, cannot mark as deceased");
        
        // This would need to be implemented in the LifeSignalRegistry
        // For now, we just emit an event
        emit GracePeriodProcessed(ownerAddress, true, block.timestamp);
    }
}
