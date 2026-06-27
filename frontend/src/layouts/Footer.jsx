import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-100 border-t border-brand-800 mt-auto px-6 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* About Section */}
        <div className="md:col-span-2">
          <Link to="/" className="text-2xl font-bold tracking-tight text-white mb-4 block">
            VESTRA<span className="text-brand-400 font-light">.shop</span>
          </Link>
          <p className="text-brand-300 text-sm leading-relaxed max-w-sm">
            Nền tảng thương mại điện tử thời trang thời đại mới tích hợp công nghệ thử đồ trực tuyến Virtual Try-On và sổ cái Blockchain lưu vết minh bạch dòng tiền.
          </p>
        </div>

        {/* Navigation links */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Khám phá</h4>
          <ul className="space-y-2.5 text-brand-300 text-sm">
            <li><Link to="/shop" className="hover:text-white transition-colors">Tất cả sản phẩm</Link></li>
            <li><Link to="/pass-items" className="hover:text-white transition-colors">Sản phẩm Pass cũ (C2C)</Link></li>
            <li><Link to="/ai-chat" className="hover:text-white transition-colors">Trợ lý ảo AI tư vấn</Link></li>
          </ul>
        </div>

        {/* Contact/Support */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Hỗ trợ</h4>
          <ul className="space-y-2.5 text-brand-300 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Liên hệ Vestra</a></li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-brand-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-brand-400 text-xs">
        <p>© 2026 Vestra Project. Bảo lưu mọi quyền.</p>
        <p className="mt-2 sm:mt-0">Đồ án Khóa luận tốt nghiệp - Xây dựng trên nền tảng Web 2.5 & AI</p>
      </div>
    </footer>
  );
}
