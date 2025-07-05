// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UserModule = buildModule("UserModule", (m) => {
  // Parameters for User contract constructor
  const firstname = m.getParameter("firstname", "John");
  const lastname = m.getParameter("lastname", "Doe");
  const email = m.getParameter("email", "john.doe@example.com");

  // Deploy the User contract
  const user = m.contract("User", [firstname, lastname, email], {
    // Optional: Add value if you want to send ETH with deployment
    // value: ethers.parseEther("0.1"),
  });

  return { user };
});

export default UserModule; 