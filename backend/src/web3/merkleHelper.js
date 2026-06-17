const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

class MerkleHelper {
  /**
   * Băm một đối tượng giao dịch tài chính thành mã hash 32-byte (Buffer)
   * @param {object} tx - Giao dịch cần băm
   * @returns {Buffer}
   */
  static hashTransaction(tx) {
    const dataStr = `${tx.id}-${tx.order_id || ''}-${tx.transaction_type}-${tx.amount}-${tx.sender_address}-${tx.receiver_address}`;
    return keccak256(dataStr);
  }

  /**
   * Tạo Merkle Tree từ danh sách giao dịch
   * @param {Array<object>} transactions - Danh sách giao dịch
   * @returns {MerkleTree}
   */
  static createTree(transactions) {
    const leaves = transactions.map(tx => this.hashTransaction(tx));
    return new MerkleTree(leaves, keccak256, { sortPairs: true });
  }

  /**
   * Lấy Merkle Root Hash dưới dạng chuỗi hex có prefix 0x
   * @param {Array<object>} transactions 
   * @returns {string}
   */
  static getRoot(transactions) {
    if (!transactions || transactions.length === 0) {
      return '0x0000000000000000000000000000000000000000000000000000000000000000';
    }
    const tree = this.createTree(transactions);
    return '0x' + tree.getRoot().toString('hex');
  }

  /**
   * Sinh Merkle Proof cho một giao dịch cụ thể
   * @param {Array<object>} transactions 
   * @param {object} targetTx 
   * @returns {Array<string>}
   */
  static getProof(transactions, targetTx) {
    const tree = this.createTree(transactions);
    const leaf = this.hashTransaction(targetTx);
    const proof = tree.getProof(leaf);
    return proof.map(p => '0x' + p.data.toString('hex'));
  }

  /**
   * Xác thực tính hợp lệ của một giao dịch bằng Merkle Proof cục bộ (tương thích Solidity MerkleProof.verify)
   * @param {string} root - Root hash trên chuỗi
   * @param {object} targetTx - Giao dịch cần xác thực
   * @param {Array<string>} proof - Mảng mã proof
   * @returns {boolean}
   */
  static verifyTransaction(root, targetTx, proof) {
    try {
      const leaf = this.hashTransaction(targetTx);
      let currentHash = leaf;

      for (let i = 0; i < proof.length; i++) {
        const proofElement = Buffer.from(proof[i].replace('0x', ''), 'hex');
        
        // Sắp xếp các nút con để khớp với OpenZeppelin MerkleProof.sol (sortPairs: true)
        if (Buffer.compare(currentHash, proofElement) <= 0) {
          currentHash = keccak256(Buffer.concat([currentHash, proofElement]));
        } else {
          currentHash = keccak256(Buffer.concat([proofElement, currentHash]));
        }
      }

      const calculatedRoot = '0x' + currentHash.toString('hex');
      return calculatedRoot.toLowerCase() === root.toLowerCase();
    } catch (err) {
      console.error("❌ Lỗi khi verify Merkle Proof:", err);
      return false;
    }
  }
}

module.exports = MerkleHelper;
