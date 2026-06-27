require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../backend/.env" }); // Nhập file .env dùng chung ở backend

const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const rawPrivateKey = process.env.OPERATOR_PRIVATE_KEY || "";
const cleanPrivateKey = rawPrivateKey.startsWith("0x") ? rawPrivateKey.slice(2) : rawPrivateKey;
const hasValidKey = cleanPrivateKey.length === 64 && /^[0-9a-fA-F]{64}$/.test(cleanPrivateKey);

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    amoy: {
      url: POLYGON_AMOY_RPC_URL,
      accounts: hasValidKey ? [`0x${cleanPrivateKey}`] : [],
    }
  }
};

