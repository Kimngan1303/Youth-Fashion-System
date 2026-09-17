import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const toastStyles = `
  .toast-container-root {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 10010;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 420px;
    width: calc(100vw - 48px);
    pointer-events: none;
  }

  .toast-item-card {
    pointer-events: auto;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 10px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    line-height: 18px;
    animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-sizing: border-box;
    transition: all 0.2s ease;
  }

  @keyframes toastSlideIn {
    from {
      transform: translateX(110%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Success: Green */
  .toast-item-card.success {
    background: #F0FDF4;
    border: 1px solid #BBF7D0;
    color: #15803D;
  }

  /* Error: Red */
  .toast-item-card.error {
    background: #FEF2F2;
    border: 1px solid #FCA5A5;
    color: #DC2626;
  }

  /* Warning: Yellow */
  .toast-item-card.warning {
    background: #FFFBEB;
    border: 1px solid #FDE68A;
    color: #B45309;
  }

  /* Info: Blue */
  .toast-item-card.info {
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    color: #1D4ED8;
  }

  .toast-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
    flex-shrink: 0;
  }

  .toast-message-content {
    flex: 1;
    word-break: break-word;
  }

  .toast-close-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition: opacity 0.2s;
    color: inherit;
  }

  .toast-close-btn:hover {
    opacity: 1;
  }
`;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Tự động đóng sau 3 giây
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  const showSuccess = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const showError = useCallback((msg) => showToast(msg, 'error'), [showToast]);
  const showWarning = useCallback((msg) => showToast(msg, 'warning'), [showToast]);
  const showInfo = useCallback((msg) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      <style>{toastStyles}</style>
      {children}
      <div className="toast-container-root">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item-card ${t.type}`}>
            <div className="toast-icon-wrapper">
              {t.type === 'success' && <CheckCircle2 size={18} />}
              {t.type === 'error' && <AlertCircle size={18} />}
              {t.type === 'warning' && <AlertTriangle size={18} />}
              {t.type === 'info' && <Info size={18} />}
            </div>

            <div className="toast-message-content">{t.message}</div>

            <button type="button" className="toast-close-btn" onClick={() => removeToast(t.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được dùng bên trong ToastProvider');
  }
  return context;
};
