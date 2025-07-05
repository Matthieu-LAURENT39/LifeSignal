import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GracePeriodAutomationModule", (m) => {
  // Deploy the GracePeriodAutomation contract for Sepolia
  // The relay address will be provided during deployment
  const relayAddress = m.getParameter("relayAddress", "0x0000000000000000000000000000000000000000");
  
  const gracePeriodAutomation = m.contract("GracePeriodAutomation", [relayAddress]);

  return { gracePeriodAutomation };
}); 