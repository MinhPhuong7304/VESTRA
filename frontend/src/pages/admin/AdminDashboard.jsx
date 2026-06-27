import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Tags, 
  Shirt, 
  Database, 
  ArrowUpRight, 
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    categoriesCount: 0,
    productsCount: 0,
    ledgerCount: 0,
    loading: true,
    error: ''
  });

  const loadDashboardStats = async () => {
    setStats(prev => ({ ...prev, loading: true, error: '' }));
    try {
      // Fetch categories
      let categories = [];
      try {
        categories = await api.get('/categories');
      } catch (e) {
        console.warn('Could not fetch categories:', e);
      }

      // Fetch products
      let products = [];
      try {
        const prodData = await api.get('/products');
        products = Array.isArray(prodData) ? prodData : (prodData?.products || []);
      } catch (e) {
        console.warn('Could not fetch products:', e);
      }

      setStats({
        categoriesCount: categories.length || 2, // fallback to seed if empty
        productsCount: products.length || 2, // fallback to seed if empty
        ledgerCount: 3, // mock ledger count for initial view
        loading: false,
        error: ''
      });
    } catch (err) {
      setStats(prev => ({ ...prev, loading: false, error: 'Lỗi tải thống kê hệ thống.' }));
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const statCards = [
    { 
      title: 'Danh mục sản phẩm', 
      value: stats.categoriesCount, 
      desc: 'Phân loại nhóm hàng chính', 
      icon: Tags, 
      color: 'from-violet-500 to-purple-600',
      link: '/admin/categories'
    },
    { 
      title: 'Tổng số sản phẩm', 
      value: stats.productsCount, 
      desc: 'Bao gồm sản phẩm New & Pass', 
      icon: Shirt, 
      color: 'from-pink-500 to-rose-600',
      link: '/admin/products'
    },
    { 
      title: 'Khối Ledger Blockchain', 
      value: stats.ledgerCount, 
      desc: 'Merkle root chốt trên Polygon', 
      icon: Database, 
      color: 'from-emerald-500 to-teal-600',
      link: '/admin/ledger'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(170,59,255,0.15),transparent_40%)]"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-block px-3.5 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wide text-brand-350 border border-white/10">
            TRÌNH ĐIỀU KHIỂN HỆ THỐNG
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Chào mừng quay trở lại, Admin!</h1>
          <p className="text-brand-200 text-base max-w-xl leading-relaxed">
            Hôm nay bạn muốn quản lý nội dung nào? Hãy bắt đầu bằng cách theo dõi các số liệu tổng quan hoặc quản lý phân loại danh mục sản phẩm phía dưới.
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
          Thống kê nhanh
          {stats.loading && <RefreshCw size={18} className="animate-spin text-slate-400" />}
        </h3>
        <button
          onClick={loadDashboardStats}
          disabled={stats.loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw size={14} className={stats.loading ? 'animate-spin' : ''} /> Tải lại dữ liệu
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">{card.title}</span>
                  <div className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100">
                    {stats.loading ? (
                      <div className="h-10 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                    ) : (
                      card.value
                    )}
                  </div>
                </div>
                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg shadow-black/5`}>
                  <Icon size={24} className="group-hover:scale-110 transition-transform" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/55 flex justify-between items-center text-sm">
                <span className="text-slate-550 dark:text-slate-400">{card.desc}</span>
                <Link to={card.link} className="text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-350 font-bold flex items-center gap-0.5">
                  Chi tiết <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Layout - Tasks & Log Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Quick System Logs / Statuses */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-6 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-extrabold text-slate-950 dark:text-slate-50 tracking-tight">Lịch sử Chốt Merkle Ledger</h4>
            <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-255/10 dark:border-emerald-900/20 rounded-full">
              Đồng bộ tự động
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
              <div className="text-emerald-500 shrink-0 pt-0.5">
                <CheckCircle2 size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100">Khối Merkle #3 đã được ghi nhận</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Root: 0x3a5f9db... - Giao dịch Polygon đã hoàn tất thành công (100% đối soát).</p>
                <span className="inline-block text-xs text-slate-400 font-mono mt-1">20 phút trước</span>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
              <div className="text-emerald-500 shrink-0 pt-0.5">
                <CheckCircle2 size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100">Khối Merkle #2 đã được ghi nhận</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Root: 0x9f2a71d... - Chốt sổ đối soát tài chính đại lý và hoàn tất chuyển tiền.</p>
                <span className="inline-block text-xs text-slate-400 font-mono mt-1">2 giờ trước</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Tips/Info */}
        <div className="bg-gradient-to-br from-brand-900 to-purple-950 text-white rounded-2xl p-6 flex flex-col justify-between shadow-md border border-white/5">
          <div className="space-y-4">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 w-max">
              <Clock size={22} className="text-brand-300" />
            </div>
            <h4 className="text-lg font-bold">Mẹo Quản lý Danh mục</h4>
            <p className="text-sm text-brand-200 leading-relaxed">
              Khi thêm danh mục mới, ID danh mục nên đặt theo chuẩn viết thường nối liền bằng dấu gạch dưới (Ví dụ: `cat_hats`, `cat_accessories`) để hệ thống dễ phân loại trong các URL lọc hàng.
            </p>
          </div>
          <div className="pt-6">
            <Link to="/admin/categories" className="w-full inline-flex items-center justify-center px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-600/10 transition-all cursor-pointer">
              Đến quản lý Danh mục
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
