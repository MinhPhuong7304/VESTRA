import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Wallet, Sparkles, User, AlertCircle, Save, Plus, Edit2, 
  Trash2, X, Tag, UploadCloud, Loader2, CheckCircle2, ImagePlus, Shirt,
  ChevronRight, RefreshCw, Eye, Lock, Calendar, Info, Globe, Camera, Mail, Link2,
  ExternalLink
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
];
import { Link } from 'react-router-dom';
import api from '../services/api';

const COLORS = ['Trắng','Đen','Hồng','Đỏ','Xanh dương','Xanh lá','Vàng','Cam','Tím','Xám','Be','Nâu'];
const SIZES  = ['XS','S','M','L','XL','XXL','XXXL','Freesize'];

export default function Profile() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'pass'
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    gender: '',
    birth_date: '',
    avatar_url: '',
    avatar_3d_url: '',
    body_image_url: '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Fetch fresh user data from API on mount to sync any missing fields (like full_name)
  useEffect(() => {
    if (user && user.id) {
      api.get(`/users/${user.id}`)
        .then((res) => {
          updateUser(res);
        })
        .catch((err) => {
          console.error("Lỗi đồng bộ thông tin tài khoản:", err);
        });
    }
  }, [user?.id]);

  // Sync state with user data
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || '',
        birth_date: user.birth_date || '',
        avatar_url: user.avatar_url || '',
        avatar_3d_url: user.avatar_3d_url || '',
        body_image_url: user.body_image_url || '',
      });
    }
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-white dark:bg-slate-900 p-8 rounded-3xl border border-brand-100 dark:border-slate-800 shadow-sm space-y-6 font-sans">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-brand-900 dark:text-slate-100 text-lg">Yêu cầu đăng nhập</h3>
          <p className="text-sm text-brand-400 dark:text-slate-400">
            Vui lòng đăng nhập tài khoản để xem thông tin cá nhân và quản lý ví Web 2.5 của bạn.
          </p>
        </div>
        <Link to="/login" className="block w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full shadow-lg shadow-brand-500/10 hover:shadow-brand-500/25 transition-all text-sm">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      // Call backend upload endpoint
      const response = await api.post('/upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFormData((prev) => ({ ...prev, avatar_url: response.url }));
      
      // Auto save the avatar update to backend
      const updated = await api.put(`/users/${user.id}`, {
        avatar_url: response.url,
      });
      updateUser(updated);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Lỗi tải ảnh đại diện:', err);
      setError(err.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const [bankForm, setBankForm] = useState({
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
  });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const [forgotStep, setForgotStep] = useState(1); // 1: Send OTP, 2: Reset Password with OTP
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotForm, setForgotForm] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [forgotSaving, setForgotSaving] = useState(false);
  const [forgotSent, setForgotSent] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Sync bankForm with user data
  useEffect(() => {
    if (user) {
      setBankForm({
        bank_name: user.bank_name || '',
        bank_account_number: user.bank_account_number || '',
        bank_account_name: user.bank_account_name || '',
      });
    }
  }, [user]);

  const handleSaveBank = async (e) => {
    e.preventDefault();
    setBankSaving(true);
    setBankSaved(false);
    try {
      const updated = await api.put(`/users/${user.id}`, {
        bank_name: bankForm.bank_name || null,
        bank_account_number: bankForm.bank_account_number || null,
        bank_account_name: bankForm.bank_account_name || null,
      });
      updateUser(updated);
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Không thể cập nhật tài khoản ngân hàng.');
    } finally {
      setBankSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdSaving(true);
    setPwdSaved(false);
    setPwdError('');

    if (!pwdForm.currentPassword || !pwdForm.newPassword) {
      setPwdError('Vui lòng nhập mật khẩu cũ và mật khẩu mới.');
      setPwdSaving(false);
      return;
    }

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('Mật khẩu mới và mật khẩu xác nhận không trùng khớp.');
      setPwdSaving(false);
      return;
    }

    try {
      await api.post('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });

      setPwdSaved(true);
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setPwdError(err.message || 'Lỗi đổi mật khẩu.');
    } finally {
      setPwdSaving(false);
    }
  };

  // Prefill forgotEmail from logged in user email
  useEffect(() => {
    if (user && user.email) {
      setForgotEmail(user.email);
    }
  }, [user]);

  const handleSendForgotOTP = async (e) => {
    e.preventDefault();
    setForgotSaving(true);
    setForgotSent('');
    setForgotError('');
    try {
      const res = await api.post('/auth/forgot-password', {
        email: user.email,
      });
      setForgotSent(res.message || 'Mã OTP đã được gửi thành công!');
      setForgotStep(2); // Go to step 2
    } catch (err) {
      console.error(err);
      setForgotError(err.message || 'Lỗi gửi yêu cầu mã OTP.');
    } finally {
      setForgotSaving(false);
    }
  };

  const handleResetPasswordOTP = async (e) => {
    e.preventDefault();
    setForgotSaving(true);
    setForgotSent('');
    setForgotError('');

    if (!forgotForm.otp || !forgotForm.newPassword) {
      setForgotError('Vui lòng nhập mã OTP và mật khẩu mới.');
      setForgotSaving(false);
      return;
    }

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotError('Mật khẩu mới và mật khẩu xác nhận không trùng khớp.');
      setForgotSaving(false);
      return;
    }

    try {
      const res = await api.post('/auth/reset-password-otp', {
        email: user.email,
        otp: forgotForm.otp.trim(),
        newPassword: forgotForm.newPassword,
      });
      setForgotSent(res.message || 'Đặt lại mật khẩu thành công!');
      // Reset form and go back to step 1 after 3 seconds
      setForgotForm({ otp: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setForgotStep(1);
        setForgotSent('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setForgotError(err.message || 'Lỗi xác nhận mã OTP và đặt lại mật khẩu.');
    } finally {
      setForgotSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      // Call backend to update user
      const updated = await api.put(`/users/${user.id}`, {
        username: formData.username.trim() || null,
        full_name: formData.full_name.trim() || null,
        phone: formData.phone.trim() || null,
        gender: formData.gender,
        birth_date: formData.birth_date || null,
        avatar_url: formData.avatar_url.trim() || null,
        avatar_3d_url: formData.avatar_3d_url.trim() || null,
        body_image_url: formData.body_image_url.trim() || null,
      });

      // Update auth store locally
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Không thể cập nhật thông tin tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 font-sans text-slate-800 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-brand-600 via-brand-550 to-indigo-600 text-white p-6 md:p-8 flex items-center gap-6 overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.15),transparent_50%)]"></div>
        <div className="relative group shrink-0">
          {formData.avatar_url ? (
            <img src={formData.avatar_url} alt="avatar" className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/50 object-cover shadow-sm transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/25 border-2 border-white/35 flex items-center justify-center text-white text-3xl font-extrabold uppercase shadow-sm">
              {formData.username?.[0] || 'U'}
            </div>
          )}
        </div>
        <div className="relative space-y-1">
          <h2 className="text-xl md:text-2xl font-bold leading-tight tracking-tight">
            {user.username}
          </h2>
          <p className="text-xs text-brand-100 font-medium">
            {user.email}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {user.user_type !== 'customer' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/10 uppercase tracking-wider text-brand-100">
                {user.user_type === 'shop' ? 'Cửa hàng (Seller)' : user.user_type === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </span>
            )}
            {user.store_id && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 border border-emerald-500/30 uppercase tracking-wider text-emerald-250">
                ID Cửa hàng: {user.store_id}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Custodial Wallet Details & Avatar presets */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Wallet card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold border-b border-brand-50 dark:border-slate-800 pb-3 text-xs uppercase tracking-wider">
              <Wallet size={16} /> Ví Giám Hộ Web 2.5
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wide">Địa chỉ ví Blockchain</span>
                  {user.wallet_address && (
                    <a 
                      href={`https://amoy.polygonscan.com/address/${user.wallet_address}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-slate-400 hover:text-brand-500 transition-colors"
                      title="Xem trên Polygonscan"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-brand-100 dark:border-slate-800 p-3 rounded-xl text-[11px] font-mono text-brand-800 dark:text-slate-350 select-all break-all leading-relaxed shadow-inner font-sans">
                  {user.wallet_address || 'Chưa khởi tạo ví'}
                </div>
              </div>

              <div className="p-3 bg-brand-50/50 dark:bg-slate-950/30 rounded-xl border border-brand-100 dark:border-slate-800 text-xs text-brand-700 dark:text-slate-400 leading-relaxed font-sans">
                Ví này được hệ thống tự động khởi tạo khi bạn đăng ký và được bảo mật ở máy chủ Vestra. Mọi hoa hồng Affiliate, hoàn tiền mua hàng sẽ được thanh toán trực tiếp về địa chỉ ví này.
              </div>
            </div>
          </div>

          {/* Avatar upload card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold border-b border-brand-50 dark:border-slate-800 pb-3 text-xs uppercase tracking-wider">
              <Camera size={16} /> Ảnh đại diện
            </div>
            
            {/* Live avatar preview & upload */}
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative group w-24 h-24">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar Preview" className="w-full h-full rounded-full object-cover border-2 border-brand-200 dark:border-slate-700 shadow-sm" />
                ) : (
                  <div className="w-full h-full rounded-full bg-brand-100 dark:bg-brand-900/30 border-2 border-brand-200 dark:border-slate-700 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-2xl uppercase">
                    {formData.username?.[0] || 'U'}
                  </div>
                )}
                
                {/* Upload overlay */}
                <label className="absolute inset-0 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-200 text-[10px] font-semibold">
                  <UploadCloud size={18} className="mb-0.5" />
                  Tải ảnh lên
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarFileChange} 
                    className="hidden" 
                  />
                </label>
              </div>

              {uploading ? (
                <div className="text-xs text-slate-400 flex items-center gap-1.5 animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  Đang tải lên...
                </div>
              ) : (
                <label className="px-4 py-1.5 bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-slate-750 text-xs font-semibold rounded-full border border-brand-100 dark:border-slate-750 cursor-pointer transition-colors flex items-center gap-1">
                  <UploadCloud size={13} />
                  Chọn ảnh từ máy
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarFileChange} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>
            
            <div className="border-t border-brand-50 dark:border-slate-800/80 pt-3">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal text-center">
                Hỗ trợ định dạng JPG, PNG kích thước tối đa 5MB.
              </p>
            </div>
          </div>

          {/* Quick Avatar selection card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold border-b border-brand-50 dark:border-slate-800 pb-3 text-xs uppercase tracking-wider">
              <Camera size={16} /> Ảnh đại diện mẫu
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal">
              Chọn nhanh một ảnh đại diện phong cách từ danh sách dưới đây:
            </p>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AVATARS.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar_url: url })}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                    formData.avatar_url === url 
                      ? 'border-brand-500 scale-105 ring-2 ring-brand-500/20' 
                      : 'border-slate-200 dark:border-slate-750 hover:border-brand-300'
                  }`}
                >
                  <img src={url} alt={`preset-${index}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Interface */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Tab selector */}
          <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl w-fit font-sans">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-300'
              }`}
            >
              <User size={13} className="inline mr-1" /> Thông tin tài khoản
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'wallet'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-300'
              }`}
            >
              <Wallet size={13} className="inline mr-1" /> Ví & Ngân hàng
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-300'
              }`}
            >
              <Lock size={13} className="inline mr-1" /> Bảo mật & Thiết lập
            </button>
            <button
              onClick={() => setActiveTab('pass')}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pass'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-300'
              }`}
            >
              <Tag size={13} className="inline mr-1" /> Quản lý đồ Pass thanh lý (C2C)
            </button>
          </div>

          {activeTab === 'info' && (
            /* PROFILE DETAILS FORM */
            <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-brand-900 dark:text-slate-100 font-bold border-b border-brand-50 dark:border-slate-800 pb-3 text-sm uppercase tracking-wider">
                <User size={18} /> Cấu hình thông tin
              </div>

              {saved && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-450 text-xs font-semibold rounded-xl border border-green-200 dark:border-green-900/30 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Lưu thông tin tài khoản thành công!
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/30 flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* Grid 1: Basic credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tên đăng nhập</label>
                  <input 
                    type="text" 
                    value={formData.username} 
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                    placeholder="VD: user_123" 
                  />
                </div>

                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Họ và tên</label>
                  <input 
                    type="text" 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    Email <Lock size={12} className="text-slate-400" />
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={formData.email} 
                      disabled 
                      className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none cursor-not-allowed font-sans" 
                    />
                    <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Số điện thoại</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                    placeholder="VD: 0987654321" 
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Giới tính</label>
                  <div className="flex gap-4">
                    {['male', 'female', 'other'].map((g) => (
                      <label key={g} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl cursor-pointer text-xs font-medium transition-colors font-sans">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={formData.gender === g}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="accent-brand-500"
                        />
                        <span>{g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Birth Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    Ngày sinh <Calendar size={12} className="text-slate-400" />
                  </label>
                  <input 
                    type="date" 
                    value={formData.birth_date} 
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                  />
                </div>
              </div>

              {/* Avatar Url input manually */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  Đường dẫn ảnh đại diện tùy chỉnh <Link2 size={12} className="text-slate-400" />
                </label>
                <input 
                  type="text" 
                  value={formData.avatar_url} 
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })} 
                  placeholder="Dán link ảnh avatar của bạn (.png, .jpg,...)" 
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100" 
                />
              </div>

              {/* VTO Assets URLs */}
              <div className="border-t border-brand-100 dark:border-slate-800 pt-5 space-y-4">
                <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wide">
                  <Sparkles size={16} /> Dữ liệu thử đồ trực tuyến (VTO)
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      Đường dẫn ảnh body cá nhân (VTO 2D)
                    </label>
                    <input 
                      type="text" 
                      value={formData.body_image_url} 
                      onChange={(e) => setFormData({ ...formData, body_image_url: e.target.value })} 
                      placeholder="Dán link ảnh chụp vóc dáng người dùng (.png/jpg)" 
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      Đường dẫn model 3D Avatar (.glb/.gltf)
                    </label>
                    <input 
                      type="text" 
                      value={formData.avatar_3d_url} 
                      onChange={(e) => setFormData({ ...formData, avatar_3d_url: e.target.value })} 
                      placeholder="Dán link file 3D Model nhân vật để thử đồ 3D" 
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-semibold rounded-full shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 transition-all flex items-center gap-1.5 text-sm cursor-pointer font-sans"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'wallet' && (
            /* WALLET & BANK TAB */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Custodial Wallet Details (Expanded version in tab) */}
              <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-brand-900 dark:text-slate-100 font-bold border-b border-brand-50 dark:border-slate-800 pb-3 text-sm uppercase tracking-wider">
                  <Wallet size={18} /> Ví Giám Hộ Web 2.5 (Blockchain)
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    Đây là ví kỹ thuật số bảo mật được cấp tự động cho tài khoản của bạn. Ví này dùng để nhận thưởng, điểm Affiliate, hoàn tiền mặt, và giao dịch hợp đồng thông minh trên Ledger Blockchain.
                  </p>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 relative group">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Địa chỉ ví công khai (Public Address)</span>
                      {user.wallet_address && (
                        <a 
                          href={`https://amoy.polygonscan.com/address/${user.wallet_address}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-slate-400 hover:text-brand-500 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                          title="Xem trên Polygonscan"
                        >
                          Xem trên Explorer <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <div className="font-mono text-xs text-brand-600 dark:text-brand-400 select-all break-all leading-normal">
                      {user.wallet_address || 'Chưa khởi tạo ví'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Account Config Form */}
              <form onSubmit={handleSaveBank} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-6">
                <div className="flex items-center gap-2 text-brand-900 dark:text-slate-100 font-bold border-b border-brand-50 dark:border-slate-800 pb-3 text-sm uppercase tracking-wider">
                  <Globe size={18} /> Tài khoản ngân hàng (Rút tiền & Thanh toán)
                </div>

                {bankSaved && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-450 text-xs font-semibold rounded-xl border border-green-200 dark:border-green-900/30 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Lưu tài khoản ngân hàng thành công!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bank Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tên ngân hàng</label>
                    <select 
                      value={bankForm.bank_name} 
                      onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans"
                    >
                      <option value="">Chọn ngân hàng</option>
                      <option value="Vietcombank">Vietcombank (VCB)</option>
                      <option value="Techcombank">Techcombank (TCB)</option>
                      <option value="MB Bank">MB Bank (MB)</option>
                      <option value="VietinBank">VietinBank (CTG)</option>
                      <option value="BIDV">BIDV</option>
                      <option value="Agribank">Agribank</option>
                      <option value="ACB">ACB</option>
                      <option value="Sacombank">Sacombank</option>
                      <option value="TPBank">TPBank</option>
                    </select>
                  </div>

                  {/* Bank Account Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tên chủ tài khoản (Viết hoa không dấu)</label>
                    <input 
                      type="text" 
                      value={bankForm.bank_account_name} 
                      onChange={(e) => setBankForm({ ...bankForm, bank_account_name: e.target.value.toUpperCase() })} 
                      placeholder="VD: NGUYEN VAN A"
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                    />
                  </div>

                  {/* Bank Account Number */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Số tài khoản ngân hàng</label>
                    <input 
                      type="text" 
                      value={bankForm.bank_account_number} 
                      onChange={(e) => setBankForm({ ...bankForm, bank_account_number: e.target.value.replace(/\D/g, '') })} 
                      placeholder="VD: 1903652618999"
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={bankSaving}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-semibold rounded-full shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 transition-all flex items-center gap-1.5 text-sm cursor-pointer font-sans"
                >
                  {bankSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Lưu tài khoản ngân hàng
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            /* SECURITY & ACCOUNT SETTINGS TAB */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-6">
                <div className="flex items-center gap-2 text-brand-900 dark:text-slate-100 font-bold border-b border-brand-50 dark:border-slate-800 pb-3 text-sm uppercase tracking-wider">
                  <Lock size={18} /> Đổi mật khẩu tài khoản
                </div>

                {pwdSaved && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-450 text-xs font-semibold rounded-xl border border-green-200 dark:border-green-900/30 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Đổi mật khẩu thành công!
                  </div>
                )}

                {pwdError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/30 flex items-center gap-2">
                    <AlertCircle size={16} /> {pwdError}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mật khẩu cũ</label>
                    <input 
                      type="password" 
                      value={pwdForm.currentPassword} 
                      onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} 
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      value={pwdForm.newPassword} 
                      onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} 
                      placeholder="Nhập mật khẩu mới"
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" 
                      value={pwdForm.confirmPassword} 
                      onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} 
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={pwdSaving}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-semibold rounded-full shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 transition-all flex items-center gap-1.5 text-sm cursor-pointer font-sans"
                >
                  {pwdSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Cập nhật mật khẩu
                </button>
              </form>

              {/* Forgot Password OTP card */}
              <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-brand-900 dark:text-slate-100 font-bold border-b border-brand-50 dark:border-slate-800 pb-3 text-sm uppercase tracking-wider">
                  <Info size={18} /> Khôi phục mật khẩu qua Email OTP
                </div>

                {forgotSent && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-450 text-xs font-semibold rounded-xl border border-green-200 dark:border-green-900/30 flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 size={16} /> {forgotSent}
                  </div>
                )}

                {forgotError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/30 flex items-center gap-2 animate-in fade-in duration-200">
                    <AlertCircle size={16} /> {forgotError}
                  </div>
                )}

                {forgotStep === 1 ? (
                  <form onSubmit={handleSendForgotOTP} className="space-y-4">
                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                      Hệ thống sẽ tạo một mã xác minh OTP gửi trực tiếp về địa chỉ email đã đăng ký của bạn.
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        Email đăng ký <Lock size={12} className="text-slate-400" />
                      </label>
                      <div className="relative">
                        <input 
                          type="email" 
                          value={user?.email || ''} 
                          disabled
                          className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none cursor-not-allowed font-sans font-semibold" 
                        />
                        <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={forgotSaving}
                      className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-semibold text-xs rounded-full transition-all cursor-pointer flex items-center gap-1.5 font-sans"
                    >
                      {forgotSaving ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      Gửi mã xác thực OTP
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordOTP} className="space-y-4">
                    <p className="text-xs text-slate-450 dark:text-slate-450 leading-relaxed">
                      Vui lòng kiểm tra hộp thư email <strong>{forgotEmail}</strong> (Môi trường Test: hoặc xem tab console log của backend) để lấy mã xác minh OTP 6 chữ số và nhập mật khẩu mới của bạn dưới đây:
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* OTP Code */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mã OTP xác thực (6 chữ số)</label>
                        <input 
                          type="text" 
                          maxLength={6}
                          value={forgotForm.otp} 
                          onChange={(e) => setForgotForm({ ...forgotForm, otp: e.target.value.replace(/\D/g, '') })} 
                          placeholder="VD: 123456"
                          required
                          className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-widest focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100" 
                        />
                      </div>

                      {/* New Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mật khẩu mới</label>
                        <input 
                          type="password" 
                          value={forgotForm.newPassword} 
                          onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })} 
                          placeholder="Nhập mật khẩu mới"
                          required
                          className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                        />
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Xác nhận mật khẩu mới</label>
                        <input 
                          type="password" 
                          value={forgotForm.confirmPassword} 
                          onChange={(e) => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })} 
                          placeholder="Nhập lại mật khẩu mới"
                          required
                          className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-slate-900 dark:text-slate-100 font-sans" 
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button 
                        type="submit"
                        disabled={forgotSaving}
                        className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-semibold text-xs rounded-full transition-all cursor-pointer flex items-center gap-1.5 font-sans"
                      >
                        {forgotSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Xác nhận & Đặt lại mật khẩu
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          setForgotStep(1);
                          setForgotSent('');
                          setForgotError('');
                        }}
                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs rounded-full transition-all cursor-pointer"
                      >
                        Quay lại
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pass' && (
            /* C2C PASS ITEMS MANAGEMENT PANEL */
            <PassItemsManagement user={user} />
          )}
        </div>

      </div>
    </div>
  );
}

// ── Pass Items Management Subcomponent ────────────────────────────
function PassItemsManagement({ user }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [imgInput, setImgInput] = useState('');

  const emptyPassForm = () => ({
    name: '',
    description: '',
    price_sale: '',
    price_cost: '',
    condition: 90, // % new
    category_id: '',
    color: '',
    size: '',
    images: [],
  });
  const [form, setForm] = useState(emptyPassForm());

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        api.get(`/products?owner_id=${user.id}&is_pass_item=true`),
        api.get('/categories')
      ]);
      setItems(prodRes.status === 'fulfilled' ? (prodRes.value?.data ?? prodRes.value ?? []) : []);
      setCategories(catRes.status === 'fulfilled' ? (catRes.value?.data ?? catRes.value ?? []) : []);
    } catch (_) {}
    finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyPassForm());
    setImgInput('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      price_sale: item.price_sale || '',
      price_cost: item.price_cost || '',
      condition: item.condition || 90,
      category_id: item.category_id || '',
      color: item.variants?.[0]?.color || '',
      size: item.variants?.[0]?.size || '',
      images: item.images?.map(img => ({ image_url: typeof img === 'string' ? img : img.image_url })) || [],
    });
    setImgInput('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Vui lòng nhập tên sản phẩm', 'error'); return; }
    if (!form.price_sale) { showToast('Vui lòng nhập giá thanh lý', 'error'); return; }
    
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price_sale: Number(form.price_sale),
        price_cost: Number(form.price_cost) || 0,
        stock: 1, // Pass item always has stock = 1
        is_pass_item: true,
        condition: Number(form.condition) || 90,
        category_id: form.category_id || undefined,
        owner_id: user.id,
        status: 'active',
        images: form.images.map(img => typeof img === 'string' ? img : img.image_url).filter(Boolean),
        variants: [{
          color: form.color || 'Mặc định',
          size: form.size || 'Freesize',
          quantity: 1,
          price_sale: Number(form.price_sale)
        }]
      };

      if (editItem) {
        await api.put(`/products/${editItem.id}`, payload);
        showToast('Cập nhật thông tin thành công!');
      } else {
        await api.post('/products', payload);
        showToast('Đăng bán đồ Pass thành công!');
      }
      setShowModal(false);
      fetchItems();
    } catch (e) {
      showToast(e.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setDeleteConfirm(null);
      showToast('Đã gỡ đồ Pass thanh lý!');
      fetchItems();
    } catch (e) {
      showToast('Có lỗi xảy ra khi gỡ sản phẩm', 'error');
    }
  };

  // Image Drag and Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chỉ chọn tệp hình ảnh!', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm(f => ({
          ...f,
          images: [...f.images, { image_url: e.target.result }]
        }));
      };
      reader.readAsDataURL(file);
    });
    showToast(`Đã thêm ${files.length} ảnh!`);
  };

  const setMainImage = (index) => {
    if (index === 0) return;
    setForm(f => {
      const imgs = [...f.images];
      const [target] = imgs.splice(index, 1);
      imgs.unshift(target);
      return { ...f, images: imgs };
    });
    showToast('Đã đặt làm ảnh chính!');
  };

  const removeImg = (index) => {
    setForm(f => ({
      ...f,
      images: f.images.filter((_, j) => j !== index)
    }));
  };

  const addImgViaUrl = () => {
    if (!imgInput.trim()) return;
    setForm(f => ({ ...f, images: [...f.images, { image_url: imgInput.trim() }] }));
    setImgInput('');
    showToast('Đã thêm ảnh từ URL!');
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-6 relative">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-semibold animate-in slide-in-from-top-3 duration-200 ${
          toast.type === 'success' ? 'bg-brand-650 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-50 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-brand-900 dark:text-slate-100 font-bold text-sm uppercase tracking-wider">
          <Tag size={18} /> Đồ Pass thanh lý của tôi
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-xl transition-all text-xs shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-95 self-start sm:self-auto"
        >
          <Plus size={14} /> Đăng bán đồ Pass
        </button>
      </div>

      {/* Body List */}
      {loading ? (
        <div className="flex justify-center items-center py-16 gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin text-brand-500" />
          <span className="text-xs">Đang tải sản phẩm...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Shirt size={40} className="text-slate-300" />
          <div className="space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Bạn chưa có sản phẩm pass nào</p>
            <p className="text-[10px] text-slate-400 max-w-[280px]">Thanh lý tủ quần áo cũ của bạn và bắt đầu kiếm tiền ngay hôm nay.</p>
          </div>
          <button onClick={openCreate} className="bg-brand-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow hover:bg-brand-600">Đăng bán ngay</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map(item => {
            const cat = categories.find(c => c.id === item.category_id);
            const img = item.images?.[0];
            return (
              <div key={item.id} className="flex gap-4 p-3 bg-brand-50/20 dark:bg-slate-950/20 border border-brand-50 dark:border-slate-800/80 rounded-2xl hover:shadow-md transition-shadow relative group">
                <div className="w-18 h-18 rounded-xl overflow-hidden shrink-0 border bg-white">
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Shirt size={24} /></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate pr-14">{item.name}</h5>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded">Độ mới: {item.condition}%</span>
                      <span className="text-[9px] text-slate-450">{cat?.name || 'Chưa phân loại'}</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold text-[13px] text-brand-650 dark:text-brand-400">{fmtPrice(item.price_sale)}</span>
                    {item.price_cost > 0 && <span className="text-[10px] text-slate-400 line-through">{fmtPrice(item.price_cost)}</span>}
                  </div>
                </div>

                {/* Hover actions */}
                <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(item)} className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-brand-600 shadow-sm border rounded-lg transition-colors" title="Chỉnh sửa">
                    <Edit2 size={11} />
                  </button>
                  <button onClick={() => setDeleteConfirm(item)} className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-red-500 shadow-sm border rounded-lg transition-colors" title="Gỡ bán">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DELETE CONFIRMATION ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-4 text-red-500">
              <Trash2 size={22} />
            </div>
            <h3 className="text-sm font-bold mb-1">Gỡ sản phẩm thanh lý?</h3>
            <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn gỡ <strong className="text-slate-800 dark:text-slate-200">"{deleteConfirm.name}"</strong> khỏi trang bán hàng thanh lý?<br/>Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors">Hủy bỏ</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2 rounded-xl bg-red-655 hover:bg-red-700 text-white font-semibold text-xs transition-colors">Đồng ý</button>
            </div>
          </div>
        </div>
      )}

      {/* ── POST / EDIT C2C MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[160] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl my-6 animate-in zoom-in-98 duration-150 text-slate-900 dark:text-white">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl">
              <div>
                <h4 className="font-bold text-sm">{editItem ? 'Chỉnh sửa đồ Pass' : 'Đăng bán đồ Pass thanh lý'}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Thanh lý quần áo cũ để hướng tới phong cách thời trang tuần hoàn C2C</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              
              {/* Product name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Tên sản phẩm <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Áo khoác gió Varsity Jacket cũ"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-850 dark:text-slate-200"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Mô tả tình trạng món đồ</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả độ mới, vết xước nếu có, lý do pass..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-850 dark:text-slate-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category select */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Danh mục</label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Condition Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Độ mới món đồ</label>
                    <span className="text-[10px] text-brand-600 font-bold">{form.condition}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={form.condition}
                    onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                    className="w-full accent-brand-500 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[9px] text-slate-400">Yêu cầu độ mới từ 50% trở lên</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Color select */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Màu sắc</label>
                  <select
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Chọn màu sắc</option>
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Size select */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Kích cỡ (Size)</label>
                  <select
                    value={form.size}
                    onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Chọn kích cỡ</option>
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Price Sale */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Giá thanh lý (₫) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min={0}
                    value={form.price_sale}
                    onChange={e => setForm(f => ({ ...f, price_sale: e.target.value }))}
                    placeholder="150,000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-850 dark:text-slate-200"
                  />
                </div>

                {/* Price Cost */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Giá mua gốc (₫)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price_cost}
                    onChange={e => setForm(f => ({ ...f, price_cost: e.target.value }))}
                    placeholder="350,000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-850 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Images Drag zone */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Hình ảnh món đồ</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                  className={`w-full py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-brand-500 bg-brand-50/20' 
                      : 'border-slate-200 dark:border-slate-850 hover:border-brand-400 bg-slate-50/50 dark:bg-slate-900'
                  }`}
                >
                  <UploadCloud size={24} className="text-slate-400" />
                  <p className="text-[11px] font-semibold text-slate-650 dark:text-slate-300">Kéo thả ảnh hoặc <span className="text-brand-500 hover:underline">Chọn file</span></p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative group w-14 h-14 rounded-lg overflow-hidden border bg-white">
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        {i === 0 ? (
                          <span className="absolute bottom-0 inset-x-0 text-center text-[8px] bg-brand-500 text-white font-bold py-0.5">CHÍNH</span>
                        ) : (
                          <button
                            onClick={() => setMainImage(i)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 text-[8px] font-bold"
                          >
                            Đặt chính
                          </button>
                        )}
                        <button
                          onClick={() => removeImg(i)}
                          className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-650 text-white rounded-full flex items-center justify-center text-[9px] shadow hover:bg-red-700"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    value={imgInput}
                    onChange={e => setImgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addImgViaUrl()}
                    placeholder="Hoặc dán URL ảnh tại đây..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                  <button onClick={addImgViaUrl} className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-250 text-slate-700 dark:text-slate-250 rounded-xl transition-colors shrink-0">
                    Thêm URL
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 rounded-b-2xl">
              <p className="text-[10px] text-slate-400">* Bắt buộc</p>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md transition-all active:scale-95"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {editItem ? 'Lưu' : 'Đăng bán'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
