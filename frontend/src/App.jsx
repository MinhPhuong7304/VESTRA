import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useThemeStore } from './store/useThemeStore';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Login from './pages/Login';
import AiChat from './pages/AiChat';

// Admin Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProducts from './pages/admin/AdminProducts';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminLedger from './pages/admin/AdminLedger';

// Seller Components
import SellerLayout from './layouts/seller/SellerLayout';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerVouchers from './pages/seller/SellerVouchers';
import SellerPassItems from './pages/seller/SellerPassItems';

export default function App() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public & Customer Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="cart" element={<Cart />} />
          <Route path="profile" element={<Profile />} />
          <Route path="login" element={<Login />} />
          <Route path="ai-chat" element={<AiChat />} />
          <Route path="pass-items" element={<Shop />} /> {/* Reuses Shop component with a filter or defaults */}
        </Route>

        {/* Protected Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="vouchers" element={<AdminVouchers />} />
          <Route path="ledger" element={<AdminLedger />} />
        </Route>

        {/* Protected Seller Routes */}
        <Route
          path="/seller"
          element={
            <ProtectedRoute allowedRoles={['shop']}>
              <SellerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="vouchers" element={<SellerVouchers />} />
          <Route path="pass-items" element={<SellerPassItems />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
