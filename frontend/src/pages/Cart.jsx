import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotalAmount, clearCart } = useCartStore();

  const formatPrice = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="space-y-8 py-4">
      <div className="border-b border-brand-100 dark:border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-brand-900 dark:text-slate-100 tracking-tight">Giỏ hàng của bạn</h1>
        <p className="text-sm text-brand-500 dark:text-slate-400 mt-1">Xem lại các sản phẩm bạn đã chọn trước khi thanh toán</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-brand-100 dark:border-slate-800/80 space-y-6">
          <div className="w-16 h-16 bg-brand-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-brand-500 dark:text-brand-400 mx-auto">
            <ShoppingBag size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-brand-900 dark:text-slate-100 text-lg">Giỏ hàng đang trống</h3>
            <p className="text-sm text-brand-400 dark:text-slate-400 max-w-xs mx-auto">
              Có vẻ bạn chưa thêm món đồ thời trang nào vào giỏ hàng.
            </p>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full shadow-lg shadow-brand-500/10 hover:shadow-brand-500/25 transition-all">
            Khám phá cửa hàng <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-100 dark:border-slate-800/80 divide-y divide-brand-50 dark:divide-slate-800">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.variant?.id || 'none'}`} className="p-5 flex gap-4 items-center">
                  
                  {/* Product Image */}
                  <img src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500'} alt={item.product.name} className="w-16 h-20 object-cover rounded-lg border border-brand-50 dark:border-slate-800 bg-brand-50/50 dark:bg-slate-950/40 shrink-0" />
                  
                  {/* Info */}
                  <div className="flex-grow min-w-0 space-y-1">
                    <h3 className="font-bold text-brand-900 dark:text-slate-100 text-sm line-clamp-1">{item.product.name}</h3>
                    {item.variant && (
                      <p className="text-[11px] text-brand-400 dark:text-slate-400">
                        Phân loại: <span className="font-semibold">{item.variant.color} - {item.variant.size}</span>
                      </p>
                    )}
                    <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm block">
                      {formatPrice(item.product.price_sale)}
                    </span>
                  </div>

                  {/* Quantity Control */}
                  <div className="flex items-center bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-slate-700/50 rounded-full px-2 py-1 shrink-0">
                    <button onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)} className="p-1 hover:text-brand-500 transition-colors text-brand-400 dark:text-slate-500">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-brand-900 dark:text-slate-100">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)} className="p-1 hover:text-brand-500 transition-colors text-brand-400 dark:text-slate-500">
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Trash */}
                  <button onClick={() => removeItem(item.product.id, item.variant?.id)} className="p-2 text-brand-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-all shrink-0" title="Xóa">
                    <Trash2 size={16} />
                  </button>

                </div>
              ))}
            </div>

            <button onClick={clearCart} className="text-xs font-semibold text-red-500 hover:text-red-650 transition-colors">
              Xóa sạch giỏ hàng
            </button>
          </div>

          {/* Checkout Summary Box */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-100 dark:border-slate-800/80 p-6 shadow-sm space-y-6 sticky top-24">
              <h3 className="font-bold text-brand-900 dark:text-slate-100 text-base border-b border-brand-50 dark:border-slate-800 pb-3">Tóm tắt đơn hàng</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-brand-500 dark:text-slate-400">
                  <span>Tạm tính</span>
                  <span>{formatPrice(getTotalAmount())}</span>
                </div>
                <div className="flex justify-between text-brand-500 dark:text-slate-400">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">Miễn phí</span>
                </div>
                <div className="border-t border-brand-50 dark:border-slate-800 pt-3 flex justify-between font-extrabold text-brand-900 dark:text-slate-100 text-base">
                  <span>Tổng tiền</span>
                  <span className="text-brand-600 dark:text-brand-450">{formatPrice(getTotalAmount())}</span>
                </div>
              </div>

              <button className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full shadow-lg shadow-brand-500/10 hover:shadow-brand-500/25 transition-all flex items-center justify-center gap-2">
                Tiến hành thanh toán <ArrowRight size={18} />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
