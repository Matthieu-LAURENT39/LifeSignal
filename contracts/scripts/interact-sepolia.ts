import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0xf3b0Ba8d1d8d5A3aa7A130E959f98108eF0D5136";

async function main() {
  const [signer] = await ethers.getSigners();

  // Récupère l'adresse du contrat
  const contract = await ethers.getContractAt("LifeSignal", CONTRACT_ADDRESS, signer);


  const status = await contract.status();
  const statusStr = status == 0n ? "Alive" : "Suspected Dead";
  console.log(`Current status: ${statusStr}`);

  const [upkeepNeeded] = await contract.checkUpkeep("0x");
  console.log(`Upkeep needed: ${upkeepNeeded}`);

  if (upkeepNeeded) {
    console.log("Calling performUpkeep()...");
    const tx = await contract.performUpkeep("0x");
    await tx.wait();
    console.log("performUpkeep executed");
  }

  console.log("Calling ping()...");
  const txPing = await contract.ping();
  await txPing.wait();
  console.log("Ping executed");

  const newStatus = await contract.status();
  console.log("New status:", newStatus == 0n ? "Alive" : "Suspected Dead");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
