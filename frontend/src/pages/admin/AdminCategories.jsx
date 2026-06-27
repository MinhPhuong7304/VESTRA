import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  AlertTriangle,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  SlidersHorizontal,
  XCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import api from '../../services/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'table' | 'grid'

  // Advanced Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [imageFilter, setImageFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Category Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailCategory, setDetailCategory] = useState(null);

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null means adding new
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImages, setFormImages] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageSource, setImageSource] = useState('url'); // 'url' | 'upload'
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load Categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormId('');
    setFormName('');
    setFormDescription('');
    setFormImages('');
    setFormIsActive(true);
    setFormError('');
    setImageSource('url');
    setUploadingImage(false);
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormId(category.id);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormImages(category.images || '');
    setFormIsActive(category.isActive ?? true);
    setFormError('');
    setImageSource('url');
    setUploadingImage(false);
    setModalOpen(true);
  };

  const handleOpenDetail = (category) => {
    setDetailCategory(category);
    setDetailModalOpen(true);
  };

  // Handle Image File Upload to Cloudinary
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.url) {
        setFormImages(response.url);
        showToast('Tải ảnh lên thành công!');
      }
    } catch (err) {
      setFormError(err.message || 'Lỗi tải ảnh lên máy chủ.');
      showToast('Không thể tải ảnh lên', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Form (Add / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) return setFormError('Tên danh mục không được để trống.');

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        images: formImages.trim(),
        isActive: formIsActive
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        showToast('Cập nhật danh mục thành công!');
      } else {
        await api.post('/categories', payload);
        showToast('Tạo danh mục mới thành công!');
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Lỗi gửi dữ liệu lên máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setDeleteConfirmId(null);
      showToast('Đã xóa danh mục thành công!');
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra khi xóa danh mục.', 'error');
    }
  };

  // Filter categories by search and advanced filters
  const filteredCategories = categories.filter(category => {
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      category.name.toLowerCase().includes(q) ||
      (category.description && category.description.toLowerCase().includes(q)) ||
      category.id.toLowerCase().includes(q);

    let matchStatus = true;
    if (statusFilter === 'active') matchStatus = category.isActive ?? true;
    if (statusFilter === 'inactive') matchStatus = !(category.isActive ?? true);

    let matchImage = true;
    if (imageFilter === 'has_image') matchImage = !!category.images;
    if (imageFilter === 'no_image') matchImage = !category.images;

    // Filter by date
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      if (new Date(category.created_at) < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      if (new Date(category.created_at) > end) return false;
    }

    return matchSearch && matchStatus && matchImage;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setImageFilter('ALL');
    setStartDate('');
    setEndDate('');
    showToast('Đã xóa tất cả bộ lọc!');
  };

  // Stats counters
  const totalCount = categories.length;
  const inactiveCount = categories.filter(c => !(c.isActive ?? true)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 tracking-tight text-slate-800 dark:text-slate-200">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl text-sm font-bold border backdrop-blur-md animate-in slide-in-from-top-3 duration-250 ${
          toast.type === 'success' 
            ? 'bg-emerald-500 border-emerald-400/30 text-white' 
            : 'bg-rose-500 border-rose-400/30 text-white'
        }`}>
          {toast.type === 'success' ? <Check size={18} className="text-white" /> : <AlertTriangle size={18} className="text-white" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header & Stats Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-2">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-400/10 flex items-center justify-center text-brand-500 shrink-0">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight whitespace-nowrap">
              Danh mục sản phẩm
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              Quản lý các nhóm hàng và phân loại trang phục trong hệ thống
            </p>
          </div>
        </div>

        {/* Small stats cards container */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Card 1: Tất cả */}
          <button 
            onClick={() => { setStatusFilter('ALL'); setImageFilter('ALL'); }}
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all text-left w-36 cursor-pointer ${
              statusFilter === 'ALL' && imageFilter === 'ALL'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-805 text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              statusFilter === 'ALL' && imageFilter === 'ALL' ? 'bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold opacity-75">Tất cả</div>
              <div className="text-base font-black leading-none mt-0.5">{totalCount}</div>
            </div>
          </button>

          {/* Card 2: Tạm ẩn */}
          <button 
            onClick={() => { setStatusFilter('inactive'); }}
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all text-left w-36 cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-805 text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              statusFilter === 'inactive' ? 'bg-rose-500/20' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold opacity-75">Tạm ẩn</div>
              <div className="text-base font-black leading-none mt-0.5">{inactiveCount}</div>
            </div>
          </button>

          {/* Card 3: Thao tác Thêm Danh mục */}
          <button 
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-all flex items-center gap-3 shadow-sm hover:shadow-md w-44 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-black opacity-80">Thao tác</div>
              <div className="text-xs font-black whitespace-nowrap mt-0.5">Thêm danh mục</div>
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
              placeholder="Tìm theo Mã danh mục, Tên hoặc Mô tả..."
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
              {(statusFilter !== 'ALL' || imageFilter !== 'ALL' || startDate || endDate) && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
              )}
            </button>

            {/* View toggle */}
            <div className="flex gap-1 p-1 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0">
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
              onClick={fetchCategories} 
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-slate-505 hover:text-brand-500 transition-colors cursor-pointer" 
              title="Làm mới"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* ── Advanced Filters Panel ── */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Status Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-brand-500 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold"
              >
                <option value="ALL">Tất cả</option>
                <option value="active">Đang hiển thị</option>
                <option value="inactive">Tạm ẩn</option>
              </select>
            </div>

            {/* Image Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Hình ảnh bìa</label>
              <select
                value={imageFilter}
                onChange={e => setImageFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-brand-500 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold"
              >
                <option value="ALL">Tất cả</option>
                <option value="has_image">Đã có ảnh đại diện</option>
                <option value="no_image">Chưa có ảnh</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Từ ngày tạo</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-brand-500 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Đến ngày tạo</label>
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
        {(statusFilter !== 'ALL' || imageFilter !== 'ALL' || searchQuery || startDate || endDate) && (
          <div className="flex flex-wrap gap-1.5 pt-2 items-center">
            <span className="text-[10px] text-slate-450 dark:text-slate-505 font-semibold mr-1">Đang lọc:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Tìm kiếm: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-red-500 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Trạng thái: {statusFilter === 'active' ? 'Đang hiển thị' : 'Tạm ẩn'}
                <button onClick={() => setStatusFilter('ALL')} className="hover:text-red-500 cursor-pointer"><X size={10} /></button>
              </span>
            )}
            {imageFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Ảnh bìa: {imageFilter === 'has_image' ? 'Đã có ảnh' : 'Chưa có ảnh'}
                <button onClick={() => setImageFilter('ALL')} className="hover:text-red-500 cursor-pointer"><X size={10} /></button>
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

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-16 text-center flex flex-col items-center justify-center space-y-4">
          <Loader2 size={36} className="animate-spin text-brand-500" />
          <p className="text-slate-550 text-sm font-medium">Đang tải danh mục hàng...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-2xl p-8 text-red-700 dark:text-red-400 text-center space-y-4">
          <AlertTriangle size={32} className="mx-auto" />
          <p className="font-semibold text-base">{error}</p>
          <button onClick={fetchCategories} className="px-5 py-2.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">
            Thử lại
          </button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center space-y-5 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-505">
            <FolderOpen size={30} />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-lg text-slate-900 dark:text-slate-100">Không tìm thấy danh mục nào</p>
            <p className="text-sm text-slate-450 dark:text-slate-400">
              Không có danh mục nào khớp với tiêu chí bộ lọc.
            </p>
          </div>
          <button onClick={resetFilters} className="text-xs font-bold text-brand-500 hover:underline cursor-pointer">Xóa bộ lọc</button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Cards Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {filteredCategories.map((category) => (
            <div 
              key={category.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group flex flex-col h-full relative"
            >
              {/* Category Cover Image Area */}
              <div className="h-44 w-full relative bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0 border-b border-slate-150 dark:border-slate-850">
                {category.images ? (
                  <img 
                    src={category.images} 
                    alt={category.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-950 gap-2">
                    <ImageIcon size={28} />
                    <span className="text-xs">Không có hình ảnh</span>
                  </div>
                )}
                
                {/* ID Tag Overlaid */}
                <div className="absolute top-3.5 left-3.5 px-2.5 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-mono text-white tracking-wide shadow-sm select-all">
                  {category.id}
                </div>

                {/* Status Overlaid */}
                <div className="absolute top-3.5 right-3.5">
                  {category.isActive ?? true ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-950/70 border border-emerald-500/20 backdrop-blur-md px-2 py-0.5 rounded-md shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-pulse"></span>
                      Hiển thị
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-950/80 border border-slate-800 backdrop-blur-md px-2 py-0.5 rounded-md shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                      Tạm ẩn
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-50 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors tracking-tight line-clamp-1">
                    {category.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed h-8 overflow-hidden">
                    {category.description || <span className="text-slate-400 italic">Không có mô tả chi tiết...</span>}
                  </p>
                  
                  {/* Category Meta */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1.5 font-bold uppercase tracking-wider">
                    <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      {category._count?.products ?? 0} sản phẩm
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      {category.created_at ? new Date(category.created_at).toLocaleDateString('vi-VN') : '—'}
                    </span>
                  </div>
                </div>

                {/* Actions bottom block */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2.5">
                  {deleteConfirmId === category.id ? (
                    <div className="flex items-center justify-between w-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-1 rounded-xl text-xs animate-in fade-in duration-200">
                      <span className="text-red-650 dark:text-red-400 font-bold pl-2">Xóa?</span>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
                        >
                          Có
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2.5 py-1 bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-350 rounded-lg font-bold transition-colors cursor-pointer"
                        >
                          Không
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenDetail(category)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-gray-500 hover:text-brand-500 hover:bg-brand-500/10 transition-all border border-transparent dark:border-white/5 cursor-pointer shrink-0"
                        title="Xem chi tiết"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(category)}
                        className="flex-1 py-2 text-xs font-bold text-slate-700 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 bg-slate-55 hover:bg-brand-50 dark:bg-slate-800 dark:hover:bg-brand-950/20 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 duration-200"
                      >
                        <Edit2 size={12} />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(category.id)}
                        className="p-2 text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 rounded-xl transition-all cursor-pointer shadow-sm active:scale-90"
                        title="Xóa danh mục"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View Mode */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-805 text-xs font-bold text-slate-405 uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Hình ảnh</th>
                  <th className="px-6 py-4">Tên danh mục</th>
                  <th className="px-6 py-4">Mô tả</th>
                  <th className="px-6 py-4">Số sản phẩm</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/10 transition-colors group">
                    
                    {/* Image Column */}
                    <td className="px-6 py-3.5">
                      {category.images ? (
                        <img 
                          src={category.images} 
                          alt={category.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-150 dark:border-slate-800 bg-slate-50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-150 dark:border-slate-800">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>

                    {/* Code & Name */}
                    <td className="px-6 py-3.5">
                      <div className="font-extrabold text-slate-900 dark:text-slate-55 text-sm">{category.name}</div>
                      <code className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-955/60 px-1.5 py-0.5 rounded border border-slate-150 dark:border-slate-800/80">
                        {category.id}
                      </code>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-3.5 max-w-xs truncate text-slate-500 dark:text-slate-400 text-xs">
                      {category.description || <span className="text-slate-400 italic">Không có mô tả</span>}
                    </td>

                    {/* Product count */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {category._count?.products ?? 0}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{category.created_at ? new Date(category.created_at).toLocaleDateString('vi-VN') : '—'}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {category.isActive ?? true ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-green-500 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20">
                          <span className="w-1 h-1 rounded-full bg-green-500"></span>
                          Hiển thị
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-550 bg-slate-500/10 px-2.5 py-0.5 rounded-full border border-slate-500/20">
                          <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                          Tạm ẩn
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-right">
                      {deleteConfirmId === category.id ? (
                        <div className="inline-flex items-center justify-end gap-1.5 bg-red-500/10 border border-red-500/25 p-1 rounded-xl text-xs">
                          <span className="text-red-500 font-black text-[10px] px-1.5">Xóa?</span>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg font-black transition-colors cursor-pointer"
                          >
                            Có
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition-colors cursor-pointer"
                          >
                            Không
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(category)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-gray-550 dark:text-gray-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all border border-transparent dark:border-white/5 cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(category)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all border border-transparent dark:border-white/5 cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(category.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-gray-550 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent dark:border-white/5 cursor-pointer"
                            title="Xóa danh mục"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL DRAWER */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-805 rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {editingCategory ? 'Cấu hình danh mục' : 'Thêm danh mục mới'}
                </h3>
                <p className="text-xs text-gray-550 dark:text-gray-400 mt-0.5">Thiết lập nhóm phân loại hàng hóa trên trang web</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 text-xs bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 flex items-center gap-2 font-bold">
                  <AlertTriangle size={15} className="shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ID field (Only visible and read-only during edit) */}
              {editingCategory && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-550 dark:text-gray-400 uppercase tracking-tight block">
                    Mã ID Danh mục
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-500 dark:text-slate-400 select-all">
                    {formId}
                  </div>
                </div>
              )}

              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-555 dark:text-gray-450 uppercase tracking-tight block">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Áo Sơ Mi, Quần Tây, Đầm..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 font-semibold"
                  required
                />
              </div>

              {/* Image selection field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-555 dark:text-gray-450 uppercase tracking-tight">
                    Hình ảnh bìa
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImageSource('url')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        imageSource === 'url' 
                          ? 'bg-brand-500 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Nhập URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSource('upload')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        imageSource === 'upload' 
                          ? 'bg-brand-500 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Tải file lên
                    </button>
                  </div>
                </div>

                {imageSource === 'url' ? (
                  <input
                    type="url"
                    placeholder="Nhập liên kết hình ảnh bìa danh mục..."
                    value={formImages}
                    onChange={(e) => setFormImages(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 font-semibold"
                  />
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none text-slate-500 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-brand-500/10 file:text-brand-500 dark:file:bg-brand-500/5 hover:file:bg-brand-100 cursor-pointer disabled:opacity-50"
                    />
                    {uploadingImage && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-brand-500 font-medium">
                        <Loader2 size={14} className="animate-spin" /> Đang tải...
                      </div>
                    )}
                  </div>
                )}

                {formImages && (
                  <div className="mt-2.5 p-2 border border-slate-200 dark:border-slate-800 rounded-xl w-max flex items-center gap-3 bg-slate-50 dark:bg-slate-950">
                    <img 
                      src={formImages} 
                      alt="preview" 
                      className="w-16 h-16 object-cover rounded-lg border dark:border-slate-800"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormImages('')}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Description field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-555 dark:text-gray-450 uppercase tracking-tight block">
                  Mô tả danh mục
                </label>
                <textarea
                  placeholder="Nhập mô tả ngắn gọn về nhóm sản phẩm này..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white resize-none placeholder-slate-400 font-semibold"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between py-3 border-t border-b border-slate-100 dark:border-slate-800/80">
                <div className="space-y-1 pr-4">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Kích hoạt hiển thị</span>
                  <p className="text-[10px] text-slate-400 leading-tight">Nếu ẩn, danh mục và sản phẩm trực thuộc sẽ không được hiển thị cho khách mua hàng.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`
                    w-11 h-6 rounded-full transition-all duration-200 relative focus:outline-none cursor-pointer shrink-0
                    ${formIsActive ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'}
                  `}
                >
                  <span 
                    className={`
                      w-4.5 h-4.5 bg-white rounded-full absolute top-0.75 left-0.75 transition-transform duration-200 shadow-sm
                      ${formIsActive ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800/80">
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
                  <span>{editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ─── CATEGORY DETAIL MODAL ─── */}
      {detailModalOpen && detailCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-805 rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Chi tiết danh mục
                </h3>
                <p className="text-xs text-gray-550 dark:text-gray-400 mt-0.5">Thông tin cấu hình chi tiết và chỉ số sản phẩm</p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-5">
              
              {/* Category Cover Image Large */}
              <div className="h-48 w-full relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                {detailCategory.images ? (
                  <img 
                    src={detailCategory.images} 
                    alt={detailCategory.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-2">
                    <ImageIcon size={36} />
                    <span className="text-xs font-semibold">Chưa thiết lập ảnh bìa</span>
                  </div>
                )}
              </div>

              {/* Grid info fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tên danh mục</span>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-250">
                    {detailCategory.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mã danh mục (ID)</span>
                  <code className="text-xs font-mono text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/15 select-all inline-block font-semibold">
                    {detailCategory.id}
                  </code>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số lượng sản phẩm</span>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-500/20">
                      {detailCategory._count?.products ?? 0} sản phẩm
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ngày tạo danh mục</span>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-350 flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>{detailCategory.created_at ? new Date(detailCategory.created_at).toLocaleString('vi-VN') : '—'}</span>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trạng thái hoạt động</span>
                  <div>
                    {detailCategory.isActive ?? true ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Hiển thị trên Shop (Hoạt động)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 bg-slate-500/10 px-3 py-1 rounded-full border border-slate-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Tạm ẩn khỏi Shop (Không hoạt động)
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mô tả chi tiết</span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                    {detailCategory.description || <span className="italic text-slate-400">Không có mô tả chi tiết cho danh mục này.</span>}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800/80">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 font-bold text-sm rounded-xl cursor-pointer border border-transparent dark:border-slate-800 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenEdit(detailCategory);
                }}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 transition-all cursor-pointer"
              >
                Chỉnh sửa
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
