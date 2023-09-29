const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { arrayify } = require("ethers/lib/utils");

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe("AirDrop", function () {
  const TOKENS_IN_POOL = toWei(1000000000)
  const REWARD_AMOUNT = toWei(500)
  let addrs
  let contractBlocknumber
  const blockNumberCutoff = 11
  before(async function () {

    this.shuffle = []
    while (this.shuffle.length < 20) {
      let r = Math.floor(Math.random() * 20)
      if (this.shuffle.indexOf(r) === -1) { // checking if indexOf r exist or not, to avoid duplication.
        this.shuffle.push(r)
      }
    }

    // Get all signers
    addrs = await ethers.getSigners();
    // Deploy eth swap
    const EthSwapFactory = await ethers.getContractFactory('EthSwap', addrs[0]);
    this.ethSwap = await EthSwapFactory.deploy();
    const receipt = await this.ethSwap.deployTransaction.wait()
    contractBlocknumber = receipt.blockNumber

    // Instantiate token
    let tokenAddress = await this.ethSwap.token();
    this.token = (
      await ethers.getContractFactory('Token', addrs[0])
    ).attach(tokenAddress);

    
    expect(
      await this.token.balanceOf(this.ethSwap.address)
    ).to.equal(TOKENS_IN_POOL);

    await Promise.all(this.shuffle.map(async (i, indx) => {
      const receipt = await (await this.ethSwap.connect(addrs[i]).buyTokens({ value: toWei(10) })).wait() 
      expect(receipt.blockNumber).to.eq(indx + 2) 
    }))


    const filter = this.ethSwap.filters.TokensPurchased() // filtering parameter
    const results = await this.ethSwap.queryFilter(filter, contractBlocknumber, blockNumberCutoff) // exact filtering
    expect(results.length).to.eq(blockNumberCutoff - contractBlocknumber)

    // Get elligble addresses from events and then hash them to get leaf nodes
    this.leafNodes = results.map(i => keccak256(i.args.account.toString()))
    // Generate merkleTree from leafNodes
    this.merkleTree = new MerkleTree(this.leafNodes, keccak256, { sortPairs: true });
    // Get root hash from merkle tree
    const rootHash = this.merkleTree.getRoot()
    // Deploy the Air Drop contract
    const AirDropFactory = await ethers.getContractFactory('AirDrop', addrs[0]);
    this.airDrop = await AirDropFactory.deploy(rootHash, REWARD_AMOUNT);

  });

  it("Only eligible accounts should be able to claim airdrop", async function () {
    // Every eligible account claims their airdrop
    for (let i = 0; i < 20; i++) {
      const proof = this.merkleTree.getHexProof(keccak256(addrs[i].address))
      if (proof.length !== 0) {
        await this.airDrop.connect(addrs[i]).claim(proof)
        expect(await this.airDrop.balanceOf(addrs[i].address)).to.eq(REWARD_AMOUNT)
        // Fails when user tries to claim tokens again.
        await expect(this.airDrop.connect(addrs[i]).claim(proof)).to.be.revertedWith("Already claimed air drop")
      } else {
        await expect(this.airDrop.connect(addrs[i]).claim(proof)).to.be.revertedWith("Incorrect merkle proof")
        expect(await this.airDrop.balanceOf(addrs[i].address)).to.eq(0)
      }
    }
  });
});
