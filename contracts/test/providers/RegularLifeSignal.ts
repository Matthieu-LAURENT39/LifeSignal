import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";


describe("RegularLifeSignal", function () {

  async function deployLifeSignalFixture() {
    const INTERVAL = 240;
    const TIMEOUT = 240;

    const interval = INTERVAL;
    const timeout = TIMEOUT;

    const [owner, otherAccount] = await  hre.ethers.getSigners();

    const RegularLifeSignal = await hre.ethers.getContractFactory("RegularLifeSignal");
    const regularLifeSignal = await RegularLifeSignal.deploy(interval, timeout);

    return { regularLifeSignal, RegularLifeSignal, interval, timeout, owner, otherAccount}
  }

    describe("Deployment", function () {
      it("Should set the right interval", async function () {
        const { regularLifeSignal, interval } = await loadFixture(deployLifeSignalFixture);

        expect(await regularLifeSignal.interval()).to.equal(interval);
      });

      it("Should set the right timeout", async function () {
        const { regularLifeSignal, timeout } = await loadFixture(deployLifeSignalFixture);

        expect(await regularLifeSignal.timeout()).to.equal(timeout);
      });
    });

    describe("Ping", function () {
      it("should stay alive if ping is recent", async function () {
        const { regularLifeSignal, timeout } = await loadFixture(deployLifeSignalFixture);
        // simulate a ping from the owner
        await regularLifeSignal.ping();

        // simulate passage of time < timeout
        await hre.ethers.provider.send("evm_increaseTime", [timeout / 2]); //120s
        await hre.ethers.provider.send("evm_mine");

        // run upkeep manually
        const upkeepNeeded = await regularLifeSignal.checkUpkeep("0x");
        if (upkeepNeeded[0]) {
          await regularLifeSignal.performUpkeep("0x");
        }

        await expect(await regularLifeSignal.status()).to.equal(0);
      })

      it("should mark user as suspected dead after timeout without ping", async function () {
        const { regularLifeSignal, timeout } = await loadFixture(deployLifeSignalFixture);
        // simulate a ping from the owner
        await regularLifeSignal.ping();

        // simulate passage of time < timeout
        await hre.ethers.provider.send("evm_increaseTime", [timeout + 1]); //240s + 1s
        await hre.ethers.provider.send("evm_mine");

        // run upkeep manually
        const upkeepNeeded = await regularLifeSignal.checkUpkeep("0x");
        if (upkeepNeeded[0]) {
          await regularLifeSignal.performUpkeep("0x");
        }

        await expect(await regularLifeSignal.status()).to.equal(1);    // Status.SuspectedDead
    })

}); });
