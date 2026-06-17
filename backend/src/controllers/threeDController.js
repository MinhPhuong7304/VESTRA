// Hàm map: Chuyển đổi giá trị thực sang tỉ lệ 0 -> 1
function mapRange(value, min, max) {
    let result = (value - min) / (max - min);
    return Math.min(1, Math.max(0, result)); // Giới hạn kết quả trong khoảng 0-1
}

exports.generate3DAvatar = async (req, res) => {
  try {
    const { gender, height, weight, chest, waist, hips, clothId } = req.body;

    console.log("📐 [3D-Morph] Đang tính toán hình thể 3D:", { height, weight });

    // 1. Tính toán Morph Targets để biến đổi model 3D ở Frontend
    const morphs = {
        fat: mapRange(weight, 60, 120),        // Nặng > 60kg bắt đầu tăng mỡ
        thin: mapRange(weight, 40, 55),        // Nhẹ < 55kg bắt đầu gầy đi
        muscle: 0.2,                           // Mức cơ bắp mặc định
        breast: mapRange(chest, 75, 110),      // Kích thước vòng 1
        waist: mapRange(waist, 60, 100),       // Kích thước vòng 2
        hips: mapRange(hips, 80, 120),         // Kích thước vòng 3
        height: mapRange(height, 150, 190)     // Chiều cao
    };

    // 2. Tính toán BMI và Size khuyến nghị
    const heightInMeter = height / 100;
    const bmi = (weight / (heightInMeter * heightInMeter)).toFixed(1);
    
    let recommendedSize = "M";
    if (chest < 85) recommendedSize = "S";
    else if (chest < 95) recommendedSize = "M";
    else if (chest < 105) recommendedSize = "L";
    else recommendedSize = "XL";

    let analysisText = clothId 
        ? `Với số đo cơ thể, AI đã điều chỉnh mô hình 3D thử đồ cho trang phục này. Size phù hợp: ${recommendedSize}`
        : `Mô hình 3D đã được khởi tạo dựa trên BMI ${bmi} của bạn. Size chuẩn là ${recommendedSize}.`;

    // Giả lập độ trễ xử lý của AI tạo trải nghiệm người dùng chân thực
    await new Promise(resolve => setTimeout(resolve, 800));

    res.json({
        success: true,
        data: {
            morphs: morphs, // Dữ liệu quan trọng nhất để điều khiển xương/morph model 3D
            analysisData: {
                bmi: bmi,
                size: recommendedSize,
                bodyShape: bmi < 18.5 ? "Mảnh mai" : (bmi > 25 ? "Đầy đặn" : "Cân đối"),
                analysis: analysisText
            }
        }
    });

  } catch (error) {
    console.error("❌ Lỗi 3D Controller:", error);
    res.status(500).json({ error: "Lỗi server xử lý 3D" });
  }
};
