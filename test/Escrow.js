const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let realEstate, escrow, tx, receipt;
  let seller, buyer, nftAddress, inspector, lender;

  beforeEach(async () => {
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    //NFT Deployment
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    nftAddress = realEstate.address;

    // Mint from seller_address to realestate_address
    tx = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );

    receipt = await tx.wait();

    //Escrow Deployment
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      nftAddress,
      seller.address,
      inspector.address,
      lender.address
    );
    receipt = await tx.wait();

    // Approve and List property to escrow
    tx = await realEstate.connect(seller).approve(escrow.address, 1);
    receipt = await tx.wait();

    tx = await escrow
      .connect(seller)
      .list(1, tokens(10), buyer.address, tokens(5));
    receipt = await tx.wait();
  });

  describe("Deployment", () => {
    it("Saves the addresses", async () => {
      let result;
      result = await escrow.nftAddress();
      expect(result).to.be.equal(nftAddress);

      result = await escrow.seller();
      expect(result).to.be.equal(seller.address);

      result = await escrow.inspector();
      expect(result).to.be.equal(inspector.address);

      result = await escrow.lender();
      expect(result).to.be.equal(lender.address);
    });
  });

  describe("Listing", () => {
    it("Updates ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
    });
    it("Updates as listed", async () => {
      expect(await escrow.isListed(1)).to.be.equal(true);
    });

    it("Returns the purchase price", async () => {
      expect(await escrow.purchasePrice(1)).to.be.equal(tokens(10));
    });

    it("Returns the buyer", async () => {
      expect(await escrow.buyer(1)).to.be.equal(buyer.address);
    });

    it("Returns the escrow amount", async () => {
      expect(await escrow.escrowAmount(1)).to.be.equal(tokens(5));
    });
  });

  describe("Deposit", () => {
    it("Updates contract balance", async () => {
      const tx = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await tx.wait();

      const buyerBalance = await escrow.getBalance();
      expect(buyerBalance).to.be.equal(tokens(5));
    });
  });

  describe("Inspection", () => {
    it("Updates inspection status", async () => {
      const tx = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await tx.wait();

      expect(await escrow.inspectionPassed(1)).to.be.equal(true);
    });
  });

  describe("Approval", () => {
    it("Updates approval status", async () => {
      let tx;
      tx = await escrow.connect(inspector).updateInspectionStatus(1, true);
      await tx.wait();

      tx = await escrow.connect(buyer).approveSale(1);
      await tx.wait();

      tx = await escrow.connect(seller).approveSale(1);
      await tx.wait();

      tx = await escrow.connect(lender).approveSale(1);
      await tx.wait();

      expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(1, seller.address)).to.be.equal(true);
      expect(await escrow.approval(1, lender.address)).to.be.equal(true);
    });
  });
});
