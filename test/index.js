const HashTimeLock = artifacts.require("HashTimeLock");

// Unit tests wrapper
contract("HashTimeLock", () => {
  let contractInstance;
  let txHash;

  beforeEach(async () => {
    contractInstance = await HashTimeLock.new();
  });

  // Deploy contract
  it("should deploy contract", async () => {
    assert(
      contractInstance.address !== "",
      `Expected empty string for address, got ${contractInstance.address} instead`
    );
  });
});
