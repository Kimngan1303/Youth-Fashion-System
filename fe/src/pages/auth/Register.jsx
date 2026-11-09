import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

/**
 * Register Component
 * Match UI pixel-perfect according to luxury editorial design for Youth Fashion
 */

const registerStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Montserrat:wght@500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  .auth-outer-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 30px 20px;
    min-height: 100vh;
    width: 100%;
    background-color: #EFECE6;
    box-sizing: border-box;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .auth-content-box {
    display: flex;
    flex-direction: column;
    width: 1024px;
    max-width: 100%;
  }

  .back-navigation-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #44403C;
    margin-bottom: 18px;
    align-self: flex-start;
    padding: 4px 0;
    transition: color 0.2s ease, transform 0.2s ease;
    text-decoration: none;
  }

  .back-navigation-btn:hover {
    color: #111111;
    transform: translateX(-3px);
  }

  .auth-modal-card {
    box-sizing: border-box;
    width: 100%;
    min-height: 720px;
    height: auto;
    background: #FFFFFF;
    border: 1px solid rgba(222, 216, 203, 0.6);
    box-shadow: 0px 25px 50px -12px rgba(0, 0, 0, 0.16);
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
    min-height: 718px;
    height: 100%;
    left: 1px;
    width: 480px;
    top: 1px;
    background: radial-gradient(143.16% 109.3% at 10% 15%, #F9F7F2 0%, #ECE6DB 100%);
    border-right: 1px solid rgba(222, 216, 203, 0.7);
    overflow: hidden;
  }

  .concentric-circle-1 {
    position: absolute;
    width: 340px;
    height: 340px;
    left: -100px;
    top: -100px;
    border: 1px solid rgba(180, 165, 145, 0.4);
    border-radius: 9999px;
    pointer-events: none;
    z-index: 0;
  }

  .concentric-circle-2 {
    position: absolute;
    width: 460px;
    height: 460px;
    right: -70px;
    bottom: -110px;
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
    font-weight: 600;
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

  .floating-emblem-badge {
    position: relative;
    width: 80px;
    height: 80px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(248, 246, 240, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
    border-radius: 9999px;
    box-shadow: 0px 10px 25px -5px rgba(120, 110, 95, 0.12);
  }

  .hero-headline {
    font-family: 'Playfair Display', serif;
    font-weight: 400;
    font-size: 38px;
    line-height: 44px;
    letter-spacing: -0.5px;
    color: #1C1917;
    margin: 0 0 16px 0;
  }

  .ornamental-divider {
    width: 42px;
    height: 1.5px;
    background: #D6D3D1;
    margin-bottom: 20px;
  }

  .banner-tagline {
    font-size: 13.5px;
    line-height: 21px;
    color: #57534E;
    max-width: 320px;
    margin: 0;
    font-weight: 400;
  }

  .banner-footer-credentials {
    width: 100%;
    padding-top: 16px;
    border-top: 1px solid rgba(214, 211, 209, 0.5);
    font-weight: 400;
    font-size: 11px;
    line-height: 16px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #8C827A;
    z-index: 4;
  }

  /* Right Registration Form Section */
  .register-form-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 32px 56px;
    position: absolute;
    min-height: 718px;
    height: 100%;
    left: 481px;
    width: calc(100% - 481px);
    top: 1px;
    background: #FFFFFF;
    box-sizing: border-box;
    overflow-y: auto;
  }

  .form-inner-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 440px;
    max-width: 100%;
  }

  .brand-wordmark {
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: #1C1917;
    margin-bottom: 4px;
  }

  .form-heading {
    font-family: 'Playfair Display', serif;
    font-weight: 500;
    font-size: 28px;
    line-height: 34px;
    letter-spacing: -0.3px;
    color: #1C1917;
    margin: 0 0 4px 0;
  }

  .form-subtext {
    font-size: 13px;
    line-height: 19px;
    color: #78716C;
    margin: 0 0 4px 0;
  }

  /* Alert Banners */
  .alert-box {
    padding: 9px 12px;
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
    color: #44403C;
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
    height: 42px;
    background: #FFFFFF;
    border: 1px solid #E5E2DC;
    border-radius: 8px;
    padding: 8px 38px 8px 38px;
    font-size: 13.5px;
    color: #292524;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .custom-input::placeholder {
    color: #A8A29E;
    font-size: 13px;
  }

  .custom-input:focus {
    border-color: #1C1917;
    box-shadow: 0 0 0 1px #1C1917;
  }

  .input-left-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 17px;
    height: 17px;
    color: #A8A29E;
    pointer-events: none;
  }

  .input-right-btn {
    position: absolute;
    right: 10px;
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

  .password-row-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
  }

  .terms-container {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    margin-top: 2px;
  }

  .terms-checkbox {
    width: 16px;
    height: 16px;
    margin-top: 2px;
    border: 1px solid #D6D3D1;
    border-radius: 4px;
    cursor: pointer;
    accent-color: #111111;
    flex-shrink: 0;
  }

  .terms-text {
    font-size: 12px;
    line-height: 18px;
    color: #57534E;
  }

  .terms-link {
    color: #1C1917;
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 500;
  }

  .terms-link:hover {
    color: #000000;
  }

  .btn-submit-cta {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 13px 16px;
    gap: 8px;
    width: 100%;
    height: 44px;
    background: #111111;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #FFFFFF;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
    margin-top: 6px;
  }

  .btn-submit-cta:hover {
    background: #282523;
  }

  .btn-submit-cta:active {
    transform: scale(0.99);
  }

  .btn-submit-cta:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .registration-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    width: 100%;
    font-size: 12.5px;
    color: #78716C;
    margin-top: 4px;
  }

  .login-now-link {
    font-weight: 600;
    color: #1C1917;
    text-decoration: none;
  }

  .login-now-link:hover {
    text-decoration: underline;
  }

  .or-divider-container {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    margin: 8px 0 6px;
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
    height: 40px;
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

  @media (max-width: 900px) {
    .auth-modal-card {
      flex-direction: column;
      height: auto;
    }
    .editorial-banner-section {
      position: static;
      width: 100%;
      height: auto;
      padding: 32px 24px;
    }
    .register-form-section {
      position: static;
      width: 100%;
      height: auto;
      padding: 32px 24px;
    }
    .password-row-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default function Register() {
  const { register, loginWithGoogle, loading } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

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
                  showSuccess(`Đăng ký & Đăng nhập Google thành công! Chào mừng ${res.data?.user?.full_name || 'quý khách'}`);
                  navigate('/');
                } else {
                  showError(res.message || 'Đăng ký Google thất bại');
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
                showError('Đăng ký Google thất bại: ' + (tokenResponse.error_description || tokenResponse.error));
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
                  showSuccess(`Đăng ký Google thành công! Chào mừng ${res.data?.user?.full_name || googleProfile.name}`);
                  navigate('/');
                } else {
                  showError(res.message || 'Đăng ký Google thất bại');
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
      showSuccess(`Đăng ký Google thành công! Chào mừng ${res.data?.user?.full_name || account.name}`);
      setShowGoogleModal(false);
      navigate('/');
    } else {
      showError(res.message || 'Đăng ký Google thất bại. Vui lòng thử lại!');
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

    // Client-side validations
    if (!agreeTerms) {
      setErrorMessage('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/.test(password)) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 6 ký tự, gồm chữ hoa (A-Z), chữ thường (a-z), chữ số (0-9) và ký tự đặc biệt (VD: Manh123@).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
      return;
    }

    const res = await register({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    if (res.success) {
      const normalizedEmail = email.trim().toLowerCase();
      const msg = res.message || 'Mã xác thực OTP đã được gửi đến email của bạn!';
      setSuccessMessage(msg);
      setTimeout(() => {
        navigate('/verify-email', { state: { email: normalizedEmail } });
      }, 1000);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="auth-outer-container">
      <style>{registerStyles}</style>

      <div className="auth-content-box">
        {/* Nút Quay Lại ở phía trên bên trái */}
        <button
          type="button"
          className="back-navigation-btn"
          onClick={() => navigate(-1)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          QUAY LẠI
        </button>

        <div className="auth-modal-card">

          {/* BÊN TRÁI: Editorial Banner Section */}
          <div className="editorial-banner-section">
            <div className="concentric-circle-1" />
            <div className="concentric-circle-2" />

            {/* Header mini logo */}
            <div className="header-mini-logo">
              <img src="/logo.png" alt="Youth Fashion Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              <span className="mini-logo-text">YOUTH FASHION</span>
            </div>

            {/* Central hero statement */}
            <div className="central-hero-statement">
              <div className="floating-emblem-badge">
                <img src="/logo.png" alt="Youth Fashion Emblem" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
              </div>

              <h1 className="hero-headline">Đăng ký</h1>
              <div className="ornamental-divider" />
              <p className="banner-tagline">
                Biến ý tưởng sáng tạo thành phong cách sống vượt thời gian cùng đặc quyền thành viên Youth Fashion.
              </p>
            </div>

            {/* Footer credentials */}
            <div className="banner-footer-credentials">
              © 2026 YOUTH FASHION
            </div>
          </div>

          {/* BÊN PHẢI: Form Đăng Ký Tài Khoản */}
          <div className="register-form-section">
            <div className="form-inner-container">

              {/* Brand wordmark & Tiêu đề */}
              <div>
                <div className="brand-wordmark">Y O U T H &nbsp; F A S H I O N</div>
                <h2 className="form-heading">Đăng Ký Tài Khoản</h2>
                <p className="form-subtext">
                  Khám phá các bộ sưu tập giới hạn và đặc quyền thành viên Youth Fashion.
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

              {/* Form Input */}
              <form className="auth-form" onSubmit={handleSubmit}>

                {/* Họ và tên */}
                <div className="input-field-group">
                  <label className="input-label">HỌ VÀ TÊN</label>
                  <div className="input-relative-box">
                    <svg className="input-left-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="Nguyễn Thảo My"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
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
                      placeholder="quykhach@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Mật khẩu và Xác nhận mật khẩu (2 cột ngang) */}
                <div className="password-row-grid">
                  {/* Cột Mật khẩu */}
                  <div className="input-field-group">
                    <label className="input-label">MẬT KHẨU</label>
                    <div className="input-relative-box">
                      <svg className="input-left-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="custom-input"
                        placeholder="Tối thiểu 6 ký tự"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="input-right-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
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

                  {/* Cột Xác nhận mật khẩu */}
                  <div className="input-field-group">
                    <label className="input-label">XÁC NHẬN MẬT KHẨU</label>
                    <div className="input-relative-box">
                      <svg className="input-left-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="custom-input"
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Điều khoản dịch vụ và Chính sách bảo mật */}
                <div className="terms-container">
                  <input
                    type="checkbox"
                    id="terms-check"
                    className="terms-checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <label htmlFor="terms-check" className="terms-text">
                    Tôi đồng ý với{' '}
                    <a href="#terms" className="terms-link">Điều khoản dịch vụ</a>
                    {' '}và{' '}
                    <a href="#privacy" className="terms-link">Chính sách bảo mật</a>
                    {' '}của Youth Fashion.
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="btn-submit-cta"
                  disabled={loading}
                >
                  {loading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ →'}
                </button>
              </form>

              {/* Divider */}
              <div className="or-divider-container">
                <div className="or-divider-line" />
                <span className="or-divider-text">HOẶC TIẾP TỤC VỚI</span>
              </div>

              {/* Google Register Button */}
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
                {googleLoading ? 'Đang kết nối Google...' : 'Đăng ký nhanh với Google'}
              </button>

              {/* Footer link to Login */}
              <div className="registration-footer">
                <span>Đã có tài khoản hội viên?</span>
                <Link to="/login" className="login-now-link">
                  Đăng nhập ngay
                </Link>
              </div>

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
              <h3 className="google-modal-title">Đăng ký bằng Google</h3>
              <p className="google-modal-subtitle">để trở thành hội viên Youth Fashion chỉ với 1 cú click</p>
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
                    <div className="google-account-email">Đăng ký bằng địa chỉ email Google bất kỳ</div>
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
                    {googleLoading ? 'Đang tạo tài khoản...' : 'Tiếp tục'}
                  </button>
                </div>
              </form>
            )}

            <div className="google-modal-footer">
              Bằng việc đăng ký bằng Google, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Youth Fashion.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
