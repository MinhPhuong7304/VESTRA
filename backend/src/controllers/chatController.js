const Groq = require("groq-sdk");
const prisma = require("../config/prisma");
require("dotenv").config();

let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const formatMoney = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );

// --- 1. LẤY DỮ LIỆU TỪ CSDL POSTGRESQL (NÂNG CẤP THAY THẾ JSON-SERVER) ---
const fetchFromDatabase = async () => {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true
      }
    });
    const vouchers = await prisma.voucher.findMany({
      where: {
        status: "ACTIVE"
      }
    });

    console.log(`✅ [Chat-AI] Đã đọc ${products.length} sản phẩm và ${vouchers.length} voucher từ PostgreSQL`);
    return { products, vouchers };
  } catch (error) {
    console.error("❌ Lỗi khi đọc dữ liệu CSDL cho Chatbot:", error.message);
    return { products: [], vouchers: [] };
  }
};

// --- 2. BỘ LỌC TÌM KIẾM DỮ LIỆU KHỚP ---
const searchData = (keyword, { products, vouchers }) => {
  if (!keyword) return { foundProducts: [], foundVouchers: [] };

  const lowerMessage = keyword.toLowerCase().trim();
  console.log(`🔍 [Chat-AI] Đang quét kho hàng với từ khóa: "${lowerMessage}"`);

  const foundProducts = products.filter((p) => {
    const pID = String(p.id).toLowerCase();
    const pName = String(p.name).toLowerCase();

    // Khớp mã sản phẩm (ví dụ: sp001) hoặc tên sản phẩm
    const isMatchID = lowerMessage.includes(pID);
    const isMatchName = pName.includes(lowerMessage);

    if (isMatchID) console.log(`   -> 🎯 Bắt được ID sản phẩm: ${p.id}`);
    return isMatchID || isMatchName;
  });

  const foundVouchers = vouchers.filter(
    (v) =>
      lowerMessage.includes("voucher") ||
      (v.code && v.code.toLowerCase().includes(lowerMessage))
  );

  return { foundProducts, foundVouchers };
};

// --- 3. CONTROLLER CHATBOT TƯ VẤN THỜI TRANG ---
exports.chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ reply: "Vui lòng nhập tin nhắn." });
    }

    // Lấy trực tiếp từ Database PostgreSQL
    const { products, vouchers } = await fetchFromDatabase();
    const { foundProducts, foundVouchers } = searchData(message, { products, vouchers });

    // Tạo Context để AI trả lời đúng thông tin sản phẩm thực tế
    let context = "";
    if (foundProducts.length > 0) {
      const list = foundProducts
        .slice(0, 3)
        .map((p) => {
          const price = p.price_sale || 0;
          let variantInfo = "";
          if (p.variants && p.variants.length > 0) {
            const colors = [...new Set(p.variants.map((v) => v.color).filter(Boolean))].join(", ");
            const sizes = [...new Set(p.variants.map((v) => v.size).filter(Boolean))].join(", ");
            variantInfo = `(Màu: ${colors || 'Nhiều màu'} - Size: ${sizes || 'Nhiều size'})`;
          }

          return `- [Mã: ${p.id}] ${p.name}
          + Giá bán: ${formatMoney(price)} 
          + Phân loại: ${variantInfo}
          + Mô tả: ${p.description || "Không có mô tả"}
          + Tồn kho: ${p.stock || "Còn hàng"}`;
        })
        .join("\n\n");

      context += `📦 SẢN PHẨM TÌM THẤY TRONG CSDL:\n${list}\n\n`;
    }

    if (foundVouchers.length > 0) {
      const vList = foundVouchers
        .slice(0, 3)
        .map((v) => `- Mã: ${v.code} - Giảm: ${v.discount_type === 'PERCENT' ? v.discount_value + '%' : formatMoney(v.discount_value)}`)
        .join("\n");
      context += `🎫 VOUCHER PHÙ HỢP:\n${vList}\n\n`;
    }

    if (!context) {
      context = "🚫 Không tìm thấy sản phẩm hoặc voucher nào khớp với yêu cầu của khách.";
    }

    const systemPrompt = `
      VAI TRÒ: Trợ lý tư vấn thời trang Vestra (VTOShop).
      
      ❌ ĐIỀU CẤM KỴ:
      1. KHÔNG giải thích lý thuyết dông dài. Khách hỏi "mặc gì đi chơi" -> Gợi ý combo đồ ngay.
      2. KHÔNG chào hỏi rườm rà nếu đã có lịch sử chat trước đó.
      3. KHÔNG trả lời "Không tìm thấy" rồi im lặng. Luôn phải gợi ý sản phẩm tương tự trong danh sách CSDL.
      
      ✅ QUY TẮC PHẢN HỒI:
      1. Đưa ra GỢI Ý CỤ THỂ (ví dụ: Set Baby Tee + Chân váy xếp ly) ngay lập tức.
      2. Tone giọng: Gen Z, năng động, thân thiện, dùng nhiều icon dễ thương (🔥, ✨, 👗).
      3. Xưng "Mình" - gọi "Nàng" (hoặc "Bạn").
      4. Luôn kết thúc bằng một câu hỏi mở để giữ chân khách hàng.

      🛍️ CHIẾN THUẬT LÁI HƯỚNG SẢN PHẨM:
      Nếu trong CSDL không có món đồ khách tìm kiếm chính xác:
      - Nói khéo léo: "Mẫu đó bên mình đang cháy hàng mất rồi, cơ mà nàng nghía qua em [Tên SP Tương Tự] này xem, vibe Y2K y hệt mà mặc tôn dáng cực kỳ! ✨"

      🛒 HƯỚNG DẪN MUA HÀNG:
      - Click trực tiếp vào sản phẩm trên màn hình -> Nhấn "Mua ngay" hoặc "Thêm vào giỏ hàng" để chốt đơn nhanh chóng.

      === CSDL SẢN PHẨM & VOUCHER HIỆN CÓ ===
      ${context}
    `;

    // Nếu không cấu hình API Key, chuyển sang Mock Chat để demo offline
    if (!groq) {
      console.warn("⚠️ GROQ_API_KEY chưa được cấu hình. Trả về câu trả lời giả lập.");
      let replyMock = "Xin chào nàng! ✨ Mình là trợ lý Vestra đây. Hiện tại hệ thống đang chạy ở chế độ offline, nhưng nàng hoàn toàn có thể click vào danh mục để chọn đồ và trải nghiệm thử đồ 3D cực xịn xò nha! 💖";
      if (foundProducts.length > 0) {
        replyMock = `Ái chà, mẫu ${foundProducts[0].name} này mặc đi cafe chụp hình là hết sẩy luôn á! Nàng click vào hình để xem chi tiết và ướm thử 3D xem có vừa vặn không nhé. Nàng cần mình tư vấn thêm gì không nè? 🔥`;
      }
      return res.json({ reply: replyMock });
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      })),
      { role: "user", content: message },
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 500,
    });

    return res.json({ reply: completion.choices[0]?.message?.content });

  } catch (error) {
    console.error("❌ Lỗi chatbot:", error.message);
    return res.status(500).json({ reply: "Lỗi hệ thống chatbot thời trang." });
  }
};
