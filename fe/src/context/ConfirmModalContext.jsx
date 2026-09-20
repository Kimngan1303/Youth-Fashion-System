import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, LogOut, Trash2, HelpCircle, X } from 'lucide-react';

const ConfirmModalContext = createContext(null);

const modalStyles = `
  .confirm-backdrop-blur {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 10050;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes fadeInModal {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .confirm-modal-card {
    background: #FFFFFF;
    width: 440px;
    max-width: 100%;
    border-radius: 20px;
    padding: 28px 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(222, 216, 203, 0.8);
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    animation: scaleInModal 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  }

  @keyframes scaleInModal {
    from {
      transform: scale(0.92);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .confirm-icon-badge {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
  }

  .confirm-icon-badge.danger {
    background: #FEF2F2;
    color: #DC2626;
    border: 1px solid #FCA5A5;
  }

  .confirm-icon-badge.warning {
    background: #FFFBEB;
    color: #D97706;
    border: 1px solid #FDE68A;
  }

  .confirm-icon-badge.logout {
    background: #FDF2F2;
    color: #E11D48;
    border: 1px solid #FECDD3;
  }

  .confirm-icon-badge.info {
    background: #F4F4F5;
    color: #18181B;
    border: 1px solid #E4E4E7;
  }

  .confirm-modal-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 20px;
    font-weight: 700;
    color: #111111;
    margin: 0 0 8px 0;
    line-height: 1.3;
  }

  .confirm-modal-message {
    font-size: 13.5px;
    line-height: 20px;
    color: #57534E;
    margin: 0 0 24px 0;
    word-break: break-word;
  }

  .confirm-modal-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .btn-confirm-cancel {
    flex: 1;
    height: 42px;
    background: #F5F5F4;
    border: 1px solid #E7E5E4;
    border-radius: 10px;
    font-size: 12.5px;
    font-weight: 600;
    color: #57534E;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-confirm-cancel:hover {
    background: #E7E5E4;
    color: #1C1917;
  }

  .btn-confirm-submit {
    flex: 1;
    height: 42px;
    border: none;
    border-radius: 10px;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .btn-confirm-submit.danger,
  .btn-confirm-submit.logout {
    background: #111111;
    color: #FFFFFF;
  }

  .btn-confirm-submit.danger:hover,
  .btn-confirm-submit.logout:hover {
    background: #DC2626;
  }

  .btn-confirm-submit.warning {
    background: #D97706;
    color: #FFFFFF;
  }

  .btn-confirm-submit.warning:hover {
    background: #B45309;
  }

  .btn-confirm-submit.info {
    background: #111111;
    color: #FFFFFF;
  }

  .btn-confirm-submit.info:hover {
    background: #27272A;
  }

  .confirm-close-corner {
    position: absolute;
    top: 16px;
    right: 16px;
    background: transparent;
    border: none;
    color: #A1A1AA;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
  }

  .confirm-close-corner:hover {
    color: #18181B;
  }
`;

export function ConfirmModalProvider({ children }) {
  const [modalConfig, setModalConfig] = useState(null);

  const confirmModal = useCallback((options) => {
    return new Promise((resolve) => {
      setModalConfig({
        title: options.title || 'Xác nhận hành động',
        message: options.message || 'Bạn có chắc chắn muốn thực hiện hành động này?',
        confirmText: options.confirmText || 'Đồng ý',
        cancelText: options.cancelText || 'Hủy bỏ',
        variant: options.variant || 'logout', // 'danger' | 'warning' | 'logout' | 'info'
        resolve,
      });
    });
  }, []);

  const handleClose = (result) => {
    if (modalConfig?.resolve) {
      modalConfig.resolve(result);
    }
    setModalConfig(null);
  };

  return (
    <ConfirmModalContext.Provider value={{ confirmModal }}>
      <style>{modalStyles}</style>
      {children}

      {modalConfig && (
        <div className="confirm-backdrop-blur" onClick={() => handleClose(false)}>
          <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="confirm-close-corner" onClick={() => handleClose(false)}>
              <X size={18} />
            </button>

            <div className={`confirm-icon-badge ${modalConfig.variant}`}>
              {modalConfig.variant === 'logout' && <LogOut size={26} />}
              {modalConfig.variant === 'danger' && <Trash2 size={26} />}
              {modalConfig.variant === 'warning' && <AlertTriangle size={26} />}
              {modalConfig.variant === 'info' && <HelpCircle size={26} />}
            </div>

            <h3 className="confirm-modal-title">{modalConfig.title}</h3>
            <p className="confirm-modal-message">{modalConfig.message}</p>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn-confirm-cancel"
                onClick={() => handleClose(false)}
              >
                {modalConfig.cancelText}
              </button>
              <button
                type="button"
                className={`btn-confirm-submit ${modalConfig.variant}`}
                onClick={() => handleClose(true)}
              >
                {modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmModalContext.Provider>
  );
}

export const useConfirmModal = () => {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    throw new Error('useConfirmModal phải được dùng bên trong ConfirmModalProvider');
  }
  return context;
};
