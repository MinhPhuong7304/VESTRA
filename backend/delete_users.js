const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const idsToDelete = [
    'usr_1781950577448_t3ii7',
    'usr_1781952945129_v0qld'
  ];

  console.log('🔄 Đang xóa 2 user:', idsToDelete);

  for (const id of idsToDelete) {
    try {
      // Xóa Cart trước vì Cart quan hệ 1-1 Cascade nhưng đôi khi Prisma cần xóa tường minh hoặc để đảm bảo an toàn
      await prisma.cart.deleteMany({ where: { user_id: id } });
      
      const deleted = await prisma.user.delete({
        where: { id }
      });
      console.log(`✅ Đã xóa thành công user: ${deleted.email} (ID: ${id})`);
    } catch (error) {
      console.error(`❌ Lỗi khi xóa user ID ${id}:`, error.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
