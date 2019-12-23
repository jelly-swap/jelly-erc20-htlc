const HashTimeLock = artifacts.require("HashTimeLock");
const SimpleToken = artifacts.require("SimpleToken");
const { id, mockNewContract } = require("./mockData.js");
const { MAXIMUM_UNIX_TIMESTAMP } = require("./constants.js");

const { ether } = require("openzeppelin-test-helpers");

// Unit tests wrapper
contract("HashTimeLock", ([_, senderAddress]) => {
  let contractInstance;
  let tokenInstance;
  let txHash;

  beforeEach(async () => {
    // Creating new instance of HashTimeLock contract
    contractInstance = await HashTimeLock.new();

    // Creating new instance of SimpleToken contract
    tokenInstance = await SimpleToken.new();

    // Approve htlc contract spending from token contract funds
    await tokenInstance.approve(contractInstance.address, ether("10"), {
      from: senderAddress
    });

    // Minting tokens from token contract and sending them to senderAddress
    await tokenInstance.mint(senderAddress, ether("10"));
  });

  // Deploy contract
  it("should deploy contract", async () => {
    assert(
      contractInstance.address !== "",
      `Expected empty string for address, got ${contractInstance.address} instead`
    );
  });

  it("should succeed once approved", async function() {
    await tokenInstance.approve(contractInstance.address, ether("10"), {
      from: senderAddress
    });
  });

  // Contract exists
  it("should return error, because contract doesn't exist yet", async () => {
    const contractExists = await contractInstance.contractExists(id);
    assert(!contractExists, `Expected false, got ${contractExists} instead`);
  });

  // New contract
  it("should create new contract", async () => {
    const {
      inputAmount,
      outputAmount,
      hashLock,
      receiverAddress,
      outputNetwork,
      outputAddress
    } = mockNewContract;

    let newContract = await contractInstance.newContract(
      inputAmount,
      outputAmount,
      MAXIMUM_UNIX_TIMESTAMP,
      hashLock,
      tokenInstance.address,
      receiverAddress,
      outputNetwork,
      outputAddress,
      {
        from: senderAddress
      }
    );

    txHash = newContract.logs[0].transactionHash;

    const contractId = newContract.logs[0].args.id;
    const contractExists = await contractInstance.contractExists(contractId);
    assert(contractExists, `Expected true, got ${contractExists} instead`);
  });
});
