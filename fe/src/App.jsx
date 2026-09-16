import React, { useState, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AISearchModal from './components/AISearchModal';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ContactPage from './pages/ContactPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ManagerDashboard from './pages/manager/ManagerDashboard';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);

  return (
    <div className="app-layout">
      <Header onOpenAISearch={() => setIsAISearchOpen(true)} />

      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/" 
            element={<HomePage onOpenAISearch={() => setIsAISearchOpen(true)} />} 
          />
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
          
          {/* Fallback routes */}
          <Route 
            path="*" 
            element={<HomePage onOpenAISearch={() => setIsAISearchOpen(true)} />} 
          />
        </Routes>
      </main>

      <Footer />

      {/* Multimodal AI Search Modal */}
      <AISearchModal 
        isOpen={isAISearchOpen} 
        onClose={() => setIsAISearchOpen(false)} 
      />

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
