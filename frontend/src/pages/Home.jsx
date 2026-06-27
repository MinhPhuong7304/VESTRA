import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, ShieldCheck, Sparkles, ShoppingBag } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-16 py-4">
      
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-brand-950 text-white p-8 md:p-16 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(170,59,255,0.15),transparent_50%)]"></div>
        <div className="relative max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide border border-white/10 text-brand-300">
            <Sparkles size={12} className="animate-spin" /> XU THẾ THỜI TRANG WEB 2.5
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Thời Trang <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-purple-400">Công Nghệ</span> & Minh Bạch
          </h1>
          <p className="text-brand-200 text-base md:text-lg leading-relaxed max-w-lg">
            Khám phá trải nghiệm mua sắm tuyệt vời nhất: Thử đồ trực tuyến 3D, thanh toán nhanh gọn và đối soát tài chính an toàn nhờ sổ cái Blockchain.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link to="/shop" className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-full shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35 hover:-translate-y-0.5 transition-all flex items-center gap-2">
              Mua Sắm Ngay <ArrowRight size={18} />
            </Link>
            <Link to="/ai-chat" className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-full border border-white/20 hover:border-white/30 backdrop-blur-sm transition-all">
              Tư Vấn AI
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Card 1: Virtual Try-On */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-slate-800 flex items-center justify-center text-brand-500 dark:text-brand-400">
            <Cpu size={24} />
          </div>
          <h3 className="text-xl font-bold text-brand-900 dark:text-slate-100">Virtual Try-On (VTO)</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
            Ươm thử trang phục 2D lên hình ảnh cá nhân hoặc render mô phỏng hình thể 3D thời gian thực trước khi mua sắm. Tránh đổi trả hàng!
          </p>
          <div className="pt-2 text-brand-500 dark:text-brand-450 font-semibold text-sm group-hover:text-brand-600 dark:group-hover:text-brand-300 flex items-center gap-1">
            Tìm hiểu thêm <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Blockchain Transparency */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-slate-800 flex items-center justify-center text-brand-500 dark:text-brand-400">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-xl font-bold text-brand-900 dark:text-slate-100">Minh Bạch Tài Chính</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
            Lưu trữ mã băm Merkle Root của các giao dịch chia hoa hồng Affiliate, thuế phí, và chuyển khoản Shop trực tiếp lên chuỗi Polygon.
          </p>
          <div className="pt-2 text-brand-500 dark:text-brand-450 font-semibold text-sm group-hover:text-brand-600 dark:group-hover:text-brand-300 flex items-center gap-1">
            Đến trang đối soát <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Circular Fashion C2C */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-slate-800 flex items-center justify-center text-brand-500 dark:text-brand-400">
            <ShoppingBag size={24} />
          </div>
          <h3 className="text-xl font-bold text-brand-900 dark:text-slate-100">Pass Đồ Cũ (C2C)</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
            Đăng bán lại hoặc mua sắm trang phục cũ đã qua sử dụng ngay trên sàn thời trang để kéo dài tuổi thọ sản phẩm, bảo vệ môi trường.
          </p>
          <div className="pt-2 text-brand-500 dark:text-brand-450 font-semibold text-sm group-hover:text-brand-600 dark:group-hover:text-brand-300 flex items-center gap-1">
            Khám phá mục Pass đồ <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </section>

      {/* Highlights Banner */}
      <section className="bg-brand-50 dark:bg-slate-900 rounded-3xl p-8 md:p-12 border border-brand-100 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <h3 className="text-2xl md:text-3xl font-extrabold text-brand-900 dark:text-slate-100 tracking-tight">
            Tham gia chương trình Affiliate, làm Creator lan tỏa phong cách thời trang!
          </h3>
          <p className="text-brand-500 dark:text-slate-350 text-sm md:text-base leading-relaxed">
            Đăng các clip ngắn ngắn ướm sản phẩm, gắn thẻ liên kết giới thiệu mua hàng và nhận hoa hồng bất biến chốt tự động lên Blockchain.
          </p>
        </div>
        <Link to="/ai-chat" className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full shadow-lg shadow-brand-600/10 shrink-0">
          Trò chuyện cùng AI
        </Link>
      </section>

    </div>
  );
}
