// ignition/modules/LifeAutomationModule.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LifeAutomationModule", (m) => {
  const userContract = m.contract("User", []); // déploie un contrat User vide pour test

  const graceAutomation = m.contract("GracePeriodAutomation", [userContract]);

  return { userContract, graceAutomation };
});