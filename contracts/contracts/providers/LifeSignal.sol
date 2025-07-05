// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

contract LifeSignal is AutomationCompatibleInterface {
    address public user;
    uint256 public lastPing;
    uint256 public interval;     // Intervalle de vérification
    uint256 public timeout;      // Délai max sans ping
    uint256 public lastCheck;

    enum Status { Alive, SuspectedDead }
    Status public status;

    constructor(uint256 _interval, uint256 _timeout) {
        user = msg.sender;
        lastPing = block.timestamp;
        interval = _interval;
        timeout = _timeout;
        lastCheck = block.timestamp;
        status = Status.Alive;
    }

    function ping() external {
        require(msg.sender == user, "Only user can ping");
        lastPing = block.timestamp;
        status = Status.Alive;
    }

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = (block.timestamp - lastCheck) > interval;
        performData = ""; 
        return (upkeepNeeded, performData);
    }

    function performUpkeep(bytes calldata) external override {
        if ((block.timestamp - lastCheck) > interval) {
            lastCheck = block.timestamp;
            if ((block.timestamp - lastPing) > timeout) {
                status = Status.SuspectedDead;
            } else {
                status = Status.Alive;
            }
        }
    }
}
