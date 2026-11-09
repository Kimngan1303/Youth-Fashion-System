import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

/**
 * Single-file Login Component with Full Backend Integration
 * Connected to /api/auth/login via AuthContext & Axios Client.
 */

const loginStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Montserrat:wght@500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  .auth-page-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 40px 20px;
    min-height: 100vh;
    width: 100%;
    background: linear-gradient(0deg, #EDEAE4, #EDEAE4), #FFFFFF;
    box-sizing: border-box;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .auth-modal-wrapper {
    box-sizing: border-box;
    width: 1024px;
    max-width: 100%;
    height: 670px;
    background: #FFFFFF;
    border: 1px solid rgba(222, 216, 203, 0.6);
    box-shadow: 0px 25px 50px -12px rgba(0, 0, 0, 0.25);
    border-radius: 24px;
    position: relative;
    overflow: hidden;
    display: flex;
  }

  /* Left Editorial Banner Section */
  .editorial-banner-section {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 48px;
    justify-content: space-between;
    isolation: isolate;
    position: absolute;
    height: 668px;
    left: 1px;
    width: 511px;
    top: 1px;
    background: radial-gradient(143.16% 109.3% at 10% 15%, #F9F7F2 0%, #ECE6DB 100%);
    border-right: 1px solid rgba(222, 216, 203, 0.7);
    overflow: hidden;
  }

  .concentric-circle-1 {
    position: absolute;
    width: 320px;
    height: 320px;
    left: -90px;
    top: -90px;
    border: 1px solid rgba(180, 165, 145, 0.35);
    border-radius: 9999px;
    pointer-events: none;
    z-index: 0;
  }

  .concentric-circle-2 {
    position: absolute;
    width: 440px;
    height: 440px;
    right: -59px;
    bottom: -120px;
    border: 1px solid rgba(180, 165, 145, 0.35);
    border-radius: 9999px;
    pointer-events: none;
    z-index: 1;
  }

  .header-mini-logo {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    z-index: 2;
  }

  .mini-logo-dot {
    width: 8px;
    height: 8px;
    background: #111111;
    border-radius: 9999px;
  }

  .mini-logo-text {
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 3.36px;
    text-transform: uppercase;
    color: #1C1917;
  }

  .central-hero-statement {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    z-index: 3;
    text-align: center;
  }

  .floating-emblem-wrapper {
    position: relative;
    width: 80px;
    height: 80px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .floating-emblem {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 80px;
    background: rgba(248, 246, 240, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
    border-radius: 9999px;
    box-shadow: 0px 10px 25px -5px rgba(120, 110, 95, 0.12);
  }

  .emblem-icon {
    width: 42px;
    height: 42px;
    color: #1C1917;
  }

  .hero-headline {
    font-family: 'Playfair Display', serif;
    font-weight: 400;
    font-size: 36px;
    line-height: 40px;
    letter-spacing: -0.9px;
    color: #1C1917;
    margin: 0 0 16px 0;
  }

  .ornamental-divider {
    width: 40px;
    height: 1.5px;
    background: #D6D3D1;
    margin-bottom: 20px;
  }

  .banner-tagline {
    font-size: 14px;
    line-height: 20px;
    color: #57534E;
    max-width: 320px;
    margin: 0;
  }

  .banner-footer-credentials {
    width: 100%;
    padding-top: 16px;
    border-top: 1px solid rgba(214, 211, 209, 0.6);
    font-weight: 300;
    font-size: 11px;
    line-height: 16px;
    text-transform: uppercase;
    color: #737373;
    z-index: 4;
  }

  /* Right Login Form Section */
  .login-form-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 59.5px 56px;
    position: absolute;
    height: 666.5px;
    left: 512px;
    width: 511px;
    top: 1px;
    background: #FFFFFF;
    box-sizing: border-box;
  }

  .form-inner-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 399px;
    max-width: 100%;
  }

  .brand-wordmark {
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
    font-size: 13px;
    line-height: 16px;
    letter-spacing: 4.55px;
    text-transform: uppercase;
    color: #1C1917;
  }

  .form-heading {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 30px;
    line-height: 36px;
    letter-spacing: -0.3px;
    color: #1C1917;
    margin: 4px 0 0 0;
  }

  .form-subtext {
    font-size: 14px;
    line-height: 20px;
    color: #78716C;
    margin: 0;
  }

  /* Alert Banners */
  .alert-box {
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 12px;
    line-height: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .alert-error {
    background-color: #FEF2F2;
    border: 1px solid #FCA5A5;
    color: #991B1B;
  }

  .alert-success {
    background-color: #F0FDF4;
    border: 1px solid #86EFAC;
    color: #166534;
  }

  /* Role Switcher Pills */
  .role-switcher {
    display: flex;
    background: #F5F5F4;
    padding: 3px;
    border-radius: 8px;
    gap: 4px;
    width: 100%;
  }

  .role-btn {
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    cursor: pointer;
    background: transparent;
    color: #78716C;
    transition: all 0.2s ease;
  }

  .role-btn.active {
    background: #FFFFFF;
    color: #1C1917;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
  }

  .input-field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  .input-label {
    font-weight: 600;
    font-size: 11px;
    line-height: 16px;
    letter-spacing: 0.55px;
    text-transform: uppercase;
    color: #57534E;
  }

  .input-relative-box {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
  }

  .custom-input {
    box-sizing: border-box;
    width: 100%;
    height: 44px;
    background: #FFFFFF;
    border: 1px solid #E7E5E4;
    border-radius: 8px;
    padding: 10px 40px 10px 40px;
    font-size: 14px;
    color: #292524;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .custom-input::placeholder {
    color: #A8A29E;
  }

  .custom-input:focus {
    border-color: #1C1917;
    box-shadow: 0 0 0 1px #1C1917;
  }

  .input-left-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: #A8A29E;
    pointer-events: none;
  }

  .input-right-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #A8A29E;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .input-right-btn:hover {
    color: #1C1917;
  }

  .auxiliary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-size: 12px;
  }

  .remember-me-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #57534E;
    cursor: pointer;
  }

  .remember-checkbox {
    width: 16px;
    height: 16px;
    border: 1px solid #D6D3D1;
    border-radius: 4px;
    cursor: pointer;
    accent-color: #111111;
  }

  .forgot-password-link {
    font-weight: 500;
    color: #292524;
    text-decoration: none;
  }

  .forgot-password-link:hover {
    text-decoration: underline;
  }

  .btn-submit-cta {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 14px 16px;
    gap: 8px;
    width: 100%;
    height: 44px;
    background: #111111;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 12px;
    letter-spacing: 2.4px;
    text-transform: uppercase;
    color: #FFFFFF;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .btn-submit-cta:hover {
    background: #2A2725;
  }

  .btn-submit-cta:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .or-divider-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: 2px 0;
  }

  .or-divider-line {
    width: 100%;
    height: 1px;
    background: #E7E5E4;
  }

  .or-divider-text {
    position: absolute;
    background: #FFFFFF;
    padding: 0 12px;
    font-size: 11px;
    letter-spacing: 0.55px;
    text-transform: uppercase;
    color: #A8A29E;
  }

  .btn-google-login {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 38px;
    background: #FFFFFF;
    border: 1px solid #E7E5E4;
    border-radius: 8px;
    font-weight: 500;
    font-size: 12px;
    color: #44403C;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-google-login:hover {
    background: #F5F5F4;
    border-color: #D6D3D1;
  }

  /* Google OAuth Modal */
  .google-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    padding: 16px;
    animation: fadeInModal 0.2s ease-out;
  }

  @keyframes fadeInModal {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }

  .google-modal-card {
    background: #FFFFFF;
    width: 100%;
    max-width: 440px;
    border-radius: 20px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    position: relative;
    border: 1px solid #E2E8F0;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .google-modal-header {
    padding: 24px 24px 16px;
    text-align: center;
    border-bottom: 1px solid #F1F5F9;
    position: relative;
  }

  .google-modal-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: transparent;
    border: none;
    font-size: 20px;
    line-height: 1;
    color: #94A3B8;
    cursor: pointer;
    padding: 6px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .google-modal-close-btn:hover {
    background: #F1F5F9;
    color: #0F172A;
  }

  .google-modal-title {
    font-size: 18px;
    font-weight: 600;
    color: #1E293B;
    margin-top: 10px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .google-modal-subtitle {
    font-size: 13px;
    color: #64748B;
    margin: 0;
  }

  .google-account-list {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .google-account-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid #E2E8F0;
    background: #FFFFFF;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;
  }

  .google-account-item:hover {
    background: #F8FAFC;
    border-color: #CBD5E1;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }

  .google-account-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #2563EB;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 16px;
    flex-shrink: 0;
  }

  .google-account-avatar.demo {
    background: #0D9488;
  }

  .google-account-avatar.custom {
    background: #64748B;
  }

  .google-account-info {
    flex: 1;
    min-width: 0;
  }

  .google-account-name {
    font-size: 14px;
    font-weight: 600;
    color: #1E293B;
    margin-bottom: 2px;
  }

  .google-account-email {
    font-size: 12px;
    color: #64748B;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .google-custom-form {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .google-custom-input {
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid #CBD5E1;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
  }

  .google-custom-input:focus {
    border-color: #2563EB;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  }

  .google-custom-btn-group {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 4px;
  }

  .google-btn-cancel {
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid #CBD5E1;
    background: #FFFFFF;
    color: #475569;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }

  .google-btn-submit {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    background: #2563EB;
    color: #FFFFFF;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .google-modal-footer {
    padding: 14px 20px;
    background: #F8FAFC;
    border-top: 1px solid #F1F5F9;
    font-size: 11px;
    color: #94A3B8;
    line-height: 1.5;
    text-align: center;
  }

  .registration-note-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;
    width: 100%;
    font-size: 12px;
    color: #78716C;
  }

  .register-now-link {
    font-weight: 600;
    color: #1C1917;
    text-decoration: none;
  }

  .register-now-link:hover {
    text-decoration: underline;
  }

  .user-welcome-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #F9F7F2;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #E7E5E4;
    width: 100%;
  }
`;

export default function Login() {
  const { login, loginWithGoogle, logout, user, isAuthenticated, loading } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const prefillEmail = location.state?.registeredEmail || '';
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('CUSTOMER'); // 'CUSTOMER' or 'EMPLOYEE'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Trạng thái Google OAuth
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [isCustomGoogleInput, setIsCustomGoogleInput] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Khởi tạo Google Identity Services (GSI) nếu cấu hình Client ID
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const setupGsi = () => {
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              if (response?.credential) {
                setGoogleLoading(true);
                const res = await loginWithGoogle({ credential: response.credential });
                setGoogleLoading(false);
                if (res.success) {
                  showSuccess(`Đăng nhập Google thành công! Chào mừng ${res.data?.user?.full_name || 'quý khách'}`);
                  navigate('/');
                } else {
                  showError(res.message || 'Đăng nhập Google thất bại');
                }
              }
            },
          });
        }
      } catch (e) {
        console.warn('Google GSI Init:', e);
      }
    };

    if (!document.getElementById('google-gsi-client')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = setupGsi;
      document.body.appendChild(script);
    } else {
      setupGsi();
    }
  }, []);

  const handleOpenGoogle = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Ưu tiên mở cửa sổ Popup chính thức của Google (Google OAuth2 Token Client)
    if (clientId && window.google?.accounts?.oauth2) {
      try {
        setGoogleLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.error) {
              setGoogleLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                showError('Đăng nhập Google thất bại: ' + (tokenResponse.error_description || tokenResponse.error));
              }
              return;
            }

            if (tokenResponse?.access_token) {
              try {
                // Lấy thông tin hồ sơ thật từ Google UserInfo API
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleProfile = await userInfoRes.json();

                if (!googleProfile?.email) {
                  throw new Error('Không lấy được email từ tài khoản Google');
                }

                const res = await loginWithGoogle({
                  email: googleProfile.email,
                  name: googleProfile.name || googleProfile.email.split('@')[0],
                  picture: googleProfile.picture || null,
                  google_id: googleProfile.sub,
                });

                if (res.success) {
                  showSuccess(`Đăng nhập Google thành công! Chào mừng ${res.data?.user?.full_name || googleProfile.name}`);
                  navigate('/');
                } else {
                  showError(res.message || 'Đăng nhập Google thất bại');
                }
              } catch (err) {
                showError('Lỗi xác thực thông tin tài khoản Google: ' + err.message);
              } finally {
                setGoogleLoading(false);
              }
            }
          },
        });

        // Bật ngay cửa sổ popup chính thức của Google
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Lỗi mở popup Google OAuth2, mở modal dự phòng:', err);
        setGoogleLoading(false);
      }
    }

    // Mở modal dự phòng nếu script Google chưa tải hoặc không có Client ID
    setShowGoogleModal(true);
  };

  const handleSelectGoogleAccount = async (account) => {
    setGoogleLoading(true);
    const res = await loginWithGoogle(account);
    setGoogleLoading(false);
    if (res.success) {
      showSuccess(`Đăng nhập Google thành công! Chào mừng ${res.data?.user?.full_name || account.name}`);
      setShowGoogleModal(false);
      navigate('/');
    } else {
      showError(res.message || 'Đăng nhập Google thất bại. Vui lòng thử lại!');
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleCustomEmail || !googleCustomEmail.includes('@')) {
      showError('Vui lòng nhập địa chỉ email Google hợp lệ!');
      return;
    }
    const name = googleCustomName.trim() || googleCustomEmail.split('@')[0];
    await handleSelectGoogleAccount({
      email: googleCustomEmail.trim().toLowerCase(),
      name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=128`,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const res = await login({ email, password, user_type: loginType });

    if (res.success) {
      const msg = `Đăng nhập thành công! Chào mừng ${res.data.user.full_name}`;
      setSuccessMessage(msg);
      showSuccess(msg);
      setTimeout(() => {
        const role = res.data.user.role || res.data.user.user_type;
        if (loginType === 'EMPLOYEE' || role === 'EMPLOYEE' || role === 'ADMIN' || role === 'MANAGER') {
          navigate('/manager');
        } else {
          navigate('/');
        }
      }, 500);
    } else {
      const msg = res.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!';
      setErrorMessage(msg);
      showError(msg);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <style>{loginStyles}</style>

      <div className="auth-modal-wrapper">

        {/* BÊN TRÁI: EditorialBannerSection */}
        <div className="editorial-banner-section">
          <div className="concentric-circle-1" />
          <div className="concentric-circle-2" />

          <div className="header-mini-logo">
            <img src="/logo.png" alt="Youth Fashion Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <span className="mini-logo-text">YOUTH FASHION</span>
          </div>

          <div className="central-hero-statement">
            <div className="floating-emblem-wrapper">
              <div className="floating-emblem">
                <img src="/logo.png" alt="Youth Fashion Emblem" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
              </div>
            </div>

            <h1 className="hero-headline">Đăng nhập</h1>
            <div className="ornamental-divider" />
            <p className="banner-tagline">
              Biến ý tưởng sáng tạo thành phong cách sống vượt thời gian cùng đặc quyền thành viên Youth Fashion.
            </p>
          </div>

          <div className="banner-footer-credentials">
            © 2026 Youth Fashion. All rights reserved.
          </div>
        </div>

        {/* BÊN PHẢI: LoginFormSection */}
        <div className="login-form-section">
          <div className="form-inner-container">

            {/* Header */}
            <div>
              <div className="brand-wordmark">Y O U T H F A S H I O N</div>
              <h2 className="form-heading">Chào Mừng Trở Lại</h2>
              <p className="form-subtext">
                Đăng nhập vào tài khoản cá nhân Youth Fashion của quý khách.
              </p>
            </div>

            {/* Thông báo Error/Success */}
            {errorMessage && (
              <div className="alert-box alert-error">
                <span>⚠️ {errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="alert-box alert-success">
                <span>✅ {successMessage}</span>
              </div>
            )}

            {/* Form Đăng Nhập */}
            <form className="auth-form" onSubmit={handleSubmit}>

              {/* Switcher Khách hàng / Nhân viên */}
              <div className="role-switcher">
                <button
                  type="button"
                  className={`role-btn ${loginType === 'CUSTOMER' ? 'active' : ''}`}
                  onClick={() => setLoginType('CUSTOMER')}
                >
                  Khách Hàng
                </button>
                <button
                  type="button"
                  className={`role-btn ${loginType === 'EMPLOYEE' ? 'active' : ''}`}
                  onClick={() => setLoginType('EMPLOYEE')}
                >
                  Nhân Viên / Admin
                </button>
              </div>

              {/* Email */}
              <div className="input-field-group">
                <label className="input-label">ĐỊA CHỈ EMAIL</label>
                <div className="input-relative-box">
                  <svg className="input-left-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    className="custom-input"
                    placeholder={loginType === 'CUSTOMER' ? 'quykhach@domain.com' : 'nhanvien@youthfashion.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="input-field-group">
                <label className="input-label">MẬT KHẨU</label>
                <div className="input-relative-box">
                  <svg className="input-left-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="custom-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-right-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Auxiliary Row */}
              <div className="auxiliary-row">
                <label className="remember-me-label">
                  <input
                    type="checkbox"
                    className="remember-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Ghi nhớ đăng nhập
                </label>
                <Link to="/forgot-password" className="forgot-password-link">
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit CTA */}
              <button type="submit" className="btn-submit-cta" disabled={loading}>
                {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>

            {/* Divider */}
            <div className="or-divider-container">
              <div className="or-divider-line" />
              <span className="or-divider-text">HOẶC TIẾP TỤC VỚI</span>
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="btn-google-login"
              onClick={handleOpenGoogle}
              disabled={loading || googleLoading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              {googleLoading ? 'Đang kết nối Google...' : 'Google'}
            </button>

            {/* Footer Link */}
            <div className="registration-note-footer">
              <span>Chưa có tài khoản?</span>
              <Link to="/register" className="register-now-link">
                Đăng ký tài khoản ngay
              </Link>
            </div>

          </div>
        </div>

      </div>

      {/* Modal Chọn Tài Khoản Google */}
      {showGoogleModal && (
        <div className="google-modal-overlay" onClick={() => !googleLoading && setShowGoogleModal(false)}>
          <div className="google-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="google-modal-header">
              <button
                type="button"
                className="google-modal-close-btn"
                onClick={() => !googleLoading && setShowGoogleModal(false)}
              >
                ✕
              </button>
              <svg width="32" height="32" viewBox="0 0 24 24" style={{ margin: '0 auto' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <h3 className="google-modal-title">Đăng nhập bằng Google</h3>
              <p className="google-modal-subtitle">để tiếp tục truy cập Youth Fashion</p>
            </div>

            {!isCustomGoogleInput ? (
              <div className="google-account-list">
                {/* Tài khoản gợi ý 1: Quang NQ */}
                <button
                  type="button"
                  className="google-account-item"
                  disabled={googleLoading}
                  onClick={() =>
                    handleSelectGoogleAccount({
                      email: 'quangnq.dev@gmail.com',
                      name: 'Nguyễn Quang',
                      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                    })
                  }
                >
                  <div className="google-account-avatar">Q</div>
                  <div className="google-account-info">
                    <div className="google-account-name">Nguyễn Quang</div>
                    <div className="google-account-email">quangnq.dev@gmail.com</div>
                  </div>
                </button>

                {/* Tài khoản gợi ý 2: Youth Fashion VIP */}
                <button
                  type="button"
                  className="google-account-item"
                  disabled={googleLoading}
                  onClick={() =>
                    handleSelectGoogleAccount({
                      email: 'vip.customer@youthfashion.vn',
                      name: 'Khách hàng Thân Thiết',
                      picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
                    })
                  }
                >
                  <div className="google-account-avatar demo">Y</div>
                  <div className="google-account-info">
                    <div className="google-account-name">Khách hàng Thân Thiết</div>
                    <div className="google-account-email">vip.customer@youthfashion.vn</div>
                  </div>
                </button>

                {/* Tùy chọn 3: Nhập tài khoản Google khác */}
                <button
                  type="button"
                  className="google-account-item"
                  disabled={googleLoading}
                  onClick={() => setIsCustomGoogleInput(true)}
                >
                  <div className="google-account-avatar custom">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="google-account-info">
                    <div className="google-account-name">Sử dụng tài khoản khác</div>
                    <div className="google-account-email">Đăng nhập bằng địa chỉ email Google bất kỳ</div>
                  </div>
                </button>
              </div>
            ) : (
              <form className="google-custom-form" onSubmit={handleCustomGoogleSubmit}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    EMAIL GOOGLE CỦA BẠN
                  </label>
                  <input
                    type="email"
                    className="google-custom-input"
                    placeholder="ví dụ: tenban@gmail.com"
                    value={googleCustomEmail}
                    onChange={(e) => setGoogleCustomEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    HỌ VÀ TÊN (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    className="google-custom-input"
                    placeholder="Nguyễn Văn A"
                    value={googleCustomName}
                    onChange={(e) => setGoogleCustomName(e.target.value)}
                  />
                </div>

                <div className="google-custom-btn-group">
                  <button
                    type="button"
                    className="google-btn-cancel"
                    onClick={() => setIsCustomGoogleInput(false)}
                    disabled={googleLoading}
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    className="google-btn-submit"
                    disabled={googleLoading}
                  >
                    {googleLoading ? 'Đang xác thực...' : 'Tiếp tục'}
                  </button>
                </div>
              </form>
            )}

            <div className="google-modal-footer">
              Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email, tùy chọn ngôn ngữ và ảnh hồ sơ của bạn với Youth Fashion.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
