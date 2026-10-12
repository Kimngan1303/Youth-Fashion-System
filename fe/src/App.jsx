import React, { useState, useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmModalProvider } from './context/ConfirmModalContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AISearchModal from './components/AISearchModal';
import HomePage from './pages/HomePage';
import ProductListPage from './pages/customer/ProductListPage';
import WishlistPage from './pages/customer/WishlistPage';
import CartPage from './pages/customer/CartPage';
import ProfilePage from './pages/ProfilePage';
import ContactPage from './pages/ContactPage';
import LookbookPage from './pages/LookbookPage';
import ChatPage from './pages/ChatPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ProductManager from './pages/manager/ProductManager';
import CategoryManager from './pages/manager/CategoryManager';
import BrandManager from './pages/manager/BrandManager';
import LookbookManagement from './pages/manager/LookbookManagement';
import VoucherManager from './pages/manager/VoucherManager';
import UserManagement from './pages/manager/UserManagement';
import SystemConfig from './pages/manager/SystemConfig';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const isAdmin = user?.role === 'ADMIN' || user?.employee_role === 'ADMIN';
  return isAdmin ? children : <Navigate to="/manager" replace />;
}

function AppContent() {
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  const location = useLocation();

  // Xác định các trang không cần hiển thị Header và Footer của khách hàng
  const hideHeaderFooter = ['/login', '/register', '/verify-email', '/forgot-password'].includes(location.pathname) || location.pathname.startsWith('/manager') || location.pathname.startsWith('/admin');

  return (
    <div className="app-layout">
      {!hideHeaderFooter && <Header onOpenAISearch={() => setIsAISearchOpen(true)} />}

      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Nhóm Route Dành cho Khách hàng (Customer & Guest) */}
          <Route 
            path="/" 
            element={<HomePage onOpenAISearch={() => setIsAISearchOpen(true)} />} 
          />
          <Route 
            path="/products" 
            element={<ProductListPage onOpenAISearch={() => setIsAISearchOpen(true)} />} 
          />
          <Route path="/lookbook" element={<LookbookPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/manager"
            element={
              <ProtectedRoute>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/manager/products"
            element={
              <ProtectedRoute>
                <ProductManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/categories"
            element={
              <ProtectedRoute>
                <CategoryManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/brands"
            element={
              <ProtectedRoute>
                <BrandManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/lookbooks"
            element={
              <ProtectedRoute>
                <LookbookManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/vouchers"
            element={
              <ProtectedRoute>
                <VoucherManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/users"
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/manager/system-config"
            element={
              <AdminRoute>
                <SystemConfig />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/system-config"
            element={
              <AdminRoute>
                <SystemConfig />
              </AdminRoute>
            }
          />
          
          {/* Fallback routes */}
          <Route 
            path="*" 
            element={<HomePage onOpenAISearch={() => setIsAISearchOpen(true)} />} 
          />
        </Routes>
      </main>

      {!hideHeaderFooter && <Footer />}

      {/* Multimodal AI Search Modal */}
      {!hideHeaderFooter && (
        <AISearchModal 
          isOpen={isAISearchOpen} 
          onClose={() => setIsAISearchOpen(false)} 
        />
      )}

      <style>{`
        .app-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .app-main {
          flex: 1;
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmModalProvider>
          <AppContent />
        </ConfirmModalProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
