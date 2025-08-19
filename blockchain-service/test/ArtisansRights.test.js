const { expect } = require("chai");
const { ethers } = require("hardhat");

async function expectRevert(promise, expectedReason) {
  try {
    await promise;
    throw new Error("Expected transaction to be reverted, but it succeeded");
  } catch (err) {
    if (expectedReason && !err.message.includes(expectedReason)) {
      throw new Error(
        `Expected revert with '${expectedReason}', but got '${err.message}'`
      );
    }
  }
}

describe("ArtisanRights1155", function () {
  let contract;
  let owner, admin, minter, artisan, buyer;

  beforeEach(async function () {
    [owner, admin, minter, artisan, buyer] = await ethers.getSigners();

    const ArtisanRights1155 = await ethers.getContractFactory(
      "ArtisanRights1155"
    );
    contract = await ArtisanRights1155.deploy(
      "https://api.example.com/metadata/", // Base URI
      admin.address, // Admin
      minter.address // Minter
    );
    await contract.deployed();
  });

  describe("Minting CoA", function () {
    it("Should mint a Certificate of Authenticity", async function () {
      const sku = 12345;
      const tokenURI = "ipfs://QmHash/metadata.json";
      const royaltyBps = 500; // 5%

      await contract
        .connect(minter)
        .mintCoA(artisan.address, sku, tokenURI, royaltyBps);

      const tokenId = await contract.calculateTokenId(sku, 0); // COA_KIND = 0
      expect(
        (await contract.balanceOf(artisan.address, tokenId)).toString()
      ).to.equal("1");
      expect(await contract.uri(tokenId)).to.equal(tokenURI);
    });

    it("Should not allow duplicate CoA minting", async function () {
      const sku = 12345;
      const tokenURI = "ipfs://QmHash/metadata.json";

      await contract
        .connect(minter)
        .mintCoA(artisan.address, sku, tokenURI, 500);

      await expectRevert(
        contract.connect(minter).mintCoA(artisan.address, sku, tokenURI, 500),
        "CoA already exists"
      );
    });
  });

  describe("Minting Rights", function () {
    it("Should mint rights tokens", async function () {
      const sku = 12345;
      const amount = 1000;
      const tokenURI = "ipfs://QmHash/rights-metadata.json";

      await contract.connect(minter).mintRights(
        artisan.address,
        sku,
        tokenURI,
        amount,
        750 // 7.5%
      );

      const tokenId = await contract.calculateTokenId(sku, 1); // RIGHTS_KIND = 1
      expect(
        (await contract.balanceOf(artisan.address, tokenId)).toString()
      ).to.equal(amount.toString());
    });
  });

  describe("Royalties", function () {
    it("Should return correct royalty info", async function () {
      const sku = 12345;
      const salePrice = ethers.utils.parseEther("1"); // 1 MATIC

      await contract.connect(minter).mintCoA(
        artisan.address,
        sku,
        "ipfs://test",
        500 // 5%
      );

      const tokenId = await contract.calculateTokenId(sku, 0);
      const [receiver, royaltyAmount] = await contract.royaltyInfo(
        tokenId,
        salePrice
      );

      expect(receiver).to.equal(artisan.address);
      expect(royaltyAmount.toString()).to.equal(
        ethers.utils.parseEther("0.05").toString()
      ); // 5% of 1 MATIC
    });
  });
});
