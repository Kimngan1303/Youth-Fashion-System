import React, { useState, useContext, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmModalProvider } from './context/ConfirmModalContext';
import { ensureOrderCacheReset } from './utils/orderCacheReset';
import Header from './components/Header';
import Footer from './components/Footer';
import AISearchModal from './components/AISearchModal';
import AccountLockedModal from './components/AccountLockedModal';
import CustomerChatNotification from './components/CustomerChatNotification';
import ManagerChatNotification from './components/ManagerChatNotification';
import HomePage from './pages/HomePage';
import ProductListPage from './pages/customer/ProductListPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import SearchPage from './pages/customer/SearchPage';
import WishlistPage from './pages/customer/WishlistPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import PayOSPaymentPage from './pages/customer/PayOSPaymentPage';
import OrderSuccessPage from './pages/customer/OrderSuccessPage';
import ProfilePage from './pages/ProfilePage';
import NotificationPage from './pages/customer/NotificationPage';
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
import OrderManager from './pages/manager/OrderManager';
import UserManagement from './pages/manager/UserManagement';
import SystemConfig from './pages/manager/SystemConfig';
import ChatManagement from './pages/manager/ChatManagement';
import RevenueReport from './pages/manager/RevenueReport';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#FAFAFA', minHeight: '60vh' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            Đang cập nhật dữ liệu hiển thị...
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '16px' }}>
            Vui lòng nhấn nút bên dưới để làm mới nội dung trang.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '10px 24px',
              backgroundColor: '#111827',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13.5px'
            }}
          >
            Làm mới trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function ManagerRoute({ children }) {
  const { user, isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const isManagerOrAdmin = Boolean(
    user && (
      ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(String(user?.role || '').toUpperCase()) ||
      ['ADMIN', 'MANAGER'].includes(String(user?.employee_role || '').toUpperCase()) ||
      String(user?.user_type || user?.type || '').toUpperCase() === 'EMPLOYEE'
    )
  );
  return isManagerOrAdmin ? children : <Navigate to="/" replace />;
}

function AdminRoute({ children }) {
  const { user, isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const isAdmin =
    String(user?.role || '').toUpperCase() === 'ADMIN' ||
    String(user?.employee_role || '').toUpperCase() === 'ADMIN';
  return isAdmin ? children : <Navigate to="/manager" replace />;
}

function AppContent() {
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  const location = useLocation();

  // Đảm bảo làm sạch một lần bộ nhớ đệm đơn hàng cũ trên trình duyệt
  useEffect(() => {
    ensureOrderCacheReset();
  }, []);

  // Xác định các trang không cần hiển thị Header và Footer của khách hàng
  const hideHeaderFooter = ['/login', '/register', '/verify-email', '/forgot-password'].includes(location.pathname) || 
    location.pathname.startsWith('/manager') || 
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/payment');

  return (
    <div className="app-layout">
      <CustomerChatNotification />
      <ManagerChatNotification />
      {!hideHeaderFooter && <Header onOpenAISearch={() => setIsAISearchOpen(true)} />}

      <main className="app-main">
        <GlobalErrorBoundary>
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
          <Route path="/search" element={<SearchPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/lookbook" element={<LookbookPage />} />
          <Route 
            path="/wishlist" 
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cart" 
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <NotificationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/thong-bao" 
            element={
              <ProtectedRoute>
                <NotificationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment/payos/:orderCode" 
            element={<PayOSPaymentPage />} 
          />
          <Route 
            path="/order-success" 
            element={<OrderSuccessPage />} 
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route
            path="/manager"
            element={
              <ManagerRoute>
                <ManagerDashboard />
              </ManagerRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ManagerRoute>
                <ManagerDashboard />
              </ManagerRoute>
            }
          />
          
          <Route
            path="/manager/products"
            element={
              <ManagerRoute>
                <ProductManager />
              </ManagerRoute>
            }
          />
          <Route
            path="/manager/categories"
            element={
              <ManagerRoute>
                <CategoryManager />
              </ManagerRoute>
            }
          />
          <Route
            path="/manager/brands"
            element={
              <ManagerRoute>
                <BrandManager />
              </ManagerRoute>
            }
          />
          <Route
            path="/manager/lookbooks"
            element={
              <ManagerRoute>
                <LookbookManagement />
              </ManagerRoute>
            }
          />
          <Route
            path="/manager/vouchers"
            element={
              <ManagerRoute>
                <VoucherManager />
              </ManagerRoute>
            }
          />
          <Route
            path="/manager/orders"
            element={
              <ManagerRoute>
                <OrderManager />
              </ManagerRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ManagerRoute>
                <OrderManager />
              </ManagerRoute>
            }
          />
          <Route
            path="/manager/reports"
            element={
              <ManagerRoute>
                <RevenueReport />
              </ManagerRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ManagerRoute>
                <RevenueReport />
              </ManagerRoute>
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
            element={<Navigate to="/manager/dashboard" replace />}
          />
          <Route
            path="/admin/system-config"
            element={<Navigate to="/manager/dashboard" replace />}
          />
          <Route
            path="/manager/chat"
            element={
              <ManagerRoute>
                <ChatManagement />
              </ManagerRoute>
            }
          />
          <Route
            path="/manager/support"
            element={
              <ManagerRoute>
                <ChatManagement />
              </ManagerRoute>
            }
          />
          
          {/* Fallback routes */}
          <Route 
            path="*" 
            element={<HomePage onOpenAISearch={() => setIsAISearchOpen(true)} />} 
          />
        </Routes>
        </GlobalErrorBoundary>
      </main>

      {!hideHeaderFooter && <Footer />}

      {/* Multimodal AI Search Modal */}
      {!hideHeaderFooter && (
        <AISearchModal 
          isOpen={isAISearchOpen} 
          onClose={() => setIsAISearchOpen(false)} 
        />
      )}

      {/* Account Locked Enforcement Modal */}
      <AccountLockedModal />

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
