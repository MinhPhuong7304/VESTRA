const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const nodemailer = require('nodemailer');
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
 * Gửi email chứa mã OTP đăng ký mới
 */
const sendRegistrationOTPEmail = async (email, otp) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"VESTRA Support" <${SMTP_USER}>`,
        to: email,
        subject: "[VESTRA] Xác thực tài khoản đăng ký mới",
        text: `Mã OTP kích hoạt tài khoản của bạn là: ${otp}. Mã này có hiệu lực trong vòng 15 phút.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px;">Chào mừng bạn đến với VESTRA</h2>
            <p>Cảm ơn bạn đã lựa chọn đăng ký tài khoản tại Vestra. Vui lòng nhập mã OTP dưới đây để hoàn tất việc xác minh địa chỉ email và kích hoạt tài khoản:</p>
            <div style="font-size: 26px; font-weight: bold; text-align: center; background-color: #f3f4f6; padding: 15px; margin: 25px 0; border-radius: 8px; letter-spacing: 5px; color: #4f46e5;">
              ${otp}
            </div>
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">Mã OTP này có hiệu lực trong vòng 15 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
          </div>
        `,
      });
      console.log(`✉️ [Mail Server] Đã gửi mã OTP đăng ký thành công đến ${email}`);
      return true;
    } catch (mailError) {
      console.error("🔴 Lỗi gửi mail đăng ký qua SMTP:", mailError);
    }
  }

  // Fallback: Console Logging for Dev/Local Environment
  console.log(`\n======================================================`);
  console.log(`✉️  [SMTP SIMULATION] OTP ĐĂNG KÝ GỬI TỚI EMAIL: ${email}`);
  console.log(`🔑  MÃ OTP XÁC NHẬN: ${otp}`);
  console.log(`======================================================\n`);
  return false;
};

/**
 * Đăng ký người dùng mới - Tạo tài khoản trạng thái pending và gửi OTP
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, phone, full_name, gender, birth_date, user_type, turnstile_token } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email và mật khẩu là bắt buộc." });
    }

    // 1. Kiểm tra định dạng số điện thoại (bắt đầu bằng 0, chỉ có số, đúng 10 số)
    if (phone) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({ error: "Số điện thoại không hợp lệ. Phải bắt đầu bằng số 0, chỉ gồm số và có đúng 10 chữ số." });
      }
    }

    // 2. Kiểm tra định dạng mật khẩu (tối thiểu 6 ký tự, gồm cả chữ và số)
    const cleanPassword = password.trim();
    if (cleanPassword.length < 6) {
      return res.status(400).json({ error: "Mật khẩu phải tối thiểu 6 ký tự." });
    }
    const hasLetter = /[a-zA-Z]/.test(cleanPassword);
    const hasDigit = /\d/.test(cleanPassword);
    if (!hasLetter || !hasDigit) {
      return res.status(400).json({ error: "Mật khẩu phải chứa cả chữ và số." });
    }

    // 1. Xác thực Cloudflare Turnstile
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const isHuman = await verifyTurnstile(turnstile_token, ip);
    if (!isHuman) {
      return res.status(400).json({ error: "Xác thực bảo mật Cloudflare Turnstile thất bại hoặc không hợp lệ." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser && existingUser.account_status !== 'pending') {
      return res.status(400).json({ error: "Email này đã được đăng ký sử dụng." });
    }

    // Kiểm tra tên tài khoản (username) đã tồn tại chưa
    if (username) {
      const duplicateUsername = await prisma.user.findFirst({
        where: {
          username: username.trim(),
          NOT: { email: cleanEmail }
        }
      });
      if (duplicateUsername) {
        return res.status(400).json({ error: "Tên tài khoản này đã được sử dụng." });
      }
    }

    // Kiểm tra số điện thoại (phone) đã tồn tại chưa
    if (phone) {
      const duplicatePhone = await prisma.user.findFirst({
        where: {
          phone: phone.trim(),
          NOT: { email: cleanEmail }
        }
      });
      if (duplicatePhone) {
        return res.status(400).json({ error: "Số điện thoại này đã được đăng ký sử dụng." });
      }
    }

    // Sinh mã OTP 6 chữ số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60 giây hết hạn
    const hashedPassword = await bcrypt.hash(password, 10);

    let targetUserId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    if (existingUser) {
      // Nếu là tài khoản đang chờ kích hoạt, cập nhật lại thông tin mới nhất và cấp lại OTP
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: username || cleanEmail.split('@')[0],
          password: hashedPassword,
          phone,
          full_name,
          gender,
          birth_date,
          user_type: user_type || 'customer',
          otp_code: otp,
          otp_expires_at: expiresAt
        }
      });
      targetUserId = existingUser.id;
    } else {
      // Lưu User vào database với trạng thái pending
      await prisma.user.create({
        data: {
          id: targetUserId,
          username: username || cleanEmail.split('@')[0],
          email: cleanEmail,
          password: hashedPassword,
          phone,
          full_name,
          gender,
          birth_date,
          user_type: user_type || 'customer',
          account_status: 'pending',
          otp_code: otp,
          otp_expires_at: expiresAt
        }
      });
    }

    // Gửi email chứa OTP đăng ký
    const isRealSent = await sendRegistrationOTPEmail(cleanEmail, otp);

    res.status(200).json({
      success: true,
      message: isRealSent
        ? `Mã xác thực OTP đã được gửi đến email ${cleanEmail}. Vui lòng xác thực tài khoản.`
        : `Gửi mã OTP đăng ký thành công! (Môi trường Test: Mã OTP là ${otp} - Xem ở console log backend)`,
      isPending: true,
      email: cleanEmail
    });

  } catch (error) {
    console.error("🔴 Lỗi đăng ký:", error);
    next(error);
  }
};

/**
 * Xác nhận mã OTP đăng ký để kích hoạt tài khoản
 */
exports.verifyRegisterOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Vui lòng cung cấp email và mã OTP." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản người dùng." });
    }

    if (user.account_status !== 'pending') {
      return res.status(400).json({ error: "Tài khoản này đã được kích hoạt trước đó." });
    }

    // Kiểm tra OTP
    if (!user.otp_code || user.otp_code !== otp.trim()) {
      return res.status(400).json({ error: "Mã OTP không chính xác." });
    }

    // Kiểm tra hết hạn
    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: "Mã OTP đã hết hạn sử dụng (quá 60 giây). Vui lòng yêu cầu gửi lại mã mới." });
    }

    // Tạo ví ngầm Custodial Wallet (Web 2.5) cho người dùng
    const wallet = createCustodialWallet();
    console.log(`🔑 Kích hoạt tài khoản - Đã tạo ví ngầm cho ${cleanEmail}: ${wallet.address}`);

    // Cập nhật trạng thái người dùng thành active và lưu địa chỉ ví
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        account_status: 'active',
        wallet_address: wallet.address,
        otp_code: null,
        otp_expires_at: null
      }
    });

    // Tạo token JWT
    const token = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email, userType: updatedUser.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Tài khoản của bạn đã được kích hoạt thành công!",
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        phone: updatedUser.phone,
        gender: updatedUser.gender,
        birth_date: updatedUser.birth_date,
        avatar_url: updatedUser.avatar_url,
        avatar_3d_url: updatedUser.avatar_3d_url,
        body_image_url: updatedUser.body_image_url,
        wallet_address: updatedUser.wallet_address,
        user_type: updatedUser.user_type,
        store_id: updatedUser.store_id,
        bank_name: updatedUser.bank_name,
        bank_account_number: updatedUser.bank_account_number,
        bank_account_name: updatedUser.bank_account_name
      }
    });

  } catch (error) {
    console.error("🔴 Lỗi xác nhận OTP kích hoạt tài khoản:", error);
    next(error);
  }
};

/**
 * Gửi lại mã OTP đăng ký mới (Hạn dùng 60s)
 */
exports.resendRegisterOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Vui lòng cung cấp email." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản người dùng." });
    }

    if (user.account_status !== 'pending') {
      return res.status(400).json({ error: "Tài khoản này đã được kích hoạt trước đó." });
    }

    // Sinh mã OTP 6 chữ số ngẫu nhiên mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60 giây hết hạn

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp_code: otp,
        otp_expires_at: expiresAt
      }
    });

    const isRealSent = await sendRegistrationOTPEmail(cleanEmail, otp);

    res.json({
      success: true,
      message: isRealSent
        ? `Mã xác thực OTP mới đã được gửi đến email ${cleanEmail}.`
        : `Gửi lại mã OTP đăng ký thành công! (Môi trường Test: Mã OTP là ${otp})`,
      email: cleanEmail
    });

  } catch (error) {
    console.error("🔴 Lỗi gửi lại mã OTP đăng ký:", error);
    next(error);
  }
};

/**
 * Đăng nhập hệ thống
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, turnstile_token } = req.body;

    console.log('\n📩 [Login Request]', {
      email: JSON.stringify(email),
      pass_len: password?.length,
      node_env: process.env.NODE_ENV,
      has_turnstile: !!turnstile_token,
    });

    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng cung cấp đầy đủ email và mật khẩu." });
    }

    // 1. Xác thực Cloudflare Turnstile
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const isHuman = await verifyTurnstile(turnstile_token, ip);
    if (!isHuman) {
      return res.status(400).json({ error: "Xác thực bảo mật Cloudflare Turnstile thất bại hoặc không hợp lệ." });
    }

    // 2. Tìm user theo email
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác." });
    }

    // 3. So sánh mật khẩu
    const cleanPassword = password.trim();
    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác." });
    }

    // 4. Kiểm tra trạng thái kích hoạt tài khoản
    if (user.account_status === 'pending') {
      return res.status(400).json({
        error: "Tài khoản chưa được xác thực Email. Vui lòng điền mã OTP để kích hoạt.",
        requireVerification: true,
        email: user.email
      });
    }

    // 5. Sinh token JWT
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
        full_name: user.full_name,
        phone: user.phone,
        gender: user.gender,
        birth_date: user.birth_date,
        avatar_url: user.avatar_url,
        avatar_3d_url: user.avatar_3d_url,
        body_image_url: user.body_image_url,
        wallet_address: user.wallet_address,
        user_type: user.user_type,
        store_id: user.store_id,
        bank_name: user.bank_name,
        bank_account_number: user.bank_account_number,
        bank_account_name: user.bank_account_name
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

/**
 * Đổi mật khẩu tài khoản
 */
exports.changePassword = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Chưa cung cấp token xác thực hoặc token không hợp lệ.' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Token xác thực hết hạn hoặc không hợp lệ.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu cũ không chính xác.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    res.json({ success: true, message: 'Thay đổi mật khẩu thành công!' });
  } catch (error) {
    console.error("🔴 Lỗi đổi mật khẩu:", error);
    next(error);
  }
};

/**
 * Gửi email chứa mã OTP khôi phục mật khẩu
 */
const sendOTPEmail = async (email, otp) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"VESTRA Support" <${SMTP_USER}>`,
        to: email,
        subject: "[VESTRA] Mã OTP xác nhận đặt lại mật khẩu",
        text: `Mã OTP khôi phục mật khẩu của bạn là: ${otp}. Mã này có hiệu lực trong vòng 10 phút.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px;">Khôi Phục Mật Khẩu VESTRA</h2>
            <p>Chào bạn,</p>
            <p>Chúng tôi đã nhận được yêu cầu lấy lại mật khẩu cho tài khoản liên kết với email này. Vui lòng sử dụng mã OTP dưới đây để tiến hành thiết lập mật khẩu mới:</p>
            <div style="font-size: 26px; font-weight: bold; text-align: center; background-color: #f3f4f6; padding: 15px; margin: 25px 0; border-radius: 8px; letter-spacing: 5px; color: #4f46e5;">
              ${otp}
            </div>
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">Mã OTP này chỉ có hiệu lực trong vòng 10 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này để giữ an toàn cho tài khoản.</p>
          </div>
        `,
      });
      console.log(`✉️ [Mail Server] Đã gửi mã OTP thành công đến ${email}`);
      return true;
    } catch (mailError) {
      console.error("🔴 Lỗi gửi mail qua SMTP:", mailError);
    }
  }

  // Fallback: Console Logging for Dev/Local Environment
  console.log(`\n======================================================`);
  console.log(`✉️  [SMTP SIMULATION] OTP GỬI TỚI EMAIL: ${email}`);
  console.log(`🔑  MÃ OTP XÁC NHẬN: ${otp}`);
  console.log(`======================================================\n`);
  return false;
};

