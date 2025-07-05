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

    function getStatus(address user) external view returns (UserStatus);
    function getVaults(address user) external view returns (address[] memory);
}

interface IVaultManager {
    function getAllAthorizedContacts() external view returns (address[] memory);
    // TODO
    function addHeirs(address[] calldata heirs) external;
}

contract LifeAutomation is AutomationCompatibleInterface {
    address public userAddress;
    IUser public userContract;
    IVaultManager public  vaultContract;

    bool public executed;

    constructor(address _userAddress, address _userContract, address _vaultContract) {
        userAddress = _userAddress;
        userContract = IUser(_userContract);
        vaultContract = IVaultManager(_vaultContract);
    }

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory data) {
        if (!executed && userContract.getStatus(userAddress) == IUser.UserStatus.DEAD) {
            upkeepNeeded = true;
            data = abi.encode(userAddress);
        }
    }

    function performUpkeep(bytes calldata data) external override {
        require(!executed, "Already executed");
        address targetUser = abi.decode(data, (address));
        require(targetUser == userAddress, "Invalid user");

        require(userContract.getStatus(userAddress) == IUser.UserStatus.DEAD, "User not dead");

        address[] memory heirs = vaultContract.getAllAthorizedContacts();
        address[] memory vaults = userContract.getVaults(userAddress);

        for (uint i = 0; i < vaults.length; i++) {
            IVaultManager(vaults[i]).addHeirs(heirs);
        }

        executed = true;
    }
}

