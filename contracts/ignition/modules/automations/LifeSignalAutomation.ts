// ignition/modules/LifeAutomationModule.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LifeAutomationModule", (m) => {
  const userAddress = m.getParameter("userAddress");
  const userContract = m.getParameter("userContract");
  const vaultContract = m.getParameter("vaultContract");

  const lifeAutomation = m.contract("LifeAutomation", [userAddress, userContract, vaultContract]);

  return { lifeAutomation };
});
