import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  LayoutGrid,
  List,
  CheckCircle2,
  Ban,
  Copy,
  Check,
  Store,
  UserCheck,
  UserX,
  Calendar,
  Shield,
  Info,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Mail,
  Phone,
  User as UserIcon,
  Cake,
  ShieldAlert,
  Clock,
  Eye,
  SlidersHorizontal,
  XCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminUsers() {
  const { user: currentAdmin } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  
  // Advanced Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [walletFilter, setWalletFilter] = useState('ALL');
  const [storeFilter, setStoreFilter] = useState('ALL');

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formGender, setFormGender] = useState('Nam');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formUserType, setFormUserType] = useState('customer');
  const [formAccountStatus, setFormAccountStatus] = useState('active');
  const [formStoreId, setFormStoreId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // UI state
  const [copiedId, setCopiedId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStores = useCallback(async () => {
    try {
      const data = await api.get('/stores');
      setStores(Array.isArray(data) ? data : []);
    } catch {
      // Fail silently
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStores();
  }, [fetchUsers, fetchStores]);

  const handleCopyWallet = (address, id) => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    showToast('Đã sao chép địa chỉ ví ngầm!');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center px-2.5 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded-full border border-rose-500/20 whitespace-nowrap">Quản trị viên</span>;
      case 'staff':
        return <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full border border-blue-500/20 whitespace-nowrap">Nhân viên</span>;
      case 'shop':
        return <span className="inline-flex items-center px-2.5 py-0.5 bg-amber-500/10 text-amber-600 text-[10px] font-bold rounded-full border border-amber-500/20 whitespace-nowrap">Cửa hàng</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-500/10 text-gray-400 text-[10px] font-bold rounded-full border border-gray-200 dark:border-white/5 whitespace-nowrap">Khách hàng</span>;
    }
  };

  const getRoleRingClass = (role) => {
    switch (role) {
      case 'admin': return 'border-rose-500/30 ring-rose-500/10';
      case 'staff': return 'border-blue-500/30 ring-blue-500/10';
      case 'shop': return 'border-amber-500/30 ring-amber-500/10';
      default: return 'border-slate-200 dark:border-slate-800';
    }
  };

  const getStoreName = (storeId) => {
    if (!storeId) return '';
    const st = stores.find(s => s.id === storeId);
    return st ? st.name : storeId;
  };

  const resetForm = () => {
    setFormUsername('');
    setFormEmail('');
    setFormFullName('');
    setFormPhone('');
    setFormPassword('');
    setFormGender('Nam');
    setFormBirthDate('');
    setFormUserType('customer');
    setFormAccountStatus('active');
    setFormStoreId('');
    setFormError('');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setGenderFilter('ALL');
    setWalletFilter('ALL');
    setStoreFilter('ALL');
    setStartDate('');
    setEndDate('');
    showToast('Đã xóa tất cả bộ lọc!');
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormUsername(user.username || '');
    setFormEmail(user.email || '');
    setFormFullName(user.full_name || '');
    setFormPhone(user.phone || '');
    setFormPassword('');
    setFormGender(user.gender || 'Nam');
    setFormBirthDate(user.birth_date || '');
    setFormUserType(user.user_type || 'customer');
    setFormAccountStatus(user.account_status || 'active');
    setFormStoreId(user.store_id || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    if (user.id === currentAdmin?.id) {
      showToast('Bạn không thể tự khóa tài khoản của chính mình!', 'error');
      return;
    }

    const newStatus = user.account_status === 'active' ? 'suspended' : 'active';
    const confirmMsg = user.account_status === 'active' 
      ? 'Bạn có chắc chắn muốn KHÓA tài khoản này?' 
      : 'Bạn có chắc chắn muốn MỞ KHÓA tài khoản này?';

    if (window.confirm(confirmMsg)) {
      try {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, account_status: newStatus } : u));
        await api.put(`/users/${user.id}`, { account_status: newStatus });
        showToast(`Đã ${newStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản thành công!`);
        fetchUsers();
      } catch (e) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, account_status: user.account_status } : u));
        showToast(e.message || 'Lỗi thay đổi trạng thái tài khoản', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formEmail.trim()) return setFormError('Email là bắt buộc.');
    if (!editingUser && !formPassword) return setFormError('Mật khẩu là bắt buộc cho tài khoản mới.');
    if ((formUserType === 'shop' || formUserType === 'staff') && !formStoreId) {
      return setFormError('Vui lòng liên kết một cửa hàng cho vai trò Shop hoặc Staff.');
    }

    setSubmitting(true);
    try {
      const payload = {
        username: formUsername.trim() || undefined,
        email: formEmail.trim(),
        full_name: formFullName.trim() || undefined,
        phone: formPhone.trim() || undefined,
        gender: formGender,
        birth_date: formBirthDate || undefined,
        user_type: formUserType,
        account_status: formAccountStatus,
        store_id: (formUserType === 'shop' || formUserType === 'staff') ? formStoreId : null,
      };

      if (formPassword) {
        payload.password = formPassword;
      }

      if (editingUser) {
        if (editingUser.id === currentAdmin?.id && formUserType !== 'admin') {
          setSubmitting(false);
          return setFormError('Bạn không thể tự hạ quyền Admin của chính mình.');
        }

        await api.put(`/users/${editingUser.id}`, payload);
        showToast('Cập nhật tài khoản thành công!');
      } else {
        await api.post('/users', payload);
        showToast('Tạo tài khoản mới thành công! Ví ngầm đã tự động khởi tạo.');
      }

      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Có lỗi xảy ra khi lưu thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentAdmin?.id) {
      showToast('Bạn không thể tự xóa tài khoản của chính mình!', 'error');
      setDeleteConfirmId(null);
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      setDeleteConfirmId(null);
      showToast('Đã xóa tài khoản thành công!');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa tài khoản.', 'error');
    }
  };

  // Filter Logic
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.wallet_address && u.wallet_address.toLowerCase().includes(q));

    const matchRole = roleFilter === 'ALL' || u.user_type === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.account_status === statusFilter;
    const matchGender = genderFilter === 'ALL' || u.gender === genderFilter;
    
    let matchWallet = true;
    if (walletFilter === 'has_wallet') matchWallet = !!u.wallet_address;
    if (walletFilter === 'no_wallet') matchWallet = !u.wallet_address;

    let matchStore = true;
    if (storeFilter === 'has_store') matchStore = !!u.store_id;
    if (storeFilter === 'no_store') matchStore = !u.store_id;

    // Filter by date
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      if (new Date(u.created_at) < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      if (new Date(u.created_at) > end) return false;
    }

    return matchSearch && matchRole && matchStatus && matchGender && matchWallet && matchStore;
  });

  // Stats
  const totalCount = users.length;
  const suspendedCount = users.filter(u => u.account_status === 'suspended').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 tracking-tight text-slate-800 dark:text-slate-200">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl text-sm font-bold border backdrop-blur-md animate-in slide-in-from-top-3 duration-250 ${
          toast.type === 'success' 
            ? 'bg-emerald-500 border-emerald-400/30 text-white' 
            : 'bg-rose-500 border-rose-400/30 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="text-white" /> : <ShieldAlert size={18} className="text-white" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header & Stats Layout (Pristine non-squishable Flex layout) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-2">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-400/10 flex items-center justify-center text-brand-500 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight whitespace-nowrap">
              Quản lý Người dùng
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              Xem, tìm kiếm và quản lý quyền hạn của toàn bộ thành viên.
            </p>
          </div>
        </div>

        {/* Small stats cards container (exact standard sizes, flex gap layout) */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Card 1: Tất cả */}
          <button 
            onClick={() => { setRoleFilter('ALL'); setStatusFilter('ALL'); setStartDate(''); setEndDate(''); }}
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all text-left w-36 cursor-pointer ${
              roleFilter === 'ALL' && statusFilter === 'ALL' && !startDate && !endDate
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-805 text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              roleFilter === 'ALL' && statusFilter === 'ALL' && !startDate && !endDate ? 'bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold opacity-75">Tất cả</div>
              <div className="text-base font-black leading-none mt-0.5">{totalCount}</div>
            </div>
          </button>

          {/* Card 2: Bị khóa */}
          <button 
            onClick={() => { setRoleFilter('ALL'); setStatusFilter('suspended'); }}
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all text-left w-36 cursor-pointer ${
              statusFilter === 'suspended'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-805 text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              statusFilter === 'suspended' ? 'bg-rose-500/20' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold opacity-75">Khóa</div>
              <div className="text-base font-black leading-none mt-0.5">{suspendedCount}</div>
            </div>
          </button>

          {/* Card 3: Thao tác Thêm User */}
          <button 
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-all flex items-center gap-3 shadow-sm hover:shadow-md w-44 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-black opacity-80">Thao tác</div>
              <div className="text-xs font-black whitespace-nowrap mt-0.5">Thêm User</div>
            </div>
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-sm transition-all">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          
          {/* Search (Takes maximum horizontal space on left) */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={15} className="text-slate-400" />
            </div>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Username, Email, SĐT hoặc Ví ngầm..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-brand-500 transition-all text-slate-800 dark:text-slate-200 font-semibold placeholder-slate-400"
            />
          </div>

          {/* Right Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {/* Advanced Filters Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                showFilters 
                  ? 'bg-brand-500/10 border-brand-500 text-brand-500' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-655 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              <SlidersHorizontal size={14} /> 
              <span>Bộ lọc nâng cao</span>
              {(roleFilter !== 'ALL' || statusFilter !== 'ALL' || genderFilter !== 'ALL' || walletFilter !== 'ALL' || storeFilter !== 'ALL' || startDate || endDate) && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
              )}
            </button>

            {/* View toggle */}
            <div className="flex gap-1 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-brand-500 shadow-sm border border-slate-200/50 dark:border-slate-800' : 'text-gray-400'}`}
              ><List size={14} /></button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-brand-500 shadow-sm border border-slate-200/50 dark:border-slate-800' : 'text-gray-400'}`}
              ><LayoutGrid size={14} /></button>
            </div>

            <button 
              onClick={fetchUsers} 
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-slate-500 hover:text-brand-500 transition-colors cursor-pointer" 
              title="Làm mới"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* ── Advanced Filters Panel ── */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Role Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Vai trò</label>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-brand-500 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold"
              >
                <option value="ALL">Tất cả</option>
                <option value="customer">Khách hàng</option>
                <option value="shop">Cửa hàng</option>
                <option value="staff">Nhân viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-brand-500 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold"
              >
                <option value="ALL">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="suspended">Đã khóa</option>
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Giới tính</label>
              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-brand-500 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold"
              >
                <option value="ALL">Tất cả</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            {/* Wallet Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Ví Web3</label>
              <select
                value={walletFilter}
                onChange={e => setWalletFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-brand-500 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold"
              >
                <option value="ALL">Tất cả</option>
                <option value="has_wallet">Đã có ví</option>
                <option value="no_wallet">Chưa tạo ví</option>
              </select>
            </div>

            {/* Store Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Liên kết shop</label>
              <select
                value={storeFilter}
                onChange={e => setStoreFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-brand-500 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold"
              >
                <option value="ALL">Tất cả</option>
                <option value="has_store">Đã liên kết</option>
                <option value="no_store">Chưa liên kết</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Từ ngày tham gia</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-brand-500 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Đến ngày tham gia</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-brand-500 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold"
              />
            </div>
          </div>
        )}

        {/* ── Active Filter Tags ── */}
        {(roleFilter !== 'ALL' || statusFilter !== 'ALL' || genderFilter !== 'ALL' || walletFilter !== 'ALL' || storeFilter !== 'ALL' || searchQuery || startDate || endDate) && (
          <div className="flex flex-wrap gap-1.5 pt-2 items-center">
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mr-1">Đang lọc:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Tìm kiếm: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-red-500 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            {roleFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Vai trò: {roleFilter === 'admin' ? 'Quản trị viên' : roleFilter === 'staff' ? 'Nhân viên' : roleFilter === 'shop' ? 'Cửa hàng' : 'Khách hàng'}
                <button onClick={() => setRoleFilter('ALL')} className="hover:text-red-500 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Trạng thái: {statusFilter === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                <button onClick={() => setStatusFilter('ALL')} className="hover:text-red-500 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            {genderFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Giới tính: {genderFilter}
                <button onClick={() => setGenderFilter('ALL')} className="hover:text-red-500 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            {walletFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Ví Web3: {walletFilter === 'has_wallet' ? 'Đã có ví' : 'Chưa tạo ví'}
                <button onClick={() => setWalletFilter('ALL')} className="hover:text-red-500 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            {storeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Cửa hàng: {storeFilter === 'has_store' ? 'Đã liên kết' : 'Chưa liên kết'}
                <button onClick={() => setStoreFilter('ALL')} className="hover:text-red-500 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            {startDate && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Từ ngày: {startDate}
                <button onClick={() => setStartDate('')} className="hover:text-red-500 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            {endDate && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Đến ngày: {endDate}
                <button onClick={() => setEndDate('')} className="hover:text-red-500 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-[10px] text-rose-500 font-bold hover:underline ml-2 flex items-center gap-0.5 cursor-pointer"
            >
              <XCircle size={11} /> 
              <span>Xóa hết bộ lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* Main content table card */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 text-xs uppercase font-black border-b border-slate-200 dark:border-slate-800/80 select-none">
                  <th className="px-6 py-4">Người dùng</th>
                  <th className="px-6 py-4 whitespace-nowrap">Vai trò</th>
                  <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                  <th className="px-6 py-4 whitespace-nowrap">Cửa hàng</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Ngày tham gia</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="6" className="px-6 py-6 bg-slate-50/50 dark:bg-slate-950/20"></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-slate-500 font-bold">Không tìm thấy người dùng nào.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isCurrentAdmin = user.id === currentAdmin?.id;
                    const isSuspended = user.account_status === 'suspended';
                    const ringClass = getRoleRingClass(user.user_type);

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors group">
                        {/* Profile detail */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt=""
                                className={`w-10 h-10 rounded-full object-cover border-2 p-0.5 shrink-0 ${ringClass}`}
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-500 border-2 shrink-0 ${ringClass}`}>
                                {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-gray-900 dark:text-white mb-0.5 truncate flex items-center gap-1.5 leading-snug">
                                {user.full_name || 'Không tên'}
                                {isCurrentAdmin && (
                                  <span className="px-2 py-0.5 bg-brand-500 text-white text-[9px] font-black rounded-full select-none">Tôi</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-450 dark:text-slate-400 truncate">@{user.username || 'user'} • {user.email}</div>
                              
                              {user.phone && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 font-semibold">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{user.phone}</span>
                                </div>
                              )}

                              {user.wallet_address && (
                                <div className="text-[10px] font-mono text-slate-450 mt-1 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity select-all">
                                  <Shield className="w-3 h-3 text-brand-500 shrink-0" />
                                  <span title={user.wallet_address}>Ví ngầm: {user.wallet_address.substring(0, 6)}...{user.wallet_address.substring(38)}</span>
                                  <button
                                    onClick={() => handleCopyWallet(user.wallet_address, user.id)}
                                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-400 hover:text-emerald-500 rounded transition-colors cursor-pointer"
                                  >
                                    {copiedId === user.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.user_type)}</td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {!isSuspended ? (
                            <div className="flex items-center text-green-500 text-xs font-bold gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                              <span>Đang hoạt động</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-500 text-xs font-bold gap-1.5">
                              <Ban className="w-4 h-4 text-red-500 shrink-0" />
                              <span>Đã khóa</span>
                            </div>
                          )}
                        </td>

                        {/* Store */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.store_id ? (
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate max-w-[150px]" title={getStoreName(user.store_id)}>{getStoreName(user.store_id)}</span>
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full uppercase font-black w-fit border border-emerald-500/20">Hoạt động</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Chưa đăng ký Shop</span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell text-xs text-slate-500 font-bold">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}</span>
                          </div>
                        </td>

                        {/* Actions (Standard w-8 h-8 rounded circles, flex-gap spacing) */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {deleteConfirmId === user.id ? (
                            <div className="inline-flex items-center justify-end gap-1.5 bg-red-500/10 border border-red-500/25 p-1 rounded-xl text-xs">
                              <span className="text-red-500 font-black text-[10px] px-1.5">Xóa?</span>
                              <button onClick={() => handleDelete(user.id)} className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg font-black cursor-pointer shadow-sm">Có</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold cursor-pointer">Không</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleOpenEdit(user)}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all border border-transparent dark:border-white/5 cursor-pointer"
                                title="Xem chi tiết & Sửa"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleStatus(user)}
                                disabled={isCurrentAdmin}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                                  isCurrentAdmin
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200/50 opacity-40 cursor-not-allowed'
                                    : !isSuspended 
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' 
                                    : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                                }`}
                                title={isCurrentAdmin ? 'Không khóa Admin' : !isSuspended ? 'Khóa' : 'Mở khóa'}
                              >
                                {!isSuspended ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmId(user.id)}
                                disabled={isCurrentAdmin}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                                  isCurrentAdmin 
                                    ? 'border-slate-100 dark:border-slate-800 text-slate-450 opacity-30 cursor-not-allowed' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 border-transparent dark:border-white/5 cursor-pointer'
                                }`}
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── GRID LAYOUT ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {filteredUsers.map((user) => {
            const isCurrentAdmin = user.id === currentAdmin?.id;
            const isSuspended = user.account_status === 'suspended';
            const ringClass = getRoleRingClass(user.user_type);

            return (
              <div
                key={user.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group/card hover:shadow-md transition-all duration-300 min-h-[220px] ${
                  isSuspended ? 'border-red-500/20 shadow-inner' : 'border-slate-200 dark:border-slate-850 shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          className={`w-10 h-10 rounded-full object-cover border-2 p-0.5 shrink-0 ${ringClass}`}
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-500 border-2 shrink-0 ${ringClass}`}>
                          {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5 leading-tight">
                          {user.full_name || 'Không tên'}
                          {isCurrentAdmin && (
                            <span className="text-[9px] font-black uppercase bg-indigo-500 text-white px-2 py-0.5 rounded-full select-none">Tôi</span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-505 truncate">@{user.username || 'user'}</p>
                      </div>
                    </div>
                    <div className="shrink-0">{getRoleBadge(user.user_type)}</div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-405 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-405 shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.store_id && (
                      <div className="flex items-center gap-2">
                        <Store size={13} className="text-amber-500 shrink-0" />
                        <span className="truncate">Cửa hàng: <strong>{getStoreName(user.store_id)}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    {user.wallet_address ? (
                      <div className="flex items-center gap-1.5">
                        <code className="text-[10px] font-mono font-bold bg-slate-55 dark:bg-slate-950 px-2 py-1 border border-slate-200 dark:border-slate-805 text-slate-550 dark:text-slate-400 rounded">
                          Ví: {user.wallet_address.substring(0, 6)}...{user.wallet_address.substring(38)}
                        </code>
                        <button
                          onClick={() => handleCopyWallet(user.wallet_address, user.id)}
                          className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500 rounded transition-colors cursor-pointer"
                        >
                          {copiedId === user.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] italic text-slate-400 font-medium">Chưa tạo ví ngầm</span>
                    )}

                    <div className="flex gap-1 shrink-0">
                      {user.avatar_3d_url && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">3D</span>
                      )}
                      {user.body_image_url && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-450 rounded">2D</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {!isSuspended ? (
                      <span className="inline-flex items-center text-green-500 text-[10px] font-black space-x-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span>Hoạt động</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-500 text-[10px] font-black space-x-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span>Tạm khóa</span>
                      </span>
                    )}

                    {deleteConfirmId === user.id ? (
                      <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 p-0.5 rounded-lg text-xs shadow-inner">
                        <span className="text-red-500 font-extrabold text-[10px] px-1.5">Xóa?</span>
                        <button onClick={() => handleDelete(user.id)} className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-black cursor-pointer shadow-sm">Có</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-0.5 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold cursor-pointer">Không</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenEdit(user)} 
                          className="w-7.5 h-7.5 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-gray-505 hover:text-brand-500 rounded-lg transition-colors border border-transparent dark:border-white/5 cursor-pointer" 
                          title="Xem"
                        >
                          <Eye size={12} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          disabled={isCurrentAdmin}
                          className={`w-7.5 h-7.5 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                            isCurrentAdmin
                              ? 'bg-slate-100 dark:bg-white/5 text-gray-405 border-gray-250 dark:border-white/10 cursor-not-allowed opacity-60'
                              : !isSuspended 
                              ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' 
                              : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                          }`}
                          title={isCurrentAdmin ? 'Không khóa Admin' : !isSuspended ? 'Khóa' : 'Mở khóa'}
                        >
                          {!isSuspended ? <Ban size={12} /> : <UserCheck size={12} />}
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(user.id)} 
                          disabled={isCurrentAdmin}
                          className={`w-7.5 h-7.5 rounded-full flex items-center justify-center border transition-colors ${
                            isCurrentAdmin 
                              ? 'border-slate-150 dark:border-slate-800 text-slate-455 opacity-30 cursor-not-allowed' 
                              : 'bg-slate-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 border-transparent dark:border-white/5 cursor-pointer'
                          }`}
                          title="Xóa"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between text-xs text-slate-505 transition-colors select-none">
         <span>Hiển thị 1 - {filteredUsers.length} của {filteredUsers.length} người dùng</span>
         <div className="flex items-center space-x-2">
            <button disabled className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-lg opacity-50 cursor-not-allowed select-none">Trước</button>
            <button disabled className="px-3 py-1.5 bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-805 rounded-lg opacity-50 cursor-not-allowed select-none">Sau</button>
         </div>
      </div>

      {/* ─── CREATE / EDIT USER MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-805 rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {editingUser ? 'Cấu hình hồ sơ' : 'Thêm User mới'}
                </h3>
                <p className="text-xs text-gray-550 dark:text-gray-400 mt-0.5">Thiết lập dữ liệu hồ sơ, vai trò truy cập và ví Web3</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 text-xs bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 flex items-center gap-2 font-bold animate-in shake duration-300">
                  <ShieldAlert size={15} className="shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Username + Email block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-550 dark:text-gray-400 uppercase tracking-tight">Username</label>
                  <div className="relative">
                    <UserIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="VD: seller_vestra"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-550 dark:text-gray-400 uppercase tracking-tight">Email liên kết *</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-505" />
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value.trim())}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 font-semibold"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-555 dark:text-gray-400 uppercase tracking-tight">
                  {editingUser ? 'Mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? "Nhập mật khẩu mới..." : "Nhập mật khẩu..."}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 font-semibold"
                  required={!editingUser}
                />
              </div>

              {/* Full Name + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-555 dark:text-gray-450 uppercase tracking-tight">Họ và tên</label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-555 dark:text-gray-450 uppercase tracking-tight">Số điện thoại</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="VD: 0987654321"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Gender + Birth Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-550 dark:text-gray-450 uppercase tracking-tight">Giới tính</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white font-bold cursor-pointer"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-550 dark:text-gray-455 uppercase tracking-tight">Ngày sinh</label>
                  <div className="relative">
                    <Cake size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="date"
                      value={formBirthDate}
                      onChange={(e) => setFormBirthDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Role selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-black text-slate-550 dark:text-gray-450 uppercase tracking-tight block mb-1">Vai trò thành viên</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'customer', label: 'Khách hàng' },
                    { value: 'shop', label: 'Cửa hàng' },
                    { value: 'staff', label: 'Nhân viên' },
                    { value: 'admin', label: 'Admin' }
                  ].map((role) => {
                    const isSelfAdmin = editingUser?.id === currentAdmin?.id && role.value !== 'admin';
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => { if (!isSelfAdmin) setFormUserType(role.value); }}
                        disabled={isSelfAdmin}
                        className={`py-2.5 px-1 text-center font-bold text-xs rounded-xl border transition-all ${
                          isSelfAdmin
                            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-455 bg-slate-50 dark:bg-slate-950'
                            : formUserType === role.value
                            ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                            : 'border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-355 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Store Selector */}
              {(formUserType === 'shop' || formUserType === 'staff') && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                  <label className="text-xs font-black text-slate-555 dark:text-gray-450 uppercase tracking-tight flex items-center gap-1.5">
                    <Store size={12} className="text-amber-500" />
                    Liên kết cửa hàng quản lý *
                  </label>
                  <div className="relative">
                    <Store size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-550" />
                    <select
                      value={formStoreId}
                      onChange={(e) => setFormStoreId(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm appearance-none focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white font-bold cursor-pointer"
                      required
                    >
                      <option value="">-- Chọn cửa hàng --</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-555 dark:text-gray-450 uppercase tracking-tight">Trạng thái hoạt động</label>
                <div className="flex p-1 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {[
                    { value: 'active', label: 'Hoạt động' },
                    { value: 'suspended', label: 'Khóa tài khoản' }
                  ].map((status) => {
                    const isSelfAdmin = editingUser?.id === currentAdmin?.id && status.value === 'suspended';
                    return (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => { if (!isSelfAdmin) setFormAccountStatus(status.value); }}
                        disabled={isSelfAdmin}
                        className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                          isSelfAdmin
                            ? 'opacity-40 cursor-not-allowed text-gray-400'
                            : formAccountStatus === status.value
                            ? 'bg-white dark:bg-slate-900 text-brand-500 shadow-sm border border-slate-200/50 dark:border-slate-805 cursor-pointer'
                            : 'text-slate-500 hover:text-slate-700 cursor-pointer'
                        }`}
                      >
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal footer buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 font-bold text-sm rounded-xl cursor-pointer border border-transparent dark:border-slate-800 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 size={14} className="animate-spin text-white" />}
                  <span>{editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
