import { useState, useEffect, useCallback } from 'react';
import {
  Shirt,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  Upload,
  Link2,
  Package,
  Layers,
  Box,
  Image as ImageIcon,
  Tag,
  ChevronDown,
  Users,
  Sparkles,
  Check,
} from 'lucide-react';
import api from '../../services/api';

const TABS = ['info', 'images', 'variants', 'vto', 'c2c'];
const TAB_LABELS = {
  info: '📋 Thông tin',
  images: '🖼 Hình ảnh',
  variants: '🎨 Biến thể',
  vto: '✨ VTO 3D',
  c2c: '♻️ Hàng Pass',
};

const emptyVariant = () => ({ color: '', size: '', quantity: 0, price_import: 0, price_sale: 0 });

export default function AdminProducts() {
  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL | B2C | C2C
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | active | hidden
  const [vtoFilter, setVtoFilter] = useState('ALL'); // ALL | VTO | NOVTO
  const [viewMode, setViewMode] = useState('grid');

  // Modal/Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [formImages, setFormImages] = useState(['']); // array of URLs
  const [formVariants, setFormVariants] = useState([emptyVariant()]);
  const [formIsVto, setFormIsVto] = useState(false);
  const [formGlbUrl, setFormGlbUrl] = useState('');
  const [formGlbSource, setFormGlbSource] = useState('url'); // url | upload
  const [uploadingGlb, setUploadingGlb] = useState(false);
  const [formIsC2c, setFormIsC2c] = useState(false);
  const [formCondition, setFormCondition] = useState(95);
  const [formOwnerId, setFormOwnerId] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);

  // ── Fetch data ──────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Lỗi tải sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMeta = useCallback(async () => {
    try {
      const [cats, usrs] = await Promise.all([
        api.get('/categories'),
        api.get('/users?user_type=customer'),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setUsers(Array.isArray(usrs) ? usrs : []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchMeta();
  }, [fetchProducts, fetchMeta]);

  // ── Filtering ───────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false;
    if (categoryFilter !== 'ALL' && p.category_id !== categoryFilter) return false;
    if (typeFilter === 'B2C' && p.is_pass_item) return false;
    if (typeFilter === 'C2C' && !p.is_pass_item) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (vtoFilter === 'VTO' && !p.is_vto_enabled) return false;
    if (vtoFilter === 'NOVTO' && p.is_vto_enabled) return false;
    return true;
  });

  // ── Form helpers ─────────────────────────────────────────────
  const resetForm = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormCategoryId('');
    setFormStatus('active');
    setFormImages(['']);
    setFormVariants([emptyVariant()]);
    setFormIsVto(false);
    setFormGlbUrl('');
    setFormGlbSource('url');
    setFormIsC2c(false);
    setFormCondition(95);
    setFormOwnerId('');
    setFormError('');
    setActiveTab('info');
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormName(product.name || '');
    setFormDescription(product.description || '');
    setFormCategoryId(product.category_id || '');
    setFormStatus(product.status || 'active');
    setFormImages(product.images?.length ? product.images : ['']);
    setFormVariants(product.variants?.length ? product.variants.map(v => ({ color: v.color || '', size: v.size || '', quantity: v.quantity || 0, price_import: v.price_import || 0, price_sale: v.price_sale || 0 })) : [emptyVariant()]);
    setFormIsVto(product.is_vto_enabled || false);
    setFormGlbUrl(product.garment_3d_url || '');
    setFormGlbSource('url');
    setFormIsC2c(product.is_pass_item || false);
    setFormCondition(product.condition || 95);
    setFormOwnerId(product.owner_id || '');
    setFormError('');
    setActiveTab('info');
    setModalOpen(true);
  };

  // ── Image upload ─────────────────────────────────────────────
  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.url) {
        const imgs = [...formImages];
        imgs[index] = res.url;
        setFormImages(imgs);
      }
    } catch (err) {
      setFormError(err.message || 'Lỗi upload ảnh.');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleGlbUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingGlb(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.url) setFormGlbUrl(res.url);
    } catch (err) {
      setFormError(err.message || 'Lỗi upload tệp 3D.');
    } finally {
      setUploadingGlb(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim()) return setFormError('Tên sản phẩm không được để trống.');
    const cleanVariants = formVariants.filter(v => v.color || v.size || v.quantity > 0);
    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        category_id: formCategoryId || null,
        status: formStatus,
        images: formImages.filter(Boolean),
        variants: cleanVariants.map(v => ({
          color: v.color || null,
          size: v.size || null,
          quantity: Number(v.quantity) || 0,
          price_import: Number(v.price_import) || 0,
          price_sale: Number(v.price_sale) || 0,
        })),
        is_vto_enabled: formIsVto,
        garment_3d_url: formIsVto ? (formGlbUrl || null) : null,
        is_pass_item: formIsC2c,
        condition: formIsC2c ? Number(formCondition) : null,
        owner_id: formIsC2c ? (formOwnerId || null) : null,
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.message || 'Lỗi lưu sản phẩm.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setDeleteConfirmId(null);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Lỗi xóa sản phẩm.');
    }
  };

  const toggleStatus = async (product) => {
    try {
      await api.patch(`/products/${product.id}`, { status: product.status === 'active' ? 'hidden' : 'active' });
      fetchProducts();
    } catch { /* silent */ }
  };

  // ── Stats ─────────────────────────────────────────────────────
  const vtoCount = products.filter(p => p.is_vto_enabled).length;
  const c2cCount = products.filter(p => p.is_pass_item).length;

  // ── Render helpers ────────────────────────────────────────────
  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || '—';
  const getUserName = (id) => {
    const u = users.find(u => u.id === id);
    return u ? (u.full_name || u.username || id) : id;
  };

  const ProductTypeBadge = ({ product }) => {
    if (product.is_pass_item) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border text-teal-600 bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/30">
          ♻️ C2C {product.condition ? `| ${product.condition}% mới` : ''}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30">
        🏷 B2C
      </span>
    );
  };

  // ── Main Render ───────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Quản lý sản phẩm
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kho hàng mới (B2C), hàng ký gửi (C2C) và tích hợp thử đồ 3D VTO
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/15 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Tổng sản phẩm', value: loading ? null : products.length, sub: 'Toàn bộ danh mục', color: 'indigo', icon: Shirt },
          { label: 'Hỗ trợ VTO 3D', value: loading ? null : vtoCount, sub: 'Thử đồ ảo có thể kích hoạt', color: 'fuchsia', icon: Sparkles },
          { label: 'Hàng Pass C2C', value: loading ? null : c2cCount, sub: 'Ký gửi từ khách hàng', color: 'teal', icon: Package },
        ].map((card) => {
          const Icon = card.icon;
          const colorMap = {
            indigo: { border: 'hover:border-indigo-500/30', icon: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', val: 'text-indigo-600 dark:text-indigo-400' },
            fuchsia: { border: 'hover:border-fuchsia-500/30', icon: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20', val: 'text-fuchsia-600 dark:text-fuchsia-400' },
            teal: { border: 'hover:border-teal-500/30', icon: 'bg-teal-500/10 text-teal-500 border-teal-500/20', val: 'text-teal-600 dark:text-teal-400' },
          };
          const c = colorMap[card.color];
          return (
            <div key={card.label} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-sm ${c.border} hover:shadow-md transition-all duration-300`}>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</span>
                <div className={`text-2xl font-extrabold ${c.val}`}>
                  {card.value === null ? <div className="h-7 w-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /> : card.value}
                </div>
                <p className="text-[11px] text-slate-400">{card.sub}</p>
              </div>
              <div className={`p-3.5 rounded-xl border ${c.icon}`}><Icon size={22} /></div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          {/* Search */}
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Tìm tên hoặc mô tả sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/15 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm appearance-none focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex flex-wrap gap-2 lg:ml-auto items-center">
            {/* B2C/C2C */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              {[['ALL', 'Tất cả'], ['B2C', 'B2C'], ['C2C', 'C2C']].map(([v, l]) => (
                <button key={v} onClick={() => setTypeFilter(v)} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${typeFilter === v ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50' : 'text-slate-500 dark:text-slate-400'}`}>{l}</button>
              ))}
            </div>
            {/* Status */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              {[['ALL', 'Tất cả'], ['active', 'Đang bán'], ['hidden', 'Ẩn']].map(([v, l]) => (
                <button key={v} onClick={() => setStatusFilter(v)} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${statusFilter === v ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50' : 'text-slate-500 dark:text-slate-400'}`}>{l}</button>
              ))}
            </div>
            {/* VTO */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              {[['ALL', 'Tất cả'], ['VTO', '✨ VTO'], ['NOVTO', 'Không VTO']].map(([v, l]) => (
                <button key={v} onClick={() => setVtoFilter(v)} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${vtoFilter === v ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50' : 'text-slate-500 dark:text-slate-400'}`}>{l}</button>
              ))}
            </div>
            {/* View mode */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              {[['grid', LayoutGrid], ['table', List]].map(([m, Icon]) => (
                <button key={m} onClick={() => setViewMode(m)} className={`p-2 rounded-lg cursor-pointer transition-all ${viewMode === m ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50' : 'text-slate-500'}`}><Icon size={14} /></button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 flex flex-col items-center gap-4 shadow-sm">
          <Loader2 size={36} className="animate-spin text-indigo-500" />
          <p className="text-slate-500 text-sm font-medium">Đang tải danh sách sản phẩm...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-2xl p-8 text-red-700 dark:text-red-400 text-center space-y-4">
          <AlertTriangle size={32} className="mx-auto" />
          <p className="font-semibold">{error}</p>
          <button onClick={fetchProducts} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold cursor-pointer">Thử lại</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center space-y-5 flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700"><Shirt size={28} /></div>
          <div>
            <p className="font-semibold text-lg text-slate-900 dark:text-slate-100">Không tìm thấy sản phẩm nào</p>
            <p className="text-sm text-slate-400 mt-1">{searchQuery ? 'Không có sản phẩm khớp với từ khóa.' : 'Kho hàng đang trống. Hãy thêm sản phẩm đầu tiên!'}</p>
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold cursor-pointer transition-colors">Xóa tìm kiếm</button>
          )}
        </div>
      ) : viewMode === 'grid' ? (

        /* ── Grid View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 animate-in fade-in duration-300">
          {filtered.map((product) => {
            const thumbnail = product.images?.[0] || null;
            const isActive = product.status === 'active';
            return (
              <div key={product.id} className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group ${isActive ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
                {/* Image */}
                <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {thumbnail ? (
                    <img src={thumbnail} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><Shirt size={40} /></div>
                  )}
                  {/* Status overlay */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                      <span className="text-xs font-bold text-white bg-slate-800/80 px-3 py-1 rounded-full">Đang ẩn</span>
                    </div>
                  )}
                  {/* Top-right badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {product.is_vto_enabled && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/30">
                        <Sparkles size={9} /> VTO 3D
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">{product.name}</h3>
                    </div>
                    <ProductTypeBadge product={product} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate">{getCategoryName(product.category_id)}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      {Number(product.price_sale).toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-xs text-slate-400">Tồn: <strong className="text-slate-700 dark:text-slate-300">{product.stock}</strong></span>
                    {deleteConfirmId === product.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(product.id)} className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer">Xóa</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold cursor-pointer">Hủy</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleStatus(product)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 rounded-lg transition-colors cursor-pointer" title={isActive ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}>
                          {isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button onClick={() => openEdit(product)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 rounded-lg transition-colors cursor-pointer" title="Chỉnh sửa">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteConfirmId(product.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer" title="Xóa">
                          <Trash2 size={13} />
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

        /* ── Table View ── */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-4">Sản phẩm</th>
                  <th className="px-5 py-4">Phân loại</th>
                  <th className="px-5 py-4">Danh mục</th>
                  <th className="px-5 py-4">Giá bán</th>
                  <th className="px-5 py-4">Tồn kho</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((product) => {
                  const thumbnail = product.images?.[0] || null;
                  const isActive = product.status === 'active';
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                            {thumbnail ? <img src={thumbnail} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Shirt size={16} /></div>}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{product.name}</p>
                            {product.is_vto_enabled && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400">
                                <Sparkles size={9} /> VTO 3D
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><ProductTypeBadge product={product} /></td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{getCategoryName(product.category_id)}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-50 whitespace-nowrap">{Number(product.price_sale).toLocaleString('vi-VN')}đ</td>
                      <td className="px-5 py-3.5">
                        <span className={`font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>{product.stock}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => toggleStatus(product)}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${isActive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200'}`}
                          title="Bấm để đổi trạng thái"
                        >
                          {isActive ? <><Eye size={10} /> Đang bán</> : <><EyeOff size={10} /> Đang ẩn</>}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {deleteConfirmId === product.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-red-500 font-semibold text-xs">Xóa?</span>
                            <button onClick={() => handleDelete(product.id)} className="px-2.5 py-1 text-white bg-red-500 hover:bg-red-600 rounded-lg text-xs font-semibold cursor-pointer">Có</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer">Không</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEdit(product)} className="p-1.5 text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors" title="Sửa"><Edit2 size={14} /></button>
                            <button onClick={() => setDeleteConfirmId(product.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md cursor-pointer transition-colors" title="Xóa"><Trash2 size={14} /></button>
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

      {/* ─── CREATE / EDIT MODAL ──────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">

            {/* Modal Header */}
            <div className="flex justify-between items-center px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
                  {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Quản lý thông tin, hình ảnh, biến thể và tính năng VTO</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer transition-colors"><X size={20} /></button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 px-7 pt-4 shrink-0 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5">

                {formError && (
                  <div className="p-3 text-sm bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* ── Tab: INFO ── */}
                {activeTab === 'info' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên sản phẩm <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Ví dụ: Áo thun Baby Tee Cotton Y2K" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 text-slate-900 dark:text-slate-100 placeholder-slate-400" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả</label>
                      <textarea placeholder="Mô tả chi tiết sản phẩm..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh mục</label>
                        <div className="relative">
                          <select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)} className="w-full pl-4 pr-8 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm appearance-none focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 cursor-pointer">
                            <option value="">-- Không có --</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</label>
                        <div className="flex gap-2">
                          {[['active', '✅ Đang bán'], ['hidden', '🚫 Ẩn']].map(([v, l]) => (
                            <button key={v} type="button" onClick={() => setFormStatus(v)} className={`flex-1 py-3 text-xs font-bold rounded-xl border-2 cursor-pointer transition-all ${formStatus === v ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}>{l}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Tab: IMAGES ── */}
                {activeTab === 'images' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">Nhập URL hoặc tải ảnh lên Cloudinary. Thêm nhiều ảnh cho sản phẩm.</p>
                    {formImages.map((img, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {img ? <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} /> : <ImageIcon size={16} className="text-slate-400" />}
                        </div>
                        <input type="text" placeholder={`URL ảnh ${i + 1}`} value={img} onChange={(e) => { const arr = [...formImages]; arr[i] = e.target.value; setFormImages(arr); }} className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400" />
                        <label className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors text-slate-600 dark:text-slate-300" title="Tải ảnh lên">
                          {uploadingImg ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, i)} />
                        </label>
                        {formImages.length > 1 && (
                          <button type="button" onClick={() => setFormImages(formImages.filter((_, j) => j !== i))} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"><X size={14} /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setFormImages([...formImages, ''])} className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-400 hover:text-indigo-500 rounded-xl text-sm font-semibold cursor-pointer transition-colors">
                      + Thêm ảnh
                    </button>
                  </div>
                )}

                {/* ── Tab: VARIANTS ── */}
                {activeTab === 'variants' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">Định nghĩa các biến thể màu sắc, kích thước, số lượng tồn kho và giá của sản phẩm.</p>
                    <div className="space-y-2">
                      {formVariants.map((v, i) => (
                        <div key={i} className="grid grid-cols-6 gap-2 items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                          <input placeholder="Màu" value={v.color} onChange={(e) => { const arr = [...formVariants]; arr[i].color = e.target.value; setFormVariants(arr); }} className="col-span-1 px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400" />
                          <input placeholder="Size" value={v.size} onChange={(e) => { const arr = [...formVariants]; arr[i].size = e.target.value; setFormVariants(arr); }} className="col-span-1 px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400" />
                          <input type="number" placeholder="SL" value={v.quantity} min={0} onChange={(e) => { const arr = [...formVariants]; arr[i].quantity = e.target.value; setFormVariants(arr); }} className="col-span-1 px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400" />
                          <input type="number" placeholder="Giá nhập" value={v.price_import} min={0} onChange={(e) => { const arr = [...formVariants]; arr[i].price_import = e.target.value; setFormVariants(arr); }} className="col-span-1 px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400" />
                          <input type="number" placeholder="Giá bán" value={v.price_sale} min={0} onChange={(e) => { const arr = [...formVariants]; arr[i].price_sale = e.target.value; setFormVariants(arr); }} className="col-span-1 px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400" />
                          <button type="button" onClick={() => formVariants.length > 1 && setFormVariants(formVariants.filter((_, j) => j !== i))} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors disabled:opacity-30" disabled={formVariants.length === 1}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-400 flex gap-6 px-1">
                      <span>Màu sắc</span><span>Kích thước</span><span>Số lượng</span><span>Giá nhập (đ)</span><span>Giá bán (đ)</span>
                    </div>
                    <button type="button" onClick={() => setFormVariants([...formVariants, emptyVariant()])} className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-400 hover:text-indigo-500 rounded-xl text-sm font-semibold cursor-pointer transition-colors">
                      + Thêm biến thể
                    </button>
                  </div>
                )}

                {/* ── Tab: VTO ── */}
                {activeTab === 'vto' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-fuchsia-50 dark:bg-fuchsia-950/20 border border-fuchsia-200 dark:border-fuchsia-900/30 rounded-2xl">
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-fuchsia-700 dark:text-fuchsia-300 flex items-center gap-2"><Sparkles size={16} /> Kích hoạt Thử đồ ảo (VTO 3D)</span>
                        <p className="text-xs text-fuchsia-500/80 dark:text-fuchsia-400/60">Cho phép khách hàng mặc thử sản phẩm này trực tiếp trong trình duyệt.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormIsVto(!formIsVto)}
                        className={`w-12 h-6.5 rounded-full transition-all duration-200 relative cursor-pointer ${formIsVto ? 'bg-fuchsia-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <span className={`w-5 h-5 bg-white rounded-full absolute top-0.75 left-0.75 transition-transform duration-200 shadow-sm ${formIsVto ? 'translate-x-5.5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {formIsVto && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          {[['url', <Link2 size={13} />, 'Nhập URL'], ['upload', <Upload size={13} />, 'Tải tệp lên']].map(([v, icon, l]) => (
                            <button key={v} type="button" onClick={() => setFormGlbSource(v)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl border-2 cursor-pointer transition-all ${formGlbSource === v ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-600 dark:text-fuchsia-400' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}>
                              {icon} {l}
                            </button>
                          ))}
                        </div>

                        {formGlbSource === 'url' ? (
                          <input
                            type="text"
                            placeholder="https://example.com/model.glb"
                            value={formGlbUrl}
                            onChange={(e) => setFormGlbUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                          />
                        ) : (
                          <label className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-fuchsia-200 dark:border-fuchsia-900/30 bg-fuchsia-50/50 dark:bg-fuchsia-950/10 rounded-2xl cursor-pointer hover:border-fuchsia-400 transition-colors">
                            {uploadingGlb ? <Loader2 size={24} className="animate-spin text-fuchsia-400" /> : <Box size={24} className="text-fuchsia-400" />}
                            <span className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400">{uploadingGlb ? 'Đang tải lên...' : 'Chọn tệp .glb / .gltf'}</span>
                            {formGlbUrl && <span className="text-xs text-slate-400 truncate max-w-xs">{formGlbUrl}</span>}
                            <input type="file" className="hidden" accept=".glb,.gltf" onChange={handleGlbUpload} />
                          </label>
                        )}

                        {formGlbUrl && (
                          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400">
                            <Check size={13} className="shrink-0" />
                            <span className="truncate font-medium">{formGlbUrl}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab: C2C ── */}
                {activeTab === 'c2c' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/30 rounded-2xl">
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-teal-700 dark:text-teal-300 flex items-center gap-2">♻️ Hàng ký gửi (C2C)</span>
                        <p className="text-xs text-teal-500/80 dark:text-teal-400/60">Đây là mặt hàng cũ/pass lại được khách hàng ký gửi qua sàn.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormIsC2c(!formIsC2c)}
                        className={`w-12 h-6.5 rounded-full transition-all duration-200 relative cursor-pointer ${formIsC2c ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <span className={`w-5 h-5 bg-white rounded-full absolute top-0.75 left-0.75 transition-transform duration-200 shadow-sm ${formIsC2c ? 'translate-x-5.5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {formIsC2c && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Độ mới của sản phẩm: <span className="text-teal-600 dark:text-teal-400 font-extrabold">{formCondition}%</span></label>
                          <input
                            type="range"
                            min={50}
                            max={100}
                            step={1}
                            value={formCondition}
                            onChange={(e) => setFormCondition(e.target.value)}
                            className="w-full accent-teal-500 cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>50% (Khá cũ)</span>
                            <span>95% (Như mới)</span>
                            <span>100% (Chưa dùng)</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Users size={12} /> Người ký gửi
                          </label>
                          <div className="relative">
                            <select value={formOwnerId} onChange={(e) => setFormOwnerId(e.target.value)} className="w-full pl-4 pr-8 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm appearance-none focus:outline-none focus:border-teal-500 text-slate-900 dark:text-slate-100 cursor-pointer">
                              <option value="">-- Chọn người dùng --</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name || u.username || u.email} ({u.user_type})</option>
                              ))}
                            </select>
                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-7 py-5 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
                <div className="flex gap-1">
                  {TABS.map((tab) => (
                    <div key={tab} className={`w-2 h-2 rounded-full transition-all ${activeTab === tab ? 'bg-indigo-500 scale-110' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition-colors cursor-pointer">Hủy</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/15 cursor-pointer disabled:opacity-60">
                    {submitting && <Loader2 size={15} className="animate-spin" />}
                    <span>{editingProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
