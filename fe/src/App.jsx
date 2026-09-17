import React, { useState, useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
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

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  const location = useLocation();

  const hideHeaderFooter = ['/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/manager');

  return (
    <div className="app-layout">
      {!hideHeaderFooter && <Header onOpenAISearch={() => setIsAISearchOpen(true)} />}

      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/" 
            element={<HomePage onOpenAISearch={() => setIsAISearchOpen(true)} />} 
          />
          <Route path="/lookbook" element={<LookbookPage />} />
          <Route path="/profile" element={<ProfilePage />} />
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
      <AppContent />
    </AuthProvider>
  );
}
