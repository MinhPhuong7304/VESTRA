import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { 
  LayoutDashboard, 
  Tags, 
  Shirt, 
  Ticket, 
  Database, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ChevronRight, 
  ArrowLeft,
  UserCheck
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Tổng quan', path: '/admin', icon: LayoutDashboard },
    { name: 'Quản lý tài khoản', path: '/admin/users', icon: UserCheck },
    { name: 'Quản lý danh mục', path: '/admin/categories', icon: Tags },
    { name: 'Quản lý sản phẩm', path: '/admin/products', icon: Shirt },
    { name: 'Khuyến mãi / Voucher', path: '/admin/vouchers', icon: Ticket },
    { name: 'Blockchain Ledger', path: '/admin/ledger', icon: Database, badge: 'Đơn hàng' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getPageTitle = () => {
    const current = menuItems.find(item => item.path === location.pathname);
    return current ? current.name : 'Quản trị hệ thống';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex transition-colors duration-300">
      
      {/* Backdrop for mobile */}
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
        {/* Sidebar Header */}
        <div className="py-4 px-6 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
              VESTRA <span className="text-slate-400 dark:text-slate-500 font-light text-xs">ADMIN</span>
            </span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info Quick View */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-500/10 dark:bg-brand-400/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-base shrink-0">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
              {user?.full_name || user?.username}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-55 dark:bg-brand-950/40 px-2 py-0.5 rounded-full border border-brand-200/50 dark:border-brand-900/50">
              <UserCheck size={11} /> Admin Panel
            </span>
          </div>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group
                  ${isActive 
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10 dark:shadow-brand-500/5' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge ? (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white/70' : 'text-slate-400'}`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
          >
            <ArrowLeft size={20} />
            <span>Quay lại Shop</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 px-6 flex items-center justify-between shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 md:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats on desktop */}
            <div className="hidden lg:flex items-center gap-2 text-sm font-semibold text-slate-400">
              <span>Hệ thống:</span>
              <span className="text-emerald-500 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                Trực tuyến
              </span>
            </div>

            {/* Dark mode button */}
            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
