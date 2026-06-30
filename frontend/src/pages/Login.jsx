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
    setError('');
    setRegisterSuccess('');
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

  // Forgot password OTP states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotForm, setForgotForm] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Register OTP verification states
  const [isRegisterPending, setIsRegisterPending] = useState(false);
  const [registerOtp, setRegisterOtp] = useState('');
  const [registerOtpLoading, setRegisterOtpLoading] = useState(false);
  const [pendingRegisterEmail, setPendingRegisterEmail] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  
  // OTP countdown state & effect
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Vui lòng hoàn tất xác thực bảo mật Cloudflare Turnstile trước.');
      return;
    }
    setForgotLoading(true);
    setError('');
    setForgotSuccess('');
    try {
      const data = await api.post('/auth/forgot-password', {
        email: forgotEmail.trim(),
      });
      setForgotSuccess(data.message || 'Mã OTP đã được gửi đến email của bạn!');
      setForgotStep(2);
      setTimeLeft(60);
    } catch (err) {
      setError(err.message || 'Lỗi gửi yêu cầu OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Vui lòng hoàn tất xác thực bảo mật Cloudflare Turnstile trước.');
      return;
    }
    setForgotLoading(true);
    setError('');
    setForgotSuccess('');

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setError('Mật khẩu mới và mật khẩu xác nhận không trùng khớp.');
      setForgotLoading(false);
      return;
    }

    try {
      const data = await api.post('/auth/reset-password-otp', {
        email: forgotEmail.trim(),
        otp: forgotForm.otp.trim(),
        newPassword: forgotForm.newPassword,
      });
      setForgotSuccess(data.message || 'Đặt lại mật khẩu thành công! Đang quay lại đăng nhập...');
      setTimeout(() => {
        setIsForgotPassword(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotForm({ otp: '', newPassword: '', confirmPassword: '' });
        setForgotSuccess('');
        setError('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Lỗi đặt lại mật khẩu.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyRegisterOTP = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Vui lòng hoàn tất xác thực bảo mật Cloudflare Turnstile trước.');
      return;
    }
    setRegisterOtpLoading(true);
    setError('');
    try {
      const data = await api.post('/auth/verify-register-otp', {
        email: pendingRegisterEmail,
        otp: registerOtp.trim(),
      });
      if (data.success) {
        setIsRegisterPending(false);
        setIsLogin(true);
        setRegisterOtp('');
        setRegisterSuccess(data.message || 'Kích hoạt tài khoản thành công! Vui lòng đăng nhập.');
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Lỗi xác nhận mã OTP.');
    } finally {
      setRegisterOtpLoading(false);
    }
  };

  const handleResendRegisterOTP = async () => {
    setError('');
    setForgotSuccess('');
    try {
      const data = await api.post('/auth/resend-register-otp', {
        email: pendingRegisterEmail,
      });
      setForgotSuccess(data.message || 'Mã OTP mới đã được gửi thành công!');
      setTimeLeft(60);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Lỗi gửi lại mã OTP.');
    }
  };

  const handleResendForgotOTP = async () => {
    setError('');
    setForgotSuccess('');
    if (!forgotEmail) {
      setError('Không xác định được địa chỉ email.');
      return;
    }
    try {
      const data = await api.post('/auth/forgot-password', {
        email: forgotEmail.trim(),
      });
      setForgotSuccess(data.message || 'Mã OTP mới đã được gửi thành công!');
      setTimeLeft(60);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Lỗi gửi lại mã OTP.');
    }
  };

  const handleRedirect = (user) => {
    if (user?.user_type === 'admin' || user?.user_type === 'staff') {
      navigate('/admin');
    } else if (user?.user_type === 'shop') {
      navigate('/seller');
    } else {
      navigate('/');
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
        // 1. Kiểm tra định dạng số điện thoại
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(phone.trim())) {
          setError('Số điện thoại không hợp lệ. Phải bắt đầu bằng số 0 và có đúng 10 chữ số.');
          setLoading(false);
          return;
        }

        // 2. Kiểm tra định dạng mật khẩu
        const cleanPassword = password.trim();
        if (cleanPassword.length < 6) {
          setError('Mật khẩu phải tối thiểu 6 ký tự.');
          setLoading(false);
          return;
        }
        const hasLetter = /[a-zA-Z]/.test(cleanPassword);
        const hasDigit = /\d/.test(cleanPassword);
        if (!hasLetter || !hasDigit) {
          setError('Mật khẩu phải chứa cả chữ và số.');
          setLoading(false);
          return;
        }

        const data = await api.post('/auth/register', {
          email,
          password,
          username,
          phone,
          full_name: fullName,
          turnstile_token: turnstileToken,
        });

        if (data.success) {
          if (data.isPending) {
            setPendingRegisterEmail(data.email);
            setIsRegisterPending(true);
            setTimeLeft(60);
            setError('');
          } else {
            loginStore(data.user, data.token);
            handleRedirect(data.user);
          }
        }
      }
    } catch (err) {
      if (err.response?.data?.requireVerification) {
        setPendingRegisterEmail(err.response.data.email);
        setIsRegisterPending(true);
        setTimeLeft(60);
        setError('');
        return;
      }
      const msg = err.message || '';
      if (!err.status && (msg.includes('Network') || msg.includes('ERR_CONNECTION') || msg.includes('fetch'))) {
        setError('Không thể kết nối máy chủ. Vui lòng đảm bảo backend đang chạy (cổng 5000).');
      } else {
        setError(err.response?.data?.error || msg || 'Có lỗi xảy ra, vui lòng thử lại.');
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
      <div className="w-full max-w-[480px] bg-white dark:bg-[#121212] rounded-2xl border border-gray-200 dark:border-[#222222] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)] overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="pt-6 pb-4 px-6 text-center border-b border-gray-100 dark:border-[#222222]">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 text-brand-500 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
            <ShieldCheck size={20} className="text-brand-600 dark:text-brand-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide leading-tight">
            {isRegisterPending ? 'Kích hoạt tài khoản' : isForgotPassword ? 'Khôi phục mật khẩu' : isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
          </h2>
          <h1 className="text-lg font-black text-brand-600 dark:text-brand-400 tracking-wider leading-none mt-1">
            VESTRA
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            {isRegisterPending ? 'Nhập mã xác thực OTP để kích hoạt ví và tài khoản.' : isForgotPassword ? 'Sử dụng mã OTP nhận qua email để đặt lại mật khẩu.' : isLogin ? 'Đăng nhập an toàn vào hệ thống.' : 'Khởi tạo tài khoản mua sắm và ví Web 2.5.'}
          </p>
        </div>

        {/* Form */}
        {isRegisterPending ? (
          <form onSubmit={handleVerifyRegisterOTP} className="p-8 space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <Info size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
              Mã OTP kích hoạt tài khoản đã được gửi đến email <strong>{pendingRegisterEmail}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc thư rác) và nhập mã để kích hoạt tài khoản của bạn.
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-sans">
                Mã OTP kích hoạt (6 chữ số)
              </label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="VD: 123456" 
                value={registerOtp} 
                onChange={(e) => setRegisterOtp(e.target.value.replace(/\D/g, ''))} 
                required 
                className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-4 py-3 text-center font-mono text-lg tracking-widest focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white" 
              />
            </div>

            {/* Cloudflare Turnstile */}
            <div className="w-full py-1">
              <Turnstile
                key={`reg-otp-${theme}`}
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

            <button 
              type="submit" 
              disabled={registerOtpLoading || !turnstileToken} 
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-250 dark:disabled:bg-slate-800 disabled:text-gray-450 dark:disabled:text-gray-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all text-[15px] disabled:opacity-50 cursor-pointer font-sans"
            >
              {registerOtpLoading ? 'Đang kích hoạt...' : 'Kích hoạt tài khoản'}
            </button>

            <div className="text-center text-xs text-gray-500 dark:text-gray-400 font-sans pt-2">
              {timeLeft > 0 ? (
                <span>Gửi lại mã OTP sau <strong className="text-brand-500 font-mono">{timeLeft}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendRegisterOTP}
                  className="text-brand-500 hover:text-brand-600 font-bold transition-all hover:underline cursor-pointer"
                >
                  Gửi lại mã OTP
                </button>
              )}
            </div>

            <div className="text-center text-sm pt-2">
              <button 
                type="button" 
                onClick={() => { setIsRegisterPending(false); setError(''); setRegisterOtp(''); }} 
                className="font-bold text-brand-500 dark:text-brand-450 hover:text-brand-600 dark:hover:text-brand-350 transition-colors cursor-pointer font-sans"
              >
                Quay lại Đăng nhập / Đăng ký
              </button>
            </div>
          </form>
        ) : isForgotPassword ? (
          <div className="p-8 space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <Info size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {forgotSuccess && (
              <div className="p-3.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-sm font-medium rounded-xl border border-green-100 dark:border-green-900/30 flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Nhập địa chỉ email liên kết với tài khoản của bạn. Hệ thống sẽ tạo một mã xác minh OTP gửi trực tiếp về hòm thư này.
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Địa chỉ Email
                  </label>
                  <input 
                    type="email" 
                    placeholder="VD: customer@vestra.com" 
                    value={forgotEmail} 
                    onChange={(e) => setForgotEmail(e.target.value)} 
                    required 
                    className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" 
                  />
                </div>

                {/* Cloudflare Turnstile */}
                <div className="w-full py-1">
                  <Turnstile
                    key={`forgot-${theme}`}
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

                <button 
                  type="submit" 
                  disabled={forgotLoading || !turnstileToken} 
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-250 dark:disabled:bg-slate-800 disabled:text-gray-450 dark:disabled:text-gray-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all text-[15px] disabled:opacity-50 cursor-pointer"
                >
                  {forgotLoading ? 'Đang gửi mã...' : 'Gửi mã xác thực OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Nhập mã xác minh OTP 6 chữ số được gửi tới email <strong>{forgotEmail}</strong> và thiết lập mật khẩu mới bên dưới:
                </p>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Mã OTP xác thực (6 chữ số)
                  </label>
                  <input 
                    type="text" 
                    maxLength={6}
                    placeholder="VD: 123456" 
                    value={forgotForm.otp} 
                    onChange={(e) => setForgotForm({ ...forgotForm, otp: e.target.value.replace(/\D/g, '') })} 
                    required 
                    className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-4 py-3 text-center font-mono text-lg tracking-widest focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Mật khẩu mới
                  </label>
                  <input 
                    type="password" 
                    placeholder="Nhập mật khẩu mới" 
                    value={forgotForm.newPassword} 
                    onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })} 
                    required 
                    className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Xác nhận mật khẩu mới
                  </label>
                  <input 
                    type="password" 
                    placeholder="Xác nhận mật khẩu mới" 
                    value={forgotForm.confirmPassword} 
                    onChange={(e) => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })} 
                    required 
                    className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white" 
                  />
                </div>

                {/* Cloudflare Turnstile */}
                <div className="w-full py-1">
                  <Turnstile
                    key={`reset-${theme}`}
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

                <button 
                  type="submit" 
                  disabled={forgotLoading || !turnstileToken} 
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-250 dark:disabled:bg-slate-800 disabled:text-gray-450 dark:disabled:text-gray-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all text-[15px] disabled:opacity-50 cursor-pointer"
                >
                  {forgotLoading ? 'Đang xử lý...' : 'Xác nhận & Đặt lại mật khẩu'}
                </button>

                <div className="text-center text-xs text-gray-500 dark:text-gray-400 font-sans pt-2">
                  {timeLeft > 0 ? (
                    <span>Gửi lại mã OTP sau <strong className="text-brand-500 font-mono">{timeLeft}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendForgotOTP}
                      className="text-brand-500 hover:text-brand-600 font-bold transition-all hover:underline cursor-pointer"
                    >
                      Gửi lại mã OTP
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="text-center text-sm pt-2">
              <button 
                type="button" 
                onClick={() => { setIsForgotPassword(false); setError(''); setForgotSuccess(''); setForgotStep(1); }} 
                className="font-bold text-brand-500 dark:text-brand-450 hover:text-brand-600 dark:hover:text-brand-350 transition-colors cursor-pointer"
              >
                Quay lại Đăng nhập
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {registerSuccess && (
              <div className="p-3.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-sm font-medium rounded-xl border border-green-100 dark:border-green-900/30 flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0" />
                <span>{registerSuccess}</span>
              </div>
            )}
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <Info size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {!isLogin ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {/* Họ và tên */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Họ và tên
                  </label>
                  <input 
                    type="text" 
                    placeholder="Nguyễn Văn A" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    required 
                    className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-sans" 
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Tên tài khoản
                  </label>
                  <input 
                    type="text" 
                    placeholder="nguyenvana" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-sans" 
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Số điện thoại
                  </label>
                  <input 
                    type="text" 
                    placeholder="0987654321" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required 
                    className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-sans" 
                  />
                  <p className="text-[9.5px] text-gray-400 dark:text-gray-500 font-sans pl-1.5 leading-none mt-1">
                    * Bắt đầu bằng 0, gồm 10 số.
                  </p>
                </div>

                {/* Email (in Register Mode) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Địa chỉ Email
                  </label>
                  <input 
                    type="email" 
                    placeholder="customer@vestra.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-sans" 
                  />
                </div>

                {/* Password (in Register Mode) */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-sans" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[9.5px] text-gray-400 dark:text-gray-500 font-sans pl-1.5 leading-none mt-1">
                    * Mật khẩu tối thiểu 6 ký tự, gồm cả chữ và số.
                  </p>
                </div>
              </div>
            ) : (
              /* Login Mode Fields */
              <>
                {/* Email/Phone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email hoặc Số điện thoại
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="admin@vestra.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-sans" 
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
                    <button 
                      type="button" 
                      onClick={() => { setIsForgotPassword(true); setError(''); setForgotSuccess(''); setForgotStep(1); }}
                      className="text-xs font-semibold text-brand-500 dark:text-brand-450 hover:text-brand-600 dark:hover:text-brand-350 transition-colors cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-1 focus:ring-brand-500 dark:focus:ring-brand-400 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-sans" 
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
              </>
            )}

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
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-250 dark:disabled:bg-slate-800 disabled:text-gray-450 dark:disabled:text-gray-500 disabled:shadow-none text-white font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all text-[15px] disabled:opacity-50 cursor-pointer"
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
                onClick={() => { setIsLogin(!isLogin); setError(''); setRegisterSuccess(''); }} 
                className="font-bold text-brand-500 dark:text-brand-450 hover:text-brand-600 dark:hover:text-brand-350 transition-colors cursor-pointer"
              >
                {isLogin ? 'Tạo tài khoản' : 'Đăng nhập'}
              </button>
            </div>

            {/* Legal footer */}
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed max-w-xs mx-auto border-t border-gray-100 dark:border-[#222222] pt-4 mt-2">
              Bằng việc tiếp tục, bạn đã đồng ý với <span className="text-brand-500 dark:text-brand-450 font-semibold hover:underline cursor-pointer">Điều khoản sử dụng</span> và <span className="text-brand-500 dark:text-brand-450 font-semibold hover:underline cursor-pointer">Chính sách bảo mật thông tin cá nhân</span> của VESTRA
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
