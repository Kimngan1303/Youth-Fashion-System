import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Clock, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function PayOSPaymentPage() {
  const { orderCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useToast();
  const { setCart, removePurchasedItems } = useAuth();

  // Khởi tạo thông tin đơn thanh toán từ state hoặc sessionStorage
  const [paymentData, setPaymentData] = useState(() => {
    if (location.state?.paymentData) return location.state.paymentData;
    try {
      const raw = sessionStorage.getItem('yf_current_payos_payment');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (String(parsed.orderCode) === String(orderCode)) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  const [loading, setLoading] = useState(!paymentData);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  // Thời gian đếm ngược 5 phút (300 giây)
  const [timeLeft, setTimeLeft] = useState(() => {
    if (paymentData?.expiresAt) {
      const diff = Math.floor((paymentData.expiresAt - Date.now()) / 1000);
      return diff > 0 ? diff : 300;
    }
    return 300;
  });

  // Tải dữ liệu từ backend nếu người dùng F5 hoặc truy cập trực tiếp
  useEffect(() => {
    if (!paymentData && orderCode) {
      orderService.checkPayosStatus(orderCode)
        .then((res) => {
          if (res?.data) {
            const payosInfo = res.data.payosInfo || {};
            const restoredData = {
              orderCode,
              orderNumber: res.data.orderNumber || `YF-${orderCode}`,
              amount: res.data.amount || payosInfo.amount || 2000,
              accountNumber: payosInfo.accountNumber || 'VQRQANOVP2204',
              accountName: payosInfo.accountName || 'TRAN THI KIM NGAN',
              description: payosInfo.description || `Thanh toan YF${orderCode}`,
              bin: '970422',
              checkoutUrl: payosInfo.checkoutUrl,
              qrCode: payosInfo.qrCode,
              expiresAt: Date.now() + 300 * 1000,
            };
            setPaymentData(restoredData);
          }
        })
        .catch(() => {
          showError('Không tìm thấy thông tin đơn thanh toán');
          navigate('/checkout');
        })
        .finally(() => setLoading(false));
    }
  }, [orderCode, paymentData, navigate, showError]);

  // Bộ đếm ngược 5 phút từng giây (300 -> 0)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Tự động kiểm tra trạng thái thanh toán từ PayOS mỗi 2.5 giây
  useEffect(() => {
    if (!orderCode || timeLeft <= 0) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await orderService.checkPayosStatus(orderCode);
        if (!isMounted) return;

        if (res?.data?.status === 'PAID') {
          clearInterval(interval);
          showSuccess('Thanh toán thành công! Đang chuyển đến xác nhận đơn hàng...');
          try {
            const rawPending = sessionStorage.getItem('yf_pending_checkout_items');
            if (rawPending) {
              const pendingItems = JSON.parse(rawPending);
              if (removePurchasedItems) {
                removePurchasedItems(pendingItems);
              }
            }
          } catch (e) {}
          sessionStorage.removeItem('yf_current_payos_payment');
          navigate(`/order-success?orderCode=${orderCode}&orderNumber=${paymentData?.orderNumber || `YF-${orderCode}`}&status=PAID`);
        } else if (res?.data?.status === 'CANCELLED') {
          clearInterval(interval);
          handleCancel('Giao dịch đã được hủy trên hệ thống.');
        }
      } catch (e) {}
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderCode, timeLeft, paymentData, navigate, showSuccess]);

  // Xử lý khi hết hạn 5 phút: Hủy đơn, hoàn kho, về màn checkout
  const handleTimeout = async () => {
    try {
      if (orderCode) {
        await orderService.deleteOrder(orderCode);
        await orderService.deleteOrder(`YF-${orderCode}`);
      }
    } catch (e) {}

    cleanupAndRestoreCart();
    showError('Đã hết thời gian thanh toán (5 phút). Đơn hàng đã tự động hủy, các sản phẩm đã được giữ lại trong giỏ hàng.');
    navigate('/checkout');
  };

  // Xử lý khi người dùng bấm nút Huỷ: Hủy đơn, hoàn kho, về màn checkout
  const handleCancel = async (msg = 'Bạn đã hủy thanh toán đơn hàng qua PayOS.') => {
    try {
      if (orderCode) {
        await orderService.deleteOrder(orderCode);
        await orderService.deleteOrder(`YF-${orderCode}`);
      }
    } catch (e) {}

    cleanupAndRestoreCart();
    showInfo(msg);
    navigate('/checkout');
  };

  // Dọn dẹp session và khôi phục giỏ hàng
  const cleanupAndRestoreCart = () => {
    try {
      const rawDel = localStorage.getItem('yf_deleted_order_ids');
      const delList = rawDel ? JSON.parse(rawDel) : [];
      const digits = String(orderCode || '').replace(/\D/g, '');
      const newDel = Array.from(new Set([...delList, String(orderCode), `YF-${orderCode}`, digits]));
      localStorage.setItem('yf_deleted_order_ids', JSON.stringify(newDel));
    } catch (e) {}

    sessionStorage.removeItem('yf_pending_payos_order');
    sessionStorage.removeItem('yf_pending_order_code');
    sessionStorage.removeItem('yf_current_payos_payment');

    try {
      const cached = sessionStorage.getItem('yf_pending_checkout_items');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed.some((it) => it.isBuyNow)) {
            sessionStorage.setItem('yf_buy_now_item', JSON.stringify(parsed[0]));
          }
          if (setCart) setCart(parsed);
        }
      }
    } catch (e) {}
  };

  // Sao chép nội dung
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    showSuccess(`Đã sao chép ${fieldName}`);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft <= 60;

  // Dữ liệu hiển thị
  const accountNumber = paymentData?.accountNumber || 'VQRQANOVP2204';
  const accountName = paymentData?.accountName || 'TRAN THI KIM NGAN';
  const amount = paymentData?.amount || 2000;
  const description = paymentData?.description || `Thanh toan YF${orderCode}`;
  const bankName = 'Ngân hàng TMCP Quân đội';

  // URL mã QR VietQR chuẩn
  const qrImageUrl = paymentData?.qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(paymentData.qrCode)}`
    : `https://api.vietqr.io/image/970422-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;

  if (loading) {
    return (
      <div className="payos-loading-screen">
        <div className="payos-spinner"></div>
        <p className="payos-loading-text">Đang tải trang thanh toán VietQR PayOS...</p>
      </div>
    );
  }

  return (
    <div className="payos-page-root">
      {/* Top Header: Trắng, chuẩn 100% giao diện PayOS */}
      <header className="payos-page-header">
        <div className="payos-brand-left">
          <img
            src="/logo.png"
            alt="YOUTH FASHION"
            className="payos-yf-logo-img"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = 'flex';
              }
            }}
          />
          <div className="payos-yf-circle" style={{ display: 'none' }}>YF</div>
          <span className="payos-brand-text">YOUTH FASHION</span>
        </div>

        {/* Logo PayOS xanh góc phải */}
        <div className="payos-logo-right">
          <div className="payos-mascot-box">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="7" fill="#00A86B"/>
              <circle cx="11" cy="14" r="3.2" fill="white"/>
              <circle cx="21" cy="14" r="3.2" fill="white"/>
              <path d="M10 22C11.5 24 14 25 16 25C18 25 20.5 24 22 22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="payos-logo-text">payOS</span>
        </div>
      </header>

      {/* ĐỒNG HỒ ĐẾM NGƯỢC 5 PHÚT THAY VÀO VỊ TRÍ DÒNG CHỮ TĨNH */}
      <div className="payos-countdown-section">
        <div className={`payos-countdown-pill ${isUrgent ? 'urgent' : ''}`}>
          <Clock size={19} className={isUrgent ? 'clock-urgent' : 'clock-normal'} />
          <span className="countdown-label">Thời gian thanh toán còn lại:</span>
          <span className="countdown-digits">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
        <p className="countdown-hint">
          Nếu không hoàn tất chuyển khoản trong 5 phút, hệ thống sẽ tự động hủy đơn và quay về màn thanh toán.
        </p>
      </div>

      {/* Main Payment Card (Chuẩn 1:1 theo giao diện ảnh quét mã PayOS) */}
      <main className="payos-card-wrapper">
        <div className="payos-main-card">
          {/* Thanh Chi tiết đơn hàng */}
          <div className="payos-card-header">
            <span className="payos-order-title">Chi tiết đơn hàng</span>
            <button
              type="button"
              className="btn-toggle-details"
              onClick={() => setShowOrderDetails(!showOrderDetails)}
            >
              <span>{showOrderDetails ? 'Thu gọn' : 'Xem'}</span>
              {showOrderDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Chi tiết đơn hàng khi mở Xem */}
          {showOrderDetails && (
            <div className="payos-details-expanded">
              <div className="payos-detail-row">
                <span className="detail-lbl">Mã đơn hàng:</span>
                <span className="detail-val mono">{paymentData?.orderNumber || `YF-${orderCode}`}</span>
              </div>
              <div className="payos-detail-row">
                <span className="detail-lbl">Tổng số tiền:</span>
                <span className="detail-val price">{Number(amount).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          )}

          <div className="payos-card-body">
            {/* Lời nhắc quét mã bóng đèn */}
            <div className="payos-instruction-box">
              <span className="lightbulb-icon">💡</span>
              <p className="instruction-text">
                Mở App Ngân hàng bất kỳ để <strong>quét mã VietQR</strong> hoặc <strong>chuyển khoản</strong> chính xác số tiền bên dưới
              </p>
            </div>

            {/* Khung chia 2 cột: Cột trái VietQR PRO, Cột phải Thông tin ngân hàng */}
            <div className="payos-two-columns">
              {/* CỘT TRÁI: VIETQR PRO */}
              <div className="payos-col-left">
                {/* Logo VietQR PRO */}
                <div className="vietqr-pro-logo">
                  <span className="vqr-red">VIET</span>
                  <span className="vqr-green">QR</span>
                  <span className="vqr-pro-badge">PRO</span>
                </div>

                {/* QR Code Container */}
                <div className="qr-image-frame">
                  <img
                    src={qrImageUrl}
                    alt="VietQR Code"
                    className="qr-img-element"
                  />
                  <div className="qr-center-vqr-badge">
                    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                      <rect width="28" height="28" rx="6" fill="#ffffff" />
                      <path d="M6 8L14 20L22 8" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* napas 247 | MB */}
                <div className="napas-mb-row">
                  <span className="napas-tag">napas 247</span>
                  <span className="v-divider">|</span>
                  <div className="mb-tag">
                    <svg width="15" height="15" viewBox="0 0 36 36" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="18" cy="18" r="18" fill="#1B2A75"/>
                      <path d="M18 6L21.3 14H30L23 19.3L25.6 27.5L18 22.5L10.4 27.5L13 19.3L6 14H14.7L18 6Z" fill="#ED1C24"/>
                    </svg>
                    <span>MB</span>
                  </div>
                </div>

                {/* Nút Huỷ */}
                <div className="cancel-btn-wrap">
                  <button
                    type="button"
                    onClick={() => handleCancel()}
                    className="btn-payos-cancel"
                  >
                    Huỷ
                  </button>
                </div>
              </div>

              {/* CỘT PHẢI: Thông tin chuyển khoản */}
              <div className="payos-col-right">
                {/* Ngân hàng */}
                <div className="bank-info-row">
                  <div className="mb-circle-icon">
                    <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
                      <circle cx="18" cy="18" r="18" fill="#1B2A75"/>
                      <path d="M18 6L21.3 14H30L23 19.3L25.6 27.5L18 22.5L10.4 27.5L13 19.3L6 14H14.7L18 6Z" fill="#ED1C24"/>
                    </svg>
                  </div>
                  <div className="bank-texts">
                    <div className="field-label">Ngân hàng</div>
                    <div className="field-value font-bold">{bankName}</div>
                  </div>
                </div>

                {/* Chủ tài khoản */}
                <div className="info-field-group">
                  <div className="field-label">Chủ tài khoản:</div>
                  <div className="field-value font-bold uppercase">{accountName}</div>
                </div>

                {/* Số tài khoản */}
                <div className="info-field-row">
                  <div className="field-content">
                    <div className="field-label">Số tài khoản:</div>
                    <div className="field-value font-mono font-bold">{accountNumber}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(accountNumber, 'Số tài khoản')}
                    className="btn-copy-tag"
                  >
                    {copiedField === 'Số tài khoản' ? (
                      <span className="flex-center gap-1"><Check size={13} /> Đã chép</span>
                    ) : (
                      <span className="flex-center gap-1"><Copy size={13} /> Sao chép</span>
                    )}
                  </button>
                </div>

                {/* Số tiền */}
                <div className="info-field-row">
                  <div className="field-content">
                    <div className="field-label">Số tiền:</div>
                    <div className="field-value font-mono font-bold amount-highlight">
                      {Number(amount).toLocaleString('vi-VN')} vnd
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(amount, 'Số tiền')}
                    className="btn-copy-tag"
                  >
                    {copiedField === 'Số tiền' ? (
                      <span className="flex-center gap-1"><Check size={13} /> Đã chép</span>
                    ) : (
                      <span className="flex-center gap-1"><Copy size={13} /> Sao chép</span>
                    )}
                  </button>
                </div>

                {/* Nội dung */}
                <div className="info-field-row">
                  <div className="field-content break-word">
                    <div className="field-label">Nội dung:</div>
                    <div className="field-value font-mono font-bold desc-text">{description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(description, 'Nội dung')}
                    className="btn-copy-tag shrink-0"
                  >
                    {copiedField === 'Nội dung' ? (
                      <span className="flex-center gap-1"><Check size={13} /> Đã chép</span>
                    ) : (
                      <span className="flex-center gap-1"><Copy size={13} /> Sao chép</span>
                    )}
                  </button>
                </div>

                {/* Lưu ý chân thẻ */}
                <div className="note-footer-text">
                  Lưu ý : Nhập chính xác số tiền <strong>{Number(amount).toLocaleString('vi-VN')}</strong> khi chuyển khoản
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Scoped CSS Styles matching the PayOS Screenshot 100% */}
      <style>{`
        .payos-page-root {
          min-height: 100vh;
          background-color: #f3f4f6;
          color: #111827;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          padding-bottom: 50px;
        }

        /* Top Header */
        .payos-page-header {
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 12px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .payos-brand-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .payos-yf-logo-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
          border-radius: 50%;
        }

        .payos-yf-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: serif;
          font-weight: 900;
          font-size: 13px;
          color: #111827;
          letter-spacing: -0.5px;
        }

        .payos-brand-text {
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #111827;
        }

        .payos-logo-right {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .payos-mascot-box {
          display: flex;
          align-items: center;
        }

        .payos-logo-text {
          font-size: 18px;
          font-weight: 800;
          color: #00a86b;
          letter-spacing: -0.3px;
        }

        /* Countdown Section */
        .payos-countdown-section {
          max-width: 760px;
          margin: 22px auto 14px;
          text-align: center;
          padding: 0 16px;
        }

        .payos-countdown-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 26px;
          border-radius: 9999px;
          background: #ffffff;
          border: 1.5px solid #f59e0b;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
        }

        .payos-countdown-pill.urgent {
          background: #fef2f2;
          border-color: #f87171;
          animation: pulseBorder 1s infinite alternate;
        }

        @keyframes pulseBorder {
          from { box-shadow: 0 0 6px rgba(239, 68, 68, 0.2); }
          to { box-shadow: 0 0 14px rgba(239, 68, 68, 0.5); }
        }

        .clock-normal {
          color: #d97706;
        }

        .clock-urgent {
          color: #dc2626;
          animation: spinSmall 2s infinite linear;
        }

        .countdown-label {
          font-size: 13.5px;
          font-weight: 600;
          color: #4b5563;
        }

        .urgent .countdown-label {
          color: #991b1b;
        }

        .countdown-digits {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 20px;
          font-weight: 800;
          color: #d97706;
          letter-spacing: 0.05em;
        }

        .urgent .countdown-digits {
          color: #dc2626;
        }

        .countdown-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 6px;
        }

        /* Card Wrapper */
        .payos-card-wrapper {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .payos-main-card {
          background-color: #ffffff;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
          overflow: hidden;
        }

        .payos-card-header {
          padding: 14px 28px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .payos-order-title {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
        }

        .btn-toggle-details {
          font-size: 13.5px;
          color: #2563eb;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 3px;
          cursor: pointer;
          background: none;
          border: none;
        }

        .btn-toggle-details:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .payos-details-expanded {
          padding: 12px 28px;
          background-color: #f9fafb;
          border-bottom: 1px solid #f3f4f6;
          font-size: 13px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .payos-detail-row {
          display: flex;
          justify-content: space-between;
        }

        .detail-lbl {
          color: #6b7280;
        }

        .detail-val {
          font-weight: 600;
          color: #111827;
        }

        .detail-val.mono {
          font-family: monospace;
        }

        .detail-val.price {
          color: #059669;
          font-weight: 700;
        }

        .payos-card-body {
          padding: 24px 28px 32px;
        }

        /* Instruction Box */
        .payos-instruction-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 8px;
          padding: 11px 16px;
          margin-bottom: 24px;
        }

        .lightbulb-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .instruction-text {
          font-size: 13px;
          color: #1f2937;
          line-height: 1.45;
        }

        /* Two Columns */
        .payos-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          align-items: center;
        }

        /* Left Column */
        .payos-col-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .vietqr-pro-logo {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }

        .vqr-red {
          color: #e11d48;
        }

        .vqr-green {
          color: #059669;
        }

        .vqr-pro-badge {
          margin-left: 5px;
          background-color: #fbbf24;
          color: #111827;
          font-size: 10px;
          font-weight: 900;
          padding: 1px 6px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .qr-image-frame {
          position: relative;
          padding: 8px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
          width: 226px;
          height: 226px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-center-vqr-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
        }

        .qr-img-element {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 6px;
        }

        .napas-mb-row {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .napas-tag {
          color: #059669;
          letter-spacing: 0.03em;
        }

        .v-divider {
          color: #d1d5db;
        }

        .mb-tag {
          color: #1e3a8a;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .mb-star {
          font-size: 11px;
        }

        .cancel-btn-wrap {
          margin-top: 22px;
          width: 130px;
        }

        .btn-payos-cancel {
          width: 100%;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-payos-cancel:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        /* Right Column */
        .payos-col-right {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .bank-info-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mb-circle-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #1e3a8a;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 13px;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(30, 58, 138, 0.3);
        }

        .field-label {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .field-value {
          font-size: 14.5px;
          color: #111827;
        }

        .field-value.font-bold {
          font-weight: 700;
        }

        .field-value.font-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .field-value.uppercase {
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .field-value.amount-highlight {
          color: #111827;
          font-size: 15.5px;
          font-weight: 800;
        }

        .field-value.desc-text {
          font-size: 13px;
        }

        .info-field-group {
          display: flex;
          flex-direction: column;
        }

        .info-field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .field-content {
          display: flex;
          flex-direction: column;
        }

        .field-content.break-word {
          word-break: break-all;
          padding-right: 8px;
        }

        .btn-copy-tag {
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          background-color: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .btn-copy-tag:hover {
          background-color: #d1fae5;
          border-color: #6ee7b7;
        }

        .flex-center {
          display: flex;
          align-items: center;
        }

        .gap-1 {
          gap: 4px;
        }

        .shrink-0 {
          flex-shrink: 0;
        }

        .note-footer-text {
          font-size: 12px;
          color: #6b7280;
          margin-top: 6px;
          line-height: 1.4;
        }

        .note-footer-text strong {
          color: #111827;
        }

        /* Loading Screen */
        .payos-loading-screen {
          min-height: 100vh;
          background-color: #f3f4f6;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .payos-spinner {
          width: 36px;
          height: 36px;
          border: 3.5px solid #d1d5db;
          border-top-color: #059669;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .payos-loading-text {
          font-size: 14px;
          color: #4b5563;
          font-weight: 500;
        }

        /* Responsive Mobile */
        @media (max-width: 640px) {
          .payos-page-header {
            padding: 10px 18px;
          }

          .payos-two-columns {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .payos-card-body {
            padding: 18px 18px 24px;
          }

          .payos-card-header {
            padding: 12px 18px;
          }

          .payos-countdown-pill {
            padding: 6px 18px;
          }

          .countdown-digits {
            font-size: 17px;
          }
        }
      `}</style>
    </div>
  );
}
