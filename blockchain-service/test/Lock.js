const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper to check reverts without hardhat-chai-matchers
async function expectRevert(promise, expectedReason) {
  try {
    await promise;
    throw new Error("Expected revert but transaction succeeded");
  } catch (err) {
    if (expectedReason && !err.message.includes(expectedReason)) {
      throw new Error(
        `Expected revert with "${expectedReason}", but got "${err.message}"`
      );
    }
  }
}

describe("Lock", function () {
  let lock;
  let unlockTime;
  let lockedAmount;
  let owner;
  let otherAccount;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();

    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const latestBlock = await ethers.provider.getBlock("latest");
    unlockTime = latestBlock.timestamp + ONE_YEAR_IN_SECS;

    lockedAmount = ethers.utils.parseEther("1");

    const Lock = await ethers.getContractFactory("Lock");
    lock = await Lock.deploy(unlockTime, { value: lockedAmount });
    await lock.deployed();
  });

  it("Should set the right unlockTime", async function () {
    expect((await lock.unlockTime()).toString()).to.equal(
      unlockTime.toString()
    );
  });

  it("Should store the right owner", async function () {
    expect(await lock.owner()).to.equal(owner.address);
  });

  it("Should receive and store funds", async function () {
    const contractBalance = await ethers.provider.getBalance(lock.address);
    expect(contractBalance.toString()).to.equal(lockedAmount.toString());
  });

  it("Should not allow withdrawal before unlockTime", async function () {
    await expectRevert(lock.withdraw(), "You can't withdraw yet");
  });

  it("Should allow withdrawal after unlockTime", async function () {
    // increase time manually
    await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    const beforeOwnerBalance = await ethers.provider.getBalance(owner.address);
    const beforeContractBalance = await ethers.provider.getBalance(lock.address);

    const tx = await lock.withdraw();
    const receipt = await tx.wait();

    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    const afterOwnerBalance = await ethers.provider.getBalance(owner.address);
    const afterContractBalance = await ethers.provider.getBalance(lock.address);

    // Owner balance should increase by lockedAmount minus gas
    expect(
      afterOwnerBalance.sub(beforeOwnerBalance).add(gasUsed).toString()
    ).to.equal(lockedAmount.toString());

    // Contract balance should go to zero
    expect(afterContractBalance.toString()).to.equal("0");
  });

  it("Should not allow non-owner to withdraw", async function () {
    await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    await expectRevert(
      lock.connect(otherAccount).withdraw(),
      "You aren't the owner"
    );
  });
});
