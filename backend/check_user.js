const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      user_type: true,
      store_id: true,
      owned_store: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  console.log('--- USERS IN DATABASE ---');
  console.log(JSON.stringify(users, null, 2));

  const vouchers = await prisma.voucher.findMany({
    select: {
      id: true,
      code: true,
      store_id: true
    }
  });
  console.log('--- VOUCHERS IN DATABASE ---');
  console.log(JSON.stringify(vouchers, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
