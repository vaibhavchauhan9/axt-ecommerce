import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages & Components
import Collection from './pages/Collection';
import Navbar from './components/layout/Navbar';
import CartDrawer from './components/layout/CartDrawer';
import SearchOverlay from './components/layout/SearchOverlay';
import SideMenu from './components/layout/SideMenu';
import PromoBanner from './components/layout/PromoBanner';
import ToastContainer from './components/layout/ToastContainer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';

// Context State Architecture Layers
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { UIProvider } from './context/UIContext';
import { ToastProvider } from './context/ToastContext'; // 🟢 YAHAN ADD KIYA HAI

// Temporary placeholder layouts for core architectural pages
const MockFooter = () => <footer className="p-8 border-t border-white/5 bg-neutral-950 text-center text-xs text-neutral-500">© 2026 AXT – ATTITUDE X T-SHIRTS. ALL RIGHTS RESERVED.</footer>;

// Route Guard: Blocks access to personal account paths if user session is invalid
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-brand-accentNeon">SYNCHRONIZING SECURE SESSION...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

// Route Guard: Blocks non-administrative traffic from loading administrative panel states
const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-brand-accentNeon">SYNCHRONIZING SECURE SESSION...</div>;
  return user && isAdmin ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      {/* 🟢 TOAST PROVIDER SE POORI APP KO WRAP KIYA */}
      <ToastProvider> 
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <UIProvider>
                <div
                  className="w-full min-h-screen bg-brand-black flex flex-col font-sans antialiased text-white selection:bg-brand-accentNeon selection:text-brand-black"
                  style={{ fontFamily: "'Rubik', sans-serif" }}
                >
                  <Navbar />
                  <ToastContainer />

                  <div className="pt-16 flex flex-col w-full">
                    <PromoBanner />

                    <main className="w-full flex-grow">
                      <Routes>
                        {/* Public Visual Interfaces */}
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/collection/:id" element={<Collection />} />
                        <Route path="/product/:slug" element={<ProductDetails />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Private Customer Operations Space */}
                        <Route path="/cart" element={
                          <ProtectedRoute>
                            <Cart />
                          </ProtectedRoute>
                        } />
                        <Route path="/wishlist" element={
                          <ProtectedRoute>
                            <Wishlist />
                          </ProtectedRoute>
                        } />
                        <Route path="/checkout" element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } />

                        {/* Protected Admin Command Center Panels */}
                        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="/admin/dashboard" element={
                          <AdminRoute>
                            <AdminDashboard />
                          </AdminRoute>
                        } />

                        {/* Fallback 404 Resolution Redirect */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                  </div>

                  <SideMenu />
                  <CartDrawer />
                  <SearchOverlay />

                  {/* Global Luxury Footer Component */}
                  <MockFooter />
                </div>
              </UIProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}