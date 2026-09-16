import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

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
    height: 670px;
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
    height: 668px;
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
    width: 78px;
    height: 78px;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FAF8F4;
    border-radius: 9999px;
    box-shadow: 0px 8px 20px -4px rgba(120, 110, 95, 0.16);
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
    padding: 44px 56px;
    position: absolute;
    height: 668px;
    left: 481px;
    width: calc(100% - 481px);
    top: 1px;
    background: #FFFFFF;
    box-sizing: border-box;
  }

  .form-inner-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
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
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Client-side validations
    if (!agreeTerms) {
      setErrorMessage('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Mật khẩu phải có tối thiểu 8 ký tự.');
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
      setSuccessMessage('Đăng ký thành công! Đang chuyển hướng sang trang đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
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
              <div className="mini-logo-dot" />
              <span className="mini-logo-text">YOUTH FASHION</span>
            </div>

            {/* Central hero statement */}
            <div className="central-hero-statement">
              <div className="floating-emblem-badge">
                <svg viewBox="0 0 80 80" width="76" height="76">
                  <circle cx="40" cy="40" r="37" fill="#F8F6F0" stroke="#DDD7CC" strokeWidth="1.2" />
                  <circle cx="40" cy="40" r="31" fill="none" stroke="#22201E" strokeWidth="1.4" />
                  <circle cx="40" cy="40" r="27.5" fill="none" stroke="#22201E" strokeWidth="0.8" />
                  <text
                    x="40"
                    y="48"
                    textAnchor="middle"
                    fontFamily="'Playfair Display', serif"
                    fontSize="23"
                    fontWeight="600"
                    fill="#1C1917"
                    letterSpacing="-0.5"
                  >
                    YF
                  </text>
                </svg>
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
                        placeholder="Tối thiểu 8 ký tự"
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
    </div>
  );
}
