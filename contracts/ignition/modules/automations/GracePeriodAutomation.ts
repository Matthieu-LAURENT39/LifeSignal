// ignition/modules/LifeAutomationModule.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GracePeriodAutomationModule", (m) => {
  // Deploy the LifeSignalRegistry contract first
  const lifeSignalRegistry = m.contract("LifeSignalRegistry", []);

  // Deploy the GracePeriodAutomation contract with LifeSignalRegistry address
  const gracePeriodAutomation = m.contract("GracePeriodAutomation", [lifeSignalRegistry]);

  return { lifeSignalRegistry, gracePeriodAutomation };
});