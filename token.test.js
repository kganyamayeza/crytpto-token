// This file contains test cases for the Token contract using Mocha and Chai.
// It ensures that the contract functions correctly, including tests for transferring tokens and checking balances.

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token Contract", function () {
    let Token;
    let token;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        Token = await ethers.getContractFactory("Token");
        [owner, addr1, addr2] = await ethers.getSigners();
        token = await Token.deploy("MyToken", "MTK", 1000000);
        await token.deployed();
    });

    it("Should have the correct name and symbol", async function () {
        expect(await token.name()).to.equal("MyToken");
        expect(await token.symbol()).to.equal("MTK");
    });

    it("Should assign the total supply to the owner", async function () {
        const ownerBalance = await token.balanceOf(owner.address);
        expect(await token.totalSupply()).to.equal(ownerBalance);
    });

    it("Should transfer tokens between accounts", async function () {
        await token.transfer(addr1.address, 50);
        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(50);

        await token.connect(addr1).transfer(addr2.address, 50);
        const addr2Balance = await token.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
        const initialOwnerBalance = await token.balanceOf(owner.address);
        await expect(token.connect(addr1).transfer(owner.address, 1)).to.be.revertedWith("Not enough tokens");
        expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
        const initialOwnerBalance = await token.balanceOf(owner.address);
        await token.transfer(addr1.address, 100);
        await token.transfer(addr2.address, 50);

        const finalOwnerBalance = await token.balanceOf(owner.address);
        expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));
    });
});

// made by kganya mayeza