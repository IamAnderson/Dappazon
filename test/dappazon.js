const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Dappazon", () => {
  let dappazon, deployer, buyer;

  beforeEach(async () => {
    const Dappazon = await ethers.getContractFactory("Dappazon");
    dappazon = await Dappazon.deploy();

    // Set up accounts
    [deployer, buyer] = await ethers.getSigners();
  });

  describe("Deployment", () => {
    it("sets the owner", async () => {
      expect(await dappazon.owner()).to.be.equal(deployer.address);
    });
  });

  describe("Listing", () => {
    let tx;

    const ID = 1;
    const NAME = "Shoes";
    const CATEGORY = "Clothing";
    const IMAGE =
      "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg";
    const COST = tokens(1);
    const RATING = 4;
    const STOCK = 5;

    beforeEach(async () => {
      tx = await dappazon
        .connect(deployer)
        .list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);

      await tx.wait();
    });

    it("returns item attributes", async () => {
      const item = await dappazon.items(1);
      expect(item.id).to.equal(ID);
      expect(item.name).to.equal(NAME);
      expect(item.category).to.equal(CATEGORY);
      expect(item.image).to.equal(IMAGE);
      expect(item.cost).to.equal(COST);
      expect(item.rating).to.equal(RATING);
      expect(item.stock).to.equal(STOCK);
    });

    it("emits list event", async () => {
      expect(tx).emit(dappazon, "List");
    });
  });

  describe("Buying", () => {
    let tx;

    const ID = 1;
    const NAME = "Shoes";
    const CATEGORY = "Clothing";
    const IMAGE =
      "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg";
    const COST = tokens(1);
    const RATING = 4;
    const STOCK = 5;

    beforeEach(async () => {
      tx = await dappazon
        .connect(deployer)
        .list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);

      await tx.wait();

      tx = await dappazon.connect(buyer).buy(ID, { value: COST });

      await tx.wait();
    });

    it("update the contract's balance", async () => {
        expect(await dappazon.getBalance()).to.be.equal(COST);
    });

    it("emits buy event", async () => {
      expect(tx).emit(dappazon, "buy");
    });
  });
});
