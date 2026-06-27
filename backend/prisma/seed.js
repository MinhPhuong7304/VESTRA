const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu Seeding dữ liệu mẫu cho hệ thống Vestra...');

  // 1. Tạo tài khoản mẫu
  console.log('👤 Đang khởi tạo tài khoản mẫu...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vestra.com' },
    update: { password: hashedPassword, user_type: 'admin' }, // luôn cập nhật password khi seed lại
    create: {
      id: 'usr_admin',
      username: 'admin_vestra',
      email: 'admin@vestra.com',
      password: hashedPassword,
      full_name: 'Quản trị viên Vestra',
      user_type: 'admin',
      wallet_address: '0x1111111111111111111111111111111111111111',
    }
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@vestra.com' },
    update: { password: hashedPassword, user_type: 'shop' },
    create: {
      id: 'usr_seller',
      username: 'seller_vestra',
      email: 'seller@vestra.com',
      password: hashedPassword,
      full_name: 'Shop Thời Trang Y2K',
      user_type: 'shop',
      wallet_address: '0x2222222222222222222222222222222222222222',
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@vestra.com' },
    update: { password: hashedPassword, user_type: 'customer' },
    create: {
      id: 'usr_customer',
      username: 'customer_vestra',
      email: 'customer@vestra.com',
      password: hashedPassword,
      full_name: 'Nguyễn Văn Khách',
      user_type: 'customer',
      wallet_address: '0x3333333333333333333333333333333333333333',
    }
  });

  // 2. Tạo gian hàng Store mẫu
  console.log('🏪 Đang khởi tạo Shop mẫu...');
  const store = await prisma.store.upsert({
    where: { id: 'store_01' },
    update: {},
    create: {
      id: 'store_01',
      name: 'Vestra Official Boutique',
      description: 'Gian hàng thời trang cao cấp của Vestra',
      logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
      owner_id: seller.id,
      wallet_address: '0x4444444444444444444444444444444444444444',
      status: 'Hoạt động',
    }
  });

  // Liên kết shop với user seller
  await prisma.user.update({
    where: { id: seller.id },
    data: { store_id: store.id }
  });

  // 3. Tạo danh mục sản phẩm (Categories)
  console.log('📂 Đang tạo danh mục hàng...');
  const catY2K = await prisma.category.upsert({
    where: { id: 'cat_y2k' },
    update: {},
    create: {
      id: 'cat_y2k',
      name: 'Thời trang Y2K',
      description: 'Phong cách cá tính, năng động xu hướng những năm 2000',
      images: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300',
      isActive: true,
    }
  });

  const catDresses = await prisma.category.upsert({
    where: { id: 'cat_dresses' },
    update: {},
    create: {
      id: 'cat_dresses',
      name: 'Đầm tiệc & Cao cấp',
      description: 'Sang trọng, quyến rũ cho các dịp đặc biệt',
      images: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300',
      isActive: true,
    }
  });

  // 4. Tạo mã giảm giá (Vouchers)
  console.log('🎫 Đang tạo Voucher mẫu...');
  
  // Platform-wide voucher
  await prisma.voucher.upsert({
    where: { code: 'VESTRA10' },
    update: {},
    create: {
      id: 'vc_10',
      code: 'VESTRA10',
      description: 'Giảm giá 10% cho tất cả các đơn hàng trên toàn sàn',
      discount_type: 'PERCENT',
      discount_value: 10,
      min_order_value: 200000,
      status: 'ACTIVE',
    }
  });

  // Shop-specific active vouchers (Y2K Shop - store_01)
  await prisma.voucher.upsert({
    where: { code: 'Y2KPERCENT15' },
    update: {},
    create: {
      id: 'vc_y2k_15',
      code: 'Y2KPERCENT15',
      description: 'Giảm 15% tối đa 50k cho đơn từ 200k trở lên',
      discount_type: 'PERCENT',
      discount_value: 15,
      max_discount: 50000,
      min_order_value: 200000,
      status: 'ACTIVE',
      store_id: store.id,
    }
  });

  await prisma.voucher.upsert({
    where: { code: 'SHOPFIXED50' },
    update: {},
    create: {
      id: 'vc_shop_50',
      code: 'SHOPFIXED50',
      description: 'Giảm 50.000đ trực tiếp cho đơn hàng từ 400k',
      discount_type: 'FIXED',
      discount_value: 50000,
      min_order_value: 400000,
      status: 'ACTIVE',
      store_id: store.id,
    }
  });

  await prisma.voucher.upsert({
    where: { code: 'SUMMERSALE' },
    update: {},
    create: {
      id: 'vc_summer_25',
      code: 'SUMMERSALE',
      description: 'Mã giảm giá chào hè chiết khấu 25% giá trị đơn hàng',
      discount_type: 'PERCENT',
      discount_value: 25,
      min_order_value: 150000,
      status: 'ACTIVE',
      store_id: store.id,
    }
  });

  // Shop-specific inactive / paused voucher
  await prisma.voucher.upsert({
    where: { code: 'PAUSEDVOUCH' },
    update: {},
    create: {
      id: 'vc_paused_10',
      code: 'PAUSEDVOUCH',
      description: 'Chương trình tạm nghỉ - Giảm 10%',
      discount_type: 'PERCENT',
      discount_value: 10,
      min_order_value: 100000,
      status: 'DISABLED',
      store_id: store.id,
    }
  });

  // Shop-specific expired voucher
  await prisma.voucher.upsert({
    where: { code: 'EXPIREDVOUCH' },
    update: {},
    create: {
      id: 'vc_expired_30',
      code: 'EXPIREDVOUCH',
      description: 'Mã tri ân khách hàng cũ hết hạn dùng - Giảm 30%',
      discount_type: 'PERCENT',
      discount_value: 30,
      min_order_value: 150000,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2025-01-01'),
      status: 'ACTIVE',
      store_id: store.id,
    }
  });

  // 5. Tạo sản phẩm mẫu (Hàng mới B2C hỗ trợ VTO & Hàng Pass C2C)
  console.log('👕 Đang tạo sản phẩm mẫu...');
  
  // Áo thun Y2K hỗ trợ thử đồ VTO (B2C - hàng mới của store)
  await prisma.product.upsert({
    where: { id: 'sp_y2k_shirt' },
    update: {},
    create: {
      id: 'sp_y2k_shirt',
      name: 'Áo thun Baby Tee Cotton Y2K',
      category_id: catY2K.id,
      description: 'Chất liệu 100% cotton dày dặn, co giãn cực tốt. Hỗ trợ tính năng Virtual Try-On.',
      stock: 150,
      price_sale: 250000,
      price_cost: 150000,
      status: 'active',
      store_id: store.id,
      is_pass_item: false,
      is_vto_enabled: true,
      garment_3d_url: 'https://vestra.com/assets/models/baby_tee.glb',
      images: {
        create: [
          { image_url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400' }
        ]
      },
      variants: {
        create: [
          { id: 'v_y2k_pink_s', color: 'Hồng', size: 'S', quantity: 50, price_sale: 250000 },
          { id: 'v_y2k_pink_m', color: 'Hồng', size: 'M', quantity: 50, price_sale: 250000 },
          { id: 'v_y2k_white_s', color: 'Trắng', size: 'S', quantity: 50, price_sale: 250000 }
        ]
      }
    }
  });

  // Đầm tiệc Pass lại (C2C - của customer Nguyễn Văn Khách)
  await prisma.product.upsert({
    where: { id: 'sp_pass_dress' },
    update: {},
    create: {
      id: 'sp_pass_dress',
      name: '[Pass] Đầm trễ vai dạ tiệc lấp lánh',
      category_id: catDresses.id,
      description: 'Mình mới mặc đi Prom 1 lần duy nhất, pass lại cho nàng nào cần. Độ mới 99%.',
      stock: 1,
      price_sale: 450000,
      price_cost: 950000,
      status: 'active',
      is_pass_item: true,
      owner_id: customer.id, // Đồ pass thuộc về khách hàng cá nhân
      condition: 99,
      images: {
        create: [
          { image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400' }
        ]
      },
      variants: {
        create: [
          { id: 'v_pass_dress_s', color: 'Đen', size: 'S', quantity: 1, price_sale: 450000 }
        ]
      }
    }
  });

  // Đồ pass của Seller (quản lý trong 'Đồ Pass của tôi')
  await prisma.product.upsert({
    where: { id: 'sp_pass_jean' },
    update: {},
    create: {
      id: 'sp_pass_jean',
      name: '[Pass] Quần Jean Baggy Retro Unisex',
      category_id: catY2K.id,
      description: 'Quần baggy denim phong cách Y2K, cạp trễ trẻ trung năng động. Mới mặc 2-3 lần. Độ mới 95%.',
      stock: 1,
      price_sale: 180000,
      price_cost: 450000,
      status: 'active',
      is_pass_item: true,
      owner_id: seller.id, // Đồ pass thuộc về seller cá nhân
      condition: 95,
      images: {
        create: [
          { image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400' }
        ]
      },
      variants: {
        create: [
          { id: 'v_pass_jean_m', color: 'Xanh nhạt', size: 'M', quantity: 1, price_sale: 180000 }
        ]
      }
    }
  });

  await prisma.product.upsert({
    where: { id: 'sp_pass_jacket' },
    update: {},
    create: {
      id: 'sp_pass_jacket',
      name: '[Pass] Áo khoác gió Vintage Nhật Bản',
      category_id: catY2K.id,
      description: 'Áo khoác gió retro mua trực tiếp tại hàng 2hand Nhật Bản. Form rộng unisex cực chất. Độ mới 90%.',
      stock: 1,
      price_sale: 290000,
      price_cost: 850000,
      status: 'active',
      is_pass_item: true,
      owner_id: seller.id, // Đồ pass thuộc về seller cá nhân
      condition: 90,
      images: {
        create: [
          { image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' }
        ]
      },
      variants: {
        create: [
          { id: 'v_pass_jacket_l', color: 'Đen phối Đỏ', size: 'L', quantity: 1, price_sale: 290000 }
        ]
      }
    }
  });

  // Đồ pass khác của customer Nguyễn Văn Khách
  await prisma.product.upsert({
    where: { id: 'sp_pass_skirt' },
    update: {},
    create: {
      id: 'sp_pass_skirt',
      name: '[Pass] Chân váy xếp ly Tennis trắng dáng ngắn',
      category_id: catDresses.id,
      description: 'Vải đứng form dày dặn có quần bảo hộ bên trong. Chưa mặc lần nào ngoài thử đồ. Mới 98%.',
      stock: 1,
      price_sale: 120000,
      price_cost: 320000,
      status: 'active',
      is_pass_item: true,
      owner_id: customer.id,
      condition: 98,
      images: {
        create: [
          { image_url: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400' }
        ]
      },
      variants: {
        create: [
          { id: 'v_pass_skirt_s', color: 'Trắng', size: 'S', quantity: 1, price_sale: 120000 }
        ]
      }
    }
  });

  console.log('✅ Đã hoàn thành quá trình Seeding dữ liệu!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
