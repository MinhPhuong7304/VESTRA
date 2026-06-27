import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import {
  Plus, Search, Edit2, Trash2, X, Ticket,
  CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Tag, Percent, BadgeDollarSign, Calendar, ToggleLeft, ToggleRight,
  LayoutGrid, List, SlidersHorizontal, ArrowUpDown, Copy, Check, Clock, Ban,
  Eye, CalendarDays, ChevronLeft, ChevronRight
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────
const DISCOUNT_TYPES = [
  { value: 'PERCENT', label: 'Giảm %', icon: Percent },
  { value: 'FIXED',   label: 'Giảm tiền cố định (₫)', icon: BadgeDollarSign },
];
const STATUS_OPTS = [
  { value: 'ACTIVE',   label: 'Đang chạy',  cls: 'bg-emerald-50 border-emerald-250 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-900/30' },
  { value: 'DISABLED', label: 'Tạm dừng',   cls: 'bg-slate-50 border-slate-200 dark:bg-slate-800 text-slate-500' },
  { value: 'EXPIRED',  label: 'Hết hạn',    cls: 'bg-red-50 border-red-200 dark:bg-red-950/20 text-red-500' },
];

const emptyForm = () => ({
  code: '', description: '', discount_type: 'PERCENT', discount_value: '',
  min_order_value: '', max_uses: '', status: 'ACTIVE',
  start_date: '', end_date: '', max_discount: ''
});

// ── Helpers ──────────────────────────────────────────────────────
const fmtPrice = (v) => Number(v || 0).toLocaleString('vi-VN') + '₫';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const highlightText = (text, searchWord) => {
  if (!searchWord || !text) return text;
  const parts = String(text).split(new RegExp(`(${searchWord})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === searchWord.toLowerCase() ? (
          <mark key={i} className="bg-yellow-100 dark:bg-yellow-950/70 text-yellow-800 dark:text-yellow-250 px-0.5 rounded font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default function SellerVouchers() {
  const { user } = useAuthStore();

  // Data states
  const [vouchers, setVouchers] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Filter & Search states
  const [search,            setSearch]            = useState('');
  const [sortBy,            setSortBy]            = useState('newest');
  const [statusFilter,      setStatusFilter]      = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DISABLED' | 'EXPIRED'
  const [discountTypeFilter,setDiscountTypeFilter] = useState('ALL'); // 'ALL' | 'PERCENT' | 'FIXED'
  const [minOrderFilter,    setMinOrderFilter]    = useState('');
  const [startDate,         setStartDate]         = useState('');
  const [endDate,           setEndDate]           = useState('');
  const [showFilters,       setShowFilters]       = useState(false);

  // Pagination states
  const [currentPage,       setCurrentPage]       = useState(1);
  const itemsPerPage = 6;

  // Modal / UI states
  const [viewMode,      setViewMode]      = useState('grid'); // 'grid' | 'list'
  const [showModal,     setShowModal]     = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [form,          setForm]          = useState(emptyForm());
  const [formErrors,    setFormErrors]    = useState({});
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copiedId,      setCopiedId]      = useState(null);

  // Fetch Vouchers
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vouchers');
      const all = res?.data ?? res ?? [];
      // Filter vouchers for this store
      const mine = Array.isArray(all) ? all.filter(v => v.store_id === user?.store_id) : [];
      setVouchers(mine);
    } catch (_) {}
    finally { setLoading(false); }
  }, [user?.store_id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, statusFilter, discountTypeFilter, minOrderFilter, startDate, endDate]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isExpired = (voucher) => {
    if (!voucher.end_date) return false;
    return new Date(voucher.end_date) < new Date();
  };

  // Filtered & Sorted list
  const filtered = vouchers
    .filter(v => {
      // Search code & description
      const q = search.toLowerCase();
      if (q && !v.code?.toLowerCase().includes(q) && !v.description?.toLowerCase().includes(q)) return false;

      // Status filter
      if (statusFilter === 'ACTIVE') {
        if (v.status !== 'ACTIVE' || isExpired(v)) return false;
      }
      if (statusFilter === 'DISABLED') {
        if (v.status !== 'DISABLED') return false;
      }
      if (statusFilter === 'EXPIRED') {
        if (!isExpired(v)) return false;
      }

      // Discount type filter
      if (discountTypeFilter !== 'ALL' && v.discount_type !== discountTypeFilter) return false;

      // Min order value filter
      if (minOrderFilter && (v.min_order_value ?? 0) < Number(minOrderFilter)) return false;

      // Start date / End date filter
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (new Date(v.start_date || v.created_at) < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        if (new Date(v.end_date || v.created_at) > end) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      if (sortBy === 'value_desc') return b.discount_value - a.discount_value;
      if (sortBy === 'value_asc') return a.discount_value - b.discount_value;
      if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      return 0;
    });

  // Paginated list
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedVouchers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setDiscountTypeFilter('ALL');
    setMinOrderFilter('');
    setStartDate('');
    setEndDate('');
    showToast('Đã xóa bộ lọc!');
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    showToast('Đã sao chép mã voucher!');
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Open create modal
  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm());
    setFormErrors({});
    setShowModal(true);
  };

  // Open edit modal
  const openEdit = (v) => {
    setEditItem(v);
    setFormErrors({});
    setForm({
      code:            v.code || '',
      description:     v.description || '',
      discount_type:   v.discount_type || 'PERCENT',
      discount_value:  v.discount_value || '',
      min_order_value: v.min_order_value || '',
      max_uses:        v.max_uses || '',
      status:          v.status || 'ACTIVE',
      start_date:      v.start_date ? v.start_date.slice(0, 10) : '',
      end_date:        v.end_date   ? v.end_date.slice(0, 10)   : '',
      max_discount:    v.max_discount || ''
    });
    setShowModal(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.code.trim()) {
      errs.code = 'Vui lòng điền mã voucher';
    } else if (/\W/.test(form.code.trim())) {
      errs.code = 'Mã chỉ gồm chữ cái và số (A-Z, 0-9), không khoảng trắng';
    }

    if (!form.discount_value) {
      errs.discount_value = 'Vui lòng nhập giá trị giảm';
    } else {
      const val = Number(form.discount_value);
      if (val <= 0) {
        errs.discount_value = 'Giá trị giảm phải lớn hơn 0';
      } else if (form.discount_type === 'PERCENT' && val > 100) {
        errs.discount_value = 'Phần trăm giảm không được vượt quá 100%';
      }
    }

    if (form.min_order_value && Number(form.min_order_value) < 0) {
      errs.min_order_value = 'Đơn tối thiểu không được âm';
    }

    if (form.max_discount && Number(form.max_discount) < 0) {
      errs.max_discount = 'Giảm tối đa không được âm';
    }

    if (form.start_date && form.end_date) {
      if (new Date(form.start_date) > new Date(form.end_date)) {
        errs.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Toggle status quick action
  const handleToggleStatus = async (voucher) => {
    const newStatus = voucher.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      // Optimistic update
      setVouchers(prev => prev.map(v => v.id === voucher.id ? { ...v, status: newStatus } : v));
      
      const payload = {
        code:            voucher.code,
        description:     voucher.description,
        discount_type:   voucher.discount_type,
        discount_value:  Number(voucher.discount_value),
        min_order_value: Number(voucher.min_order_value),
        max_discount:    voucher.max_discount ? Number(voucher.max_discount) : null,
        start_date:      voucher.start_date,
        end_date:        voucher.end_date,
        status:          newStatus,
        store_id:        voucher.store_id
      };

      await api.put(`/vouchers/${voucher.id}`, payload);
      showToast(`Đã ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'tạm dừng'} voucher!`);
      fetchAll();
    } catch (e) {
      // Revert if failed
      setVouchers(prev => prev.map(v => v.id === voucher.id ? { ...v, status: voucher.status } : v));
      showToast(e.message || 'Có lỗi xảy ra', 'error');
    }
  };

  // Save
  const handleSave = async () => {
    if (!validateForm()) {
      showToast('Vui lòng kiểm tra dữ liệu đầu vào!', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        code:            form.code.toUpperCase().trim(),
        description:     form.description,
        discount_type:   form.discount_type,
        discount_value:  Number(form.discount_value),
        min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
        max_discount:    form.max_discount ? Number(form.max_discount) : null,
        store_id:        user?.store_id || undefined,
        start_date:      form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date:        form.end_date ? new Date(form.end_date).toISOString() : null,
        status:          form.status,
      };

      if (editItem) {
        await api.put(`/vouchers/${editItem.id}`, payload);
        showToast('Cập nhật voucher thành công!');
      } else {
        await api.post('/vouchers', payload);
        showToast('Tạo voucher mới thành công!');
      }
      setShowModal(false);
      fetchAll();
    } catch (e) {
      showToast(e.message || 'Có lỗi xảy ra', 'error');
    } finally { setSaving(false); }
  };

  // Delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/vouchers/${id}`);
      setDeleteConfirm(null);
      showToast('Đã xóa voucher!');
      fetchAll();
    } catch (e) {
      showToast('Không thể xóa', 'error');
    }
  };

  // Get ticket badge status
  const getTicketStatus = (voucher) => {
    if (voucher.status === 'DISABLED') {
      return {
        label: 'Tạm tắt',
        color: 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700',
        icon: Ban,
      };
    }
    if (isExpired(voucher)) {
      return {
        label: 'Hết hạn',
        color: 'text-red-650 bg-red-50 border-red-150 dark:bg-red-955/10 dark:border-red-900/30',
        icon: Clock,
      };
    }
    return {
      label: 'Đang chạy',
      color: 'text-emerald-650 bg-emerald-50 border-emerald-150 dark:bg-emerald-955/10 dark:border-emerald-900/30',
      icon: CheckCircle2,
    };
  };

  return (
    <div className="space-y-5">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold animate-in slide-in-from-top-3 duration-200 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Voucher của Shop</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {vouchers.length} mã giảm giá đang quản lý
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-sm whitespace-nowrap"
        >
          <Plus size={18} strokeWidth={2.5} /> Tạo voucher
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Tổng số Voucher', value: vouchers.length, desc: 'Do shop phát hành', color: 'slate', icon: Ticket },
          { label: 'Mã đang hoạt động', value: vouchers.filter(v => v.status === 'ACTIVE' && !isExpired(v)).length, desc: 'Khách hàng có thể dùng', color: 'emerald', icon: CheckCircle2 },
          { label: 'Hết hạn hoặc Tạm tắt', value: vouchers.filter(v => v.status === 'DISABLED' || isExpired(v)).length, desc: 'Đã dừng lưu hành', color: 'red', icon: Clock },
        ].map(s => {
          const Icon = s.icon;
          const style = {
            emerald: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-450',
            red: 'bg-red-50/40 dark:bg-red-950/15 border-red-100 dark:border-red-900/40 text-red-500',
            slate: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300'
          }[s.color];
          return (
            <div key={s.label} className={`rounded-2xl border p-4 flex items-center justify-between transition-all hover:shadow-md ${style}`}>
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 shadow-sm shrink-0">
                <Icon size={20} className={s.color === 'emerald' ? 'text-emerald-600' : s.color === 'red' ? 'text-red-500' : 'text-slate-400'} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          
          {/* Quick status tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 overflow-x-auto w-full lg:w-auto">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'ACTIVE', label: 'Đang chạy' },
              { key: 'DISABLED', label: 'Tạm dừng' },
              { key: 'EXPIRED', label: 'Hết hạn' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === t.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full lg:w-auto justify-end">
            {/* Search */}
            <div className="relative flex-1 lg:w-60 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm mã, mô tả..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 transition-all"
              />
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                showFilters 
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-655 dark:text-slate-350 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal size={13} /> Lọc nâng cao { (discountTypeFilter !== 'ALL' || minOrderFilter || startDate || endDate) && '•' }
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-750 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="newest">Mới nhất (Ngày)</option>
                <option value="oldest">Cũ nhất (Ngày)</option>
                <option value="code">Mã A-Z</option>
                <option value="value_desc">Giảm nhiều nhất</option>
                <option value="value_asc">Giảm ít nhất</option>
              </select>
              <ArrowUpDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Grid/List View switch */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              ><LayoutGrid size={14} /></button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              ><List size={14} /></button>
            </div>

            <button onClick={fetchAll} className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-emerald-650 transition-colors">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* ── Advanced Filters Panel ── */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Discount Type */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Loại giảm giá</label>
              <select
                value={discountTypeFilter}
                onChange={e => setDiscountTypeFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Tất cả loại</option>
                <option value="PERCENT">Giảm phần trăm (%)</option>
                <option value="FIXED">Giảm tiền mặt (₫)</option>
              </select>
            </div>

            {/* Min order filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Đơn tối thiểu từ (₫)</label>
              <input
                type="number"
                value={minOrderFilter}
                onChange={e => setMinOrderFilter(e.target.value)}
                placeholder="VD: 50,000"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Date range inputs */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Từ ngày tạo</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Đến ngày tạo</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>
        )}

        {/* ── Active Filter Tags ── */}
        {(discountTypeFilter !== 'ALL' || minOrderFilter || startDate || endDate || search || statusFilter !== 'ALL') && (
          <div className="flex flex-wrap gap-1.5 pt-2 items-center">
            <span className="text-[10px] text-slate-400 font-semibold mr-1">Đang lọc:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-350">
                Tìm kiếm: {search}
                <button onClick={() => setSearch('')} className="hover:text-red-500"><X size={10} /></button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-300">
                Trạng thái: {statusFilter === 'ACTIVE' ? 'Đang chạy' : statusFilter === 'DISABLED' ? 'Tạm dừng' : 'Hết hạn'}
                <button onClick={() => setStatusFilter('ALL')} className="hover:text-red-500"><X size={10} /></button>
              </span>
            )}
            {discountTypeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-300">
                Loại: {discountTypeFilter === 'PERCENT' ? 'Giảm %' : 'Giảm tiền mặt'}
                <button onClick={() => setDiscountTypeFilter('ALL')} className="hover:text-red-500"><X size={10} /></button>
              </span>
            )}
            {minOrderFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-300">
                Đơn tối thiểu ≥ {fmtPrice(minOrderFilter)}
                <button onClick={() => setMinOrderFilter('')} className="hover:text-red-500"><X size={10} /></button>
              </span>
            )}
            {startDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-300">
                Từ ngày: {startDate}
                <button onClick={() => setStartDate('')} className="hover:text-red-500"><X size={10} /></button>
              </span>
            )}
            {endDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-300">
                Đến ngày: {endDate}
                <button onClick={() => setEndDate('')} className="hover:text-red-500"><X size={10} /></button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-[10px] text-red-500 font-bold hover:underline ml-2"
            >
              Xóa hết lọc
            </button>
          </div>
        )}
      </div>

      {/* ── Results Container ── */}
      {loading ? (
        <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
          <span className="text-sm font-medium">Đang tải danh sách voucher...</span>
        </div>
      ) : paginatedVouchers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Ticket size={28} className="text-slate-350 dark:text-slate-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy voucher</p>
            <p className="text-xs text-slate-450 dark:text-slate-550 mt-1">Hãy điều chỉnh bộ lọc hoặc thêm mới.</p>
          </div>
          <button onClick={resetFilters} className="text-xs font-bold text-emerald-600 hover:underline">Xóa bộ lọc</button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID TICKET VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedVouchers.map(v => {
            const status = getTicketStatus(v);
            const StatusIcon = status.icon;
            const isPct = v.discount_type === 'PERCENT';

            return (
              <div 
                key={v.id} 
                className="group relative flex bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 min-h-[140px]"
              >
                {/* Left side: Accent value card with dashed divider */}
                <div className={`w-28 text-white flex flex-col justify-center items-center text-center p-3 shrink-0 relative select-none ${
                  isPct 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-650' 
                    : 'bg-gradient-to-br from-violet-500 to-indigo-650'
                }`}>
                  {isPct ? (
                    <Percent size={20} className="text-emerald-100 mb-1" />
                  ) : (
                    <BadgeDollarSign size={20} className="text-violet-100 mb-1" />
                  )}
                  <p className="text-lg font-black tracking-tight leading-none">
                    {isPct ? `${v.discount_value}%` : `${Math.round(v.discount_value / 1000)}k`}
                  </p>
                  <p className="text-[10px] text-white/90 font-bold mt-1 uppercase tracking-wider">Giảm giá</p>

                  {/* Left & Right cutouts for ticket look */}
                  <div className="absolute -right-1.5 -top-1.5 w-3.5 h-3.5 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800" />
                  <div className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800" />
                </div>

                {/* Ticket center dashed separator line */}
                <div className="w-0 border-r border-dashed border-slate-200 dark:border-slate-700/80 my-2.5 z-10 shrink-0" />

                {/* Right side: details and actions */}
                <div className="flex-1 p-4 flex flex-col justify-between relative min-w-0">
                  
                  {/* Row 1: Code and Status Toggle */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-extrabold text-sm text-slate-855 dark:text-white tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg select-all border dark:border-slate-750">
                        {highlightText(v.code, search)}
                      </span>
                      <button
                        onClick={() => handleCopyCode(v.code, v.id)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                        title="Copy mã"
                      >
                        {copiedId === v.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      </button>
                    </div>

                    {isExpired(v) ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold border shrink-0 ${status.color}`}>
                        <StatusIcon size={9} />
                        {status.label}
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(v);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold border shrink-0 transition-all hover:scale-105 active:scale-95 ${status.color}`}
                        title="Click để bật/tắt nhanh trạng thái"
                      >
                        {v.status === 'ACTIVE' ? (
                          <ToggleRight size={13} className="text-emerald-600 dark:text-emerald-450" />
                        ) : (
                          <ToggleLeft size={13} className="text-slate-400" />
                        )}
                        {status.label}
                      </button>
                    )}
                  </div>

                  {/* Row 2: Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-405 leading-relaxed font-medium mt-1.5 line-clamp-2">
                    {v.description ? highlightText(v.description, search) : 'Không có mô tả cho voucher này.'}
                  </p>

                  {/* Row 3: Constraints & Expiry date & Usage */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-y-1.5 text-[10px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <div>
                        Đơn tối thiểu: <span className="font-bold text-slate-700 dark:text-slate-300">{fmtPrice(v.min_order_value)}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
                        Đã dùng: <span className="font-extrabold">{v._count?.orders ?? 0}</span>
                      </div>
                    </div>
                    {v.end_date && (
                      <div className="flex items-center gap-1 justify-between">
                        <div className="flex items-center gap-0.5">
                          <CalendarDays size={10} />
                          <span>Hạn dùng: <span className="font-bold text-slate-700 dark:text-slate-350">{fmtDate(v.end_date)}</span></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions buttons overlay */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(v)}
                      className="p-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 shadow-sm border border-slate-200 dark:border-slate-750 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(v)}
                      className="p-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-855 dark:hover:bg-slate-800 text-slate-500 hover:text-red-500 shadow-sm border border-slate-200 dark:border-slate-750 transition-colors"
                      title="Xóa voucher"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  {['Mã voucher', 'Mô tả', 'Giảm giá', 'Đơn tối thiểu', 'Đã dùng', 'Thời hạn', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedVouchers.map(v => {
                  const status = getTicketStatus(v);
                  const isPct = v.discount_type === 'PERCENT';
                  const StatusIcon = status.icon;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 tracking-wider text-xs bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 select-all">
                          {highlightText(v.code, search)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-[160px] truncate" title={v.description}>
                        {v.description ? highlightText(v.description, search) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-855 dark:text-white text-xs">
                          {isPct ? `${v.discount_value}%` : fmtPrice(v.discount_value)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-655 dark:text-slate-400 font-bold">{fmtPrice(v.min_order_value)}</td>
                      <td className="px-5 py-4 text-xs text-emerald-600 dark:text-emerald-450 font-bold">
                        {v._count?.orders ?? 0} lượt
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {v.start_date ? `${fmtDate(v.start_date)} - ` : ''}{v.end_date ? fmtDate(v.end_date) : 'Không giới hạn'}
                      </td>
                      <td className="px-5 py-4">
                        {isExpired(v) ? (
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${status.color}`}>
                            <StatusIcon size={9} />
                            {status.label}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(v)}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 ${status.color}`}
                            title="Click để bật/tắt nhanh"
                          >
                            {v.status === 'ACTIVE' ? (
                              <ToggleRight size={14} className="text-emerald-600" />
                            ) : (
                              <ToggleLeft size={14} className="text-slate-400" />
                            )}
                            {status.label}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(v)} className="p-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-500 transition-colors" title="Sửa">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setDeleteConfirm(v)} className="p-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors" title="Xóa">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
          <p className="text-xs text-slate-500">
            Hiển thị <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)}</span> trong số <span className="font-semibold text-slate-800 dark:text-slate-200">{filtered.length}</span> voucher
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-slate-655"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7.5 h-7.5 rounded-lg text-xs font-bold transition-all ${
                  currentPage === i + 1
                    ? 'bg-emerald-600 text-white shadow'
                    : 'border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-slate-655"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-955/20 flex items-center justify-center mx-auto mb-4 text-red-500 shadow-sm animate-pulse">
              <Trash2 size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Xóa voucher này?</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Bạn có chắc muốn xóa mã <strong className="text-slate-800 dark:text-slate-200">"{deleteConfirm.code}"</strong>?<br/>Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-750 font-semibold text-xs hover:bg-slate-50 transition-colors">Hủy bỏ</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-750 text-white font-semibold text-xs transition-colors">Đồng ý</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL WITH LIVE PREVIEW ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl shadow-2xl my-6 animate-in zoom-in-98 duration-150 text-slate-900 dark:text-white">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 rounded-t-2xl z-10">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {editItem ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}
                </h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Voucher do shop tự phát hành, áp dụng cho sản phẩm của shop</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body with 2 columns: Input and Live Preview */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[70vh] overflow-y-auto">
              
              {/* Form Input fields */}
              <div className="md:col-span-7 space-y-4">
                
                {/* Code */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mã Voucher <span className="text-red-400">*</span></label>
                  <input
                    value={form.code}
                    onChange={e => {
                      const val = e.target.value.toUpperCase().replace(/\s/g, '');
                      setForm(f => ({ ...f, code: val }));
                      if (formErrors.code) {
                        setFormErrors(prev => ({ ...prev, code: /\W/.test(val) ? 'Mã chỉ gồm chữ cái và số (A-Z, 0-9), không khoảng trắng' : undefined }));
                      }
                    }}
                    placeholder="VD: GIAM20K, MUAHE"
                    className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 font-mono tracking-widest font-bold ${
                      formErrors.code ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {formErrors.code ? (
                    <p className="text-[10px] text-red-500 mt-1 font-medium">{formErrors.code}</p>
                  ) : (
                    <p className="text-[9px] text-slate-400 mt-1">Viết liền không dấu, tự động viết hoa</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mô tả hiển thị</label>
                  <input
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="VD: Giảm 20k cho đơn từ 250k"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Discount type & value */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Loại giảm giá</label>
                    <select
                      value={form.discount_type}
                      onChange={e => {
                        setForm(f => ({ ...f, discount_type: e.target.value, discount_value: '' }));
                        setFormErrors(prev => ({ ...prev, discount_value: undefined }));
                      }}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                    >
                      {DISCOUNT_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Giá trị giảm {form.discount_type === 'PERCENT' ? '(%)' : '(₫)'} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={form.discount_type === 'PERCENT' ? 100 : undefined}
                      value={form.discount_value}
                      onChange={e => {
                        setForm(f => ({ ...f, discount_value: e.target.value }));
                        if (formErrors.discount_value) {
                          setFormErrors(prev => ({ ...prev, discount_value: undefined }));
                        }
                      }}
                      placeholder={form.discount_type === 'PERCENT' ? '15' : '30000'}
                      className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-855 dark:text-slate-200 ${
                        formErrors.discount_value ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {formErrors.discount_value && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">{formErrors.discount_value}</p>
                    )}
                  </div>
                </div>

                {/* Maximum Discount Value (For Percent types) */}
                {form.discount_type === 'PERCENT' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mức giảm tối đa (₫)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.max_discount}
                      onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))}
                      placeholder="VD: 50,000 (Để trống = Không giới hạn)"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-855 dark:text-slate-200"
                    />
                  </div>
                )}

                {/* Min Order & Max Uses */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Đơn tối thiểu (₫)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.min_order_value}
                      onChange={e => setForm(f => ({ ...f, min_order_value: e.target.value }))}
                      placeholder="0 (Không giới hạn)"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-855 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Số lần sử dụng tối đa</label>
                    <input
                      type="number"
                      min={0}
                      disabled
                      placeholder="Không giới hạn"
                      value=""
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 cursor-not-allowed"
                      title="Số lượt sử dụng được tự động đếm qua lượng đơn hàng hoàn thành áp dụng mã"
                    />
                  </div>
                </div>

                {/* Date range validity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block flex items-center gap-1">
                      <Calendar size={11} /> Bắt đầu
                    </label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block flex items-center gap-1">
                      <Calendar size={11} /> Kết thúc
                    </label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={e => {
                        setForm(f => ({ ...f, end_date: e.target.value }));
                        if (formErrors.end_date) {
                          setFormErrors(prev => ({ ...prev, end_date: undefined }));
                        }
                      }}
                      className={`w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 ${
                        formErrors.end_date ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {formErrors.end_date && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">{formErrors.end_date}</p>
                    )}
                  </div>
                </div>

                {/* Status Toggle option */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Trạng thái phát hành</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="ACTIVE">Đang kích hoạt (ACTIVE)</option>
                    <option value="DISABLED">Tạm tắt (DISABLED)</option>
                  </select>
                </div>

              </div>

              {/* LIVE PREVIEW TICKET CARD */}
              <div className="md:col-span-5 flex flex-col justify-start items-center space-y-4">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider self-start">XEM TRƯỚC VÉ GIẢM GIÁ (LIVE PREVIEW)</p>
                
                {/* Physical Ticket Simulation Card */}
                <div className="w-full bg-slate-50 dark:bg-slate-855/65 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                  
                  {/* Outer ticket block */}
                  <div className={`w-full max-w-[260px] h-[120px] text-white rounded-2xl flex shadow-xl overflow-hidden relative border ${
                    form.discount_type === 'PERCENT'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-650 border-emerald-500/20'
                      : 'bg-gradient-to-br from-violet-500 to-indigo-650 border-violet-500/20'
                  }`}>
                    
                    {/* Left portion */}
                    <div className={`w-20 flex flex-col items-center justify-center text-center p-2 shrink-0 ${
                      form.discount_type === 'PERCENT' ? 'bg-teal-700/40' : 'bg-indigo-700/40'
                    }`}>
                      {form.discount_type === 'PERCENT' ? (
                        <Percent size={18} className="text-emerald-100 mb-0.5" />
                      ) : (
                        <BadgeDollarSign size={18} className="text-violet-100 mb-0.5" />
                      )}
                      <p className="text-base font-black tracking-tight leading-none">
                        {form.discount_value 
                          ? form.discount_type === 'PERCENT'
                            ? `${form.discount_value}%`
                            : `${form.discount_value >= 1000 ? Math.round(form.discount_value / 1000) + 'k' : form.discount_value + 'đ'}`
                          : 'Giảm'
                        }
                      </p>
                      <p className="text-[9px] text-white/80 font-bold uppercase mt-1 tracking-wider">OFF</p>

                      {/* Top & Bottom ticket cutouts */}
                      <div className="absolute top-[-7px] left-[73px] w-3.5 h-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full" />
                      <div className="absolute bottom-[-7px] left-[73px] w-3.5 h-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full" />
                    </div>

                    {/* Separator line */}
                    <div className="w-0 border-r border-dashed border-white/20 my-2 shrink-0 z-10" />

                    {/* Right portion */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        <span className={`font-extrabold text-[10px] tracking-wider px-1.5 py-0.5 rounded select-none ${
                          form.discount_type === 'PERCENT' ? 'bg-teal-700/50' : 'bg-indigo-700/50'
                        }`}>
                          {form.code.toUpperCase().trim() || 'MAVOUCHER'}
                        </span>
                        <p className="text-[10px] text-white/90 leading-snug line-clamp-2 mt-1.5 font-medium">
                          {form.description || 'VD: Chiết khấu đơn mua sắm của bạn.'}
                        </p>
                      </div>
                      
                      <p className="text-[9px] text-white/80 mt-1 truncate font-semibold">
                        Đơn tối thiểu: {form.min_order_value ? fmtPrice(form.min_order_value) : '0₫'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-[10px] rounded-xl text-emerald-700 dark:text-emerald-350 leading-relaxed text-left w-full">
                    💡 <strong>Mô phỏng hiển thị:</strong> Đây là cách vé giảm giá của bạn hiển thị trên màn hình người dùng tại giỏ hàng và danh sách voucher của cửa hàng.
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 rounded-b-2xl">
              <p className="text-[10px] text-slate-400">* Bắt buộc</p>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-355 font-semibold text-xs hover:bg-slate-50 transition-colors">
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-60 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {editItem ? 'Lưu thay đổi' : 'Tạo voucher'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
