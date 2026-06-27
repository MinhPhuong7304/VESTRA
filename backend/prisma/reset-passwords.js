/**
 * Script reset mật khẩu tài khoản test về password123
 * Chạy: node prisma/reset-passwords.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'password123';
  const hash = await bcrypt.hash(newPassword, 10);

  const accounts = [
    { email: 'admin@vestra.com',    user_type: 'admin'    },
    { email: 'seller@vestra.com',   user_type: 'shop'     },
    { email: 'customer@vestra.com', user_type: 'customer' },
  ];

  for (const acc of accounts) {
    const result = await prisma.user.updateMany({
      where: { email: acc.email },
      data:  { password: hash, user_type: acc.user_type },
    });

    if (result.count > 0) {
      console.log(`✅ Reset mật khẩu thành công: ${acc.email}`);
    } else {
      // Tài khoản chưa tồn tại → tạo mới
      await prisma.user.create({
        data: {
          id:             `usr_${acc.user_type}`,
          username:       `${acc.user_type}_vestra`,
          email:          acc.email,
          password:       hash,
          full_name:      acc.email.split('@')[0],
          user_type:      acc.user_type,
          wallet_address: `0x${acc.user_type.padEnd(40, '0').slice(0, 40)}`,
        },
      });
      console.log(`🆕 Tạo mới tài khoản: ${acc.email}`);
    }
  }

  console.log('\n📋 Thông tin đăng nhập test:');
  console.log('   admin@vestra.com    / password123  →  /admin');
  console.log('   seller@vestra.com   / password123  →  /profile');
  console.log('   customer@vestra.com / password123  →  /profile');
}

main()
  .catch((e) => { console.error('❌ Lỗi:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
