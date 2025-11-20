require('dotenv').config();
require("@nomiclabs/hardhat-ethers");

const {
  INFURA_API_KEY,
  ALCHEMY_API_KEY,
  DEPLOYER_PRIVATE_KEY, // 0x...
} = process.env;

function rpcUrl(network) {
  // prefer Infura then Alchemy; change as you like
  if (INFURA_API_KEY) return `https://${network}.infura.io/v3/${INFURA_API_KEY}`;
  if (ALCHEMY_API_KEY) return `https://eth-${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  return "";
}

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: rpcUrl('sepolia') ? {
      url: rpcUrl('sepolia'),
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : []
    } : undefined,
    mainnet: rpcUrl('mainnet') ? {
      url: rpcUrl('mainnet'),
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : []
    } : undefined
  }
};