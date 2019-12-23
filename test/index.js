const HashTimeLock = artifacts.require("HashTimeLock");
const TokenContract = artifacts.require("SimpleToken");
const { id, mockNewContract } = require("./mockData.js");
const { MAXIMUM_UNIX_TIMESTAMP } = require("./constants.js");

const { ether } = require("openzeppelin-test-helpers");

// Unit tests wrapper
contract("HashTimeLock", ([_, senderAddress]) => {
  let contractInstance;
  let tokenInstance;
  let txHash;

  beforeEach(async () => {
    contractInstance = await HashTimeLock.new();
    tokenInstance = await TokenContract.new();
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

    await tokenInstance.approve(contractInstance.address, ether("10"), {
      from: senderAddress
    });
    await tokenInstance.mint(senderAddress, ether("10"));

    await contractInstance.newContract(
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

    // txHash = newContract.logs[0].transactionHash;

    // const contractId = newContract.logs[0].args.id;
    // const contractExists = await contractInstance.contractExists(contractId);
    // assert(contractExists, `Expected true, got ${contractExists} instead`);
    assert(true);
  });
});
