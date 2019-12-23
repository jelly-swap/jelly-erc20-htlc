const truffleAssert = require("truffle-assertions");
const HashTimeLock = artifacts.require("HashTimeLock");
const SimpleToken = artifacts.require("SimpleToken");
const { SECONDS_IN_ONE_MINUTE } = require("./constants.js");
const {
  id,
  mockNewContractArgs,
  secret,
  invalidSecret
} = require("./mockData.js");
const { getMockNewContract, getTimestamp, timeout } = require("./helpers");
const statuses = require("./statuses");
const { ACTIVE, REFUNDED, WITHDRAWN } = require("./constants.js");

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

  // Approval
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
    let newContract = await contractInstance.newContract(
      ...Object.values(
        getMockNewContract(mockNewContractArgs, tokenInstance.address)
      ),
      {
        from: senderAddress
      }
    );

    txHash = newContract.logs[0].transactionHash;

    const contractId = newContract.logs[0].args.id;
    const contractExists = await contractInstance.contractExists(contractId);
    assert(contractExists, `Expected true, got ${contractExists} instead`);
  });

  // Get one status
  it("should get one status", async () => {
    let newContract = await contractInstance.newContract(
      ...Object.values(
        getMockNewContract(mockNewContractArgs, tokenInstance.address)
      ),
      {
        from: senderAddress
      }
    );

    const contractId = newContract.logs[0].args.id;
    const getOneStatus = await contractInstance.methods["getStatus(bytes32)"](
      contractId
    );

    assert(
      statuses[parseInt(getOneStatus)] === ACTIVE,
      `Expected ACTIVE, got ${statuses[parseInt(getOneStatus)]} instead`
    );
  });

  // Successful withdraw
  it("should withdraw", async () => {
    const timestamp = await getTimestamp(txHash);
    const customTimestamp = (timestamp + SECONDS_IN_ONE_MINUTE).toString();
    let newContract = await contractInstance.newContract(
      ...Object.values(
        getMockNewContract(
          mockNewContractArgs,
          tokenInstance.address,
          customTimestamp
        )
      ),
      {
        from: senderAddress
      }
    );

    const contractId = newContract.logs[0].args.id;
    await contractInstance.withdraw(contractId, secret, tokenInstance.address, {
      from: senderAddress
    });

    const getOneStatus = await contractInstance.methods["getStatus(bytes32)"](
      contractId
    );

    assert(
      statuses[parseInt(getOneStatus)] === WITHDRAWN,
      `Expected WITHDRAWN, got ${statuses[parseInt(getOneStatus)]} instead`
    );
  });

  // Unsuccessful withdraw (invalid secret)
  it("should revert withdraw, because secret is invalid", async () => {
    const timestamp = await getTimestamp(txHash);
    const customTimestamp = (timestamp + SECONDS_IN_ONE_MINUTE).toString();

    let newContract = await contractInstance.newContract(
      ...Object.values(
        getMockNewContract(
          mockNewContractArgs,
          tokenInstance.address,
          customTimestamp
        )
      ),
      {
        from: senderAddress
      }
    );

    const contractId = newContract.logs[0].args.id;

    await truffleAssert.reverts(
      contractInstance.withdraw(
        contractId,
        invalidSecret,
        tokenInstance.address,
        { from: senderAddress }
      )
    );
  });

  // Unsuccessful withdraw (expiration time passed)
  it("should revert withdraw, because expiration time has passed", async () => {
    const timestamp = await getTimestamp(txHash);
    const customTimestamp = (timestamp + 2).toString();

    let newContract = await contractInstance.newContract(
      ...Object.values(
        getMockNewContract(
          mockNewContractArgs,
          tokenInstance.address,
          customTimestamp
        )
      ),
      {
        from: senderAddress
      }
    );

    const contractId = newContract.logs[0].args.id;
    await timeout(2000);

    await truffleAssert.reverts(
      contractInstance.withdraw(contractId, secret, tokenInstance.address, {
        from: senderAddress
      })
    );
  });

  // Successful refund
  it("should refund", async () => {
    const timestamp = await getTimestamp(txHash);
    const customTimestamp = (timestamp + 4).toString();

    let newContract = await contractInstance.newContract(
      ...Object.values(
        getMockNewContract(
          mockNewContractArgs,
          tokenInstance.address,
          customTimestamp
        )
      ),
      {
        from: senderAddress
      }
    );

    const contractId = newContract.logs[0].args.id;
    await timeout(2500);
    await contractInstance.refund(contractId, tokenInstance.address, {
      from: senderAddress
    });

    const getOneStatus = await contractInstance.methods["getStatus(bytes32)"](
      contractId
    );
    assert(
      statuses[parseInt(getOneStatus)] === REFUNDED,
      `Expected REFUNDED, got ${statuses[parseInt(getOneStatus)]} instead`
    );
  });
});
