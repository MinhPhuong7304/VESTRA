const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const prisma = require('../config/prisma');
const { createCustodialWallet } = require('../web3/walletHelper');

/**
 * Hàm kiểm tra mã Turnstile từ Cloudflare
 * - Dev: bỏ qua (luôn pass)
 * - Production: xác thực thật với CLOUDFLARE_TURNSTILE_SECRET_KEY
 */
const verifyTurnstile = async (token, ip) => {
  // Bỏ qua hoàn toàn trong môi trường phát triển
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️  [Dev] Bỏ qua Turnstile trong môi trường dev.');
    return true;
  }

  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secretKey || !token) return false;

  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({ secret: secretKey, response: token, remoteip: ip })
    );
    return response.data.success === true;
  } catch (err) {
    console.error('⚠️ Lỗi gọi API Cloudflare Turnstile:', err.message);
    return false;
  }
};

/**
 * Đăng ký người dùng mới
 * Tự động tạo ví giám hộ Web 2.5 (wallet_address) lưu vào DB
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, phone, full_name, gender, birth_date, user_type, turnstile_token } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email và mật khẩu là bắt buộc." });
    }

    // 1. Xác thực Cloudflare Turnstile
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const isHuman = await verifyTurnstile(turnstile_token, ip);
    if (!isHuman) {
      return res.status(400).json({ error: "Xác thực bảo mật Cloudflare Turnstile thất bại hoặc không hợp lệ." });
    }

    // 2. Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email này đã được đăng ký sử dụng." });
    }

    // 3. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Tạo ví ngầm Custodial Wallet (Web 2.5)
    const wallet = createCustodialWallet();
    console.log(`🔑 Đã tạo ví ngầm cho ${email}: ${wallet.address}`);

    // 5. Lưu User vào database
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

    // 6. Tạo token JWT
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
        user_type: newUser.user_type,
        store_id: newUser.store_id
      }
    });

  } catch (error) {
    console.error("🔴 Lỗi đăng ký:", error);
    next(error);
  }
};

/**
 * Đăng nhập hệ thống
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, turnstile_token } = req.body;

    // 🔍 DEBUG - xem chính xác browser gửi gì
    console.log('\n📩 [Login Request]', {
      email: JSON.stringify(email),
      pass_len: password?.length,
      pass_first4: password?.slice(0, 4),
      node_env: process.env.NODE_ENV,
      has_turnstile: !!turnstile_token,
    });

    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng cung cấp đầy đủ email và mật khẩu." });
    }

    // 1. Xác thực Cloudflare Turnstile
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const isHuman = await verifyTurnstile(turnstile_token, ip);
    console.log('🛡️ [Turnstile] result:', isHuman);
    if (!isHuman) {
      return res.status(400).json({ error: "Xác thực bảo mật Cloudflare Turnstile thất bại hoặc không hợp lệ." });
    }

    // 2. Tìm user theo email (trim để tránh space tồn đầu/cuối)
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    console.log('🔍 [User found]', user ? `${user.email} (${user.user_type})` : 'NOT FOUND');
    if (!user) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác." });
    }

    // 3. So sánh mật khẩu (trim để loại ky tự ẩn do copy-paste)
    const cleanPassword = password.trim();
    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    console.log('🔑 [bcrypt]', isMatch ? 'MATCH ✅' : 'NO MATCH ❌', `(len: ${cleanPassword.length})`);
    if (!isMatch) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác." });
    }

    // 4. Sinh token JWT
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
        user_type: user.user_type,
        store_id: user.store_id
      }
    });
  } catch (error) {
    console.error("🔴 Lỗi đăng nhập:", error);
    next(error);
  }
};

/**
 * Đăng nhập/Đăng ký thông qua Google & Facebook (Mạng xã hội)
 */
exports.socialLogin = async (req, res, next) => {
  try {
    const { email, fullName, avatarUrl, provider, turnstile_token } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email là thông tin bắt buộc từ Mạng xã hội." });
    }

    // 1. Xác thực Cloudflare Turnstile
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const isHuman = await verifyTurnstile(turnstile_token, ip);
    if (!isHuman) {
      return res.status(400).json({ error: "Xác thực bảo mật Cloudflare Turnstile thất bại hoặc không hợp lệ." });
    }

    // 2. Tìm kiếm User theo Email nhận được từ Google/Facebook
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // 3. Nếu chưa tồn tại -> Tự động đăng ký tài khoản mới và tạo Ví Blockchain
      const wallet = createCustodialWallet();
      console.log(`🔑 Đã tạo ví ngầm cho người dùng mạng xã hội (${provider}) ${email}: ${wallet.address}`);

      user = await prisma.user.create({
        data: {
          id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          username: `${email.split('@')[0]}_${Math.random().toString(36).substr(2, 3)}`,
          email,
          full_name: fullName || email.split('@')[0],
          avatar_url: avatarUrl || null,
          user_type: 'customer',
          wallet_address: wallet.address, // Lưu địa chỉ ví ngầm
        }
      });
    } else {
      // 4. Nếu đã tồn tại -> Cập nhật ảnh đại diện nếu chưa có
      if (!user.avatar_url && avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar_url: avatarUrl }
        });
      }
    }

    // 5. Tạo token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: `Đăng nhập thành công bằng tài khoản ${provider === 'google' ? 'Google' : 'Facebook'}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wallet_address: user.wallet_address,
        user_type: user.user_type,
        store_id: user.store_id
      }
    });

  } catch (error) {
    console.error("🔴 Lỗi đăng nhập mạng xã hội:", error);
    next(error);
  }
};
