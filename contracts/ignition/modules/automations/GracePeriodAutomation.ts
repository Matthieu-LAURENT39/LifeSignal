// ignition/modules/LifeAutomationModule.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GracePeriodAutomationModule", (m) => {
  // Deploy the Owner contract first
  const ownerContract = m.contract("Owner", []);

  // Deploy the GracePeriodAutomation contract with Owner contract address
  const gracePeriodAutomation = m.contract("GracePeriodAutomation", [ownerContract]);

  return { ownerContract, gracePeriodAutomation };
});