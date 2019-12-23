// Expiration field logic
const getTimestamp = async txHash => {
  const tx = await web3.eth.getTransaction(txHash);
  const blockNum = tx.blockNumber;
  const blockInfo = await web3.eth.getBlock(blockNum);
  currentTimestamp = blockInfo.timestamp;
  return currentTimestamp;
};

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Generating new contract arguments
const getMockNewContract = (
  {
    inputAmount,
    outputAmount,
    timestamp,
    hashLock,
    receiverAddress,
    outputNetwork,
    outputAddress
  },
  tokenAddress
) => {
  return {
    inputAmount,
    outputAmount,
    timestamp,
    hashLock,
    tokenAddress,
    receiverAddress,
    outputNetwork,
    outputAddress
  };
};

module.exports = {
  getTimestamp,
  timeout,
  getMockNewContract
};
