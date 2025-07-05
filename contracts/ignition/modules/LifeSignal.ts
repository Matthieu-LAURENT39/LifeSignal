import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LifeSignalModule = buildModule("LifeSignalModule", (m) => {
  // Deploy libraries first
  const typesLibrary = m.library("Types");
  const errorsLibrary = m.library("Errors");
  const safeTransferLibrary = m.library("SafeTransfer", {
    libraries: {
      Types: typesLibrary,
      Errors: errorsLibrary,
    },
  });

  // Deploy core contracts
  const heirRegistry = m.contract("HeirRegistry");
  const keepAlive = m.contract("KeepAlive");
  const deathOracle = m.contract("DeathOracle");

  // Deploy vault controller with dependencies
  const vaultController = m.contract("VaultController", [
    deathOracle,
    keepAlive,
    2, // Required confirmations
  ]);

  // Deploy vault implementation
  const vaultImplementation = m.contract("Vault", [], {
    libraries: {
      Types: typesLibrary,
      Errors: errorsLibrary,
      SafeTransfer: safeTransferLibrary,
    },
  });

  // Deploy vault factory
  const vaultFactory = m.contract("VaultFactory", [
    vaultImplementation,
    vaultController,
    heirRegistry,
  ]);

  // Return all deployed contracts
  return {
    typesLibrary,
    errorsLibrary,
    safeTransferLibrary,
    heirRegistry,
    keepAlive,
    deathOracle,
    vaultController,
    vaultImplementation,
    vaultFactory,
  };
});

export default LifeSignalModule; 