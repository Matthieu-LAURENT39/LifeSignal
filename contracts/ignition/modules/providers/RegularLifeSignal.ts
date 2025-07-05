
// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RegularLifeSignalModule = buildModule("LifeSignalModule", (m) => {
  const interval = m.getParameter("interval", 240);
  const timeout = m.getParameter("timeout", 240);

  const lifeSignal = m.contract("LifeSignal", [interval, timeout], {});

  return { lifeSignal };
});

export default RegularLifeSignalModule;