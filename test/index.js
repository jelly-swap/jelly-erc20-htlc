const HashTimeLock = artifacts.require("HashTimeLock");
const TokenContract = artifacts.require("DappTokenContract");
const { id, secret, invalidSecret, mockNewContract } = require("./mockData.js");

// Unit tests wrapper
contract("HashTimeLock", () => {
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

  // Contract exists
  it("should return error, because contract doesn't exist yet", async () => {
    const contractExists = await contractInstance.contractExists(id);
    assert(!contractExists, `Expected false, got ${contractExists} instead`);
  });

  // New contract
  it("should create new contract", async () => {

    const {
      outputAmount,
      hashLock,
      receiverAddress,
      outputNetwork,
      outputAddress
    } = mockNewContract;
    const newContract = await contractInstance.newContract(
      ...Object.values(mockNewContract)
    );

    assert(true);
  });
});
