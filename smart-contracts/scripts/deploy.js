const hre = require("hardhat");

async function main() {
  console.log("🚀 Bắt đầu quá trình deploy Smart Contract VestraLedger...");

  // Lấy Contract Factory
  const VestraLedger = await hre.ethers.getContractFactory("VestraLedger");
  
  // Tiến hành deploy
  const contract = await VestraLedger.deploy();

  // Đợi contract được deploy thành công lên khối
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("=========================================================");
  console.log(`🎉 Deploy thành công lên Polygon Amoy!`);
  console.log(`📍 Địa chỉ hợp đồng VestraLedger: ${contractAddress}`);
  console.log(`👉 Hãy copy địa chỉ này và cập nhật vào VESTRA_LEDGER_CONTRACT_ADDRESS trong file backend/.env`);
  console.log("=========================================================");
}

main().catch((error) => {
  console.error("❌ Lỗi khi deploy:", error);
  process.exitCode = 1;
});
