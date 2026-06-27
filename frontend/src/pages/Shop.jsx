import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingCart, Eye, Tag, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useCartStore } from '../store/useCartStore';

const MOCK_PRODUCTS = [
  { id: 'sp01', name: 'Áo thun Y2K Baby Tee', price_sale: 180000, description: 'Chất liệu thun gân ôm dáng phong cách Y2K', category: 'Áo', images: ['https://images.unsplash.com/photo-1554568218-0f1715e72254?w=500'], is_pass_item: false, is_vto_enabled: true },
  { id: 'sp02', name: 'Chân váy bò túi hộp', price_sale: 290000, description: 'Chất liệu jean dày dặn dáng dài xẻ tà sau', category: 'Chân váy', images: ['https://images.unsplash.com/photo-1583496661160-fb487af0416c?w=500'], is_pass_item: false, is_vto_enabled: true },
  { id: 'sp03', name: 'Áo khoác gió Varsity Jacket (Cũ)', price_sale: 200000, description: 'Độ mới 95% pass lại do mặc không vừa', category: 'Áo khoác', images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'], is_pass_item: true, condition: 95, is_vto_enabled: false },
  { id: 'sp04', name: 'Đầm xếp ly tiểu thư đen', price_sale: 350000, description: 'Thiết kế sang chảnh dự tiệc', category: 'Váy đầm', images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500'], is_pass_item: false, is_vto_enabled: true },
];

export default function Shop() {
  const location = useLocation();
  const isPassRoute = location.pathname === '/pass-items';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPass, setFilterPass] = useState(isPassRoute ? true : null); // null = all, true = only pass, false = new items
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addItem } = useCartStore();

  useEffect(() => {
    setFilterPass(isPassRoute ? true : null);
  }, [isPassRoute]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const data = await api.get('/products');
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(MOCK_PRODUCTS);
        }
      } catch (err) {
        console.warn("⚠️ Không kết nối được Backend. Sử dụng dữ liệu giả lập.", err);
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const categories = ['All', ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesPass = filterPass === null || p.is_pass_item === filterPass;
    return matchesCategory && matchesPass;
  });

  return (
    <div className="space-y-8 py-4">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-900 dark:text-slate-100 tracking-tight">Danh sách sản phẩm</h1>
          <p className="text-sm text-brand-500 dark:text-slate-400 mt-1">Cập nhật những xu hướng thời trang mới nhất</p>
        </div>

        {/* Filter buttons for B2C New / C2C Pass */}
        <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-full border border-brand-100 dark:border-slate-800 self-start shadow-sm">
          <button onClick={() => setFilterPass(null)} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${filterPass === null ? 'bg-brand-500 text-white' : 'text-brand-500 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800'}`}>
            Tất cả
          </button>
          <button onClick={() => setFilterPass(false)} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${filterPass === false ? 'bg-brand-500 text-white' : 'text-brand-500 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800'}`}>
            Hàng mới
          </button>
          <button onClick={() => setFilterPass(true)} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${filterPass === true ? 'bg-brand-500 text-white' : 'text-brand-500 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800'}`}>
            Đồ Pass cũ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Categories Sidebar */}
        <aside className="space-y-4 lg:col-span-1">
          <h3 className="font-bold text-brand-900 dark:text-slate-200 text-base uppercase tracking-wider">Danh mục</h3>
          <div className="flex flex-wrap lg:flex-col gap-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-l-4 border-brand-500' : 'bg-white dark:bg-slate-900 border border-brand-100 dark:border-slate-800/80 hover:border-brand-200 dark:hover:border-slate-700 text-brand-600 dark:text-slate-350'}`}>
                {cat}
              </button>
            ))}
          </div>
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-slate-900 border border-brand-100 dark:border-slate-800 rounded-2xl h-80"></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-brand-100 dark:border-slate-800">
              <p className="text-brand-500 dark:text-slate-450 font-medium">Không tìm thấy sản phẩm nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-100 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col relative group">
                  
                  {/* Badge VTO / Condition */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                    {product.is_vto_enabled && (
                      <span className="bg-brand-500/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1 shadow-sm">
                        <Sparkles size={10} className="animate-spin" /> VTO 3D
                      </span>
                    )}
                    {product.is_pass_item && (
                      <span className="bg-amber-500/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1 shadow-sm">
                        <Tag size={10} /> Cũ (Độ mới: {product.condition}%)
                      </span>
                    )}
                  </div>

                  {/* Image container */}
                  <div className="relative aspect-[4/5] bg-brand-50/50 dark:bg-slate-950/40 overflow-hidden">
                    <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>

                  {/* Body content */}
                  <div className="p-4 flex flex-col flex-grow space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400 dark:text-brand-400">{product.category}</span>
                    <h3 className="font-bold text-brand-900 dark:text-slate-100 text-sm line-clamp-1 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">{product.name}</h3>
                    <p className="text-xs text-brand-400 dark:text-slate-400 line-clamp-2 leading-relaxed flex-grow">{product.description}</p>
                    
                    {/* Price & Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-brand-50/50 dark:border-slate-800/80">
                      <span className="font-extrabold text-brand-600 dark:text-brand-400 text-base">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price_sale)}
                      </span>
                      <div className="flex gap-1.5">
                        <button onClick={() => addItem(product)} className="p-2 rounded-xl bg-brand-50 dark:bg-slate-800 hover:bg-brand-500 dark:hover:bg-brand-600 text-brand-500 dark:text-brand-300 hover:text-white dark:hover:text-white transition-all shadow-sm" title="Thêm vào giỏ">
                          <ShoppingCart size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
