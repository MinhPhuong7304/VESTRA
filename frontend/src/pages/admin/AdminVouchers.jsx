import { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  LayoutGrid,
  List,
  CheckCircle,
  Clock,
  Ban,
  Calendar,
  Copy,
  Check,
  Info,
  Store,
  Globe,
  ChevronDown
} from 'lucide-react';
import api from '../../services/api';

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'PLATFORM' | 'SHOP'
  const [viewMode, setViewMode] = useState('grid');

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscountType, setFormDiscountType] = useState('PERCENT');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formMaxDiscount, setFormMaxDiscount] = useState('');
  const [formMinOrderValue, setFormMinOrderValue] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formVoucherType, setFormVoucherType] = useState('PLATFORM'); // 'PLATFORM' | 'SHOP'
  const [formStoreId, setFormStoreId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // UI State
  const [copiedId, setCopiedId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/vouchers');
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách voucher.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStores = useCallback(async () => {
    try {
      const data = await api.get('/stores');
      setStores(Array.isArray(data) ? data : []);
    } catch {
      // Non-critical; silently fail
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
    fetchStores();
  }, [fetchVouchers, fetchStores]);

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const isVoucherExpired = (voucher) => {
    if (!voucher.end_date) return false;
    return new Date(voucher.end_date) < new Date();
  };

  const getVoucherStatus = (voucher) => {
    if (voucher.status === 'DISABLED') {
      return {
        label: 'Tạm tắt',
        color: 'text-slate-500 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700',
        icon: Ban,
      };
    }
    if (isVoucherExpired(voucher)) {
      return {
        label: 'Hết hạn',
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30',
        icon: Clock,
      };
    }
    return {
      label: 'Đang chạy',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30',
      icon: CheckCircle,
    };
  };

  const getStoreName = (storeId) => {
    if (!storeId) return null;
    const store = stores.find((s) => s.id === storeId);
    return store ? store.name : storeId;
  };

  const formatDiscount = (type, value) => {
    if (type === 'PERCENT') return `${value}%`;
    return `${Number(value).toLocaleString('vi-VN')}đ`;
  };

  // ── Modal Handlers ──────────────────────────────────────────
  const resetForm = () => {
    setFormCode('');
    setFormDescription('');
    setFormDiscountType('PERCENT');
    setFormDiscountValue('');
    setFormMaxDiscount('');
    setFormMinOrderValue('');
    setFormStartDate('');
    setFormEndDate('');
    setFormStatus('ACTIVE');
    setFormVoucherType('PLATFORM');
    setFormStoreId('');
    setFormError('');
  };

  const handleOpenAdd = () => {
    setEditingVoucher(null);
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormCode(voucher.code);
    setFormDescription(voucher.description || '');
    setFormDiscountType(voucher.discount_type);
    setFormDiscountValue(voucher.discount_value);
    setFormMaxDiscount(voucher.max_discount || '');
    setFormMinOrderValue(voucher.min_order_value || '0');
    setFormStartDate(voucher.start_date ? voucher.start_date.substring(0, 16) : '');
    setFormEndDate(voucher.end_date ? voucher.end_date.substring(0, 16) : '');
    setFormStatus(voucher.status);
    setFormVoucherType(voucher.store_id ? 'SHOP' : 'PLATFORM');
    setFormStoreId(voucher.store_id || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formCode.trim()) return setFormError('Mã Voucher không được để trống.');
    if (!formDiscountValue || Number(formDiscountValue) <= 0)
      return setFormError('Giá trị chiết khấu phải lớn hơn 0.');
    if (formVoucherType === 'SHOP' && !formStoreId)
      return setFormError('Vui lòng chọn cửa hàng cho Voucher shop.');

    setSubmitting(true);
    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim(),
        discount_type: formDiscountType,
        discount_value: Number(formDiscountValue),
        max_discount: formMaxDiscount ? Number(formMaxDiscount) : null,
        min_order_value: formMinOrderValue ? Number(formMinOrderValue) : 0,
        start_date: formStartDate ? new Date(formStartDate).toISOString() : null,
        end_date: formEndDate ? new Date(formEndDate).toISOString() : null,
        status: formStatus,
        store_id: formVoucherType === 'SHOP' ? formStoreId : null,
      };

      if (editingVoucher) {
        await api.put(`/vouchers/${editingVoucher.id}`, payload);
      } else {
        await api.post('/vouchers', payload);
      }

      setModalOpen(false);
      fetchVouchers();
    } catch (err) {
      setFormError(err.message || 'Lỗi gửi dữ liệu voucher.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/vouchers/${id}`);
      setDeleteConfirmId(null);
      fetchVouchers();
    } catch (err) {
      alert(err.message || 'Lỗi xóa voucher.');
    }
  };

  // ── Filter Logic ────────────────────────────────────────────
  const filteredVouchers = vouchers.filter((voucher) => {
    const matchSearch =
      voucher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (voucher.description && voucher.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType =
      typeFilter === 'ALL' ||
      (typeFilter === 'PLATFORM' && !voucher.store_id) ||
      (typeFilter === 'SHOP' && !!voucher.store_id);

    if (!matchSearch || !matchType) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'DISABLED') return voucher.status === 'DISABLED';
    if (statusFilter === 'EXPIRED') return voucher.status === 'ACTIVE' && isVoucherExpired(voucher);
    if (statusFilter === 'ACTIVE') return voucher.status === 'ACTIVE' && !isVoucherExpired(voucher);
    return true;
  });

  // ── Stats counts ────────────────────────────────────────────
  const activeCount = vouchers.filter((v) => v.status === 'ACTIVE' && !isVoucherExpired(v)).length;
  const inactiveCount = vouchers.filter((v) => v.status === 'DISABLED' || isVoucherExpired(v)).length;
  const platformCount = vouchers.filter((v) => !v.store_id).length;
  const shopCount = vouchers.filter((v) => !!v.store_id).length;

  // ── Progress helpers ────────────────────────────────────────
  const getProgress = (voucher) => {
    if (!voucher.start_date || !voucher.end_date) return 100;
    const start = new Date(voucher.start_date).getTime();
    const end = new Date(voucher.end_date).getTime();
    const now = Date.now();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  // ── Source Badge ────────────────────────────────────────────
  const SourceBadge = ({ voucher }) => {
    if (!voucher.store_id) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border text-violet-600 bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/30">
          <Globe size={9} /> Toàn sàn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30">
        <Store size={9} /> {getStoreName(voucher.store_id)}
      </span>
    );
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Page Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Khuyến mãi & Voucher
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý mã giảm giá toàn sàn và riêng theo từng cửa hàng
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-violet-500/15 hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus size={16} /> Tạo Voucher mới
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng Voucher', value: loading ? null : vouchers.length, sub: 'Tất cả mã đã cấu hình', color: 'violet', icon: Ticket },
          { label: 'Đang hoạt động', value: loading ? null : activeCount, sub: 'Khách có thể áp dụng', color: 'emerald', icon: CheckCircle },
          { label: 'Voucher toàn sàn', value: loading ? null : platformCount, sub: 'Áp dụng cho mọi đơn hàng', color: 'blue', icon: Globe },
          { label: 'Voucher Shop', value: loading ? null : shopCount, sub: 'Riêng từng cửa hàng', color: 'amber', icon: Store },
        ].map((card) => {
          const Icon = card.icon;
          const colorMap = {
            violet: { border: 'hover:border-violet-500/30', icon: 'bg-violet-500/10 text-violet-500 border-violet-500/20', val: 'text-violet-600 dark:text-violet-400' },
            emerald: { border: 'hover:border-emerald-500/30', icon: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', val: 'text-emerald-600 dark:text-emerald-400' },
            blue: { border: 'hover:border-blue-500/30', icon: 'bg-blue-500/10 text-blue-500 border-blue-500/20', val: 'text-blue-600 dark:text-blue-400' },
            amber: { border: 'hover:border-amber-500/30', icon: 'bg-amber-500/10 text-amber-500 border-amber-500/20', val: 'text-amber-600 dark:text-amber-400' },
          };
          const c = colorMap[card.color];
          return (
            <div key={card.label} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm ${c.border} hover:shadow-md transition-all duration-300`}>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{card.label}</span>
                <div className={`text-2xl font-extrabold ${c.val}`}>
                  {card.value === null ? <div className="h-7 w-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /> : card.value}
                </div>
                <p className="text-[11px] text-slate-400">{card.sub}</p>
              </div>
              <div className={`p-3 rounded-xl border ${c.icon}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter / Control Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">

          {/* Search */}
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm mã hoặc mô tả voucher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center lg:ml-auto">
            {/* Platform/Shop Type Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              {[['ALL', 'Tất cả'], ['PLATFORM', '🌐 Toàn sàn'], ['SHOP', '🏪 Shop']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setTypeFilter(val)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${typeFilter === val ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              {[['ALL', 'Tất cả'], ['ACTIVE', 'Chạy'], ['DISABLED', 'Tắt'], ['EXPIRED', 'Hết hạn']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${statusFilter === val ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              {[['grid', LayoutGrid, 'Vé'], ['table', List, 'Bảng']].map(([mode, Icon, lbl]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${viewMode === mode ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/50' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{lbl}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filter summary */}
        {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Đang lọc:</span>
            {typeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-900/30 font-semibold">
                {typeFilter === 'PLATFORM' ? '🌐 Toàn sàn' : '🏪 Voucher Shop'}
                <button onClick={() => setTypeFilter('ALL')} className="ml-0.5 hover:text-violet-800 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 font-semibold">
                {statusFilter === 'ACTIVE' ? '✅ Đang chạy' : statusFilter === 'DISABLED' ? '🚫 Tạm tắt' : '⏱ Hết hạn'}
                <button onClick={() => setStatusFilter('ALL')} className="ml-0.5 hover:text-slate-900 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 font-semibold">
                🔍 "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="ml-0.5 hover:text-slate-900 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            <button onClick={() => { setTypeFilter('ALL'); setStatusFilter('ALL'); setSearchQuery(''); }} className="ml-1 text-xs text-slate-400 hover:text-red-500 underline cursor-pointer">Xóa tất cả</button>
          </div>
        )}
      </div>

      {/* Main Display */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center flex flex-col items-center gap-4 shadow-sm">
          <Loader2 size={36} className="animate-spin text-violet-500" />
          <p className="text-slate-500 text-sm font-medium">Đang tải danh sách voucher...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-2xl p-8 text-red-700 dark:text-red-400 text-center space-y-4">
          <AlertTriangle size={32} className="mx-auto" />
          <p className="font-semibold">{error}</p>
          <button onClick={fetchVouchers} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold cursor-pointer">Thử lại</button>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center space-y-5 flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
            <Ticket size={28} />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-lg text-slate-900 dark:text-slate-100">Không tìm thấy voucher nào</p>
            <p className="text-sm text-slate-400">
              {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                ? 'Không có voucher nào khớp với bộ lọc hiện tại.'
                : 'Hệ thống chưa có mã giảm giá nào. Hãy tạo mới!'}
            </p>
          </div>
          {(searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <button onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setTypeFilter('ALL'); }} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer">
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (

        /* ─── Grid / Coupon Card View ─────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {filteredVouchers.map((voucher) => {
            const statusInfo = getVoucherStatus(voucher);
            const StatusIcon = statusInfo.icon;
            const progress = getProgress(voucher);
            const isShop = !!voucher.store_id;

            return (
              <div
                key={voucher.id}
                className={`bg-white dark:bg-slate-900 border-2 border-dashed rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all duration-300 min-h-[210px] ${isShop ? 'border-amber-200 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-800' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
              >
                {/* Notch cutouts */}
                <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-950 border-r border-dashed border-slate-200 dark:border-slate-700 -translate-y-1/2 z-10" />
                <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-950 border-l border-dashed border-slate-200 dark:border-slate-700 -translate-y-1/2 z-10" />

                {/* Top content */}
                <div className="space-y-3 relative z-20">
                  {/* Code + badges row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <code className="text-sm font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-900/50 px-2.5 py-0.5 rounded-lg tracking-wider">
                        {voucher.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(voucher.code, voucher.id)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                        title="Sao chép mã"
                      >
                        {copiedId === voucher.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusInfo.color} shrink-0`}>
                      <StatusIcon size={9} /> {statusInfo.label}
                    </span>
                  </div>

                  {/* Source badge */}
                  <SourceBadge voucher={voucher} />

                  {/* Discount value */}
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                        {formatDiscount(voucher.discount_type, voucher.discount_value)}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">GIẢM</span>
                    </div>
                    {voucher.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">{voucher.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs pt-0.5">
                      <span className="text-slate-400">Đơn tối thiểu: <strong className="text-slate-700 dark:text-slate-300">{Number(voucher.min_order_value).toLocaleString('vi-VN')}đ</strong></span>
                      {voucher.discount_type === 'PERCENT' && voucher.max_discount && (
                        <span className="text-slate-400">Tối đa: <strong className="text-slate-700 dark:text-slate-300">{Number(voucher.max_discount).toLocaleString('vi-VN')}đ</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom section */}
                <div className="mt-4 space-y-2.5 relative z-20">
                  {/* Time progress bar */}
                  {voucher.start_date && voucher.end_date && (
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${isVoucherExpired(voucher) ? 'bg-slate-300 dark:bg-slate-700' : progress > 80 ? 'bg-rose-500' : 'bg-violet-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {/* Expiry + Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={12} />
                      <span>HSD: {voucher.end_date ? new Date(voucher.end_date).toLocaleDateString('vi-VN') : 'Vô hạn'}</span>
                    </div>

                    {deleteConfirmId === voucher.id ? (
                      <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 border border-red-100 p-1 rounded-lg">
                        <span className="text-red-500 font-bold text-[11px] px-1">Xóa?</span>
                        <button onClick={() => handleDelete(voucher.id)} className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer">Có</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold cursor-pointer">Không</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleOpenEdit(voucher)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-violet-500 border border-slate-150 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-900/50 rounded-lg transition-colors cursor-pointer" title="Chỉnh sửa">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setDeleteConfirmId(voucher.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 border border-slate-150 dark:border-slate-800 hover:border-red-200 rounded-lg transition-colors cursor-pointer" title="Xóa">
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

      ) : (

        /* ─── Table View ──────────────────────────────────────── */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-4">Mã Voucher</th>
                  <th className="px-5 py-4">Nguồn</th>
                  <th className="px-5 py-4">Chiết khấu</th>
                  <th className="px-5 py-4">Điều kiện</th>
                  <th className="px-5 py-4">Thời gian</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredVouchers.map((voucher) => {
                  const statusInfo = getVoucherStatus(voucher);
                  return (
                    <tr key={voucher.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <code className="text-xs font-mono font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-md border border-violet-200/50 dark:border-violet-900/50">
                          {voucher.code}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <SourceBadge voucher={voucher} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-black text-slate-900 dark:text-slate-50">
                        {formatDiscount(voucher.discount_type, voucher.discount_value)}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{voucher.description || '—'}</div>
                        <div className="text-[11px] text-slate-400">
                          Min: {Number(voucher.min_order_value).toLocaleString('vi-VN')}đ
                          {voucher.discount_type === 'PERCENT' && voucher.max_discount && ` | Max: ${Number(voucher.max_discount).toLocaleString('vi-VN')}đ`}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 text-xs">
                        {voucher.end_date ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            {voucher.start_date ? new Date(voucher.start_date).toLocaleDateString('vi-VN') : 'Mở'}
                            {' – '}
                            {new Date(voucher.end_date).toLocaleDateString('vi-VN')}
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Vô thời hạn</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        {deleteConfirmId === voucher.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-red-500 font-semibold text-xs">Xóa?</span>
                            <button onClick={() => handleDelete(voucher.id)} className="px-2.5 py-1 text-white bg-red-500 hover:bg-red-600 rounded-lg text-xs font-semibold cursor-pointer">Có</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer">Không</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => handleOpenEdit(voucher)} className="p-1.5 text-slate-500 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer" title="Chỉnh sửa"><Edit2 size={14} /></button>
                            <button onClick={() => setDeleteConfirmId(voucher.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors cursor-pointer" title="Xóa"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── CREATE / EDIT MODAL ──────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                  {editingVoucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Cấu hình mã giảm giá cho sàn hoặc từng shop</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-3 text-sm bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ── Voucher Type: Platform vs Shop ── */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Loại Voucher</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['PLATFORM', '🌐', 'Toàn sàn', 'Áp dụng cho mọi đơn hàng trên hệ thống'],
                    ['SHOP', '🏪', 'Voucher Shop', 'Chỉ áp dụng cho sản phẩm của một cửa hàng cụ thể']].map(([val, emoji, title, sub]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setFormVoucherType(val); if (val === 'PLATFORM') setFormStoreId(''); }}
                      className={`flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${formVoucherType === val ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                    >
                      <span className="text-base mb-1">{emoji}</span>
                      <span className={`text-xs font-bold ${formVoucherType === val ? 'text-violet-600 dark:text-violet-400' : 'text-slate-700 dark:text-slate-300'}`}>{title}</span>
                      <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Shop Selector (shown if SHOP type) ── */}
              {formVoucherType === 'SHOP' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Cửa hàng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Store size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={formStoreId}
                      onChange={(e) => setFormStoreId(e.target.value)}
                      className="w-full pl-10 pr-8 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm appearance-none focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/10 text-slate-900 dark:text-slate-100 cursor-pointer"
                      required
                    >
                      <option value="">-- Chọn cửa hàng --</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* ── Voucher Code ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mã giảm giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: VESTRA10, TET2026"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono font-bold uppercase tracking-wider"
                  required
                />
              </div>

              {/* ── Description ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mô tả</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giảm 10% cho đơn hàng thời trang"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-violet-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              {/* ── Discount Type ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Loại chiết khấu</label>
                <div className="flex p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {[['PERCENT', 'Tỷ lệ (%)'], ['FIXED', 'Số tiền cố định (đ)']].map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setFormDiscountType(val); if (val === 'FIXED') setFormMaxDiscount(''); }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${formDiscountType === val ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/50' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Discount Value & Max Discount ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Giá trị giảm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder={formDiscountType === 'PERCENT' ? '10' : '50000'}
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-violet-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      min={1}
                      max={formDiscountType === 'PERCENT' ? 100 : undefined}
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">{formDiscountType === 'PERCENT' ? '%' : 'đ'}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    Giảm tối đa
                    <span className="group relative cursor-help text-slate-300">
                      <Info size={11} />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed z-30">
                        Chỉ áp dụng cho mã loại Phần trăm. Giới hạn số tiền giảm tối đa.
                      </span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="50000"
                      value={formMaxDiscount}
                      onChange={(e) => setFormMaxDiscount(e.target.value)}
                      disabled={formDiscountType === 'FIXED'}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-violet-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">đ</span>
                  </div>
                </div>
              </div>

              {/* ── Min Spend ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đơn hàng tối thiểu</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="150000"
                    value={formMinOrderValue}
                    onChange={(e) => setFormMinOrderValue(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-violet-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    min={0}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">đ</span>
                </div>
              </div>

              {/* ── Date Range ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-violet-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày kết thúc</label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-violet-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* ── Active Toggle ── */}
              <div className="flex items-center justify-between py-3.5 border-t border-b border-slate-100 dark:border-slate-800/80">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kích hoạt Voucher</span>
                  <p className="text-xs text-slate-400">Nếu tắt, khách không thể áp dụng mã này khi đặt hàng.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormStatus(formStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}
                  className={`w-11 h-6 rounded-full transition-all duration-200 relative focus:outline-none cursor-pointer ${formStatus === 'ACTIVE' ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`w-4.5 h-4.5 bg-white rounded-full absolute top-0.75 left-0.75 transition-transform duration-200 shadow-sm ${formStatus === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* ── Submit Buttons ── */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition-colors cursor-pointer">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-violet-500/15 cursor-pointer disabled:opacity-60">
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  <span>{editingVoucher ? 'Cập nhật' : 'Tạo mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
