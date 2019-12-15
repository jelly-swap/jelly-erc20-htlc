module.exports = {
  compilers: {
    solc: {
      version: '0.5.14',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: 'istanbul'
      }
    }
  }
};
