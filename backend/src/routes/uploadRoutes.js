const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Không tìm thấy tệp tin để tải lên." });
    }

    // Convert file buffer to Base64 data URI
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    console.log(`☁️ [Cloudinary] Đang tải ảnh lên thư mục vestra_media...`);
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: 'vestra_media',
    });

    console.log(`✅ [Cloudinary] Đã tải ảnh lên thành công: ${result.secure_url}`);
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error("❌ Lỗi upload Cloudinary:", error);
    next(error);
  }
});

module.exports = router;
