const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
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

    // Convert file buffer to Base64 data URI for Cloudinary
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    console.log(`☁️ [Cloudinary] Đang tải ảnh lên thư mục vestra_media...`);
    try {
      let result;
      if (process.env.CLOUDINARY_UPLOAD_PRESET) {
        console.log(`☁️ [Cloudinary] Sử dụng unsigned upload preset: ${process.env.CLOUDINARY_UPLOAD_PRESET}`);
        result = await cloudinary.uploader.unsigned_upload(fileBase64, process.env.CLOUDINARY_UPLOAD_PRESET, {
          folder: 'vestra_media',
        });
      } else {
        console.log(`☁️ [Cloudinary] Sử dụng signed upload`);
        result = await cloudinary.uploader.upload(fileBase64, {
          folder: 'vestra_media',
        });
      }
      
      console.log(`✅ [Cloudinary] Đã tải ảnh lên thành công: ${result.secure_url}`);
      return res.json({ url: result.secure_url });
    } catch (cloudinaryError) {
      console.warn("⚠️ [Cloudinary] Lỗi kết nối Cloudinary (Cấu hình sai hoặc API Key không hợp lệ). Chuyển hướng lưu tệp cục bộ:", cloudinaryError.message);
      
      // Local fallback
      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
      const localDirPath = path.join(__dirname, '../../uploads');
      
      // Ensure local upload directory exists
      if (!fs.existsSync(localDirPath)) {
        fs.mkdirSync(localDirPath, { recursive: true });
      }
      
      const localFilePath = path.join(localDirPath, filename);
      fs.writeFileSync(localFilePath, req.file.buffer);
      
      // Return local URL
      const localUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      console.log(`✅ [Local Upload] Đã lưu tệp cục bộ thành công: ${localUrl}`);
      return res.json({ url: localUrl });
    }
  } catch (error) {
    console.error("❌ Lỗi upload tệp:", error);
    next(error);
  }
});

module.exports = router;
