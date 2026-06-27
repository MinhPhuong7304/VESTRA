import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import {
  Plus, Search, Edit2, Trash2, X, Shirt,
  CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Layers, Sparkles, ImagePlus, LayoutGrid, List,
  Package, TrendingUp, AlertTriangle, Eye, EyeOff,
  Tag, ChevronDown, MoreVertical, ShoppingBag,
  Filter, SlidersHorizontal, ArrowUpDown, UploadCloud,
  Check, Smartphone, Monitor, ChevronLeft, ChevronRight,
  Sparkle, XCircle, Grid, Play
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────
const COLORS = ['Trắng','Đen','Hồng','Đỏ','Xanh dương','Xanh lá','Vàng','Cam','Tím','Xám','Be','Nâu'];
const SIZES  = ['XS','S','M','L','XL','XXL','XXXL','Freesize'];
const STATUS_OPTS = [
  { value: 'active',   label: 'Đang bán',  cls: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40' },
  { value: 'inactive', label: 'Tạm ẩn',    cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700' },
  { value: 'draft',    label: 'Bản nháp',  cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40' },
];
const TABS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'active',   label: 'Đang bán' },
  { key: 'inactive', label: 'Tạm ẩn' },
  { key: 'draft',    label: 'Bản nháp' },
  { key: 'low',      label: '⚠ Sắp hết' },
];

const emptyVariant = () => ({ color: '', size: '', quantity: 1, price_sale: '' });
const emptyForm = () => ({
  name: '', description: '', price_sale: '', price_cost: '',
  stock: '', status: 'active', category_id: '', condition: '',
  is_pass_item: false, is_vto_enabled: false, garment_3d_url: '',
  images: [], variants: [emptyVariant()],
});

// ── Helpers ──────────────────────────────────────────────────────
const statusInfo = (s) => STATUS_OPTS.find(o => o.value === s) || STATUS_OPTS[1];
const fmtPrice = (v) => Number(v || 0).toLocaleString('vi-VN') + '₫';

// ── Main Component ────────────────────────────────────────────────
export default function SellerProducts() {
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);

  // Data states
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  // UI core states
  const [viewMode,     setViewMode]     = useState('grid'); // 'grid' | 'list'
  const [activeTab,    setActiveTab]    = useState('all');
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState('newest');
  
  // Advanced Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockStatus,      setStockStatus]      = useState('all'); // 'all' | 'instock' | 'low' | 'out'
  const [minPrice,         setMinPrice]         = useState('');
  const [maxPrice,         setMaxPrice]         = useState('');
  const [startDate,        setStartDate]        = useState('');
  const [endDate,          setEndDate]          = useState('');
  const [showFilters,      setShowFilters]      = useState(false);

  // Pagination states
  const [currentPage,      setCurrentPage]      = useState(1);
  const itemsPerPage = 8;

  // Selection states (for Bulk Actions)
  const [selectedIds,      setSelectedIds]      = useState([]);

  // Modal / Interaction states
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [form,         setForm]         = useState(emptyForm());
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [deleteConfirm,setDeleteConfirm]= useState(null);
  const [imgInput,     setImgInput]     = useState('');
  const [actionMenu,   setActionMenu]   = useState(null); // product id
  const [dragActive,   setDragActive]   = useState(false);

  // Bulk variant inputs
  const [bulkVarPrice, setBulkVarPrice] = useState('');
  const [bulkVarQty,   setBulkVarQty]   = useState('');

  // Live Preview states
  const [previewProduct,   setPreviewProduct]   = useState(null);
  const [previewDevice,    setPreviewDevice]    = useState('mobile'); // 'mobile' | 'desktop'
  const [previewActiveImg, setPreviewActiveImg] = useState(0);
  const [previewSelColor,  setPreviewSelColor]  = useState('');
  const [previewSelSize,   setPreviewSelSize]   = useState('');
  const [vtoSimulated,     setVtoSimulated]     = useState(false);

  // Fetch data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        api.get('/products'),
        api.get('/categories'),
      ]);
      const fetchedProducts = prodRes.status === 'fulfilled' ? (prodRes.value?.data ?? prodRes.value ?? []) : [];
      // Filter shop products (only products belonging to this seller's store if store_id matches)
      const shopProducts = fetchedProducts.filter(p => p.store_id === user?.store_id || !p.store_id);
      setProducts(shopProducts);
      setCategories(catRes.status === 'fulfilled' ? (catRes.value?.data ?? catRes.value ?? []) : []);
    } catch (_) {}
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, selectedCategory, stockStatus, minPrice, maxPrice, sortBy, startDate, endDate]);

  // Toast helper
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Computed stats
  const total     = products.length;
  const active    = products.filter(p => p.status === 'active').length;
  const lowStock  = products.filter(p => (p.stock ?? 0) <= 5).length;
  const vtoCount  = products.filter(p => p.is_vto_enabled).length;

  // Filtered & sorted list
  const filtered = products
    .filter(p => {
      // Search by name
      const q = search.toLowerCase();
      if (q && !p.name?.toLowerCase().includes(q)) return false;

      // Status Tab filter
      if (activeTab === 'active')   return p.status === 'active';
      if (activeTab === 'inactive') return p.status === 'inactive';
      if (activeTab === 'draft')    return p.status === 'draft';
      if (activeTab === 'low')      return (p.stock ?? 0) <= 5;

      // Category filter
      if (selectedCategory && p.category_id !== selectedCategory) return false;

      // Stock Status filter
      if (stockStatus === 'instock') return (p.stock ?? 0) > 5;
      if (stockStatus === 'low')     return (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5;
      if (stockStatus === 'out')     return (p.stock ?? 0) === 0;

      // Price filter
      if (minPrice && p.price_sale < Number(minPrice)) return false;
      if (maxPrice && p.price_sale > Number(maxPrice)) return false;

      // Date filter
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(p.created_at) < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(p.created_at) > end) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name')       return a.name.localeCompare(b.name);
      if (sortBy === 'price_asc')  return a.price_sale - b.price_sale;
      if (sortBy === 'price_desc') return b.price_sale - a.price_sale;
      if (sortBy === 'stock')      return (a.stock ?? 0) - (b.stock ?? 0);
      if (sortBy === 'newest')     return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest')     return new Date(a.created_at) - new Date(b.created_at);
      return 0;
    });

  // Paginated list
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Clear filters
  const resetFilters = () => {
    setSelectedCategory('');
    setStockStatus('all');
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setActiveTab('all');
    showToast('Đã xóa tất cả bộ lọc!');
  };

  // Open modal
  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm());
    setImgInput('');
    setBulkVarPrice('');
    setBulkVarQty('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditItem(p);
    setForm({
      name:           p.name || '',
      description:    p.description || '',
      price_sale:     p.price_sale || '',
      price_cost:     p.price_cost || '',
      stock:          p.stock || '',
      status:         p.status || 'active',
      category_id:    p.category_id || '',
      condition:      p.condition || '',
      is_pass_item:   false, // Seller products are always B2C (new)
      is_vto_enabled: !!p.is_vto_enabled,
      garment_3d_url: p.garment_3d_url || '',
      images:         p.images?.map(i => ({ image_url: typeof i === 'string' ? i : i.image_url })) || [],
      variants:       p.variants?.length > 0
        ? p.variants.map(v => ({ color: v.color, size: v.size, quantity: v.quantity, price_sale: v.price_sale }))
        : [emptyVariant()],
    });
    setImgInput('');
    setBulkVarPrice('');
    setBulkVarQty('');
    setShowModal(true);
    setActionMenu(null);
  };

  // Save product
  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Vui lòng nhập tên sản phẩm', 'error'); return; }
    if (!form.price_sale)  { showToast('Vui lòng nhập giá bán', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price_sale:  Number(form.price_sale),
        price_cost:  Number(form.price_cost) || 0,
        stock:       Number(form.stock) || 0,
        is_pass_item: false,
        store_id:    user?.store_id || undefined,
        images:      form.images.map(img => typeof img === 'string' ? img : img.image_url).filter(Boolean),
        variants: form.variants
          .filter(v => v.color || v.size)
          .map(v => ({ ...v, quantity: Number(v.quantity) || 0, price_sale: Number(v.price_sale) || Number(form.price_sale) })),
      };
      if (editItem) {
        await api.put(`/products/${editItem.id}`, payload);
        showToast('Đã cập nhật sản phẩm!');
      } else {
        await api.post('/products', payload);
        showToast('Đã thêm sản phẩm mới!');
      }
      setShowModal(false);
      fetchAll();
    } catch (e) { showToast(e.message || 'Có lỗi xảy ra', 'error'); }
    finally { setSaving(false); }
  };

  // Delete product
  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setDeleteConfirm(null);
      showToast('Đã xóa sản phẩm!');
      fetchAll();
    } catch (e) { showToast(e.message || 'Không thể xóa', 'error'); }
  };

  // Quick toggle status
  const toggleStatus = async (p) => {
    const next = p.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/products/${p.id}`, { status: next });
      setProducts(ps => ps.map(x => x.id === p.id ? { ...x, status: next } : x));
      showToast(`${next === 'active' ? 'Đã hiện' : 'Đã ẩn'} sản phẩm`);
    } catch (e) { showToast('Không thể cập nhật trạng thái', 'error'); }
    setActionMenu(null);
  };

  // Bulk Actions
  const handleBulkToggleStatus = async (status) => {
    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.put(`/products/${id}`, { status })));
      showToast(`Đã ${status === 'active' ? 'bán' : 'ẩn'} hàng loạt ${selectedIds.length} sản phẩm!`);
      setSelectedIds([]);
      fetchAll();
    } catch (e) {
      showToast('Có lỗi xảy ra khi cập nhật hàng loạt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn?`)) return;
    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/products/${id}`)));
      showToast(`Đã xóa hàng loạt ${selectedIds.length} sản phẩm thành công!`);
      setSelectedIds([]);
      fetchAll();
    } catch (e) {
      showToast('Có lỗi xảy ra khi xóa hàng loạt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Drag and Drop Images Handlers
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
    showToast(`Đã tải lên ${files.length} hình ảnh!`);
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
    showToast('Đã thêm ảnh từ liên kết!');
  };

  // Variants handlers
  const updateVariant = (i, f, v) => setForm(fr => ({ ...fr, variants: fr.variants.map((x, j) => j === i ? { ...x, [f]: v } : x) }));
  const addVariant    = () => setForm(f => ({ ...f, variants: [...f.variants, emptyVariant()] }));
  const removeVariant = (i) => setForm(f => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }));

  // Apply price and stock to all variants in form
  const applyBulkToVariants = () => {
    if (!bulkVarPrice && !bulkVarQty) {
      showToast('Vui lòng nhập giá hoặc số lượng cần áp dụng!', 'error');
      return;
    }
    setForm(f => ({
      ...f,
      variants: f.variants.map(v => ({
        ...v,
        price_sale: bulkVarPrice ? Number(bulkVarPrice) : v.price_sale,
        quantity: bulkVarQty ? Number(bulkVarQty) : v.quantity
      }))
    }));
    showToast('Đã áp dụng thông số nhanh cho toàn bộ biến thể!');
    setBulkVarPrice('');
    setBulkVarQty('');
  };

  // Live Preview handlers
  const openPreview = (p) => {
    setPreviewProduct(p);
    setPreviewActiveImg(0);
    setPreviewSelColor(p.variants?.[0]?.color || '');
    setPreviewSelSize(p.variants?.[0]?.size || '');
    setVtoSimulated(false);
  };

  return (
    <div className="space-y-5 relative pb-20" onClick={() => actionMenu && setActionMenu(null)}>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold animate-in slide-in-from-top-3 duration-200 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Sản phẩm của tôi</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{total} sản phẩm · {active} đang bán</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-sm whitespace-nowrap"
        >
          <Plus size={18} strokeWidth={2.5} /> Thêm sản phẩm
        </button>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Package,       label: 'Tổng sản phẩm',   value: total,    color: 'slate',   tab: 'all' },
          { icon: ShoppingBag,   label: 'Đang bán',         value: active,   color: 'emerald', tab: 'active' },
          { icon: AlertTriangle, label: 'Sắp hết hàng',     value: lowStock, color: 'amber',   tab: 'low' },
          { icon: Sparkles,      label: 'Hỗ trợ VTO',       value: vtoCount, color: 'violet',  tab: null },
        ].map(s => {
          const Icon = s.icon;
          const colorCls = {
            slate:   'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500',
            emerald: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400',
            amber:   'bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-400',
            violet:  'bg-violet-50 dark:bg-violet-950/30 border-violet-200/60 dark:border-violet-800/40 text-violet-600 dark:text-violet-400',
          }[s.color];
          return (
            <button
              key={s.label}
              onClick={() => s.tab && setActiveTab(s.tab)}
              className={`rounded-2xl border p-4 text-left transition-all hover:shadow-md ${colorCls} ${s.tab ? 'cursor-pointer animate-none hover:scale-102' : 'cursor-default'}`}
            >
              <Icon size={18} className="mb-2" />
              <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 overflow-x-auto w-full lg:w-auto">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === t.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t.label}
                {t.key !== 'all' && (
                  <span className="ml-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                    {t.key === 'low' ? lowStock :
                     t.key === 'active' ? active :
                     products.filter(p => p.status === t.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full lg:w-auto justify-end">
            {/* Search */}
            <div className="relative flex-1 lg:w-64 max-w-xs">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm tên sản phẩm..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-200 transition-all"
              />
            </div>

            {/* Advanced Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                showFilters 
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal size={14} /> Bộ lọc { (selectedCategory || stockStatus !== 'all' || minPrice || maxPrice || startDate || endDate) && '•' }
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              >
                <option value="newest">Mới nhất (Ngày)</option>
                <option value="oldest">Cũ nhất (Ngày)</option>
                <option value="name">Tên A-Z</option>
                <option value="price_desc">Giá cao → thấp</option>
                <option value="price_asc">Giá thấp → cao</option>
                <option value="stock">Tồn kho ít nhất</option>
              </select>
              <ArrowUpDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-650'}`}
              ><LayoutGrid size={14} /></button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-650'}`}
              ><List size={14} /></button>
            </div>

            <button onClick={fetchAll} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-emerald-650 transition-colors" title="Làm mới">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* ── Advanced Filters Panel ── */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-6 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Category Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Danh mục</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 dark:text-slate-200"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Stock Status */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tình trạng kho</label>
              <select
                value={stockStatus}
                onChange={e => setStockStatus(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 dark:text-slate-200"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="instock">Còn hàng ({products.filter(p => (p.stock ?? 0) > 5).length})</option>
                <option value="low">Sắp hết hàng ({products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length})</option>
                <option value="out">Đã hết hàng ({products.filter(p => (p.stock ?? 0) === 0).length})</option>
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Giá từ (₫)</label>
              <input
                type="number"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Giá đến (₫)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="1,000,000"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Từ ngày tạo</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* End Date */}
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
        {(selectedCategory || stockStatus !== 'all' || minPrice || maxPrice || search || activeTab !== 'all' || startDate || endDate) && (
          <div className="flex flex-wrap gap-1.5 pt-2 items-center">
            <span className="text-[10px] text-slate-400 font-semibold mr-1">Đang lọc:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-300">
                Tìm kiếm: {search}
                <button onClick={() => setSearch('')} className="hover:text-red-500"><X size={10} /></button>
              </span>
            )}
            {activeTab !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-300">
                Trạng thái: {activeTab === 'active' ? 'Đang bán' : activeTab === 'inactive' ? 'Tạm ẩn' : activeTab === 'draft' ? 'Bản nháp' : 'Sắp hết'}
                <button onClick={() => setActiveTab('all')} className="hover:text-red-500"><X size={10} /></button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-300">
                Danh mục: {categories.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory('')} className="hover:text-red-500"><X size={10} /></button>
              </span>
            )}
            {stockStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-300">
                Kho: {stockStatus === 'instock' ? 'Còn hàng' : stockStatus === 'low' ? 'Sắp hết' : 'Hết hàng'}
                <button onClick={() => setStockStatus('all')} className="hover:text-red-500"><X size={10} /></button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-300">
                Giá: {minPrice ? fmtPrice(minPrice) : '0'} - {maxPrice ? fmtPrice(maxPrice) : 'Max'}
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="hover:text-red-500"><X size={10} /></button>
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
              className="text-[10px] text-red-500 font-bold hover:underline ml-2 flex items-center gap-0.5"
            >
              <XCircle size={10} /> Xóa hết lọc
            </button>
          </div>
        )}
      </div>

      {/* ── Selection Checker info ── */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex justify-between items-center animate-in fade-in duration-200">
          <span>Đang chọn {selectedIds.length} sản phẩm trên trang này</span>
          <button onClick={() => setSelectedIds([])} className="text-red-500 hover:underline">Hủy chọn</button>
        </div>
      )}

      {/* ── Results Panel ── */}
      {loading ? (
        <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
          <span className="text-sm font-medium">Đang tải danh sách...</span>
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Shirt size={28} className="text-slate-350 dark:text-slate-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy sản phẩm</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Hãy điều chỉnh bộ lọc hoặc thêm mới.</p>
          </div>
          <button onClick={resetFilters} className="text-xs font-bold text-emerald-600 hover:underline">Xóa bộ lọc</button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map(p => {
            const st   = statusInfo(p.status);
            const cat  = categories.find(c => c.id === p.category_id);
            const img  = p.images?.[0]?.image_url;
            const isLow = (p.stock ?? 0) <= 5;
            const isSelected = selectedIds.includes(p.id);

            return (
              <div
                key={p.id}
                className={`group relative bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800/80'
                }`}
              >
                {/* Checkbox Overlay */}
                <div className="absolute top-2.5 right-2.5 z-20">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectProduct(p.id)}
                    className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shadow"
                  />
                </div>

                {/* Product Image */}
                <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {img ? (
                    <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-550" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt size={40} className="text-slate-300 dark:text-slate-650" />
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    {p.is_vto_enabled && (
                      <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
                        <Sparkles size={9} /> VTO
                      </span>
                    )}
                    {isLow && (
                      <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
                        <AlertTriangle size={9} /> Sắp hết
                      </span>
                    )}
                  </div>

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => openPreview(p)}
                      className="w-9 h-9 rounded-xl bg-white text-slate-700 hover:text-emerald-600 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                      title="Xem trước"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="w-9 h-9 rounded-xl bg-white text-slate-700 hover:text-emerald-600 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => toggleStatus(p)}
                      className="w-9 h-9 rounded-xl bg-white text-slate-700 hover:text-amber-500 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                      title={p.status === 'active' ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
                    >
                      {p.status === 'active' ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(p)}
                      className="w-9 h-9 rounded-xl bg-white text-slate-700 hover:text-red-550 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-1">
                    <h3 className="font-semibold text-slate-850 dark:text-slate-105 text-sm leading-snug line-clamp-2 min-h-[40px]">
                      {p.name}
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2.5">
                    {cat?.name || 'Chưa phân loại'}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-base">{fmtPrice(p.price_sale)}</p>
                      {p.price_cost > 0 && (
                        <p className="text-[10px] text-slate-400 line-through">{fmtPrice(p.price_cost)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${st.cls}`}>
                        {st.label}
                      </span>
                      <p className={`text-[10px] mt-0.5 ${isLow ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                        Còn {p.stock ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Variants badge */}
                  {p.variants?.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-slate-400">
                      <Layers size={11} />
                      <span className="text-[10px]">{p.variants.length} biến thể màu/size</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="w-12 px-5 py-3.5 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                      className="w-4 h-4 rounded border-slate-350 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  {['Sản phẩm','Danh mục','Giá bán','Tồn kho','Biến thể','Trạng thái','Tính năng','Thao tác'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedProducts.map(p => {
                  const st  = statusInfo(p.status);
                  const cat = categories.find(c => c.id === p.category_id);
                  const img = p.images?.[0]?.image_url;
                  const isLow = (p.stock ?? 0) <= 5;
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors group ${isSelected ? 'bg-emerald-50/20 dark:bg-emerald-950/5' : ''}`}>
                      <td className="px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectProduct(p.id)}
                          className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                            {img ? (
                              <img src={img} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Shirt size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate">{p.name}</p>
                            {isLow && <span className="text-[9px] bg-red-100 dark:bg-red-950/30 text-red-500 dark:text-red-400 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5 mt-0.5"><AlertTriangle size={8} />Sắp hết</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{cat?.name || '—'}</td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{fmtPrice(p.price_sale)}</p>
                        {p.price_cost > 0 && <p className="text-[10px] text-slate-400 line-through">{fmtPrice(p.price_cost)}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-bold text-sm ${isLow ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>{p.stock ?? 0}</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {p.variants?.length > 0 ? `${p.variants.length} biến thể` : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          {p.is_vto_enabled && (
                            <span className="text-[9px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-0.5">
                              <Sparkles size={9} /> VTO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openPreview(p)} className="p-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-500 transition-colors" title="Xem trước">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => openEdit(p)} className="p-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-500 transition-colors" title="Sửa">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => toggleStatus(p)} className="p-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500 transition-colors" title="Đổi trạng thái">
                            {p.status === 'active' ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button onClick={() => setDeleteConfirm(p)} className="p-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors" title="Xóa">
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

      {/* ── Pagination controls ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
          <p className="text-xs text-slate-500">
            Hiển thị <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)}</span> trong số <span className="font-semibold text-slate-800 dark:text-slate-200">{filtered.length}</span> sản phẩm
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  currentPage === i + 1
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING BULK ACTIONS BAR ── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-800/80 text-white flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-5.5 h-5.5 bg-emerald-600 rounded-full flex items-center justify-center text-[11px] font-bold shadow">{selectedIds.length}</span>
            <span className="text-xs font-semibold text-slate-350">sản phẩm được chọn</span>
          </div>
          <div className="w-px h-5 bg-slate-800" />
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkToggleStatus('active')}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all"
            >
              <Eye size={12} /> Bán hàng loạt
            </button>
            <button
              onClick={() => handleBulkToggleStatus('inactive')}
              className="inline-flex items-center gap-1 bg-slate-850 hover:bg-slate-800 active:scale-95 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all text-slate-300 border border-slate-800"
            >
              <EyeOff size={12} /> Ẩn hàng loạt
            </button>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1 bg-red-650 hover:bg-red-700 active:scale-95 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all"
            >
              <Trash2 size={12} /> Xóa hàng loạt
            </button>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-4 text-red-500">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Xóa sản phẩm?</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mb-6 leading-relaxed">
              Bạn chắc chắn muốn xóa <strong className="text-slate-800 dark:text-slate-200">"{deleteConfirm.name}"</strong>?<br />Hành động này không thể khôi phục.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors">Hủy bỏ</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors">Đồng ý</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl my-6 animate-in zoom-in-98 duration-150">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 rounded-t-2xl z-10">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {editItem ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng điền thông tin chi tiết để bán hàng tốt hơn</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">

              {/* Section 1: Thông tin cơ bản */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Thông tin sản phẩm</p>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Tên sản phẩm <span className="text-red-400">*</span></label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="VD: Áo Blazer dạ dáng ôm Hàn Quốc"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-200 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mô tả chi tiết</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Chất vải, kích cỡ, form dáng, cách phối đồ..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-200 transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Danh mục hàng</label>
                    <select
                      value={form.category_id}
                      onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-200"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Trạng thái bán</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-200"
                    >
                      {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Giá & Kho */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Thông số cơ bản</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Giá bán (₫) <span className="text-red-400">*</span></label>
                    <input
                      type="number" min={0}
                      value={form.price_sale}
                      onChange={e => setForm(fr => ({ ...fr, price_sale: e.target.value }))}
                      placeholder="290,000"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Giá nhập / Giá gốc (₫)</label>
                    <input
                      type="number" min={0}
                      value={form.price_cost}
                      onChange={e => setForm(fr => ({ ...fr, price_cost: e.target.value }))}
                      placeholder="180,000"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Tồn kho tổng</label>
                    <input
                      type="number" min={0}
                      value={form.stock}
                      onChange={e => setForm(fr => ({ ...fr, stock: e.target.value }))}
                      placeholder="100"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Virtual Try-On */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Thử đồ trực tuyến (VTO)</p>
                <div className={`p-4 rounded-2xl border transition-all ${form.is_vto_enabled ? 'border-violet-300 bg-violet-50/20 dark:bg-violet-955/10' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${form.is_vto_enabled ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-slate-850 dark:text-slate-150">Hỗ trợ thử đồ trực tuyến (VTO)</p>
                        <p className="text-[10px] text-slate-400">Cho phép người mua ướm thử 3D trang phục này</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setForm(f => ({ ...f, is_vto_enabled: !f.is_vto_enabled }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.is_vto_enabled ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_vto_enabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {form.is_vto_enabled && (
                    <div className="mt-3 space-y-2">
                      <label className="text-[10px] font-semibold text-violet-750 dark:text-violet-300">Đường dẫn tệp 3D Model trang phục (.glb / .gltf)</label>
                      <input
                        value={form.garment_3d_url}
                        onChange={e => setForm(f => ({ ...f, garment_3d_url: e.target.value }))}
                        placeholder="Ví dụ: https://my-bucket.s3.amazonaws.com/dress.glb"
                        className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-850 border border-violet-200 dark:border-violet-800/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 text-slate-850 dark:text-slate-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Modern Image Drag & Drop */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hình ảnh sản phẩm</p>
                
                {/* Drag zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                  className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10' 
                      : 'border-slate-250 dark:border-slate-800 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-900'
                  }`}
                >
                  <UploadCloud size={32} className="text-slate-450 group-hover:text-emerald-500" />
                  <p className="text-xs font-semibold text-slate-650 dark:text-slate-300">Kéo thả ảnh hoặc <span className="text-emerald-600 hover:underline">Chọn file</span> để tải lên</p>
                  <p className="text-[10px] text-slate-450">Hỗ trợ tệp PNG, JPG, JPEG từ máy tính của bạn</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Grid image preview */}
                {form.images.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
                    <p className="text-[10px] text-slate-450 mb-2 font-semibold">Hình ảnh hiện tại ({form.images.length}) · Click ngôi sao để đặt làm ảnh chính</p>
                    <div className="flex flex-wrap gap-2.5">
                      {form.images.map((img, i) => (
                        <div key={i} className="relative group w-18 h-18 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                          
                          {/* Main badge overlay */}
                          {i === 0 ? (
                            <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-emerald-600 text-white font-bold py-0.5">CHÍNH</span>
                          ) : (
                            <button
                              onClick={() => setMainImage(i)}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Đặt làm ảnh chính"
                            >
                              <span className="bg-emerald-600/90 p-1 rounded-lg text-[9px] font-bold">Đặt chính</span>
                            </button>
                          )}

                          {/* Delete overlay */}
                          <button
                            onClick={() => removeImg(i)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-750 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                            title="Xóa ảnh"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add from URL option */}
                <div className="flex gap-2">
                  <input
                    value={imgInput}
                    onChange={e => setImgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addImgViaUrl()}
                    placeholder="Dán liên kết ảnh URL nếu muốn..."
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                  <button onClick={addImgViaUrl} className="px-3.5 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-250 dark:hover:bg-slate-650 text-slate-750 dark:text-slate-250 rounded-xl transition-colors">
                    Thêm URL
                  </button>
                </div>
              </div>

              {/* Section 5: Biến thể nâng cao & Điền nhanh */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Layers size={11} /> Biến thể Màu / Size
                  </p>
                  <button onClick={addVariant} className="text-xs text-emerald-650 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5">
                    <Plus size={12} /> Thêm biến thể
                  </button>
                </div>

                {/* BULK APPLY TOOLS */}
                {form.variants.length > 1 && (
                  <div className="bg-emerald-50/30 dark:bg-emerald-950/5 border border-emerald-100 dark:border-emerald-900/50 p-3 rounded-2xl flex flex-wrap items-center gap-3 justify-between">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-350 font-semibold">
                      ⚡ Công cụ áp dụng nhanh thông số cho {form.variants.length} biến thể:
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Giá bán"
                        value={bulkVarPrice}
                        onChange={e => setBulkVarPrice(e.target.value)}
                        className="w-24 px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-800 focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Số lượng"
                        value={bulkVarQty}
                        onChange={e => setBulkVarQty(e.target.value)}
                        className="w-20 px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-800 focus:outline-none"
                      />
                      <button
                        onClick={applyBulkToVariants}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1 rounded-lg shadow-sm"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {/* Grid header */}
                  <div className="grid grid-cols-12 gap-2 px-1 text-[9px] font-bold text-slate-400 uppercase">
                    <div className="col-span-3">Màu sắc</div>
                    <div className="col-span-3">Kích thước (Size)</div>
                    <div className="col-span-2">Tồn kho</div>
                    <div className="col-span-3">Giá bán lẻ (₫)</div>
                    <div className="col-span-1"></div>
                  </div>

                  {form.variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border border-slate-200 dark:border-slate-750">
                      {/* Color Select */}
                      <select
                        value={v.color}
                        onChange={e => updateVariant(i, 'color', e.target.value)}
                        className="col-span-3 px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="">Chọn màu</option>
                        {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>

                      {/* Size Select */}
                      <select
                        value={v.size}
                        onChange={e => updateVariant(i, 'size', e.target.value)}
                        className="col-span-3 px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="">Chọn size</option>
                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>

                      {/* Qty Input */}
                      <input
                        type="number"
                        min={0}
                        value={v.quantity}
                        onChange={e => updateVariant(i, 'quantity', e.target.value)}
                        placeholder="SL"
                        className="col-span-2 px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-850 dark:text-slate-200 focus:outline-none"
                      />

                      {/* Price Input */}
                      <input
                        type="number"
                        min={0}
                        value={v.price_sale}
                        onChange={e => updateVariant(i, 'price_sale', e.target.value)}
                        placeholder="Độ trống = giá gốc"
                        className="col-span-3 px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-850 dark:text-slate-200 focus:outline-none"
                      />

                      {/* Remove Btn */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => removeVariant(i)}
                          className="text-slate-350 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 rounded-b-2xl">
              <p className="text-[10px] text-slate-400">
                <span className="text-red-400">*</span> Các trường bắt buộc nhập
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors">
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-60 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {editItem ? 'Lưu cập nhật' : 'Thêm sản phẩm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE PREVIEW MODAL (MOBILE/DESKTOP MOCK) ── */}
      {previewProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-850 w-full max-w-5xl shadow-2xl flex flex-col h-[90vh] text-white overflow-hidden animate-in zoom-in-98 duration-200">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <h3 className="font-bold text-sm tracking-wide">CHẾ ĐỘ XEM TRƯỚC (LIVE PRODUCT PREVIEW)</h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Device Selector */}
                <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-750">
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                      previewDevice === 'mobile' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone size={13} /> Mobile
                  </button>
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                      previewDevice === 'desktop' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor size={13} /> Desktop
                  </button>
                </div>
                <button
                  onClick={() => setPreviewProduct(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-450 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Preview Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center items-start">
              
              {/* MOBILE DEVICE CONTAINER */}
              {previewDevice === 'mobile' ? (
                <div className="relative w-[360px] h-[640px] bg-white text-slate-900 rounded-[36px] border-[8px] border-slate-800 shadow-2xl flex flex-col overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
                  {/* Speaker and Camera notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-800 rounded-b-xl z-30 flex items-center justify-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    <div className="w-10 h-1 bg-slate-750 rounded-full" />
                  </div>

                  {/* Mobile screen scrollable content */}
                  <div className="flex-1 overflow-y-auto pt-4 pb-16">
                    {/* Top image slider */}
                    <div className="relative h-72 bg-slate-100 flex items-center justify-center">
                      {previewProduct.images?.length > 0 ? (
                        <>
                          <img
                            src={previewProduct.images[previewActiveImg]?.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {previewProduct.images.length > 1 && (
                            <>
                              <button
                                onClick={() => setPreviewActiveImg(prev => (prev === 0 ? previewProduct.images.length - 1 : prev - 1))}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/70 backdrop-blur shadow flex items-center justify-center text-slate-800 hover:bg-white"
                              >
                                <ChevronLeft size={14} />
                              </button>
                              <button
                                onClick={() => setPreviewActiveImg(prev => (prev === previewProduct.images.length - 1 ? 0 : prev + 1))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/70 backdrop-blur shadow flex items-center justify-center text-slate-800 hover:bg-white"
                              >
                                <ChevronRight size={14} />
                              </button>
                              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {previewActiveImg + 1}/{previewProduct.images.length}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Shirt size={48} />
                          <span className="text-xs">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details info mock */}
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">
                          {categories.find(c => c.id === previewProduct.category_id)?.name || 'VESTRA COLLECTION'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base mt-1.5 leading-snug">{previewProduct.name || 'Tên sản phẩm'}</h4>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-emerald-600">{fmtPrice(previewProduct.price_sale)}</span>
                        {previewProduct.price_cost > 0 && (
                          <span className="text-xs text-slate-405 line-through">{fmtPrice(previewProduct.price_cost)}</span>
                        )}
                      </div>

                      <div className="w-full h-px bg-slate-100" />

                      {/* Color list selection mock */}
                      {previewProduct.variants?.some(v => v.color) && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-slate-700">Màu sắc:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(new Set(previewProduct.variants.map(v => v.color).filter(Boolean))).map(col => (
                              <button
                                key={col}
                                onClick={() => setPreviewSelColor(col)}
                                className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
                                  previewSelColor === col
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                                    : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                                }`}
                              >
                                {col}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Size list selection mock */}
                      {previewProduct.variants?.some(v => v.size) && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-slate-700">Kích cỡ (Size):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(new Set(previewProduct.variants.map(v => v.size).filter(Boolean))).map(sz => (
                              <button
                                key={sz}
                                onClick={() => setPreviewSelSize(sz)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${
                                  previewSelSize === sz
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold shadow-sm'
                                    : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Try on VTO Virtual Mock button */}
                      {previewProduct.is_vto_enabled && (
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setVtoSimulated(true);
                              showToast('Đang mô phỏng thử đồ VTO 3D...');
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-750 hover:to-indigo-750 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-500/20 flex items-center justify-center gap-1.5 animate-pulse"
                          >
                            <Sparkle size={14} className="animate-spin duration-3000" /> THỬ ĐỒ TRỰC TUYẾN (3D VTO)
                          </button>
                        </div>
                      )}

                      {/* Description section mock */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-xs font-semibold text-slate-700 block">Mô tả sản phẩm:</span>
                        <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{previewProduct.description || 'Không có mô tả cho sản phẩm này.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* VTO Simulator Overlay View */}
                  {vtoSimulated && (
                    <div className="absolute inset-x-0 bottom-0 top-4 bg-slate-950 z-40 flex flex-col justify-between text-white p-4 animate-in slide-in-from-bottom duration-300">
                      <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl">
                        <span className="text-xs font-bold text-violet-400 flex items-center gap-1"><Sparkle size={12} /> GIẢ LẬP PHÒNG THỬ ĐỒ VTO 3D</span>
                        <button onClick={() => setVtoSimulated(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X size={14} /></button>
                      </div>

                      {/* Model area */}
                      <div className="flex-1 flex items-center justify-center relative my-3 bg-slate-900 rounded-2xl overflow-hidden border border-violet-850">
                        {/* Dummy 3D avatar visualization */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-3 z-10 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_65%)]">
                          <Shirt size={72} className="text-violet-550 animate-bounce" />
                          <div>
                            <p className="text-sm font-bold text-white">Avatar 3D đang ướm thử:</p>
                            <p className="text-xs text-violet-300 mt-0.5 italic">{previewProduct.name}</p>
                          </div>
                          <div className="text-[10px] text-slate-400 max-w-[200px] leading-normal bg-slate-950/80 px-3 py-2 rounded-lg">
                            Đang render file 3D Model: <br/>
                            <span className="font-mono text-emerald-400 break-all text-[9px]">{previewProduct.garment_3d_url || 'model.glb'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-center space-y-2 bg-slate-900 p-3 rounded-xl">
                        <p className="text-[10px] text-slate-450">Tỉ lệ biến hình cơ thể theo số đo avatar của bạn</p>
                        <button onClick={() => setVtoSimulated(false)} className="w-full bg-emerald-600 text-xs font-bold py-2 rounded-lg">Quay lại chi tiết</button>
                      </div>
                    </div>
                  )}

                  {/* Bottom checkout action mock */}
                  <div className="absolute bottom-0 inset-x-0 h-14 bg-white border-t border-slate-100 px-3 flex items-center gap-2 z-20">
                    <button className="flex-1 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg bg-slate-50">Thêm Giỏ Hàng</button>
                    <button className="flex-1 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow shadow-emerald-500/10">Mua Ngay</button>
                  </div>
                </div>
              ) : (
                /* DESKTOP VIEW CONTAINER MOCK */
                <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden min-h-[500px] animate-in fade-in zoom-in-95 duration-200 border border-slate-250">
                  {/* Shop header mock */}
                  <div className="bg-slate-50 border-b border-slate-150 px-6 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-extrabold text-[10px]">V</div>
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">{user?.username || 'VESTRA STORE'}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-6 p-6">
                    {/* Left: Product Images */}
                    <div className="col-span-5 space-y-3">
                      <div className="h-64 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative border border-slate-150 bg-slate-50">
                        {previewProduct.images?.length > 0 ? (
                          <img
                            src={previewProduct.images[previewActiveImg]?.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Shirt size={60} className="text-slate-355" />
                        )}
                      </div>
                      {/* Image thumbnails */}
                      {previewProduct.images?.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {previewProduct.images.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => setPreviewActiveImg(i)}
                              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                                previewActiveImg === i ? 'border-emerald-600 scale-102 shadow-sm' : 'border-slate-150'
                              }`}
                            >
                              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Product Details Info */}
                    <div className="col-span-7 space-y-4 text-left">
                      <div>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">
                          {categories.find(c => c.id === previewProduct.category_id)?.name || 'Mặc định'}
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 mt-1 leading-snug">{previewProduct.name}</h2>
                      </div>

                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-black text-emerald-600">{fmtPrice(previewProduct.price_sale)}</span>
                        {previewProduct.price_cost > 0 && (
                          <span className="text-sm text-slate-400 line-through">{fmtPrice(previewProduct.price_cost)}</span>
                        )}
                      </div>

                      <hr className="border-slate-100" />

                      {/* Color variants select mock */}
                      {previewProduct.variants?.some(v => v.color) && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-slate-700">Màu sắc:</span>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(previewProduct.variants.map(v => v.color).filter(Boolean))).map(col => (
                              <button
                                key={col}
                                onClick={() => setPreviewSelColor(col)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  previewSelColor === col
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                                    : 'border-slate-200 text-slate-650 bg-white hover:bg-slate-50'
                                }`}
                              >
                                {col}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Size select mock */}
                      {previewProduct.variants?.some(v => v.size) && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-slate-700">Kích thước (Size):</span>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(previewProduct.variants.map(v => v.size).filter(Boolean))).map(sz => (
                              <button
                                key={sz}
                                onClick={() => setPreviewSelSize(sz)}
                                className={`w-10 h-10 rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${
                                  previewSelSize === sz
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                                    : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Try on VTO Virtual Mock button */}
                      {previewProduct.is_vto_enabled && (
                        <div className="pt-2 flex gap-3">
                          <button
                            onClick={() => {
                              setVtoSimulated(true);
                              showToast('Đang mô phỏng thử đồ VTO 3D...');
                            }}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-750 hover:to-indigo-750 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 animate-pulse"
                          >
                            <Sparkle size={15} className="animate-spin duration-3000" /> THỬ ĐỒ TRỰC TUYẾN (3D VTO)
                          </button>
                          <div className="text-[10px] text-slate-450 max-w-[220px] leading-tight flex items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                            Tính năng thử đồ online tự động lấy thông số avatar cơ thể của bạn để ướm thử trang phục.
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-xs font-bold text-slate-700 block">Chi tiết mô tả:</span>
                        <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">{previewProduct.description || 'Không có mô tả.'}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-3">
                        <button className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors">Thêm Vào Giỏ Hàng</button>
                        <button className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors">Mua Ngay Sản Phẩm</button>
                      </div>
                    </div>
                  </div>

                  {/* VTO Simulator Overlay View (Desktop) */}
                  {vtoSimulated && (
                    <div className="absolute inset-0 bg-slate-950 z-40 flex flex-col justify-between text-white p-6 animate-in slide-in-from-bottom duration-300">
                      <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl">
                        <span className="text-xs font-bold text-violet-400 flex items-center gap-1.5"><Sparkle size={14} /> GIẢ LẬP PHÒNG THỬ ĐỒ VTO 3D (DESKTOP MODE)</span>
                        <button onClick={() => setVtoSimulated(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X size={18} /></button>
                      </div>

                      <div className="flex-1 flex gap-6 my-4 overflow-hidden">
                        {/* 3D view simulation */}
                        <div className="flex-1 bg-slate-900 rounded-2xl relative border border-violet-850 flex items-center justify-center p-6 text-center select-none bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_65%)]">
                          <div className="space-y-4">
                            <Shirt size={96} className="text-violet-550 mx-auto animate-bounce" />
                            <div>
                              <p className="text-base font-bold text-white">Đang ướm thử trang phục lên Avatar 3D</p>
                              <p className="text-xs text-violet-300 mt-1">Sản phẩm: {previewProduct.name}</p>
                            </div>
                            <div className="text-xs text-slate-400 max-w-sm mx-auto leading-normal bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800">
                              Đường dẫn asset 3D: <br/>
                              <span className="font-mono text-emerald-400 break-all text-[10px]">{previewProduct.garment_3d_url || 'garment.glb'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Controls view simulation */}
                        <div className="w-72 bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 text-left">
                          <h5 className="font-bold text-xs text-slate-200">THÔNG SỐ MÔ PHỎNG</h5>
                          <div className="space-y-3 text-xs text-slate-400">
                            <div>
                              <span className="block text-[10px] text-slate-500 uppercase">Chiều cao avatar:</span>
                              <span className="font-bold text-slate-300">1m72</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 uppercase">Vòng ngực:</span>
                              <span className="font-bold text-slate-300">88 cm</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 uppercase">Vòng eo:</span>
                              <span className="font-bold text-slate-300">66 cm</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 uppercase">Vòng mông:</span>
                              <span className="font-bold text-slate-300">92 cm</span>
                            </div>
                          </div>
                          <hr className="border-slate-800" />
                          <div className="p-3 bg-violet-955/20 border border-violet-850 rounded-xl">
                            <p className="text-[10px] text-violet-300 leading-normal">Hệ thống đang chuẩn hóa lưới 3D (.glb) khớp theo các mốc điểm đặc trưng cơ thể của nhân vật (Morphing targets).</p>
                          </div>
                          <button onClick={() => setVtoSimulated(false)} className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-emerald-750">Quay lại chi tiết</button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
