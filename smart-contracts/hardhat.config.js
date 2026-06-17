require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../backend/.env" }); // Nhập file .env dùng chung ở backend

const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
// Dự phòng private key rỗng để tránh crash khi chưa điền key
const PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY && process.env.OPERATOR_PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" 
  ? process.env.OPERATOR_PRIVATE_KEY.replace("0x", "") 
  : "0000000000000000000000000000000000000000000000000000000000000000";

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    amoy: {
      url: POLYGON_AMOY_RPC_URL,
      accounts: PRIVATE_KEY !== "0000000000000000000000000000000000000000000000000000000000000000" ? [PRIVATE_KEY] : [],
    }
  }
};
