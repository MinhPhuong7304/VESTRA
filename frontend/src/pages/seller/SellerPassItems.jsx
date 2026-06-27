import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Tag, Plus, Edit2, Trash2, X, UploadCloud, Loader2, 
  CheckCircle2, AlertCircle, Shirt, Package, Tag as TagIcon
} from 'lucide-react';
import api from '../../services/api';

const COLORS = ['Trắng','Đen','Hồng','Đỏ','Xanh dương','Xanh lá','Vàng','Cam','Tím','Xám','Be','Nâu'];
const SIZES  = ['XS','S','M','L','XL','XXL','XXXL','Freesize'];

const fmtPrice = (v) => Number(v || 0).toLocaleString('vi-VN') + '₫';

export default function SellerPassItems() {
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);

  // States
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [imgInput, setImgInput] = useState('');

  const emptyForm = () => ({
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
  const [form, setForm] = useState(emptyForm());

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    if (!user?.id) return;
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
  }, [user?.id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm());
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
        stock: 1, // Pass item stock is always 1
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
    <div className="space-y-5 relative pb-20">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold animate-in slide-in-from-top-3 duration-200 bg-emerald-600 text-white`}>
          <CheckCircle2 size={18} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Đồ cũ Pass của tôi</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Quản lý các sản phẩm thanh lý ký gửi (C2C)</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-sm whitespace-nowrap"
        >
          <Plus size={18} strokeWidth={2.5} /> Đăng đồ Pass cũ
        </button>
      </div>

      {/* List items */}
      {loading ? (
        <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
          <span className="text-sm font-medium">Đang tải danh sách đồ pass...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Shirt size={36} className="text-slate-300 dark:text-slate-650" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy sản phẩm pass nào</p>
            <p className="text-xs text-slate-450 mt-1">Hãy đăng món đồ pass thanh lý đầu tiên của bạn.</p>
          </div>
          <button onClick={openCreate} className="mt-1 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow shadow-emerald-600/20">
            <Plus size={16} /> Đăng món đồ đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => {
            const cat = categories.find(c => c.id === item.category_id);
            const img = item.images?.[0];
            return (
              <div key={item.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden hover:shadow-xl transition-all duration-200">
                
                {/* Image */}
                <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Shirt size={36} /></div>
                  )}
                  
                  {/* Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-lg shadow-sm">PASS ({item.condition}%)</span>
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(item)}
                      className="w-9 h-9 rounded-xl bg-white text-slate-700 hover:text-emerald-600 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(item)}
                      className="w-9 h-9 rounded-xl bg-white text-slate-750 hover:text-red-550 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-850 dark:text-slate-105 text-sm leading-snug line-clamp-2 min-h-[40px]">{item.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 mb-2.5">{cat?.name || 'Chưa phân loại'}</p>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-base">{fmtPrice(item.price_sale)}</span>
                    {item.price_cost > 0 && <span className="text-[11px] text-slate-400 line-through">{fmtPrice(item.price_cost)}</span>}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-4 text-red-555">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Gỡ đồ Pass?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Bạn chắc chắn muốn gỡ <strong className="text-slate-800 dark:text-slate-200">"{deleteConfirm.name}"</strong>?<br/>Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-350 font-semibold text-xs hover:bg-slate-50">Hủy</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs">Đồng ý</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl my-6 animate-in zoom-in-98 duration-150 text-slate-900 dark:text-white">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl">
              <div>
                <h4 className="font-bold text-sm">{editItem ? 'Chỉnh sửa đồ Pass' : 'Đăng bán đồ Pass thanh lý'}</h4>
                <p className="text-[10px] text-slate-450 mt-0.5">Thanh lý tủ quần áo cũ của bạn</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              
              {/* Product name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Tên sản phẩm <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Áo phao dày dặn ấm áp pass lại"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Mô tả tình trạng</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Lý do pass, chất liệu, size vừa vặn..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category select */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Danh mục</label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Condition Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Độ mới món đồ</label>
                    <span className="text-[10px] text-emerald-600 font-bold">{form.condition}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={form.condition}
                    onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Color select */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Màu sắc</label>
                  <select
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-850 dark:text-slate-200"
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
                    placeholder="300,000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-850 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Images Drag zone */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Hình ảnh</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                  className={`w-full py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-emerald-500 bg-emerald-50/20' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-emerald-450 bg-slate-50/50 dark:bg-slate-900'
                  }`}
                >
                  <UploadCloud size={24} className="text-slate-400" />
                  <p className="text-[11px] font-semibold text-slate-650 dark:text-slate-300">Kéo thả ảnh hoặc <span className="text-emerald-600 hover:underline">Chọn file</span></p>
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
                          <span className="absolute bottom-0 inset-x-0 text-center text-[8px] bg-emerald-600 text-white font-bold py-0.5">CHÍNH</span>
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
                          className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] shadow hover:bg-red-700"
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
                  <button onClick={addImgViaUrl} className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-250 text-slate-750 dark:text-slate-250 rounded-xl transition-colors shrink-0">
                    Thêm URL
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl">
              <p className="text-[10px] text-slate-400">* Bắt buộc</p>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50">
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md transition-all active:scale-95"
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
