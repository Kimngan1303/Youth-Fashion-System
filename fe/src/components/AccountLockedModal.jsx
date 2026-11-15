import React, { useState, useEffect, useContext } from 'react';
import { Lock, LogOut, ShieldAlert } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/auth.service';

/**
 * AccountLockedModal: Hiển thị hộp thoại giao diện chặn đứng mọi thao tác
 * khi tài khoản bị Quản trị viên (Admin) khóa, bắt buộc người dùng phải đăng xuất.
 */
export default function AccountLockedModal() {
  const { user } = useContext(AuthContext);
  const [isLocked, setIsLocked] = useState(() => {
    try {
      return localStorage.getItem('yf_is_account_locked') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [lockMessage, setLockMessage] = useState(
    'Tài khoản của bạn đã bị Quản trị viên tạm khóa. Mọi thao tác tiếp theo đã bị vô hiệu hóa!'
  );

  useEffect(() => {
    // 1. Nếu thông tin user hiện tại trong context có status === 'LOCKED'
    if (user && user.status === 'LOCKED') {
      setIsLocked(true);
      try {
        localStorage.setItem('yf_is_account_locked', 'true');
      } catch (e) {}
    }
  }, [user]);

  useEffect(() => {
    // 2. Lắng nghe sự kiện từ axiosClient khi API trả về 403 ACCOUNT_LOCKED
    const handleAccountLockedEvent = (e) => {
      if (e.detail?.message) {
        setLockMessage(e.detail.message);
      }
      setIsLocked(true);
      try {
        localStorage.setItem('yf_is_account_locked', 'true');
      } catch (err) {}
    };

    // 3. Lắng nghe sự kiện broadcast từ tab Admin vừa khóa tài khoản
    const handleBroadcastLock = (e) => {
      const lockedEmail = (e.detail?.email || '').toLowerCase().trim();
      const currentEmail = (user?.email || '').toLowerCase().trim();
      if (lockedEmail && currentEmail && lockedEmail === currentEmail) {
        setLockMessage('Tài khoản của bạn vừa bị Quản trị viên tạm khóa. Mọi quyền truy cập tiếp theo đã bị chặn lại!');
        setIsLocked(true);
        try {
          localStorage.setItem('yf_is_account_locked', 'true');
        } catch (err) {}
      }
    };

    // 4. Lắng nghe BroadcastChannel liên tab
    let bc = null;
    try {
      bc = new BroadcastChannel('yf_role_sync_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'ACCOUNT_LOCKED') {
          const lockedEmail = (event.data?.email || '').toLowerCase().trim();
          const currentEmail = (user?.email || '').toLowerCase().trim();
          if (lockedEmail && currentEmail && lockedEmail === currentEmail) {
            setLockMessage('Tài khoản của bạn vừa bị Quản trị viên tạm khóa. Mọi quyền truy cập tiếp theo đã bị chặn lại!');
            setIsLocked(true);
            try {
              localStorage.setItem('yf_is_account_locked', 'true');
            } catch (err) {}
          }
        }
      };
    } catch (e) {}

    // 5. Lắng nghe storage event cho các cửa sổ / tab khác
    const handleStorage = (e) => {
      if (e.key === 'yf_last_lock_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const lockedEmail = (parsed.email || '').toLowerCase().trim();
          const currentEmail = (user?.email || '').toLowerCase().trim();
          if (lockedEmail && currentEmail && lockedEmail === currentEmail) {
            setLockMessage('Tài khoản của bạn vừa bị Quản trị viên tạm khóa. Mọi quyền truy cập tiếp theo đã bị chặn lại!');
            setIsLocked(true);
            try {
              localStorage.setItem('yf_is_account_locked', 'true');
            } catch (err) {}
          }
        } catch (err) {}
      }
    };

    window.addEventListener('auth:account_locked', handleAccountLockedEvent);
    window.addEventListener('yf_account_locked_broadcast', handleBroadcastLock);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('auth:account_locked', handleAccountLockedEvent);
      window.removeEventListener('yf_account_locked_broadcast', handleBroadcastLock);
      window.removeEventListener('storage', handleStorage);
      if (bc) {
        try {
          bc.close();
        } catch (e) {}
      }
    };
  }, [user?.email]);

  // Xử lý bắt buộc đăng xuất và thoát khỏi hệ thống
  const handleForcedLogout = async () => {
    try {
      localStorage.removeItem('yf_is_account_locked');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('youth_fashion_cart');
      localStorage.removeItem('youth_fashion_wishlist');
    } catch (e) {}

    try {
      await authService.logout();
    } catch (e) {}

    window.dispatchEvent(new Event('auth:logout'));
    window.location.href = '/login';
  };

  if (!isLocked) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '460px',
          width: '100%',
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1.5px solid #FECACA',
          animation: 'accountLockPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Icon cảnh báo khóa tài khoản */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            border: '2px solid #FCA5A5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px auto',
          }}
        >
          <Lock size={32} color="#DC2626" strokeWidth={2.2} />
        </div>

        {/* Tiêu đề & Thông điệp */}
        <span
          style={{
            color: '#DC2626',
            fontSize: '11.5px',
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          CẢNH BÁO BẢO MẬT HỆ THỐNG
        </span>

        <h3
          style={{
            fontSize: '21px',
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 12px 0',
            fontFamily: 'serif',
          }}
        >
          Tài Khoản Đã Bị Tạm Khóa
        </h3>

        <p
          style={{
            fontSize: '13.5px',
            color: '#4B5563',
            lineHeight: 1.6,
            margin: '0 0 18px 0',
          }}
        >
          {user?.email && (
            <span>
              Tài khoản <strong style={{ color: '#111827' }}>{user.email}</strong>{' '}
            </span>
          )}
          {lockMessage}
        </p>

        {/* Khung cảnh báo màu đỏ nhạt */}
        <div
          style={{
            backgroundColor: '#FFF5F5',
            borderLeft: '3.5px solid #DC2626',
            borderRadius: '0 8px 8px 0',
            padding: '12px 14px',
            textAlign: 'left',
            fontSize: '12px',
            color: '#991B1B',
            lineHeight: 1.5,
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <ShieldAlert size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Lưu ý bắt buộc:</strong> Mọi quyền truy cập, phiên làm việc và thao tác tiếp theo đã bị đình chỉ để bảo vệ dữ liệu. Quý khách vui lòng thoát tài khoản khỏi thiết bị này.
            </span>
          </div>
        </div>

        {/* Nút thoát bắt buộc */}
        <button
          type="button"
          onClick={handleForcedLogout}
          style={{
            width: '100%',
            padding: '13px 20px',
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '13.5px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            letterSpacing: '0.4px',
            transition: 'background-color 0.15s ease',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#B91C1C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#DC2626';
          }}
        >
          <LogOut size={16} />
          ĐĂNG XUẤT VÀ THOÁT RA
        </button>
      </div>

      <style>{`
        @keyframes accountLockPop {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

