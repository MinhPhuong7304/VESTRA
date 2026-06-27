import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import {
  LayoutDashboard,
  Shirt,
  Ticket,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Store,
  ArrowLeft,
  ChevronRight,
  Recycle,
} from 'lucide-react';

export default function SellerLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Tổng quan Shop', path: '/seller', icon: LayoutDashboard },
    // Group: Sản phẩm
    { type: 'group', label: 'SẢN PHẨM' },
    { name: 'Hàng mới (Shop)', path: '/seller/products', icon: Shirt, desc: 'Sản phẩm chính hãng, mới' },
    { name: 'Đồ Pass của tôi', path: '/seller/pass-items', icon: Recycle, desc: 'Second-hand, đồ cũ C2C' },
    // Group: Khác
    { type: 'group', label: 'KHÁC' },
    { name: 'Voucher của Shop', path: '/seller/vouchers', icon: Ticket },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getPageTitle = () => {
    const flat = menuItems.filter(m => !m.type);
    const current = flat.find(item => item.path === location.pathname);
    return current ? current.name : 'Quản lý Gian hàng';
  };

  const isActive = (path) => {
    if (path === '/seller') return location.pathname === '/seller';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex transition-colors duration-300">

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80
        flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="py-4 px-6 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              VESTRA <span className="text-slate-400 dark:text-slate-500 font-light text-xs">SELLER</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* User / Shop Info */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-base shrink-0">
            <Store size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
              {user?.full_name || user?.username || 'Seller'}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Gian hàng đang hoạt động
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map((item, idx) => {
            // Group header
            if (item.type === 'group') {
              return (
                <p key={idx} className="px-3 pt-4 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  {item.label}
                </p>
              );
            }
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon
                  size={18}
                  className={active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}
                />
                <div className="flex-1 min-w-0">
                  <span className="block leading-tight">{item.name}</span>
                  {item.desc && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight">{item.desc}</span>
                  )}
                </div>
                {active && <ChevronRight size={14} className="text-emerald-500/60 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
          >
            <ArrowLeft size={18} className="text-slate-400" />
            Về trang chủ
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 md:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                Quản lý gian hàng của bạn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all"
              title="Đổi theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              {(user?.full_name || user?.username || 'S').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
