import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ContactManagerModule = buildModule("ContactManagerModule", (m) => {
  const contactManager = m.contract("ContactManager");

  return { contactManager };
});

export default ContactManagerModule; 