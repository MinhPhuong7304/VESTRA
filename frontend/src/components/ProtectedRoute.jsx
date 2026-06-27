import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = ['admin', 'staff'] }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login?mode=login" replace />;
  }

  const hasAccess = allowedRoles.includes(user?.user_type);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-150 p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-500">
            <ShieldAlert size={36} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Từ chối truy cập</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Bạn không có quyền truy cập vào khu vực quản trị này. Trang web này chỉ dành cho Quản trị viên và Nhân viên hệ thống.
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <a 
              href="/" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-full transition-all shadow-lg shadow-brand-600/10"
            >
              <ArrowLeft size={16} /> Quay về Trang chủ
            </a>
            <a 
              href="/login?mode=login" 
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-full transition-all border border-slate-700"
            >
              Đăng nhập tài khoản khác
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
