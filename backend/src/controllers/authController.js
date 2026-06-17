const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { createCustodialWallet } = require('../web3/walletHelper');

/**
 * Đăng ký người dùng mới
 * Tự động tạo ví giám hộ Web 2.5 (wallet_address) lưu vào DB
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, phone, full_name, gender, birth_date, user_type } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email và mật khẩu là bắt buộc." });
    }

    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email này đã được đăng ký sử dụng." });
    }

    // 2. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Tạo ví ngầm Custodial Wallet (Web 2.5)
    const wallet = createCustodialWallet();
    console.log(`🔑 Đã tạo ví ngầm cho ${email}: ${wallet.address}`);

    // 4. Lưu User vào database
    const newUser = await prisma.user.create({
      data: {
        id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        username: username || email.split('@')[0],
        email,
        password: hashedPassword,
        phone,
        full_name,
        gender,
        birth_date,
        user_type: user_type || 'customer',
        wallet_address: wallet.address, // Lưu địa chỉ ví công khai
      }
    });

    // 5. Tạo token JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, userType: newUser.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công!",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        wallet_address: newUser.wallet_address,
        user_type: newUser.user_type
      }
    });

  } catch (error) {
    console.error("❌ Lỗi đăng ký:", error);
    next(error);
  }
};

/**
 * Đăng nhập hệ thống
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng cung cấp đầy đủ email và mật khẩu." });
    }

    // 1. Tìm user theo email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác." });
    }

    // 2. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác." });
    }

    // 3. Sinh token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Đăng nhập thành công!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wallet_address: user.wallet_address,
        user_type: user.user_type
      }
    });
  } catch (error) {
    console.error("❌ Lỗi đăng nhập:", error);
    next(error);
  }
};
