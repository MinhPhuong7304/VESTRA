import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, MessageCircle, LogOut, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useThemeStore } from '../store/useThemeStore';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-brand-100 dark:border-slate-800 shadow-sm px-6 py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-brand-600 dark:text-brand-400">
            VESTRA<span className="text-brand-400 dark:text-brand-300 font-light">.shop</span>
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 font-medium text-slate-700 dark:text-slate-200">
          <Link to="/" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Trang chủ</Link>
          <Link to="/shop" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Cửa hàng</Link>
          <Link to="/pass-items" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
            Pass đồ cũ
          </Link>
          {isAuthenticated && (user?.user_type === 'admin' || user?.user_type === 'staff') && (
            <Link to="/admin" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-bold transition-all">
              Trang Admin
            </Link>
          )}
          <Link to="/ai-chat" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-3 py-1.5 rounded-full border border-brand-200 dark:border-brand-800">
            <MessageCircle size={16} className="animate-pulse" /> Trợ lý AI
          </Link>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-4">
          
          {/* Dark Mode Toggle */}
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-brand-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors" title={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-amber-400" />}
          </button>

          {/* Cart Icon */}
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors text-brand-900 dark:text-brand-100">
            <ShoppingBag size={22} />
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                {getTotalItems()}
              </span>
            )}
          </Link>

          {/* User Section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {(user?.user_type === 'admin' || user?.user_type === 'staff') && (
                <Link to="/admin" className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/15 border border-brand-500/20 dark:border-brand-500/30 text-brand-600 dark:text-brand-400 font-bold text-xs rounded-full transition-all" title="Trang quản trị">
                  Admin Panel
                </Link>
              )}
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-brand-200 dark:border-slate-700" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 border border-brand-200 dark:border-slate-700 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm uppercase">
                    {user.username?.[0] || 'U'}
                  </div>
                )}
                <span className="hidden sm:inline font-medium text-sm text-brand-900 dark:text-brand-100">
                  {user.full_name || user.username}
                </span>
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} className="p-2 text-brand-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors" title="Đăng xuất">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login?mode=login" className="px-4 py-2 border border-brand-200 dark:border-slate-700 hover:bg-brand-50 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 font-semibold text-sm rounded-full transition-all">
                Đăng nhập
              </Link>
              <Link to="/login?mode=register" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-full transition-all shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 hover:-translate-y-0.5">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
