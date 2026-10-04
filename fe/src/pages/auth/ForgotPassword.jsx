import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';

const forgotPasswordStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Montserrat:wght@500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  .forgot-page-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 30px 20px;
    min-height: 100vh;
    width: 100%;
    background-color: #EDE8DF;
    box-sizing: border-box;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .forgot-container {
    display: flex;
    flex-direction: column;
    width: 1000px;
    max-width: 100%;
  }

  /* Top Navigation Button */
  .back-nav-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #44403C;
    margin-bottom: 20px;
    align-self: flex-start;
    padding: 6px 0;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .back-nav-action:hover {
    color: #111111;
    transform: translateX(-4px);
  }

  /* Main Card */
  .forgot-modal-card {
    box-sizing: border-box;
    width: 100%;
    min-height: 640px;
    background: #FFFFFF;
    border: 1px solid rgba(222, 216, 203, 0.7);
    box-shadow: 0px 25px 60px -12px rgba(28, 25, 23, 0.15), 0px 10px 24px -6px rgba(0, 0, 0, 0.04);
    border-radius: 28px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: row;
  }

  /* Left Editorial Banner Section */
  .editorial-banner-section {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 48px 44px;
    justify-content: space-between;
    position: relative;
    width: 480px;
    background: radial-gradient(143.16% 109.3% at 10% 15%, #F9F7F2 0%, #ECE6DB 100%);
    border-right: 1px solid rgba(222, 216, 203, 0.75);
    overflow: hidden;
    flex-shrink: 0;
  }

  .concentric-circle-1 {
    position: absolute;
    width: 340px;
    height: 340px;
    left: -100px;
    top: -100px;
    border: 1px solid rgba(180, 165, 145, 0.35);
    border-radius: 9999px;
    pointer-events: none;
    z-index: 0;
  }

  .concentric-circle-2 {
    position: absolute;
    width: 480px;
    height: 480px;
    right: -80px;
    bottom: -130px;
    border: 1px solid rgba(180, 165, 145, 0.35);
    border-radius: 9999px;
    pointer-events: none;
    z-index: 0;
  }

  .banner-top-brand {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    z-index: 2;
  }

  .brand-dot {
    width: 7px;
    height: 7px;
    background: #1C1917;
    border-radius: 9999px;
  }

  .brand-text {
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: #1C1917;
  }

  .central-hero-statement {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    z-index: 2;
    text-align: center;
    padding: 20px 0;
  }

  .floating-emblem-badge {
    position: relative;
    width: 82px;
    height: 82px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(248, 246, 240, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(6px);
    border-radius: 9999px;
    box-shadow: 0px 10px 25px -4px rgba(120, 110, 95, 0.16);
  }

  .floating-emblem-img {
    width: 58px;
    height: 58px;
    object-fit: contain;
  }

  .hero-headline {
    font-family: 'Playfair Display', Georgia, serif;
    font-weight: 400;
    font-size: 34px;
    line-height: 42px;
    letter-spacing: -0.6px;
    color: #1C1917;
    margin: 0 0 16px 0;
  }

  .banner-tagline {
    font-size: 13.5px;
    line-height: 22px;
    color: #57534E;
    max-width: 320px;
    margin: 0 0 24px 0;
  }

  .ornamental-line {
    width: 50px;
    height: 1.5px;
    background: #D6D3D1;
  }

  .banner-footer-quote {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #78716C;
    z-index: 2;
    font-weight: 500;
  }

  /* Right Form Area */
  .forgot-form-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 50px 54px;
    background: #FFFFFF;
    box-sizing: border-box;
    position: relative;
  }

  .form-inner-wrapper {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
  }

  .form-brand-wordmark {
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
    font-size: 12.5px;
    line-height: 16px;
    letter-spacing: 4.8px;
    text-transform: uppercase;
    color: #1C1917;
    margin-bottom: 8px;
  }

  .form-headline {
    font-family: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
    font-weight: 400;
    font-size: 32px;
    line-height: 40px;
    letter-spacing: -0.5px;
    color: #1C1917;
    margin: 0 0 10px 0;
  }

  .form-instruction {
    font-size: 13.5px;
    line-height: 21px;
    color: #78716C;
    margin: 0 0 24px 0;
  }

  /* Input Elements */
  .input-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: #44403C;
    margin-bottom: 8px;
    display: block;
  }

  .custom-input-box {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .input-icon {
    position: absolute;
    left: 14px;
    width: 18px;
    height: 18px;
    color: #78716C;
    pointer-events: none;
    transition: color 0.2s ease;
  }

  .custom-input {
    width: 100%;
    height: 48px;
    padding: 10px 14px 10px 42px;
    border: 1px solid #D6D3D1;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1C1917;
    background: #FFFFFF;
    box-sizing: border-box;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .custom-input:focus {
    outline: none;
    border-color: #1C1917;
    box-shadow: 0 0 0 3px rgba(28, 25, 23, 0.08);
  }

  .custom-input::placeholder {
    color: #A8A29E;
  }

  .input-trailing-btn {
    position: absolute;
    right: 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #78716C;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
  }

  .input-trailing-btn:hover {
    color: #111111;
  }

  .helper-text {
    font-size: 12px;
    line-height: 18px;
    color: #78716C;
    margin-top: 8px;
    margin-bottom: 22px;
  }

  /* Buttons */
  .btn-submit-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 48px;
    background: #111111;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .btn-submit-action:hover:not(:disabled) {
    background: #262626;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.3);
  }

  .btn-submit-action:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  /* Bottom auxiliary links */
  .auth-links-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid #F5F5F4;
    font-size: 12.5px;
    color: #78716C;
  }

  .auth-link-bold {
    color: #1C1917;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    margin-left: 4px;
    transition: color 0.2s ease;
  }

  .auth-link-bold:hover {
    color: #000000;
  }

  /* OTP Inputs Grid for Step 2 */
  .otp-grid {
    display: flex;
    gap: 8px;
    margin: 12px 0 20px 0;
    justify-content: space-between;
  }

  .otp-box {
    width: 48px;
    height: 52px;
    border: 1.5px solid #D6D3D1;
    border-radius: 8px;
    text-align: center;
    font-size: 22px;
    font-weight: 700;
    font-family: monospace;
    color: #111111;
    background: #FAFAF9;
    transition: all 0.2s ease;
  }

  .otp-box:focus {
    outline: none;
    border-color: #111111;
    background: #FFFFFF;
    box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.08);
  }

  .otp-box.filled {
    border-color: #44403C;
    background: #FFFFFF;
  }

  /* Alert Banners */
  .alert-banner {
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 12.5px;
    line-height: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
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

  .resend-action-area {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
    font-size: 12px;
    color: #78716C;
  }

  .btn-resend-inline {
    background: transparent;
    border: none;
    color: #111111;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    font-size: 12px;
    padding: 0;
  }

  .btn-resend-inline:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .email-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #F5F5F4;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12.5px;
    color: #292524;
    font-weight: 500;
    margin-bottom: 18px;
    border: 1px solid #E7E5E4;
  }

  /* Responsive styles */
  @media (max-width: 900px) {
    .forgot-modal-card {
      flex-direction: column;
      border-radius: 20px;
    }

    .editorial-banner-section {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid rgba(222, 216, 203, 0.75);
      padding: 36px 24px;
    }

    .forgot-form-section {
      padding: 40px 24px;
    }
  }
