import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AISearchModal from './components/AISearchModal';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ContactPage from './pages/ContactPage';

function AppContent() {
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);

  return (
    <div className="app-layout">
      <Header onOpenAISearch={() => setIsAISearchOpen(true)} />

      <main className="app-main">
        <Routes>
          <Route 
            path="/" 
            element={<HomePage onOpenAISearch={() => setIsAISearchOpen(true)} />} 
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/contact" element={<ContactPage />} />
          
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
