const { Wallet } = require('ethers');

/**
 * Tạo ngẫu nhiên một địa chỉ ví định danh Web 2.5
 * @returns {{ address: string, privateKey: string }}
 */
function createCustodialWallet() {
  try {
    const wallet = Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    console.error("❌ Lỗi khi sinh ví ngầm:", error);
    throw new Error("Không thể khởi tạo ví kỹ thuật số.");
  }
}

module.exports = {
  createCustodialWallet,
};
