import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import {
  Shirt,
  Ticket,
  TrendingUp,
  Package,
  Star,
  ShoppingBag,
  Eye,
  Plus,
  Store,
  ChevronRight,
  BarChart3,
  Zap,
} from 'lucide-react';

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ products: 0, vouchers: 0, views: 0 });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, vcRes] = await Promise.allSettled([
          api.get('/products?limit=5'),
          api.get('/vouchers?limit=5'),
        ]);

        const prods = prodRes.status === 'fulfilled' ? (prodRes.value?.data || prodRes.value || []) : [];
        const vcs   = vcRes.status   === 'fulfilled' ? (vcRes.value?.data   || vcRes.value   || []) : [];

        const myProds = Array.isArray(prods)
          ? prods.filter(p => p.store_id === user?.store_id || !p.store_id)
          : [];
        const myVcs = Array.isArray(vcs)
          ? vcs.filter(v => v.store_id === user?.store_id)
          : [];

        setProducts(myProds.slice(0, 5));
        setStats({ products: myProds.length, vouchers: myVcs.length, views: 0 });
      } catch (_) {
        // dùng giá trị mặc định
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.store_id]);

  const statCards = [
    {
      label: 'Sản phẩm',
      value: stats.products,
      icon: Shirt,
      color: 'emerald',
      link: '/seller/products',
    },
    {
      label: 'Voucher đang chạy',
      value: stats.vouchers,
      icon: Ticket,
      color: 'violet',
      link: '/seller/vouchers',
    },
    {
      label: 'Lượt xem hôm nay',
      value: stats.views || '—',
      icon: Eye,
      color: 'blue',
      link: null,
    },
    {
      label: 'Đánh giá trung bình',
      value: '5.0 ★',
      icon: Star,
      color: 'amber',
      link: null,
    },
  ];

  const colorMap = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40',
    violet:  'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/40',
    blue:    'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40',
    amber:   'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-10 bottom-0 w-24 h-24 rounded-full bg-emerald-400/20" />
        <div className="relative z-10">
          <p className="text-emerald-100 text-sm font-medium mb-1">Chào mừng trở lại 👋</p>
          <h2 className="text-2xl font-bold tracking-tight">
            {user?.full_name || user?.username || 'Seller'}
          </h2>
          <p className="text-emerald-100/80 text-sm mt-1 mb-4">
            Quản lý gian hàng và tăng doanh thu của bạn
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/seller/products"
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              <Plus size={16} /> Thêm sản phẩm
            </Link>
            <Link
              to="/seller/vouchers"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              <Ticket size={16} /> Tạo voucher
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          const card = (
            <div className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all ${colorMap[s.color]} ${s.link ? 'hover:shadow-md cursor-pointer' : ''}`}>
              <div className="flex items-center justify-between">
                <Icon size={20} />
                {s.link && <ChevronRight size={16} className="opacity-50" />}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {loading ? <span className="animate-pulse">—</span> : s.value}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          );
          return s.link ? (
            <Link key={s.label} to={s.link}>{card}</Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>

      {/* Quick Actions + Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Products */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Package size={18} className="text-emerald-500" />
              Sản phẩm gần đây
            </h3>
            <Link to="/seller/products" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse flex gap-3">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : products.length > 0 ? (
              products.map((p) => (
                <div key={p.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                    {p.images?.[0]?.image_url ? (
                      <img src={p.images[0].image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Shirt size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.price_sale?.toLocaleString('vi-VN')}₫ • {p.stock || 0} còn lại</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                    p.status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {p.status === 'active' ? 'Đang bán' : 'Ẩn'}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Shirt size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-500">Chưa có sản phẩm nào</p>
                <Link to="/seller/products" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block hover:underline">
                  + Thêm sản phẩm đầu tiên
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <Zap size={18} className="text-amber-500" />
              Thao tác nhanh
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Thêm sản phẩm mới', icon: Plus, link: '/seller/products', color: 'emerald' },
                { label: 'Tạo voucher shop', icon: Ticket, link: '/seller/vouchers', color: 'violet' },
                { label: 'Xem cửa hàng', icon: Store, link: '/shop', color: 'blue' },
              ].map(({ label, icon: Icon, link, color }) => (
                <Link
                  key={label}
                  to={link}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-sm ${
                    color === 'emerald' ? 'border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60' :
                    color === 'violet'  ? 'border-violet-200/60 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/60' :
                    'border-blue-200/60 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/60'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-semibold">{label}</span>
                  <ChevronRight size={14} className="ml-auto opacity-50" />
                </Link>
              ))}
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Mẹo bán hàng</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Bật tính năng <strong className="text-emerald-700 dark:text-emerald-300">Virtual Try-On</strong> cho sản phẩm của bạn để tăng tỷ lệ chuyển đổi lên đến <strong>40%</strong>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
