import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Wallet, Sparkles, User, AlertCircle, Save, Plus, Edit2, 
  Trash2, X, Tag, UploadCloud, Loader2, CheckCircle2, ImagePlus, Shirt,
  ChevronRight, RefreshCw, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const COLORS = ['Trắng','Đen','Hồng','Đỏ','Xanh dương','Xanh lá','Vàng','Cam','Tím','Xám','Be','Nâu'];
const SIZES  = ['XS','S','M','L','XL','XXL','XXXL','Freesize'];

export default function Profile() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'pass'
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    birth_date: user?.birth_date || '',
    avatar_3d_url: user?.avatar_3d_url || '',
    body_image_url: user?.body_image_url || '',
  });
  const [saved, setSaved] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-white dark:bg-slate-900 p-8 rounded-3xl border border-brand-100 dark:border-slate-800 shadow-sm space-y-6">
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

  const handleSave = (e) => {
    e.preventDefault();
    updateUser(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white p-6 md:p-8 flex items-center gap-6 overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.1),transparent_40%)]"></div>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="avatar" className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/50 object-cover shadow-sm shrink-0" />
        ) : (
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-3xl font-extrabold uppercase shrink-0">
            {user.username?.[0]}
          </div>
        )}
        <div className="relative space-y-1">
          <h2 className="text-xl md:text-2xl font-bold">{user.full_name || user.username}</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 border border-white/10 uppercase tracking-wider text-brand-100">
            {user.user_type === 'shop' ? 'Cửa hàng (Seller)' : 'Khách hàng (Customer)'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Custodial Wallet Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold border-b border-brand-5: dark:border-slate-800 pb-3 text-sm uppercase tracking-wider">
              <Wallet size={18} /> Ví Giám Hộ Web 2.5
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-brand-400 dark:text-slate-400 uppercase font-bold tracking-wide">Địa chỉ ví Blockchain</span>
                <div className="bg-brand-50 dark:bg-slate-950 border border-brand-100 dark:border-slate-800 p-2.5 rounded-xl text-[11px] font-mono text-brand-700 dark:text-slate-300 select-all break-all leading-normal">
                  {user.wallet_address || 'Chưa khởi tạo ví'}
                </div>
              </div>

              <div className="p-3 bg-brand-50/50 dark:bg-slate-950/30 rounded-xl border border-brand-100 dark:border-slate-800 text-xs text-brand-500 dark:text-slate-400 leading-relaxed">
                Ví này được hệ thống tự động khởi tạo khi bạn đăng ký và được bảo mật ở máy chủ Vestra. Mọi hoa hồng Affiliate, hoàn tiền mua hàng sẽ được thanh toán trực tiếp về địa chỉ ví này.
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Interface */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Tab selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'info'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-305'
              }`}
            >
              <User size={13} className="inline mr-1" /> Thông tin tài khoản
            </button>
            <button
              onClick={() => setActiveTab('pass')}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pass'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-305'
              }`}
            >
              <Tag size={13} className="inline mr-1" /> Quản lý đồ Pass thanh lý (C2C)
            </button>
          </div>

          {activeTab === 'info' ? (
            /* PROFILE DETAILS FORM */
            <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-brand-100 dark:border-slate-800/80 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-brand-900 dark:text-slate-100 font-bold border-b border-brand-50 dark:border-slate-800 pb-3 text-sm uppercase tracking-wider">
                <User size={18} /> Thông tin tài khoản
              </div>

              {saved && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-450 text-xs font-semibold rounded-xl border border-green-200 dark:border-green-900/30">
                  Lưu thông tin thành công!
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-500 dark:text-slate-400 uppercase tracking-wide">Họ và tên</label>
                  <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full bg-brand-50 dark:bg-slate-850 border border-brand-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-brand-900 dark:text-slate-100" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-500 dark:text-slate-400 uppercase tracking-wide">Số điện thoại</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-brand-50 dark:bg-slate-850 border border-brand-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-brand-900 dark:text-slate-100" />
                </div>
              </div>

              {/* VTO Assets URLs */}
              <div className="border-t border-brand-50 dark:border-slate-800 pt-5 space-y-4">
                <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wide">
                  <Sparkles size={16} /> Dữ liệu thử đồ trực tuyến (VTO)
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-brand-500 dark:text-slate-400 flex items-center gap-1">
                      Đường dẫn ảnh body cá nhân (VTO 2D)
                    </label>
                    <input type="text" value={formData.body_image_url} onChange={(e) => setFormData({ ...formData, body_image_url: e.target.value })} placeholder="Dán link ảnh chụp vóc dáng người dùng (.png/jpg)" className="w-full bg-brand-50 dark:bg-slate-850 border border-brand-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-brand-900 dark:text-slate-100" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-brand-500 dark:text-slate-400 flex items-center gap-1">
                      Đường dẫn model 3D Avatar (.glb/.gltf)
                    </label>
                    <input type="text" value={formData.avatar_3d_url} onChange={(e) => setFormData({ ...formData, avatar_3d_url: e.target.value })} placeholder="Dán link file 3D Model nhân vật để thử đồ 3D" className="w-full bg-brand-50 dark:bg-slate-850 border border-brand-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-500 dark:focus:border-brand-450 text-brand-900 dark:text-slate-100" />
                  </div>
                </div>
              </div>

              <button type="submit" className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 transition-all flex items-center gap-1.5 text-sm">
                <Save size={16} /> Lưu thay đổi
              </button>
            </form>
          ) : (
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
