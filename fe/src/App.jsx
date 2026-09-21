import React, { useState, useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmModalProvider } from './context/ConfirmModalContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AISearchModal from './components/AISearchModal';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ContactPage from './pages/ContactPage';
import LookbookPage from './pages/LookbookPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ProductManager from './pages/manager/ProductManager';
import CategoryManager from './pages/manager/CategoryManager';
import BrandManager from './pages/manager/BrandManager';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  // Quản lý trạng thái đóng/mở của hộp thoại Tìm kiếm AI đa phương thức
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  const location = useLocation();

  // Xác định các trang không cần hiển thị Header và Footer của khách hàng
  const hideHeaderFooter = ['/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/manager');

  return (
    <div className="app-layout">
      {/* 1. Header điều hướng chính (chỉ hiển thị ở các trang mua sắm thông thường) */}
      {!hideHeaderFooter && <Header onOpenAISearch={() => setIsAISearchOpen(true)} />}

      {/* 2. Khu vực hiển thị nội dung trang theo URL (Routing) */}
      <main className="app-main">
        <Routes>
          {/* Nhóm Route Xác thực (Authentication) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Nhóm Route Dành cho Khách hàng (Customer & Guest) */}
          <Route
            path="/"
            element={<HomePage onOpenAISearch={() => setIsAISearchOpen(true)} />}
          />
          <Route path="/lookbook" element={<LookbookPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/contact" element={<ContactPage />} />

          {/* Nhóm Route Quản trị viên & Quản lý cửa hàng (Manager Dashboard) */}
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
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Chuyển về trang chủ nếu gõ sai đường dẫn */}
          <Route
            path="*"
            element={<HomePage onOpenAISearch={() => setIsAISearchOpen(true)} />}
          />
        </Routes>
      </main>

      {/* 3. Footer chân trang */}
      {!hideHeaderFooter && <Footer />}

      {/* 4. Modal tìm kiếm AI đa phương thức (Văn bản + Hình ảnh thông minh) */}
      {!hideHeaderFooter && (
        <AISearchModal
          isOpen={isAISearchOpen}
          onClose={() => setIsAISearchOpen(false)}
        />
      )}

      {/* Tùy chỉnh CSS cục bộ cho cấu trúc khung giao diện */}
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
