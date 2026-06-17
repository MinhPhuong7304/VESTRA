// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VestraLedger
 * @dev Hợp đồng thông minh lưu trữ mã gốc Merkle (Merkle Root Hash) của sàn TMĐT Vestra
 * Giúp minh bạch hóa toàn bộ lịch sử phân chia doanh thu, phí sàn và hoa hồng
 */
contract VestraLedger {
    address public owner;
    
    // Mapping từ Batch ID (thường là định dạng ngày YYYYMMDD) -> Merkle Root Hash
    mapping(string => bytes32) private batchRoots;
    
    // Mapping từ Batch ID -> Thời gian khối khi cập nhật (Timestamp)
    mapping(string => uint256) private batchTimestamps;

    // Sự kiện được kích hoạt khi một Batch được chốt lên chuỗi thành công
    event BatchSubmitted(string indexed batchId, bytes32 indexed rootHash, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "VestraLedger: Quyen truy cap chi danh cho chu so huu");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Chốt Merkle Root Hash cho một lô giao dịch ngày (Batch)
     * @param batchId ID định danh của lô (ví dụ: "20260617")
     * @param rootHash Mã băm Merkle Root 32-byte
     */
    function submitBatch(string calldata batchId, bytes32 rootHash) external onlyOwner {
        require(batchRoots[batchId] == bytes32(0), "VestraLedger: Batch nay da duoc chot tren chuoi");
        require(rootHash != bytes32(0), "VestraLedger: Root hash khong the bang khong");
        
        batchRoots[batchId] = rootHash;
        batchTimestamps[batchId] = block.timestamp;
        
        emit BatchSubmitted(batchId, rootHash, block.timestamp);
    }
    
    /**
     * @dev Lấy Merkle Root Hash của một Batch ID
     */
    function getBatchRoot(string calldata batchId) external view returns (bytes32) {
        return batchRoots[batchId];
    }

    /**
     * @dev Lấy thời điểm chốt block của một Batch ID
     */
    function getBatchTimestamp(string calldata batchId) external view returns (uint256) {
        return batchTimestamps[batchId];
    }
}
