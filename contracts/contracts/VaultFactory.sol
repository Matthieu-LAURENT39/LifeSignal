// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IVaultController.sol";
import "./interfaces/IHeirRegistry.sol";
import "./libraries/Types.sol";
import "./libraries/LifeSignalErrors.sol";

/**
 * @title VaultFactory
 * @dev Factory contract for deploying Vault instances using proxy pattern
 */
contract VaultFactory is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");

    // State variables
    address public immutable vaultImplementation;
    address public immutable vaultController;
    address public immutable heirRegistry;
    UpgradeableBeacon public immutable beacon;
    
    mapping(address => address) public ownerToVault;
    mapping(address => address) public vaultToOwner;
    mapping(address => bool) public isVaultDeployed;
    
    address[] public deployedVaults;
    uint256 public totalVaults;
    
    Types.VaultConfig public defaultConfig;
    
    // Events
    event VaultCreated(
        address indexed owner,
        address indexed vault,
        address indexed heirRegistry,
        uint256 vaultId,
        uint256 timestamp
    );
    
    event VaultImplementationUpdated(
        address indexed oldImplementation,
        address indexed newImplementation,
        uint256 timestamp
    );
    
    event DefaultConfigUpdated(
        Types.VaultConfig newConfig,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyNewOwner(address owner) {
        if (ownerToVault[owner] != address(0)) revert LifeSignalErrors.FactoryOwnerAlreadyHasVault();
        _;
    }

    modifier validOwner(address owner) {
        if (owner == address(0)) revert LifeSignalErrors.ZeroAddress();
        _;
    }

    modifier validConfig(Types.VaultConfig calldata config) {
        if (config.inactivityThreshold == 0) revert LifeSignalErrors.ConfigInvalidInactivityThreshold();
        if (config.gracePeriod == 0) revert LifeSignalErrors.ConfigInvalidGracePeriod();
        _;
    }

    /**
     * @dev Constructor
     */
    constructor(
        address _vaultImplementation,
        address _vaultController,
        address _heirRegistry
    ) {
        if (_vaultImplementation == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (_vaultController == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (_heirRegistry == address(0)) revert LifeSignalErrors.ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DEPLOYER_ROLE, msg.sender);

        vaultImplementation = _vaultImplementation;
        vaultController = _vaultController;
        heirRegistry = _heirRegistry;
        
        // Create upgradeable beacon
        beacon = new UpgradeableBeacon(_vaultImplementation, msg.sender);
        
        // Set default configuration
        defaultConfig = Types.VaultConfig({
            inactivityThreshold: 365 days,
            gracePeriod: 30 days,
            minimumStake: 0.1 ether,
            requiresDeathProof: false,
            allowEmergencyWithdraw: true
        });
    }

    /**
     * @dev Create a new vault for an owner using Clones (EIP-1167)
     */
    function createVault(
        address owner
    ) external nonReentrant whenNotPaused validOwner(owner) onlyNewOwner(owner) returns (address vault) {
        return _createVault(owner, defaultConfig);
    }

    /**
     * @dev Create a new vault with custom configuration
     */
    function createVaultWithConfig(
        address owner,
        Types.VaultConfig calldata config
    ) external nonReentrant whenNotPaused validOwner(owner) onlyNewOwner(owner) validConfig(config) returns (address vault) {
        return _createVault(owner, config);
    }

    /**
     * @dev Create a new vault using BeaconProxy for upgradeability
     */
    function createUpgradeableVault(
        address owner
    ) external nonReentrant whenNotPaused validOwner(owner) onlyNewOwner(owner) returns (address vault) {
        return _createUpgradeableVault(owner, defaultConfig);
    }

    /**
     * @dev Create a new upgradeable vault with custom configuration
     */
    function createUpgradeableVaultWithConfig(
        address owner,
        Types.VaultConfig calldata config
    ) external nonReentrant whenNotPaused validOwner(owner) onlyNewOwner(owner) validConfig(config) returns (address vault) {
        return _createUpgradeableVault(owner, config);
    }

    /**
     * @dev Batch create vaults for multiple owners
     */
    function batchCreateVaults(
        address[] calldata owners
    ) external nonReentrant whenNotPaused returns (address[] memory vaults) {
        vaults = new address[](owners.length);
        
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == address(0)) revert LifeSignalErrors.ZeroAddress();
            if (ownerToVault[owners[i]] != address(0)) revert LifeSignalErrors.FactoryOwnerAlreadyHasVault();
            
            vaults[i] = _createVault(owners[i], defaultConfig);
        }
        
        return vaults;
    }

    /**
     * @dev Internal function to create a vault using Clones
     */
    function _createVault(
        address owner,
        Types.VaultConfig memory config
    ) internal returns (address vault) {
        // Clone the implementation
        vault = Clones.clone(vaultImplementation);
        
        // Initialize the vault
        IVault(vault).initialize(owner, heirRegistry, vaultController, config);
        
        // Register the vault
        _registerVault(owner, vault);
        
        // Authorize vault in controller
        try IVaultController(vaultController).authorizeVault(vault) {
            // Vault authorized successfully
        } catch {
            revert LifeSignalErrors.FactoryVaultCreationFailed();
        }
        
        emit VaultCreated(owner, vault, heirRegistry, totalVaults, block.timestamp);
        
        return vault;
    }

    /**
     * @dev Internal function to create an upgradeable vault using BeaconProxy
     */
    function _createUpgradeableVault(
        address owner,
        Types.VaultConfig memory config
    ) internal returns (address vault) {
        // Create beacon proxy
        bytes memory initData = abi.encodeWithSelector(
            IVault.initialize.selector,
            owner,
            heirRegistry,
            vaultController,
            config
        );
        
        vault = address(new BeaconProxy(address(beacon), initData));
        
        // Register the vault
        _registerVault(owner, vault);
        
        // Authorize vault in controller
        try IVaultController(vaultController).authorizeVault(vault) {
            // Vault authorized successfully
        } catch {
            revert LifeSignalErrors.FactoryVaultCreationFailed();
        }
        
        emit VaultCreated(owner, vault, heirRegistry, totalVaults, block.timestamp);
        
        return vault;
    }

    /**
     * @dev Internal function to register a vault
     */
    function _registerVault(address owner, address vault) internal {
        ownerToVault[owner] = vault;
        vaultToOwner[vault] = owner;
        isVaultDeployed[vault] = true;
        
        deployedVaults.push(vault);
        totalVaults++;
    }

    /**
     * @dev Get vault address for an owner
     */
    function getVaultForOwner(address owner) external view returns (address) {
        return ownerToVault[owner];
    }

    /**
     * @dev Get owner address for a vault
     */
    function getOwnerForVault(address vault) external view returns (address) {
        return vaultToOwner[vault];
    }

    /**
     * @dev Check if an address is a deployed vault
     */
    function isVault(address vault) external view returns (bool) {
        return isVaultDeployed[vault];
    }

    /**
     * @dev Get all deployed vaults
     */
    function getAllVaults() external view returns (address[] memory) {
        return deployedVaults;
    }

    /**
     * @dev Get vaults in a range
     */
    function getVaults(uint256 start, uint256 limit) external view returns (address[] memory) {
        if (start >= deployedVaults.length) {
            return new address[](0);
        }
        
        uint256 end = start + limit;
        if (end > deployedVaults.length) {
            end = deployedVaults.length;
        }
        
        address[] memory result = new address[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = deployedVaults[i];
        }
        
        return result;
    }

    /**
     * @dev Get vault statistics
     */
    function getVaultStats() external view returns (
        uint256 totalVaultsCount,
        uint256 activeVaults,
        uint256 pendingVaults,
        uint256 deceasedVaults,
        uint256 distributedVaults
    ) {
        totalVaultsCount = totalVaults;
        
        for (uint256 i = 0; i < deployedVaults.length; i++) {
            Types.VaultState state = IVault(deployedVaults[i]).getVaultState();
            
            if (state == Types.VaultState.Active) {
                activeVaults++;
            } else if (state == Types.VaultState.Pending) {
                pendingVaults++;
            } else if (state == Types.VaultState.Deceased) {
                deceasedVaults++;
            } else if (state == Types.VaultState.Distributed) {
                distributedVaults++;
            }
        }
    }

    /**
     * @dev Get vaults by state
     */
    function getVaultsByState(Types.VaultState state) external view returns (address[] memory) {
        address[] memory matchingVaults = new address[](deployedVaults.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < deployedVaults.length; i++) {
            if (IVault(deployedVaults[i]).getVaultState() == state) {
                matchingVaults[count] = deployedVaults[i];
                count++;
            }
        }
        
        // Resize array
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = matchingVaults[i];
        }
        
        return result;
    }

    /**
     * @dev Predict vault address for an owner (for Clones)
     */
    function predictVaultAddress(address owner) external view returns (address) {
        return Clones.predictDeterministicAddress(
            vaultImplementation,
            keccak256(abi.encodePacked(owner)),
            address(this)
        );
    }

    /**
     * @dev Create deterministic vault (for predictable addresses)
     */
    function createDeterministicVault(
        address owner
    ) external nonReentrant whenNotPaused validOwner(owner) onlyNewOwner(owner) returns (address vault) {
        bytes32 salt = keccak256(abi.encodePacked(owner));
        vault = Clones.cloneDeterministic(vaultImplementation, salt);
        
        // Initialize the vault
        IVault(vault).initialize(owner, heirRegistry, vaultController, defaultConfig);
        
        // Register the vault
        _registerVault(owner, vault);
        
        // Authorize vault in controller
        try IVaultController(vaultController).authorizeVault(vault) {
            // Vault authorized successfully
        } catch {
            revert LifeSignalErrors.FactoryVaultCreationFailed();
        }
        
        emit VaultCreated(owner, vault, heirRegistry, totalVaults, block.timestamp);
        
        return vault;
    }

    // Administrative Functions
    
    /**
     * @dev Update the beacon implementation (for upgradeable vaults)
     */
    function updateBeaconImplementation(address newImplementation) external onlyRole(ADMIN_ROLE) {
        if (newImplementation == address(0)) revert LifeSignalErrors.ZeroAddress();
        
        address oldImplementation = beacon.implementation();
        beacon.upgradeTo(newImplementation);
        
        emit VaultImplementationUpdated(oldImplementation, newImplementation, block.timestamp);
    }

    /**
     * @dev Update default configuration
     */
    function updateDefaultConfig(Types.VaultConfig calldata newConfig) external onlyRole(ADMIN_ROLE) validConfig(newConfig) {
        defaultConfig = newConfig;
        emit DefaultConfigUpdated(newConfig, block.timestamp);
    }

    /**
     * @dev Pause the factory
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the factory
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Grant deployer role
     */
    function grantDeployerRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(DEPLOYER_ROLE, account);
    }

    /**
     * @dev Revoke deployer role
     */
    function revokeDeployerRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(DEPLOYER_ROLE, account);
    }

    /**
     * @dev Emergency pause all vaults
     */
    function emergencyPauseAllVaults() external onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < deployedVaults.length; i++) {
            try IVault(deployedVaults[i]).pause() {
                // Vault paused successfully
            } catch {
                // Continue with other vaults if one fails
            }
        }
    }

    /**
     * @dev Emergency unpause all vaults
     */
    function emergencyUnpauseAllVaults() external onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < deployedVaults.length; i++) {
            try IVault(deployedVaults[i]).unpause() {
                // Vault unpaused successfully
            } catch {
                // Continue with other vaults if one fails
            }
        }
    }

    /**
     * @dev Get beacon address
     */
    function getBeacon() external view returns (address) {
        return address(beacon);
    }

    /**
     * @dev Get current implementation address
     */
    function getCurrentImplementation() external view returns (address) {
        return beacon.implementation();
    }

    /**
     * @dev Get default configuration
     */
    function getDefaultConfig() external view returns (Types.VaultConfig memory) {
        return defaultConfig;
    }

    /**
     * @dev Get factory information
     */
    function getFactoryInfo() external view returns (
        address implementation,
        address controller,
        address registry,
        address beaconAddress,
        uint256 totalVaultsCount
    ) {
        return (
            vaultImplementation,
            vaultController,
            heirRegistry,
            address(beacon),
            totalVaults
        );
    }
} 