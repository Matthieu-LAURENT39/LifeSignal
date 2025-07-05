// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

interface IUser {
    enum UserStatus {
        ACTIVE,
        VOTING_IN_PROGRESS,
        GRACE_PERIOD,
        DEAD
    }

    function getStatus() external view returns (UserStatus);
    function getGraceInterval() external view returns (uint64);
    function getDeathDeclaration() external view returns (
        address declaredBy,
        uint64 declaredAt,
        address[] memory voters,
        bool consensusReached,
        uint64 consensusReachedAt
    );
    function finalizeDeathDeclaration() external;
}

contract GracePeriodAutomation is AutomationCompatibleInterface {
    IUser public user;
    bool public executed;

    constructor(address _user) {
        user = IUser(_user);
        executed = false;
    }

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        if (executed) return (false, "");

        // Vérifie si l'utilisateur est en période de grâce
        IUser.UserStatus status = user.getStatus();
        if (status != IUser.UserStatus.GRACE_PERIOD) return (false, "");

        (, , , , uint64 consensusReachedAt) = user.getDeathDeclaration();
        uint64 graceInterval = user.getGraceInterval();
        uint64 graceEnd = consensusReachedAt + graceInterval;

        if (block.timestamp >= graceEnd) {
            return (true, "");
        }

        return (false, "");
    }

    function performUpkeep(bytes calldata) external override {
        require(!executed, "Already executed");

        IUser.UserStatus status = user.getStatus();
        require(status == IUser.UserStatus.GRACE_PERIOD, "Not in grace period");

        (, , , , uint64 consensusReachedAt) = user.getDeathDeclaration();
        uint64 graceInterval = user.getGraceInterval();
            
        uint64 graceDeadline = consensusReachedAt + graceInterval;

        // Si le délai est passé, considérer l'utilisateur comme mort
        require(block.timestamp >= graceDeadline, "Grace period not yet over");

        user.finalizeDeathDeclaration(); // met le statut à DEAD
        executed = true;
        }
}
