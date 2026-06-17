const { JsonRpcProvider, Wallet, Contract } = require('ethers');
require('dotenv').config();

const RPC_URL = process.env.POLYGON_AMOY_RPC_URL;
const PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.VESTRA_LEDGER_CONTRACT_ADDRESS;

// ABI của VestraLedger để Node.js tương tác
const VESTRA_LEDGER_ABI = [
  "function submitBatch(string calldata batchId, bytes32 rootHash) external",
  "function getBatchRoot(string calldata batchId) external view returns (bytes32)",
  "function batchTimestamps(string calldata batchId) external view returns (uint256)",
  "event BatchSubmitted(string indexed batchId, bytes32 indexed rootHash, uint256 timestamp)"
];

class BlockchainService {
  /**
   * Đẩy Merkle Root của một batch giao dịch lên Smart Contract trên Polygon Amoy
   * @param {string} batchId - ID định danh của lô chốt số (thường là YYYYMMDD)
   * @param {string} rootHash - Mã hash gốc bắt đầu bằng 0x
   * @returns {Promise<string>} - Trả về Transaction Hash trên Blockchain
   */
  static async submitMerkleRoot(batchId, rootHash) {
    console.log(`⛓️ [Blockchain] Đang chuẩn bị chốt Batch ${batchId} với Root: ${rootHash}`);

    // Kiểm tra cấu hình private key và hợp đồng
    const isMockMode = !PRIVATE_KEY || 
                       PRIVATE_KEY === '0x0000000000000000000000000000000000000000000000000000000000000000' || 
                       !CONTRACT_ADDRESS;

    if (isMockMode) {
      console.warn("⚠️ Thiết lập ví/smart contract chưa hoàn tất hoặc đang là ví rỗng. Chạy chế độ giả lập (Mock Mode).");
      const mockTxHash = `0xmock${Buffer.from(batchId + rootHash).toString('hex').slice(0, 60)}`;
      return mockTxHash;
    }

    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const wallet = new Wallet(PRIVATE_KEY, provider);
      const contract = new Contract(CONTRACT_ADDRESS, VESTRA_LEDGER_ABI, wallet);

      console.log("⏳ Đang gửi giao dịch đối soát lên Polygon Amoy...");
      
      // Có thể lấy gasPrice tự động hoặc để ethers tự tính
      const tx = await contract.submitBatch(batchId, rootHash);
      console.log(`✅ Giao dịch đã gửi! Tx Hash: ${tx.hash}`);

      console.log("⏳ Đang chờ xác nhận từ khối (Block Confirmation)...");
      const receipt = await tx.wait();
      console.log(`🎉 Đẩy Root thành công ở Block: ${receipt.blockNumber}`);

      return tx.hash;
    } catch (error) {
      console.error("❌ Lỗi khi gửi giao dịch lên Smart Contract:", error.message);
      
      // Fallback để hệ thống tiếp tục chạy mượt mà ngay cả khi nghẽn mạng/hết gas
      console.warn("⚠️ Đã xảy ra lỗi kết nối Blockchain. Trả về mã lỗi giả lập.");
      return `0xerror${Buffer.from(batchId + error.message).toString('hex').slice(0, 60)}`;
    }
  }

  /**
   * Lấy Merkle Root đã lưu trên Blockchain của một batch cụ thể
   * @param {string} batchId - ID của lô cần đối soát
   * @returns {Promise<string|null>} - Trả về Root Hash hoặc null nếu lỗi
   */
  static async getBatchRoot(batchId) {
    if (!CONTRACT_ADDRESS || !RPC_URL) {
      return null;
    }

    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const contract = new Contract(CONTRACT_ADDRESS, VESTRA_LEDGER_ABI, provider);
      const root = await contract.getBatchRoot(batchId);
      return root;
    } catch (error) {
      console.error(`❌ Lỗi khi lấy root của batch ${batchId} từ Blockchain:`, error.message);
      return null;
    }
  }
}

module.exports = BlockchainService;
