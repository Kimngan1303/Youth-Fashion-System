import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

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
  }

  .btn-google-login:hover {
    background: #F5F5F4;
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
  const { login, logout, user, isAuthenticated, loading } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('CUSTOMER'); // 'CUSTOMER' or 'EMPLOYEE'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
                <a href="#forgot" className="forgot-password-link">
                  Quên mật khẩu?
                </a>
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
            <button type="button" className="btn-google-login">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Google
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
    </div>
  );
}
