const axios = require('axios');
const FormData = require('form-data');
require("dotenv").config();

exports.tryOnClothes = async (req, res) => {
  let userImageBuffer = null;
  let clothImageBuffer = null;

  try {
    console.log("👗 [Try-On] Bắt đầu xử lý ảnh 2D...");

    // 1. Kiểm tra ảnh người dùng
    if (req.files && req.files['userImage'] && req.files['userImage'][0]) {
      userImageBuffer = req.files['userImage'][0].buffer;
    } else {
      return res.status(400).json({ error: "Thiếu ảnh người dùng (userImage)" });
    }

    // 2. Kiểm tra ảnh quần áo (File tải lên hoặc URL)
    if (req.files && req.files['clothImage'] && req.files['clothImage'][0]) {
      console.log("👕 Nhận quần áo từ: File Upload");
      clothImageBuffer = req.files['clothImage'][0].buffer;
    } else if (req.body.clothUrl) {
      console.log("🔗 Nhận quần áo từ: URL", req.body.clothUrl);
      try {
        const response = await axios.get(req.body.clothUrl, { responseType: 'arraybuffer' });
        clothImageBuffer = Buffer.from(response.data, 'binary');
      } catch (err) {
        console.error("❌ Lỗi tải ảnh từ URL:", err.message);
        return res.status(400).json({ error: "Không thể tải ảnh quần áo từ link này." });
      }
    } else {
      return res.status(400).json({ error: "Thiếu ảnh quần áo (Gửi file clothImage hoặc link clothUrl)" });
    }

    // 3. Chuẩn bị dữ liệu gửi tới external API
    const formData = new FormData();
    formData.append('image', userImageBuffer, { filename: 'user.jpg' });
    formData.append('image-apparel', clothImageBuffer, { filename: 'cloth.jpg' });

    const options = {
      method: 'POST',
      url: process.env.RAPID_API_URL,
      headers: {
        'X-RapidAPI-Key': process.env.RAPID_API_KEY,
        'X-RapidAPI-Host': process.env.RAPID_API_HOST,
        ...formData.getHeaders()
      },
      data: formData
    };

    console.log("⏳ Đang gửi yêu cầu xử lý sang RapidAPI...");
    let resultData = null;

    try {
      const response = await axios.request(options);
      const data = response.data;

      if (data.results && data.results[0] && data.results[0].entities && data.results[0].entities[0]) {
        resultData = data.results[0].entities[0].image;
      } else if (data.url) {
        resultData = data.url;
      } else if (data.result_url) {
        resultData = data.result_url;
      } else if (typeof data === 'string') {
        resultData = data;
      }
    } catch (apiError) {
      console.warn("⚠️ API ngoài gặp lỗi hoặc hết hạn gói thử: ", apiError.message);
    }

    // 4. Nếu API ngoài không hoạt động, chuyển sang Mock Mode (trả về ảnh người gốc)
    if (!resultData) {
      console.log("⚠️ Sử dụng chế độ giả lập (trả về base64 của ảnh người dùng)");
      resultData = `data:image/jpeg;base64,${userImageBuffer.toString('base64')}`;
    }

    let finalResult = resultData;
    if (resultData && !resultData.startsWith('http') && !resultData.startsWith('data:image')) {
      finalResult = `data:image/jpeg;base64,${resultData}`;
    }

    console.log("🎉 Thử đồ 2D hoàn tất!");
    return res.json({ result: finalResult });

  } catch (error) {
    console.error("❌ Lỗi Controller:", error.message);
    return res.status(500).json({ error: "Lỗi xử lý thử đồ phía Server" });
  }
};