/**
 * Quên mật khẩu - Tạo và gửi OTP
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
    }

    // Sinh mã OTP 6 chữ số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000); // Hết hạn sau 60 giây

    // Cập nhật mã OTP vào cơ sở dữ liệu
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp_code: otp,
        otp_expires_at: expiresAt
      }
    });

    // Gửi email chứa OTP
    const isRealSent = await sendOTPEmail(user.email, otp);

    res.json({ 
      success: true, 
      message: isRealSent 
        ? `Mã OTP đã được gửi đến email ${user.email}!`
        : `Yêu cầu gửi OTP thành công! (Môi trường Test: Mã OTP là ${otp} - Xem thêm ở console log backend)`
    });
  } catch (error) {
    console.error("🔴 Lỗi quên mật khẩu:", error);
    next(error);
  }
};

/**
 * Xác minh OTP và Đặt lại mật khẩu mới
 */
exports.resetPasswordOtp = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin: Email, mã OTP và Mật khẩu mới.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
    }

    // Kiểm tra tính hợp lệ của mã OTP
    if (!user.otp_code || user.otp_code !== otp.trim()) {
      return res.status(400).json({ error: 'Mã OTP không chính xác.' });
    }

    // Kiểm tra hết hạn mã OTP
    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'Mã OTP đã hết hạn sử dụng (quá 60 giây). Vui lòng yêu cầu gửi lại mã mới.' });
    }

    // Hash mật khẩu mới
    const hash = await bcrypt.hash(newPassword, 10);

    // Lưu mật khẩu mới và xóa mã OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        otp_code: null,
        otp_expires_at: null
      }
    });

    res.json({ success: true, message: 'Đặt lại mật khẩu của bạn thành công!' });
  } catch (error) {
    console.error("🔴 Lỗi xác nhận OTP đặt lại mật khẩu:", error);
    next(error);
  }
};
