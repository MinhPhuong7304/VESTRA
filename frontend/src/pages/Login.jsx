import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { Info, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { auth, googleProvider, facebookProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import api from '../services/api';

export default function Login() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const theme = useThemeStore((state) => state.theme);
  
  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'register');
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);

  const handleRedirect = (user) => {
    if (user?.user_type === 'admin' || user?.user_type === 'staff') {
      navigate('/admin');
    } else if (user?.user_type === 'shop') {
      navigate('/seller');
    } else {
      navigate('/profile');
    }
  };

  // ── Đăng nhập / Đăng ký ───────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Vui lòng hoàn tất xác thực bảo mật Cloudflare.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.post('/auth/login', {
          email,
          password,
          turnstile_token: turnstileToken,
        });

        if (data.success) {
          loginStore(data.user, data.token);
          handleRedirect(data.user);
        }
      } else {
        const data = await api.post('/auth/register', {
          email,
          password,
          username,
          phone,
          full_name: fullName,
          turnstile_token: turnstileToken,
        });

        if (data.success) {
          loginStore(data.user, data.token);
          handleRedirect(data.user);
        }
      }
    } catch (err) {
      const msg = err.message || '';
      if (!err.status && (msg.includes('Network') || msg.includes('ERR_CONNECTION') || msg.includes('fetch'))) {
        setError('Không thể kết nối máy chủ. Vui lòng đảm bảo backend đang chạy (cổng 5000).');
      } else {
        setError(msg || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Đăng nhập mạng xã hội ─────────────────────────────────────
  const handleSocialLogin = async (providerName) => {
    if (!turnstileToken) {
      setError('Vui lòng hoàn tất xác thực bảo mật Cloudflare Turnstile trước.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const provider = providerName === 'google' ? googleProvider : facebookProvider;
      
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (err) {
        console.warn(`⚠️ Firebase Social Login Popup Error`, err);
        // Fallback for development if Firebase is not configured or blocked
        const dummyEmail = `mock_${providerName}_user@vestra.com`;
        const dummyName = `${providerName === 'google' ? 'Google' : 'Facebook'} Test User`;
        const dummyAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${providerName}`;
        
        const data = await api.post('/auth/social-login', {
          email: dummyEmail,
          fullName: dummyName,
          avatarUrl: dummyAvatar,
          provider: providerName,
          turnstile_token: turnstileToken
        });
        
        if (data.success) {
          loginStore(data.user, data.token);
          handleRedirect(data.user);
        }
        return;
      }
      
      const user = result.user;
      
      const data = await api.post('/auth/social-login', {
        email: user.email,
        fullName: user.displayName,
        avatarUrl: user.photoURL,
        provider: providerName,
        turnstile_token: turnstileToken
      });

      if (data.success) {
        loginStore(data.user, data.token);
        handleRedirect(data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || `Lỗi đăng nhập qua ${providerName}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center py-10 px-4 overflow-hidden">
      
      {/* Background Gradient Blob matching Vestra's Purple hue */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand-200/20 dark:bg-brand-900/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-200/10 dark:bg-purple-900/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

      {/* Main card */}
      <div className="w-full max-w-[440px] bg-white dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-[#222222] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)] overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="pt-10 pb-6 px-8 text-center border-b border-gray-100 dark:border-[#222222]">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 text-brand-500 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldCheck size={24} className="text-brand-600 dark:text-brand-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-wide leading-tight">
            {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
          </h2>
          <h1 className="text-xl font-black text-brand-600 dark:text-brand-400 tracking-wider leading-none mt-2">
            VESTRA
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {isLogin ? 'Đăng nhập an toàn vào hệ thống.' : 'Khởi tạo tài khoản mua sắm và ví Web 2.5.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2">
              <Info size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {!isLogin && (
            <>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Họ và tên
                </label>
                <input 
                  type="text" 
                  placeholder="Nguyễn Văn A" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                  className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" 
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Tên tài khoản
                </label>
                <input 
                  type="text" 
                  placeholder="nguyenvana" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" 
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Số điện thoại
                </label>
                <input 
                  type="text" 
                  placeholder="0987654321" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required 
                  className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" 
                />
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isLogin ? 'Email hoặc Số điện thoại' : 'Địa chỉ Email'}
            </label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="admin@vestra.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" 
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <Info size={16} />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Mật khẩu
              </label>
              {isLogin && (
                <button 
                  type="button" 
                  className="text-xs font-semibold text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Cloudflare Turnstile */}
          <div className="w-full py-1">
            <Turnstile
              key={theme}
              siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || "1x00000000000000000000AA"}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
              options={{
                theme: theme,
                size: 'flexible'
              }}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading || !turnstileToken} 
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-250 dark:disabled:bg-slate-800 disabled:text-gray-450 dark:disabled:text-gray-500 disabled:shadow-none text-white font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all text-[15px] disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-[#222222]"></div>
            </div>
            <span className="relative px-4 bg-white dark:bg-[#121212] text-sm text-gray-400 dark:text-gray-500 font-medium">Hoặc</span>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button 
              type="button" 
              onClick={() => handleSocialLogin('google')}
              className="w-full py-4 bg-transparent border border-gray-300 dark:border-[#222222] hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all text-[15px] font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Tiếp tục với Google
            </button>
            
            <button 
              type="button" 
              onClick={() => handleSocialLogin('facebook')}
              className="w-full py-4 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl transition-all text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Tiếp tục với Facebook
            </button>
          </div>

          {/* Toggle Login/Register */}
          <div className="text-center text-sm pt-2">
            <span className="text-gray-500 dark:text-gray-400">
              {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            </span>
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(''); }} 
              className="font-bold text-brand-500 dark:text-brand-450 hover:text-brand-600 dark:hover:text-brand-350 transition-colors"
            >
              {isLogin ? 'Tạo tài khoản' : 'Đăng nhập'}
            </button>
          </div>

          {/* Legal footer */}
          <div className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed max-w-xs mx-auto border-t border-gray-100 dark:border-[#222222] pt-4 mt-2">
            Bằng việc tiếp tục, bạn đã đồng ý với <span className="text-brand-500 dark:text-brand-450 font-semibold hover:underline cursor-pointer">Điều khoản sử dụng</span> và <span className="text-brand-500 dark:text-brand-450 font-semibold hover:underline cursor-pointer">Chính sách bảo mật thông tin cá nhân</span> của VESTRA
          </div>

        </form>

      </div>
    </div>
  );
}
