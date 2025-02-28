require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",  // Version de Solidity à adapter selon ton besoin
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL, // URL du nœud Sepolia
      accounts: [process.env.PRIVATE_KEY] // Clé privée pour signer les transactions
    }
  }
};