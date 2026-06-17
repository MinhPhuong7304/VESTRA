const MerkleHelper = require('./web3/merkleHelper');

// 1. Tạo một số giao dịch phân chia dòng tiền giả lập cho đơn hàng
const txs = [
  { id: 'tx_pay_01', order_id: 'order_1001', transaction_type: 'PAYMENT', amount: 1000000, sender_address: '0xCustomerWalletAddress', receiver_address: '0xPlatformEscrowAddress' },
  { id: 'tx_fee_01', order_id: 'order_1001', transaction_type: 'PLATFORM_FEE', amount: 50000, sender_address: '0xPlatformEscrowAddress', receiver_address: '0xPlatformRevenueAddress' },
  { id: 'tx_aff_01', order_id: 'order_1001', transaction_type: 'AFFILIATE_COMMISSION', amount: 100000, sender_address: '0xPlatformEscrowAddress', receiver_address: '0xCreatorWalletAddress' },
  { id: 'tx_set_01', order_id: 'order_1001', transaction_type: 'SETTLEMENT', amount: 850000, sender_address: '0xPlatformEscrowAddress', receiver_address: '0xSellerWalletAddress' },
];

console.log("=========================================================");
console.log("🧪 BẮT ĐẦU KIỂM THỬ THUẬT TOÁN MERKLE TREE & BATCHING");
console.log("=========================================================");

// 2. Tính toán Root Hash
const root = MerkleHelper.getRoot(txs);
console.log(`📍 Merkle Root Hash được tạo ra (Gửi lên Blockchain): ${root}`);

// 3. Sinh Proof cho giao dịch chia hoa hồng Affiliate (tx_aff_01)
const targetTx = txs[2]; // tx_aff_01
const proof = MerkleHelper.getProof(txs, targetTx);
console.log(`\n🔑 Merkle Proof sinh ra cho giao dịch Aff (${targetTx.id}):`);
console.log(proof);

// 4. Xác thực giao dịch hợp lệ
const isValid = MerkleHelper.verifyTransaction(root, targetTx, proof);
console.log(`\n🔍 Kết quả đối soát giao dịch gốc: ${isValid ? '🟢 HỢP LỆ (Dữ liệu toàn vẹn)' : '🔴 VÔ HIỆU (Dữ liệu bị lỗi)'}`);

// 5. Thử nghiệm giả lập Sàn TMĐT tự ý sửa đổi Database để gian lận số liệu
console.log("\n⚠️ GIẢ LẬP GIAN LẬN: Sàn tự ý sửa hoa hồng từ 100k thành 10k trong database Web2...");
const fraudTx = { ...targetTx, amount: 10000 }; // Sửa số tiền từ 100000 thành 10000
const isFraudValid = MerkleHelper.verifyTransaction(root, fraudTx, proof);
console.log(`🔍 Kết quả đối soát giao dịch sửa đổi: ${isFraudValid ? '🔴 HỢP LỆ (Lỗi bảo mật!)' : '🟢 VÔ HIỆU (Phát hiện giả mạo thành công!)'}`);
console.log("=========================================================");
