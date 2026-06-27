const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const accounts = ['admin@vestra.com', 'seller@vestra.com', 'customer@vestra.com'];
  
  for (const email of accounts) {
    const u = await p.user.findUnique({ where: { email } });
    if (!u) {
      console.log(`❌ ${email}: KHÔNG TỒN TẠI trong DB`);
      continue;
    }
    const match = await bcrypt.compare('password123', u.password || '');
    console.log(`${match ? '✅' : '❌'} ${email} | user_type: ${u.user_type} | bcrypt match: ${match}`);
  }
  
  await p.$disconnect();
}

check();
