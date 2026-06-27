import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [],
  
  addItem: (product, variant = null, quantity = 1) => {
    const items = get().items;
    const existingIndex = items.findIndex(
      (item) => item.product.id === product.id && (!variant || item.variant?.id === variant.id)
    );
    
    let newItems = [...items];
    if (existingIndex > -1) {
      newItems[existingIndex].quantity += quantity;
    } else {
      newItems.push({ product, variant, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },
  
  removeItem: (productId, variantId = null) => {
    const newItems = get().items.filter(
      (item) => !(item.product.id === productId && (!variantId || item.variant?.id === variantId))
    );
    localStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },
  
  updateQuantity: (productId, variantId = null, quantity) => {
    const newItems = get().items.map((item) => {
      if (item.product.id === productId && (!variantId || item.variant?.id === variantId)) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    });
    localStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },
  
  clearCart: () => {
    localStorage.removeItem('cart');
    set({ items: [] });
  },
  
  getTotalAmount: () => {
    return get().items.reduce((total, item) => total + (item.product.price_sale * item.quantity), 0);
  },
  
  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  }
}));
