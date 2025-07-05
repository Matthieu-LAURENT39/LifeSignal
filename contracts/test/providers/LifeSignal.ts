import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";


describe("LifeSignal", function () {

  async function deployLifeSignalFixture() {
    const INTERVAL = 240;
    const TIMEOUT = 240;

    const interval = INTERVAL;
    const timeout = TIMEOUT;

    const [owner, otherAccount] = await  hre.ethers.getSigners();

    const LifeSignal = await hre.ethers.getContractFactory("LifeSignal");
    const lifeSignal = await LifeSignal.deploy(interval, timeout);

    return { lifeSignal, LifeSignal, interval, timeout, owner, otherAccount}
  }

    describe("Deployment", function () {
      it("Should set the right interval", async function () {
        const { lifeSignal, interval } = await loadFixture(deployLifeSignalFixture);

        expect(await lifeSignal.interval()).to.equal(interval);
      });

      it("Should set the right timeout", async function () {
        const { lifeSignal, timeout } = await loadFixture(deployLifeSignalFixture);

        expect(await lifeSignal.timeout()).to.equal(timeout);
      });
    });

    describe("Ping", function () {
      it("should stay alive if ping is recent", async function () {
        const { lifeSignal, timeout } = await loadFixture(deployLifeSignalFixture);
        // simulate a ping from the owner
        await lifeSignal.ping();

        // simulate passage of time < timeout
        await hre.ethers.provider.send("evm_increaseTime", [timeout / 2]); //120s
        await hre.ethers.provider.send("evm_mine");

        // run upkeep manually
        const upkeepNeeded = await lifeSignal.checkUpkeep("0x");
        if (upkeepNeeded[0]) {
          await lifeSignal.performUpkeep("0x");
        }

        await expect(await lifeSignal.status()).to.equal(0);
      })

      it("should mark user as suspected dead after timeout without ping", async function () {
        const { lifeSignal, timeout } = await loadFixture(deployLifeSignalFixture);
        // simulate a ping from the owner
        await lifeSignal.ping();

        // simulate passage of time < timeout
        await hre.ethers.provider.send("evm_increaseTime", [timeout + 1]); //240s + 1s
        await hre.ethers.provider.send("evm_mine");

        // run upkeep manually
        const upkeepNeeded = await lifeSignal.checkUpkeep("0x");
        if (upkeepNeeded[0]) {
          await lifeSignal.performUpkeep("0x");
        }

        await expect(await lifeSignal.status()).to.equal(1);    // Status.SuspectedDead
    })

}); });
