import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LifeSignalRegistryModule = buildModule("LifeSignalRegistry", (m) => {
  const lifeSignalRegistry = m.contract("LifeSignalRegistry");

  return { lifeSignalRegistry };
});

export default LifeSignalRegistryModule; 