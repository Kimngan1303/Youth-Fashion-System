import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';

const verifyEmailStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Montserrat:wght@500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  .verify-outer-container {
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

  .verify-content-box {
    display: flex;
    flex-direction: column;
    width: 960px;
    max-width: 100%;
  }

  .back-nav-link {
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

  .back-nav-link:hover {
    color: #111111;
    transform: translateX(-3px);
  }

  .verify-modal-card {
    box-sizing: border-box;
    width: 100%;
    min-height: 560px;
    background: #FFFFFF;
    border: 1px solid rgba(222, 216, 203, 0.6);
    box-shadow: 0px 25px 50px -12px rgba(0, 0, 0, 0.16);
    border-radius: 24px;
    position: relative;
    overflow: hidden;
    display: flex;
  }

  /* Left Editorial Banner */
  .verify-editorial-banner {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 48px;
    justify-content: space-between;
    position: relative;
    width: 420px;
    background: radial-gradient(143.16% 109.3% at 10% 15%, #F9F7F2 0%, #ECE6DB 100%);
    border-right: 1px solid rgba(222, 216, 203, 0.7);
    overflow: hidden;
    flex-shrink: 0;
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
  }

  .header-mini-logo {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    z-index: 2;
  }

  .mini-logo-text {
    font-family: 'Playfair Display', serif;
    font-size: 13px;
    letter-spacing: 2px;
    font-weight: 700;
    color: #111111;
  }

  .central-hero-statement {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    z-index: 2;
    margin: 40px 0;
  }

  .floating-emblem-badge {
    width: 64px;
    height: 64px;
    background: #FFFFFF;
    border: 1px solid #E5E0D8;
    box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.04);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }

  .hero-headline {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 32px;
    line-height: 40px;
    color: #111111;
    margin: 0;
  }

  .ornamental-divider {
    width: 48px;
    height: 2px;
    background-color: #B4A591;
    margin: 16px 0;
  }

  .banner-tagline {
    font-size: 13.5px;
    line-height: 22px;
    color: #57534E;
    margin: 0;
  }

  .banner-bottom-quote {
    z-index: 2;
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #78716C;
  }

  /* Right Form Area */
  .verify-form-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 56px;
    box-sizing: border-box;
  }

  .verify-heading-block {
    margin-bottom: 28px;
  }

  .verify-title {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 700;
    color: #111111;
    margin: 0 0 10px 0;
  }

  .verify-desc {
    font-size: 13.5px;
    line-height: 22px;
    color: #57534E;
    margin: 0;
  }

  .email-highlight-box {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #F9F7F2;
    border: 1px solid #E7E0D2;
    padding: 8px 14px;
    border-radius: 8px;
    margin-top: 10px;
    font-weight: 600;
    font-size: 13.5px;
    color: #1C1917;
    word-break: break-all;
  }

  /* 6 OTP Input Boxes */
  .otp-inputs-grid {
    display: flex;
    gap: 12px;
    justify-content: flex-start;
    margin: 28px 0 20px 0;
  }

  .otp-single-box {
    width: 52px;
    height: 60px;
    border: 1.5px solid #D6D3D1;
    border-radius: 12px;
    text-align: center;
    font-size: 24px;
    font-weight: 700;
    font-family: monospace;
    color: #111111;
    background: #FFFFFF;
    transition: all 0.2s ease;
    outline: none;
    box-sizing: border-box;
  }

  .otp-single-box:focus {
    border-color: #111111;
    box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.1);
    background: #FCFBF9;
  }

  .otp-single-box.filled {
    border-color: #78716C;
    background: #FAF9F6;
  }

  /* Submit Button */
  .btn-verify-cta {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 46px;
    background: #111111;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 12.5px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #FFFFFF;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
    margin-top: 10px;
  }

  .btn-verify-cta:hover:not(:disabled) {
    background: #282523;
  }

  .btn-verify-cta:active:not(:disabled) {
    transform: scale(0.99);
  }

  .btn-verify-cta:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  /* Resend & Footer */
  .resend-action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #F0ECE4;
    font-size: 13px;
    color: #78716C;
  }

  .btn-resend-trigger {
    background: none;
    border: none;
    padding: 0;
    font-weight: 600;
    font-size: 13px;
    color: #111111;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color 0.2s ease;
  }

  .btn-resend-trigger:hover:not(:disabled) {
    color: #78716C;
  }

  .btn-resend-trigger:disabled {
    color: #A8A29E;
    text-decoration: none;
    cursor: not-allowed;
  }

  .alert-banner {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 20px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .alert-error {
    background: #FEF2F2;
    border: 1px solid #FCA5A5;
    color: #991B1B;
  }

  .alert-success {
    background: #F0FDF4;
    border: 1px solid #86EFAC;
    color: #166534;
  }

  @media (max-width: 860px) {
    .verify-modal-card {
      flex-direction: column;
      height: auto;
    }
    .verify-editorial-banner {
      width: 100%;
      padding: 32px 24px;
      border-right: none;
      border-bottom: 1px solid rgba(222, 216, 203, 0.7);
    }
    .verify-form-area {
      padding: 32px 24px;
    }
    .otp-single-box {
      width: 44px;
      height: 52px;
      font-size: 20px;
    }
  }
`;

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Lấy email từ route state hoặc query parameter
  const searchParams = new URLSearchParams(location.search);
  const emailParam = location.state?.email || searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const inputRefs = useRef([]);

  // Timer đếm ngược 60 giây cho Resend OTP
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Focus ô đầu tiên khi trang mở ra
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index, value) => {
    // Chỉ cho phép nhập số
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newValues = [...otpValues];

    if (cleanVal.length > 1) {
      // Người dùng paste hoặc gõ nhanh chuỗi
      const digits = cleanVal.slice(0, 6).split('');
      digits.forEach((d, i) => {
        if (index + i < 6) {
          newValues[index + i] = d;
        }
      });
      setOtpValues(newValues);
      const nextIndex = Math.min(5, index + digits.length);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
      return;
    }

    newValues[index] = cleanVal;
    setOtpValues(newValues);

    // Tự động chuyển focus sang ô tiếp theo
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const digits = pastedData.split('');
    const newValues = [...otpValues];
    digits.forEach((d, i) => {
      newValues[i] = d;
    });
    setOtpValues(newValues);
    const targetIdx = Math.min(5, digits.length);
    inputRefs.current[targetIdx]?.focus();
  };

  const fullOtp = otpValues.join('');

  // Submit xác thực OTP
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email) {
      const msg = 'Không tìm thấy địa chỉ email cần xác thực. Vui lòng quay lại trang Đăng ký.';
      setErrorMessage(msg);
      showError(msg);
      return;
    }

    if (fullOtp.length !== 6) {
      const msg = 'Vui lòng nhập đầy đủ 6 chữ số mã OTP.';
      setErrorMessage(msg);
      showError(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyEmail({ email: email.trim().toLowerCase(), otp: fullOtp });
      const successMsg = res.message || 'Xác thực email thành công! Đang chuyển đến trang đăng nhập...';
      setSuccessMessage(successMsg);
      showSuccess(successMsg);
      setTimeout(() => {
        navigate('/login', { state: { registeredEmail: email } });
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Xác thực OTP thất bại. Vui lòng thử lại!';
      setErrorMessage(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || resending) return;
    setErrorMessage('');
    setSuccessMessage('');

    if (!email) {
      showError('Không tìm thấy email cần gửi lại mã.');
      return;
    }

    setResending(true);
    try {
      const res = await authService.resendVerificationOTP({ email: email.trim().toLowerCase() });
      const msg = res.message || 'Mã OTP mới đã được gửi về email của bạn!';
      setSuccessMessage(msg);
      showSuccess(msg);
      setCooldownSeconds(60);
      setOtpValues(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-outer-container">
      <style>{verifyEmailStyles}</style>

      <div className="verify-content-box">
        {/* Nút Quay Lại */}
        <Link to="/register" className="back-nav-link">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          QUAY LẠI ĐĂNG KÝ
        </Link>

        <div className="verify-modal-card">
          {/* BÊN TRÁI: Editorial Banner */}
          <div className="verify-editorial-banner">
            <div className="concentric-circle-1" />
            <div className="concentric-circle-2" />

            <div className="header-mini-logo">
              <img src="/logo.png" alt="Youth Fashion Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              <span className="mini-logo-text">YOUTH FASHION</span>
            </div>

            <div className="central-hero-statement">
              <div className="floating-emblem-badge">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h1 className="hero-headline">Xác thực Email</h1>
              <div className="ornamental-divider" />
              <p className="banner-tagline">
                Bảo vệ tài khoản và mở khóa đầy đủ đặc quyền thành viên của Youth Fashion bằng mã bảo mật 6 số.
              </p>
            </div>

            <span className="banner-bottom-quote">ATELIER SECURITY &bull; EST. 2026</span>
          </div>

          {/* BÊN PHẢI: Form Xác thực OTP */}
          <div className="verify-form-area">
            <div className="verify-heading-block">
              <h2 className="verify-title">Verify Your Email</h2>
              <p className="verify-desc">
                Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến hòm thư:
              </p>
              {email ? (
                <div className="email-highlight-box">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span>{email}</span>
                </div>
              ) : (
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="email"
                    placeholder="Nhập email của bạn..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '320px',
                      padding: '8px 12px',
                      border: '1px solid #D6D3D1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Thông báo Alert inline */}
            {errorMessage && (
              <div className="alert-banner alert-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="alert-banner alert-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerify}>
              <label style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#78716C', display: 'block' }}>
                Nhập mã 6 chữ số (Enter the 6-digit code):
              </label>

              {/* 6 ô OTP */}
              <div className="otp-inputs-grid" onPaste={handlePaste}>
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={idx === 0 ? 6 : 1}
                    value={val}
                    className={`otp-single-box ${val ? 'filled' : ''}`}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn-verify-cta"
                disabled={loading || fullOtp.length !== 6}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang xác thực...
                  </>
                ) : (
                  'Xác thực tài khoản'
                )}
              </button>
            </form>

            {/* Khu vực Gửi lại mã */}
            <div className="resend-action-row">
              <span>Chưa nhận được mã OTP?</span>
              {cooldownSeconds > 0 ? (
                <span style={{ color: '#A8A29E', fontWeight: 500 }}>
                  Gửi lại sau <strong>{cooldownSeconds}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="btn-resend-trigger"
                  disabled={resending}
                >
                  {resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                </button>
              )}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#A8A29E' }}>
                Đã có tài khoản?{' '}
                <Link to="/login" style={{ color: '#1C1917', fontWeight: 600, textDecoration: 'underline' }}>
                  Đăng nhập
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