`;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Step 1: Request OTP, Step 2: Enter OTP & Set New Password, Step 3: Success Completed
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Step 2 States: OTP & Passwords
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resend OTP countdown
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  const otpInputRefs = useRef([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Handle Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await authService.forgotPassword({ email: email.trim() });
      setLoading(false);
      showSuccess(res.message || 'Mã xác thực OTP đã được gửi đến email của bạn.');
      setSuccessMessage('Mã OTP 6 chữ số đã được gửi đến email của bạn.');
      setCountdown(60);
      setStep(2);
      // Auto focus first OTP input box after rendering
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.';
      setErrorMessage(msg);
      showError(msg);
    }
  };

  // Handle OTP Inputs
  const handleOtpChange = (index, value) => {
    // Only accept numeric chars
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...otpValues];
      updated[index] = '';
      setOtpValues(updated);
      return;
    }

    const updated = [...otpValues];
    // Handle paste or typing single/multiple
    if (cleaned.length > 1) {
      const pastedChars = cleaned.slice(0, 6).split('');
      pastedChars.forEach((ch, idx) => {
        if (index + idx < 6) {
          updated[index + idx] = ch;
        }
      });
      setOtpValues(updated);
      const nextFocus = Math.min(index + pastedChars.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    updated[index] = cleaned[cleaned.length - 1];
    setOtpValues(updated);

    if (index < 5 && cleaned) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const updated = [...otpValues];
    pasteData.split('').forEach((ch, idx) => {
      if (idx < 6) updated[idx] = ch;
    });
    setOtpValues(updated);
    const focusTarget = Math.min(pasteData.length, 5);
    otpInputRefs.current[focusTarget]?.focus();
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setErrorMessage('');
    try {
      const res = await authService.forgotPassword({ email: email.trim() });
      setResending(false);
      setCountdown(60);
      showSuccess(res.message || 'Mã OTP mới đã được gửi đến email của bạn.');
      setSuccessMessage('Mã OTP mới đã được gửi.');
    } catch (err) {
      setResending(false);
      const msg = err.response?.data?.message || err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.';
      setErrorMessage(msg);
      showError(msg);
    }
  };

  // Handle Step 2: Reset Password Submit
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Vui lòng nhập đầy đủ 6 chữ số mã OTP');
      return;
    }
    if (!newPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    // Password complex regex check
    const complexRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/;
    if (!complexRegex.test(newPassword)) {
      setErrorMessage('Mật khẩu mới phải gồm chữ hoa, chữ thường, số và ký tự đặc biệt (VD: Youth@2026)');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không khớp');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await authService.resetPassword({
        email: email.trim(),
        otp: fullOtp,
        new_password: newPassword,
      });

      setLoading(false);
      showSuccess(res.message || 'Đặt lại mật khẩu thành công!');
      setStep(3); // Success step
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || err.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại OTP.';
      setErrorMessage(msg);
      showError(msg);
    }
  };

  return (
    <div className="forgot-page-wrapper">
      <style>{forgotPasswordStyles}</style>

      <div className="forgot-container">
        {/* Top Return link */}
        <Link to="/login" className="back-nav-action">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          QUAY LẠI
        </Link>

        {/* Rounded Card */}
        <div className="forgot-modal-card">
          {/* LEFT: Editorial Brand Banner */}
          <div className="editorial-banner-section">
            <div className="concentric-circle-1" />
            <div className="concentric-circle-2" />

            <div className="banner-top-brand">
              <span className="brand-dot" />
              <span className="brand-text">YOUTH FASHION</span>
            </div>

            <div className="central-hero-statement">
              <div className="floating-emblem-badge">
                <img
                  src="/logo.png"
                  alt="Youth Fashion Emblem"
                  className="floating-emblem-img"
                />
              </div>

              <h1 className="hero-headline">Quên Mật Khẩu</h1>
              <p className="banner-tagline">
                Biến ý tưởng sáng tạo thành phong cách sống vượt thời gian cùng đặc quyền thành viên Youth Fashion.
              </p>
              <div className="ornamental-line" />
            </div>

            <div className="banner-footer-quote">
              &copy; 2026 YOUTH FASHION
            </div>
          </div>

          {/* RIGHT: Forgot Password Form Area */}
          <div className="forgot-form-section">
            <div className="form-inner-wrapper">
              <span className="form-brand-wordmark">Y O U T H &nbsp; F A S H I O N</span>

              {step === 1 && (
                <>
                  <h2 className="form-headline">Quên Mật Khẩu?</h2>
                  <p className="form-instruction">
                    Nhập địa chỉ email liên kết để khôi phục mật khẩu tài khoản Youth Fashion của quý khách.
                  </p>

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

                  <form onSubmit={handleSendOTP}>
                    <label className="input-label" htmlFor="forgot-email">
                      ĐỊA CHỈ EMAIL
                    </label>

                    <div className="custom-input-box">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        id="forgot-email"
                        type="email"
                        className="custom-input"
                        placeholder="quykhach@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                        required
                        disabled={loading}
                      />
                    </div>

                    <p className="helper-text">
                      Chúng tôi sẽ gửi một liên kết bảo mật đến hộp thư của quý khách.
                    </p>

                    <button
                      type="submit"
                      className="btn-submit-action"
                      disabled={loading || !email.trim()}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          ĐANG XỬ LÝ...
                        </>
                      ) : (
                        <>
                          GỬI OTP &rarr;
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="form-headline">Thiết Lập Mật Khẩu Mới</h2>
                  <p className="form-instruction" style={{ marginBottom: '14px' }}>
                    Nhập mã xác thực OTP 6 chữ số và mật khẩu mới cho tài khoản của quý khách.
                  </p>

                  <div className="email-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setErrorMessage('');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#78716C',
                        cursor: 'pointer',
                        fontSize: '11px',
                        textDecoration: 'underline',
                        marginLeft: '4px',
                      }}
                    >
                      Đổi email
                    </button>
                  </div>

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

                  <form onSubmit={handleResetPassword}>
                    <label className="input-label">MÃ XÁC THỰC OTP (6 CHỮ SỐ)</label>
                    <div className="otp-grid" onPaste={handleOtpPaste}>
                      {otpValues.map((val, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={idx === 0 ? 6 : 1}
                          value={val}
                          className={`otp-box ${val ? 'filled' : ''}`}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          disabled={loading}
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>

                    <div className="resend-action-area" style={{ marginBottom: '18px' }}>
                      <span>Chưa nhận được mã OTP?</span>
                      {countdown > 0 ? (
                        <span style={{ color: '#78716C', fontWeight: 500 }}>
                          Gửi lại sau <strong>{countdown}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-resend-inline"
                          onClick={handleResendOtp}
                          disabled={resending}
                        >
                          {resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                        </button>
                      )}
                    </div>

                    {/* New Password */}
                    <div style={{ marginBottom: '14px' }}>
                      <label className="input-label">MẬT KHẨU MỚI</label>
                      <div className="custom-input-box">
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="custom-input"
                          placeholder="Tối thiểu 6 ký tự (VD: Youth@2026)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="input-trailing-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? (
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div style={{ marginBottom: '22px' }}>
                      <label className="input-label">XÁC NHẬN MẬT KHẨU MỚI</label>
                      <div className="custom-input-box">
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="custom-input"
                          placeholder="Nhập lại mật khẩu mới"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="input-trailing-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showConfirmPassword ? (
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-action"
                      disabled={loading || otpValues.join('').length !== 6 || !newPassword || !confirmPassword}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          ĐANG CẬP NHẬT...
                        </>
                      ) : (
                        <>
                          ĐẶT LẠI MẬT KHẨU &rarr;
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {step === 3 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '9999px',
                      background: '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px auto',
                      color: '#166534',
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h2 className="form-headline" style={{ marginBottom: '12px' }}>
                    Thành Công!
                  </h2>
                  <p className="form-instruction" style={{ marginBottom: '28px' }}>
                    Mật khẩu tài khoản của quý khách đã được cập nhật an toàn. Quý khách có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.
                  </p>

                  <button
                    type="button"
                    className="btn-submit-action"
                    onClick={() => navigate('/login')}
                  >
                    ĐĂNG NHẬP NGAY &rarr;
                  </button>
                </div>
              )}

              {/* Bottom links */}
              <div className="auth-links-footer">
                <div>
                  Đã nhớ lại mật khẩu?
                  <Link to="/login" className="auth-link-bold">
                    Đăng nhập ngay
                  </Link>
                </div>
                <div>
                  Chưa có tài khoản hội viên?
                  <Link to="/register" className="auth-link-bold">
                    Đăng ký tài khoản ngay
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
