import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Check, Lock, ShieldCheck, RefreshCw, Tag, ChevronDown, 
  ArrowLeft, Sparkles, User, Ticket, AlertCircle, X, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { voucherService } from '../../services/voucherService';
import { orderService } from '../../services/orderService';
import { cartService } from '../../services/cartService';

const VIETNAM_PROVINCES = [
  {
    name: 'Hà Nội',
    districts: [
      { name: 'Quận Hoàn Kiếm', wards: ['Phường Tràng Tiền', 'Phường Hàng Bạc', 'Phường Hàng Trống', 'Phường Cửa Đông'] },
      { name: 'Quận Ba Đình', wards: ['Phường Điện Biên', 'Phường Đội Cấn', 'Phường Liễu Giai', 'Phường Kim Mã'] },
      { name: 'Quận Cầu Giấy', wards: ['Phường Dịch Vọng', 'Phường Yên Hòa', 'Phường Trung Hòa', 'Phường Mai Dịch'] },
      { name: 'Quận Đống Đa', wards: ['Phường Láng Hạ', 'Phường Ô Chợ Dừa', 'Phường Nam Đồng', 'Phường Cát Linh'] },
      { name: 'Quận Hai Bà Trưng', wards: ['Phường Lê Đại Hành', 'Phường Bách Khoa', 'Phường Phố Huế'] },
    ],
  },
  {
    name: 'TP. Hồ Chí Minh',
    districts: [
      { name: 'Quận 1', wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Đa Kao', 'Phường Tân Định'] },
      { name: 'Quận 3', wards: ['Phường Võ Thị Sáu', 'Phường 1', 'Phường 2', 'Phường 3'] },
      { name: 'TP. Thủ Đức', wards: ['Phường Thảo Điền', 'Phường An Phú', 'Phường Hiệp Phú', 'Phường Linh Chiểu'] },
      { name: 'Quận 7', wards: ['Phường Tân Phong', 'Phường Phú Mỹ', 'Phường Tân Phú'] },
    ],
  },
  {
    name: 'Đà Nẵng',
    districts: [
      { name: 'Quận Hải Châu', wards: ['Phường Hải Châu I', 'Phường Thạch Thang', 'Phường Nam Dương'] },
      { name: 'Quận Sơn Trà', wards: ['Phường An Hải Bắc', 'Phường Phước Mỹ'] },
    ],
  },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, cart, setCart } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  // 1. Lấy sản phẩm được chọn từ giỏ hàng
  const checkoutItems = useMemo(() => {
    const list = cart || [];
    const selected = list.filter((i) => i.selected);
    return selected.length > 0 ? selected : list;
  }, [cart]);

  // 2. Voucher & Ghi chú từ Giỏ hàng chuyển sang
  const [appliedVoucher, setAppliedVoucher] = useState(() => {
    if (location.state?.appliedVoucher) return location.state.appliedVoucher;
    try {
      const saved = sessionStorage.getItem('yf_checkout_voucher');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [availableVouchers, setAvailableVouchers] = useState(() => voucherService.getCustomerVouchers());
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [inputVoucherCode, setInputVoucherCode] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  // Form Thông tin Người nhận
  const [fullName, setFullName] = useState(() => user?.full_name || 'Hoàng Kim Anh');
  const [phone, setPhone] = useState(() => user?.phone || '0918 223 999');
  const [email, setEmail] = useState(() => user?.email || 'kimanh.hoang@atelier-couture.vn');
  const [notifySchedule, setNotifySchedule] = useState(true);

  // Form Địa chỉ
  const [selectedProvince, setSelectedProvince] = useState('Hà Nội');
  const [selectedDistrict, setSelectedDistrict] = useState('Quận Hoàn Kiếm');
  const [selectedWard, setSelectedWard] = useState('Phường Tràng Tiền');
  const [addressDetail, setAddressDetail] = useState(
    'Căn Hộ Penthouse 1802, Tòa Nhà Heritage Plaza, 15 Tràng Tiền'
  );
  const [orderNote, setOrderNote] = useState(() => {
    return (
      location.state?.orderNote ||
      sessionStorage.getItem('yf_checkout_note') ||
      ''
    );
  });

  // Phương thức vận chuyển & Thanh toán
  const [shippingMethod, setShippingMethod] = useState('EXPRESS'); // 'EXPRESS' | 'STANDARD'
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'PAYOS'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cập nhật danh sách quận/huyện theo tỉnh/thành
  const currentProvinceData = useMemo(() => {
    return VIETNAM_PROVINCES.find((p) => p.name === selectedProvince) || VIETNAM_PROVINCES[0];
  }, [selectedProvince]);

  const currentDistricts = currentProvinceData.districts;
  const currentWards = useMemo(() => {
    const d = currentDistricts.find((item) => item.name === selectedDistrict);
    return d ? d.wards : (currentDistricts[0]?.wards || []);
  }, [currentDistricts, selectedDistrict]);

  const handleProvinceChange = (e) => {
    const newProv = e.target.value;
    setSelectedProvince(newProv);
    const pData = VIETNAM_PROVINCES.find((p) => p.name === newProv) || VIETNAM_PROVINCES[0];
    setSelectedDistrict(pData.districts[0]?.name || '');
    setSelectedWard(pData.districts[0]?.wards[0] || '');
  };

  const handleDistrictChange = (e) => {
    const newDist = e.target.value;
    setSelectedDistrict(newDist);
    const dData = currentDistricts.find((item) => item.name === newDist);
    setSelectedWard(dData?.wards[0] || '');
  };

  // Tính toán Tổng giá trị đơn hàng
  const totalItemsCount = checkoutItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const rawProductTotal = checkoutItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  let voucherDiscount = 0;
  if (appliedVoucher && rawProductTotal > 0) {
    if (appliedVoucher.minOrder && rawProductTotal < appliedVoucher.minOrder) {
      voucherDiscount = 0;
    } else if (appliedVoucher.discountPercent) {
      let percentVal = Math.round((rawProductTotal * appliedVoucher.discountPercent) / 100);
      if (appliedVoucher.maxDiscount) {
        percentVal = Math.min(percentVal, appliedVoucher.maxDiscount);
      }
      voucherDiscount = percentVal;
    } else if (appliedVoucher.discountAmount) {
      voucherDiscount = Math.min(rawProductTotal, appliedVoucher.discountAmount);
    }
  }

  // Giá trị tính toán chuẩn khớp với giao diện thiết kế
  const finalTotal = Math.max(0, rawProductTotal - voucherDiscount);
  const vatAmount = Math.round((finalTotal * 8) / 108); // Thuế VAT 8% bao gồm trong tổng tiền
  
  // Tính tổng tiết kiệm
  const totalOriginalSaving = checkoutItems.reduce((sum, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return sum + (item.originalPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0) + voucherDiscount;

  // Áp dụng Voucher
  const handleApplyVoucherCode = async (codeToApply) => {
    const code = String(codeToApply || inputVoucherCode).trim().toUpperCase();
    if (!code) {
      showError('Vui lòng nhập mã ưu đãi');
      return;
    }

    setIsApplyingVoucher(true);
    try {
      const res = await voucherService.applyVoucherApi(code, rawProductTotal);
      if (res?.status && res?.data) {
        const { voucher, discountAmount } = res.data;
        const applied = {
          code: voucher.code,
          discountAmount: discountAmount || 0,
          discountPercent: voucher.discountPercent || 0,
          maxDiscount: voucher.maxDiscount || 0,
          minOrder: voucher.minOrder || 0,
          title: voucher.name || voucher.title,
        };
        setAppliedVoucher(applied);
        sessionStorage.setItem('yf_checkout_voucher', JSON.stringify(applied));
        showSuccess(`Đã áp dụng mã ${voucher.code}!`);
        setIsVoucherModalOpen(false);
      } else {
        showError(res?.message || 'Mã ưu đãi không hợp lệ');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Mã ưu đãi không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    sessionStorage.removeItem('yf_checkout_voucher');
    showInfo('Đã gỡ mã ưu đãi');
  };

  // Lắng nghe sự kiện nếu khách bấm nút "Hủy thanh toán" trên PayOS
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isCanceled = params.get('cancel') === 'true' || params.get('status') === 'CANCELLED' || params.get('canceled') === 'true';
    const orderCode = params.get('orderCode');

    if (isCanceled) {
      showInfo('Bạn đã hủy thanh toán qua PayOS. Bạn có thể chọn lại phương thức thanh toán hoặc tiến hành thanh toán lại.');

      // Nếu giỏ hàng đang trống, tự động khôi phục lại dữ liệu ngay lập tức
      if ((!cart || cart.length === 0) && orderCode) {
        orderService.getOrderByNumber(`YF-${orderCode}`).then((res) => {
          if (res?.data?.order_items && res.data.order_items.length > 0 && setCart) {
            const restoredItems = res.data.order_items.map((item) => ({
              id: String(item.variant_id || item.order_item_id),
              variant_id: item.variant_id,
              productId: item.variant?.product_id || item.variant_id,
              sku: item.sku,
              categoryTag: item.variant?.product?.category?.category_name || 'THỜI TRANG',
              title: item.product_name,
              colorName: item.color,
              colorDot: '#000000',
              size: item.size,
              price: Number(item.unit_price || 0),
              quantity: Number(item.quantity || 1),
              image: item.variant?.product?.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
              selected: true,
            }));
            setCart(restoredItems);
          }
        }).catch(() => {});
      } else if (!cart || cart.length === 0) {
        try {
          const cached = sessionStorage.getItem('yf_pending_checkout_items');
          if (cached && setCart) {
            setCart(JSON.parse(cached));
          }
        } catch (e) {}
      }
    }
  }, [location.search]);

  // Xử lý Gửi Đơn Hàng & Thanh Toán
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (checkoutItems.length === 0) {
      showError('Không có sản phẩm nào trong đơn hàng để thanh toán');
      return;
    }

    if (!fullName.trim() || !phone.trim() || !addressDetail.trim()) {
      showError('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        recipientName: fullName.trim(),
        recipientPhone: phone.trim(),
        recipientEmail: email.trim() || null,
        shippingAddressLine: addressDetail.trim(),
        shippingWard: selectedWard,
        shippingDistrict: selectedDistrict,
        shippingCity: selectedProvince,
        shippingMethod,
        paymentMethod,
        note: orderNote.trim(),
        items: checkoutItems.map((item) => ({
          variant_id: item.variant_id || (item.id && !String(item.id).includes('-') ? item.id : null),
          product_id: item.productId || item.product_id || (item.id && String(item.id).includes('-') ? item.id.split('-')[0] : item.id),
          product_name: item.title || item.product_name,
          sku: item.sku || 'SKU-001',
          size: item.size || 'M',
          color: item.colorName || item.color || 'Màu tiêu chuẩn',
          unit_price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          image: item.image,
        })),
        voucherCode: appliedVoucher?.code || null,
        discountAmount: voucherDiscount,
      };

      const res = await orderService.createOrder(orderPayload);

      if (res?.status && res?.data) {
        const { orderNumber, orderCode, checkoutUrl, isSimulation } = res.data;

        // Lưu thông tin đơn hàng vừa hoàn tất để hiển thị tức thì tại Bước 03 Xác nhận đơn hàng
        const orderSummary = {
          order_number: orderNumber,
          orderCode,
          recipient_name: fullName.trim(),
          recipient_phone: phone.trim(),
          recipient_email: email.trim() || null,
          shipping_address_line: addressDetail.trim(),
          shipping_ward: selectedWard,
          shipping_district: selectedDistrict,
          shipping_city: selectedProvince,
          shipping_method: shippingMethod,
          payment_method: paymentMethod,
          raw_subtotal: rawProductTotal,
          voucher_discount: voucherDiscount,
          total_amount: finalTotal,
          payments: [{ payment_method: paymentMethod, payment_status: paymentMethod === 'PAYOS' ? 'PENDING' : 'PENDING' }],
          order_items: checkoutItems.map((item) => ({
            order_item_id: item.id || item.variant_id,
            product_name: item.title || item.product_name,
            color: item.colorName || item.color || 'Màu tiêu chuẩn',
            size: item.size || 'M',
            unit_price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
            subtotal: Number(item.price || 0) * Number(item.quantity || 1),
            image: item.image,
          })),
        };
        try {
          sessionStorage.setItem('yf_last_completed_order', JSON.stringify(orderSummary));
        } catch (e) {}

        if (paymentMethod === 'PAYOS') {
          if (checkoutUrl) {
            showSuccess('Đang chuyển hướng tới cổng thanh toán PayOS...');
            // Lưu lại thông tin sản phẩm và giỏ hàng để khôi phục nếu người dùng bấm Hủy
            try {
              sessionStorage.setItem('yf_pending_checkout_items', JSON.stringify(checkoutItems));
            } catch (e) {}
            // Chuyển hướng trực tiếp tới cổng PayOS VietQR
            window.location.href = checkoutUrl;
          } else {
            navigate(`/order-success?orderCode=${orderCode}&orderNumber=${orderNumber}`);
          }
        } else {
          // Phương thức COD: Xóa các sản phẩm đã mua khỏi giỏ hàng frontend
          const remainingCart = (cart || []).filter(
            (cItem) => !checkoutItems.some((bItem) => (bItem.variant_id || bItem.id) === (cItem.variant_id || cItem.id))
          );
          if (setCart) setCart(remainingCart);

          // Dọn dẹp session checkout
          sessionStorage.removeItem('yf_checkout_voucher');
          sessionStorage.removeItem('yf_checkout_note');
          sessionStorage.removeItem('yf_pending_checkout_items');

          showSuccess('Đặt hàng thành công! Đang chuyển đến xác nhận đơn hàng...');
          navigate(`/order-success?orderCode=${orderCode}&orderNumber=${orderNumber}`);
        }
      } else {
        showError(res?.message || 'Không thể tạo đơn hàng, vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Lỗi khi gửi đơn hàng:', err);
      showError(err.response?.data?.message || err.message || 'Lỗi khi gửi đơn hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page-root">
      {/* 1. Header Breadcrumbs */}
      <div className="checkout-top-nav-bar">
        <div className="checkout-container">
          <nav className="checkout-breadcrumb">
            <Link to="/" className="b-link">TRANG CHỦ</Link>
            <span className="b-sep">&gt;</span>
            <Link to="/cart" className="b-link">GIỎ HÀNG</Link>
            <span className="b-sep">&gt;</span>
            <span className="b-current">THANH TOÁN ĐƠN HÀNG</span>
          </nav>
        </div>
      </div>

      <div className="checkout-container main-content-wrap">
        {/* 2. Stepper Progress Bar */}
        <div className="checkout-stepper-row">
          <div className="step-pill step-completed">
            <span className="step-icon-circle checked">
              <Check size={14} strokeWidth={3} />
            </span>
            <div className="step-text-group">
              <span className="step-label">BƯỚC 01</span>
              <span className="step-title">Giỏ Hàng</span>
            </div>
          </div>

          <div className="step-pill step-active">
            <span className="step-number-circle">02</span>
            <div className="step-text-group">
              <span className="step-label">ĐANG XỬ LÝ</span>
              <span className="step-title">Thanh Toán</span>
            </div>
          </div>

          <div className="step-pill step-pending">
            <span className="step-number-circle">03</span>
            <div className="step-text-group">
              <span className="step-label">BƯỚC 03</span>
              <span className="step-title">Xác nhận đơn hàng</span>
            </div>
          </div>
        </div>

        {/* 3. Page Title */}
        <h1 className="checkout-page-title font-serif">Thanh Toán Đơn Hàng</h1>

        {/* 4. VIP Member Account Bar */}
        <div className="vip-account-badge-card">
          <div className="vip-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="vip-info-text">
            <h3 className="vip-customer-name">
              {user?.full_name ? user.full_name.toUpperCase() : 'HOÀNG KIM ANH'}
            </h3>
            <p className="vip-privilege-desc">
              Tài khoản được hưởng đặc quyền miễn phí giao hỏa tốc.
            </p>
          </div>
        </div>

        {/* 5. Main Single-Column Form Layout: All 4 Sections Stacked Vertically */}
        <form onSubmit={handleSubmitOrder} className="checkout-single-column-flow">
          {/* Section 1: Thông Tin Người Nhận & Liên Lạc */}
          <div className="checkout-section-card">
            <div className="section-card-header">
              <div className="section-title-left">
                <span className="section-num-badge">1</span>
                <h2 className="section-title-text">Thông Tin Người Nhận &amp; Liên Lạc</h2>
              </div>
              <span className="required-flag">BẮT BUỘC</span>
            </div>

            <div className="form-fields-wrap">
              <div className="input-row-2col">
                <div className="field-group">
                  <label className="field-label">HỌ VÀ TÊN</label>
                  <input
                    type="text"
                    className="field-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">SỐ ĐIỆN THOẠI</label>
                  <input
                    type="tel"
                    className="field-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field-group mt-14">
                <label className="field-label">ĐỊA CHỈ EMAIL</label>
                <input
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <label className="checkbox-field-wrap">
                <input
                  type="checkbox"
                  checked={notifySchedule}
                  onChange={(e) => setNotifySchedule(e.target.checked)}
                  className="custom-checkbox"
                />
                <span className="checkbox-text">Nhận thông báo lịch trình đơn hàng.</span>
              </label>
            </div>
          </div>

          {/* Section 2: Địa Chỉ Nhận Hàng & Dịch Vụ Vận Chuyển */}
          <div className="checkout-section-card">
            <div className="section-card-header">
              <div className="section-title-left">
                <span className="section-num-badge">2</span>
                <h2 className="section-title-text">Địa Chỉ Nhận Hàng &amp; Dịch Vụ Vận Chuyển</h2>
              </div>
            </div>

            <div className="form-fields-wrap">
              <div className="input-row-3col">
                <div className="field-group">
                  <label className="field-label">TỈNH / THÀNH PHỐ</label>
                  <div className="select-wrapper">
                    <select
                      className="field-select"
                      value={selectedProvince}
                      onChange={handleProvinceChange}
                    >
                      {VIETNAM_PROVINCES.map((prov) => (
                        <option key={prov.name} value={prov.name}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="select-arrow" />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">QUẬN / HUYỆN</label>
                  <div className="select-wrapper">
                    <select
                      className="field-select"
                      value={selectedDistrict}
                      onChange={handleDistrictChange}
                    >
                      {currentDistricts.map((dist) => (
                        <option key={dist.name} value={dist.name}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="select-arrow" />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">PHƯỜNG / XÃ</label>
                  <div className="select-wrapper">
                    <select
                      className="field-select"
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                    >
                      {currentWards.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="select-arrow" />
                  </div>
                </div>
              </div>

              <div className="field-group mt-14">
                <label className="field-label">ĐỊA CHỈ CHI TIẾT (TÒA NHÀ, SỐ NHÀ, TÊN PHỐ)</label>
                <input
                  type="text"
                  className="field-input"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  placeholder="Ví dụ: Căn Hộ Penthouse 1802, Tòa Nhà Heritage Plaza, 15 Tràng Tiền"
                  required
                />
              </div>

              <div className="field-group mt-14">
                <label className="field-label">GHI CHÚ</label>
                <input
                  type="text"
                  className="field-input"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Ví dụ: Gọi điện trước 20 phút, áo treo sẵn trên móc gỗ bọc vải lụa đen Signature..."
                />
              </div>

              {/* Phương thức vận chuyển */}
              <div className="shipping-methods-container">
                <label className="field-label block mb-8">PHƯƠNG THỨC VẬN CHUYỂN</label>
                <div className="shipping-options-grid">
                  <div
                    className={`shipping-option-card ${shippingMethod === 'EXPRESS' ? 'selected' : ''}`}
                    onClick={() => setShippingMethod('EXPRESS')}
                  >
                    <div className="radio-outer">
                      {shippingMethod === 'EXPRESS' && <div className="radio-inner" />}
                    </div>
                    <div className="option-content">
                      <div className="option-header-row">
                        <span className="option-title">Giao Hàng Hỏa Tốc</span>
                        <span className="badge-recommended">KHUYÊN DÙNG</span>
                      </div>
                      <p className="option-desc">Giao trong 2-4 giờ tại nội thành Hà Nội &amp; TP.HCM.</p>
                    </div>
                  </div>

                  <div
                    className={`shipping-option-card ${shippingMethod === 'STANDARD' ? 'selected' : ''}`}
                    onClick={() => setShippingMethod('STANDARD')}
                  >
                    <div className="radio-outer">
                      {shippingMethod === 'STANDARD' && <div className="radio-inner" />}
                    </div>
                    <div className="option-content">
                      <div className="option-header-row">
                        <span className="option-title">Giao Hàng Tiêu Chuẩn</span>
                        <span className="option-price-tag">0đ</span>
                      </div>
                      <p className="option-desc">Thời gian 3-5 ngày toàn quốc.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Phương Thức Thanh Toán */}
          <div className="checkout-section-card">
            <div className="section-card-header">
              <div className="section-title-left">
                <span className="section-num-badge">3</span>
                <h2 className="section-title-text">Phương Thức Thanh Toán</h2>
              </div>
            </div>

            <div className="form-fields-wrap payment-options-list">
              {/* PayOS Option */}
              <div
                className={`payment-option-card ${paymentMethod === 'PAYOS' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('PAYOS')}
              >
                <div className="radio-outer">
                  {paymentMethod === 'PAYOS' && <div className="radio-inner" />}
                </div>
                <div className="payment-body">
                  <div className="payment-title-row">
                    <span className="payment-name font-semibold">PayOS</span>
                  </div>
                  <p className="payment-desc">
                    Quét mã VietQR chuyển khoản nhanh 24/7 từ mọi ứng dụng ngân hàng và ví điện tử, xác nhận tự động tức thì.
                  </p>
                </div>
              </div>

              {/* COD Option */}
              <div
                className={`payment-option-card ${paymentMethod === 'COD' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('COD')}
              >
                <div className="radio-outer">
                  {paymentMethod === 'COD' && <div className="radio-inner" />}
                </div>
                <div className="payment-body">
                  <div className="payment-title-row">
                    <span className="payment-name font-semibold">Thanh Toán Khi Nhận Hàng (COD)</span>
                  </div>
                  <p className="payment-desc">
                    Thanh toán ngay tại thời điểm nhận hàng.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Đơn Hàng Của Quý Khách (NẰM TRỰC TIẾP DƯỚI PHƯƠNG THỨC THANH TOÁN) */}
          <div className="checkout-order-review-card">
            {/* Header: Đơn Hàng Của Quý Khách & Số Lượng Sản Phẩm */}
            <div className="order-review-header-bar">
              <div className="header-left-title">
                <Lock size={16} className="text-amber-800" />
                <span className="order-review-title font-serif">Đơn Hàng Của Quý Khách</span>
              </div>
              <span className="order-products-count-badge">
                {totalItemsCount < 10 ? `0${totalItemsCount}` : totalItemsCount} SẢN PHẨM
              </span>
            </div>

            {/* Danh sách từng sản phẩm */}
            <div className="order-products-list-wrap">
              {checkoutItems.length === 0 ? (
                <div className="empty-cart-hint">
                  <p>Chưa có sản phẩm nào được chọn từ giỏ hàng.</p>
                  <Link to="/products" className="text-amber-800 underline text-sm mt-2 block">
                    Khám phá các thiết kế mới &rarr;
                  </Link>
                </div>
              ) : (
                checkoutItems.map((item, idx) => (
                  <div key={item.id || idx} className="product-item-card">
                    <div className="p-item-thumb-box">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'}
                        alt={item.title}
                        className="p-item-thumb-img"
                      />
                    </div>
                    <div className="p-item-details-content">
                      <span className="p-item-category">
                        {item.categoryTag || item.category || 'MĂNG TÔ CAO CẤP'}
                      </span>
                      <h4 className="p-item-title font-medium">{item.title}</h4>
                      <div className="p-item-meta-row">
                        <span>Màu: {item.colorName || item.color || 'Camel Tự Nhiên'}</span>
                        <span className="meta-bullet">•</span>
                        <span>Size: {item.size || 'M'}</span>
                      </div>
                      <div className="p-item-sku-row">
                        <span>SKU: {item.sku || 'YF-COAT-CAMEL-01'}</span>
                      </div>
                      <div className="p-item-bottom-pricing">
                        <span className="p-item-qty">SL: {item.quantity || 1}</span>
                        <div className="p-item-prices">
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="p-item-price-old">
                              {Number(item.originalPrice).toLocaleString('vi-VN')}đ
                            </span>
                          )}
                          <span className="p-item-price-current font-bold">
                            {Number(item.price).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Banner Voucher Đã Áp Dụng */}
            {appliedVoucher ? (
              <div className="voucher-highlight-banner">
                <div className="voucher-b-left">
                  <Tag size={16} className="text-amber-800" />
                  <div>
                    <span className="voucher-b-code">
                      MÃ VOUCHER: {appliedVoucher.code}
                    </span>
                    <span className="voucher-b-applied">
                      ĐÃ ÁP DỤNG ({appliedVoucher.discountPercent ? `-${appliedVoucher.discountPercent}%` : 'ƯU ĐÃI'})
                    </span>
                  </div>
                </div>
                <div className="voucher-b-right">
                  <span className="voucher-b-discount-val">
                    -{voucherDiscount.toLocaleString('vi-VN')}đ
                  </span>
                  <button
                    type="button"
                    className="voucher-b-btn-change"
                    onClick={() => setIsVoucherModalOpen(true)}
                  >
                    ĐỔI MÃ
                  </button>
                </div>
              </div>
            ) : (
              <div className="voucher-empty-select-banner">
                <div className="flex items-center gap-2">
                  <Ticket size={16} className="text-amber-800" />
                  <span className="text-xs font-semibold uppercase text-stone-700">MÃ GIẢM GIÁ / VOUCHER</span>
                </div>
                <button
                  type="button"
                  className="btn-open-wallet-link"
                  onClick={() => setIsVoucherModalOpen(true)}
                >
                  CHỌN TỪ VÍ &rarr;
                </button>
              </div>
            )}

            {/* Bảng Chi Tiết Tạm Tính & Tổng Thanh Toán */}
            <div className="order-financial-breakdown-card">
              <div className="calc-row">
                <span className="calc-label">Tổng Giá Trị Hàng</span>
                <span className="calc-value font-semibold">{rawProductTotal.toLocaleString('vi-VN')}đ</span>
              </div>

              <div className="calc-row discount-highlight">
                <span className="calc-label">Ưu Đãi</span>
                <span className="calc-value discount-text">-{voucherDiscount.toLocaleString('vi-VN')}đ</span>
              </div>

              <div className="calc-row">
                <span className="calc-label">Vận Chuyển VIP</span>
                <span className="calc-value font-semibold text-amber-900">MIỄN PHÍ (0đ)</span>
              </div>

              <div className="calc-row">
                <span className="calc-label">Thuế VAT (8%)</span>
                <span className="calc-value">{vatAmount.toLocaleString('vi-VN')}đ</span>
              </div>

              <div className="calc-horizontal-divider" />

              <div className="grand-total-flex-row">
                <div className="grand-total-left">
                  <span className="grand-total-label uppercase font-semibold">TỔNG CỘNG THANH TOÁN</span>
                  {totalOriginalSaving > 0 && (
                    <span className="savings-badge-subtext">
                      (Tiết kiệm {totalOriginalSaving.toLocaleString('vi-VN')}đ)
                    </span>
                  )}
                </div>
                <span className="grand-total-amount font-serif">
                  {finalTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>

              {/* Nút Đặt Hàng & Hoàn Tất Thanh Toán */}
              <button
                type="submit"
                disabled={isSubmitting || checkoutItems.length === 0}
                className="btn-complete-order-action"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner-border animate-spin" />
                    ĐANG XỬ LÝ ĐƠN HÀNG...
                  </span>
                ) : (
                  <span>ĐẶT HÀNG &amp; HOÀN TẤT THANH TOÁN &rarr;</span>
                )}
              </button>

              {/* Quay lại sửa giỏ hàng */}
              <div className="back-to-cart-wrapper">
                <Link to="/cart" className="link-back-to-cart">
                  &larr; SỬA GIỎ HÀNG
                </Link>
              </div>
            </div>
          </div>

          {/* Hai thẻ Bảo mật & Đổi trả nằm dưới cùng */}
          <div className="trust-guarantees-bottom-row">
            <div className="guarantee-capsule-item">
              <ShieldCheck size={16} className="text-amber-800" />
              <span>Bảo mật tuyệt đối</span>
            </div>
            <div className="guarantee-capsule-item">
              <RefreshCw size={16} className="text-amber-800" />
              <span>Đổi trả miễn phí 30 ngày</span>
            </div>
          </div>
        </form>
      </div>

      {/* Popup Chọn Voucher */}
      {isVoucherModalOpen && (
        <div className="voucher-modal-overlay" onClick={() => setIsVoucherModalOpen(false)}>
          <div className="voucher-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-amber-800" />
                <h3 className="modal-title font-serif">Ví Ưu Đãi Độc Quyền</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsVoucherModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-input-row">
              <input
                type="text"
                placeholder="Nhập mã ưu đãi của bạn..."
                value={inputVoucherCode}
                onChange={(e) => setInputVoucherCode(e.target.value.toUpperCase())}
                className="voucher-input-code"
              />
              <button
                type="button"
                className="btn-submit-code"
                onClick={() => handleApplyVoucherCode(inputVoucherCode)}
                disabled={isApplyingVoucher || !inputVoucherCode.trim()}
              >
                {isApplyingVoucher ? 'ĐANG ÁP DỤNG...' : 'ÁP DỤNG'}
              </button>
            </div>

            <div className="available-vouchers-list">
              <span className="list-heading uppercase">Mã ưu đãi có sẵn cho tài khoản:</span>
              {availableVouchers.length === 0 ? (
                <p className="no-vouchers-text">Không có mã ưu đãi nào khả dụng lúc này.</p>
              ) : (
                availableVouchers.map((v) => (
                  <div key={v.id || v.code} className="voucher-card-item">
                    <div className="v-card-left">
                      <span className="v-card-code">{v.code}</span>
                      <h5 className="v-card-title">{v.title}</h5>
                      <p className="v-card-desc">{v.desc}</p>
                      <span className="v-card-expiry">{v.expiry}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-choose-voucher"
                      onClick={() => handleApplyVoucherCode(v.code)}
                    >
                      DÙNG MÃ
                    </button>
                  </div>
                ))
              )}
            </div>

            {appliedVoucher && (
              <div className="modal-remove-footer">
                <button type="button" className="btn-remove-code-link" onClick={handleRemoveVoucher}>
                  Gỡ mã ưu đãi hiện tại
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scoped CSS Styles matching the Editorial Luxury Design */}
      <style>{`
        .checkout-page-root {
          background-color: #faf9f5;
          min-height: 100vh;
          padding-bottom: 70px;
          color: #1c1917;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .checkout-container {
          max-width: 920px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .checkout-top-nav-bar {
          background-color: #faf9f5;
          border-bottom: 1px dashed #d6d3d1;
          padding: 14px 0;
        }

        .checkout-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .checkout-breadcrumb .b-link {
          color: #78716c;
          text-decoration: none;
          transition: color 0.15s;
        }
        .checkout-breadcrumb .b-link:hover {
          color: #1c1917;
        }

        .checkout-breadcrumb .b-sep {
          color: #a8a29e;
        }

        .checkout-breadcrumb .b-current {
          color: #1c1917;
          font-weight: 600;
        }

        /* Stepper */
        .checkout-stepper-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
          margin-bottom: 28px;
        }

        .step-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 18px;
          border-radius: 9999px;
          font-size: 12px;
          transition: all 0.2s;
        }

        .step-pill.step-completed {
          background-color: #f5f5f4;
          color: #44403c;
          border: 1px solid #e7e5e4;
        }

        .step-icon-circle.checked {
          width: 22px;
          height: 22px;
          background-color: #e7e5e4;
          color: #78716c;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-pill.step-active {
          background-color: #000000;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .step-pill.step-active .step-number-circle {
          width: 22px;
          height: 22px;
          background-color: #ffffff;
          color: #000000;
          font-weight: 700;
          font-size: 11px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-pill.step-pending {
          background-color: transparent;
          color: #a8a29e;
        }

        .step-pill.step-pending .step-number-circle {
          width: 22px;
          height: 22px;
          border: 1px solid #d6d3d1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }

        .step-text-group {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .step-label {
          font-size: 9.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.8;
        }

        .step-title {
          font-size: 12px;
          font-weight: 600;
        }

        /* Page Title */
        .checkout-page-title {
          font-size: 32px;
          font-weight: 400;
          margin-bottom: 24px;
          color: #111827;
        }

        /* VIP Account Bar */
        .vip-account-badge-card {
          background-color: #f4f3ef;
          border: 1px solid #ebe8e1;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
        }

        .vip-icon-box {
          width: 44px;
          height: 44px;
          background-color: #111827;
          color: #ffffff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .vip-customer-name {
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          margin: 0;
          color: #111827;
        }

        .vip-privilege-desc {
          font-size: 12.5px;
          color: #78716c;
          margin: 2px 0 0 0;
        }

        /* Single-Column Flow */
        .checkout-single-column-flow {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        /* Section Cards */
        .checkout-section-card {
          background-color: #ffffff;
          border: 1px solid #eeece5;
          border-radius: 14px;
          padding: 24px 28px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .section-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 18px;
          border-bottom: 1px solid #f4f3ef;
          margin-bottom: 20px;
        }

        .section-title-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-num-badge {
          width: 24px;
          height: 24px;
          background-color: #f4f3ef;
          color: #1c1917;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .section-title-text {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
          color: #1c1917;
        }

        .required-flag {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #a8a29e;
          text-transform: uppercase;
        }

        /* Form Inputs */
        .input-row-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .input-row-3col {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 640px) {
          .input-row-2col, .input-row-3col {
            grid-template-columns: 1fr;
          }
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #44403c;
        }

        .field-input, .field-select {
          width: 100%;
          height: 42px;
          padding: 0 14px;
          background-color: #f7f6f2;
          border: 1px solid #e7e5e0;
          border-radius: 8px;
          font-size: 13.5px;
          color: #1c1917;
          outline: none;
          transition: border-color 0.15s, background-color 0.15s;
        }

        .field-input:focus, .field-select:focus {
          background-color: #ffffff;
          border-color: #111827;
        }

        .select-wrapper {
          position: relative;
        }

        .field-select {
          appearance: none;
          padding-right: 32px;
          cursor: pointer;
        }

        .select-arrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #78716c;
        }

        .mt-14 {
          margin-top: 14px;
        }

        .checkbox-field-wrap {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 18px;
          cursor: pointer;
          user-select: none;
        }

        .custom-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #111827;
          cursor: pointer;
        }

        .checkbox-text {
          font-size: 12.5px;
          color: #57534e;
        }

        /* Shipping Methods */
        .shipping-methods-container {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px dashed #e7e5e0;
        }

        .shipping-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 640px) {
          .shipping-options-grid {
            grid-template-columns: 1fr;
          }
        }

        .shipping-option-card {
          border: 1px solid #e7e5e0;
          border-radius: 10px;
          padding: 14px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          background-color: #faf9f6;
          transition: all 0.15s;
        }

        .shipping-option-card.selected {
          border-color: #111827;
          background-color: #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .radio-outer {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid #a8a29e;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 3px;
        }

        .shipping-option-card.selected .radio-outer,
        .payment-option-card.selected .radio-outer {
          border-color: #111827;
        }

        .radio-inner {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #111827;
        }

        .option-content {
          flex: 1;
        }

        .option-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .option-title {
          font-size: 13px;
          font-weight: 600;
          color: #1c1917;
        }

        .badge-recommended {
          background-color: #78350f;
          color: #fef3c7;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 2px 7px;
          border-radius: 9999px;
        }

        .option-price-tag {
          font-size: 12.5px;
          font-weight: 600;
          color: #1c1917;
        }

        .option-desc {
          font-size: 11.5px;
          color: #78716c;
          margin: 0;
          line-height: 1.35;
        }

        /* Payment Options */
        .payment-options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .payment-option-card {
          border: 1px solid #e7e5e0;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          background-color: #faf9f6;
          transition: all 0.15s;
        }

        .payment-option-card.selected {
          border-color: #854d0e;
          background-color: #fffefb;
          box-shadow: 0 2px 8px rgba(133, 77, 14, 0.08);
        }

        .payment-body {
          flex: 1;
        }

        .payment-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .payment-name {
          font-size: 13.5px;
          color: #1c1917;
        }

        .badge-current-selected {
          background-color: #78350f;
          color: #fef3c7;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .badge-vietqr {
          background-color: #1e3a8a;
          color: #dbeafe;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .payment-desc {
          font-size: 12px;
          color: #78716c;
          margin: 0;
          line-height: 1.4;
        }

        /* Section 4: Đơn Hàng Của Quý Khách (Card lớn nằm dưới Phương thức thanh toán) */
        .checkout-order-review-card {
          background-color: #fbfbf9;
          border: 1px solid #ebe8e1;
          border-radius: 14px;
          padding: 24px 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.02);
        }

        .order-review-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 18px;
          border-bottom: 1px solid #f0eee8;
          margin-bottom: 18px;
        }

        .header-left-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .order-review-title {
          font-size: 16px;
          font-weight: 600;
          color: #1c1917;
        }

        .order-products-count-badge {
          background-color: #000000;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 4px 12px;
          border-radius: 9999px;
        }

        /* Products List */
        .order-products-list-wrap {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 18px;
        }

        .product-item-card {
          background-color: #ffffff;
          border: 1px solid #eeece5;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          gap: 16px;
        }

        .p-item-thumb-box {
          width: 72px;
          height: 90px;
          border-radius: 6px;
          overflow: hidden;
          background-color: #f4f3ef;
          flex-shrink: 0;
        }

        .p-item-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .p-item-details-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .p-item-category {
          font-size: 10px;
          letter-spacing: 0.08em;
          color: #78716c;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .p-item-title {
          font-size: 14px;
          color: #1c1917;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .p-item-meta-row, .p-item-sku-row {
          font-size: 11.5px;
          color: #78716c;
          margin-bottom: 2px;
        }

        .meta-bullet {
          margin: 0 6px;
        }

        .p-item-bottom-pricing {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
        }

        .p-item-qty {
          font-size: 12px;
          color: #44403c;
          font-weight: 500;
        }

        .p-item-prices {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .p-item-price-old {
          font-size: 12px;
          color: #a8a29e;
          text-decoration: line-through;
        }

        .p-item-price-current {
          font-size: 14px;
          color: #111827;
        }

        /* Voucher Highlight Banner */
        .voucher-highlight-banner {
          background-color: #fef9ee;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .voucher-b-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .voucher-b-code {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #1c1917;
          letter-spacing: 0.04em;
        }

        .voucher-b-applied {
          display: block;
          font-size: 11px;
          color: #92400e;
          font-weight: 600;
        }

        .voucher-b-right {
          text-align: right;
        }

        .voucher-b-discount-val {
          display: block;
          font-size: 13.5px;
          font-weight: 700;
          color: #92400e;
        }

        .voucher-b-btn-change {
          background: none;
          border: none;
          font-size: 10.5px;
          font-weight: 700;
          color: #78716c;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          margin-top: 2px;
        }

        .voucher-empty-select-banner {
          background-color: #f5f4ef;
          border: 1px dashed #d6d3d1;
          border-radius: 8px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .btn-open-wallet-link {
          background: none;
          border: none;
          font-size: 11.5px;
          font-weight: 700;
          color: #78350f;
          cursor: pointer;
        }

        /* Financial Breakdown Card */
        .order-financial-breakdown-card {
          background-color: #ffffff;
          border: 1px solid #eeece5;
          border-radius: 10px;
          padding: 22px 24px;
        }

        .calc-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: #57534e;
          margin-bottom: 10px;
        }

        .calc-row.discount-highlight .discount-text {
          color: #92400e;
          font-weight: 600;
        }

        .calc-horizontal-divider {
          height: 1px;
          background-color: #e7e5e0;
          margin: 14px 0 16px 0;
        }

        .grand-total-flex-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .grand-total-left {
          display: flex;
          flex-direction: column;
        }

        .grand-total-label {
          font-size: 12.5px;
          letter-spacing: 0.05em;
          color: #1c1917;
        }

        .savings-badge-subtext {
          font-size: 11.5px;
          color: #78716c;
          margin-top: 2px;
        }

        .grand-total-amount {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }

        /* Complete Order Button */
        .btn-complete-order-action {
          width: 100%;
          height: 48px;
          background-color: #000000;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s, transform 0.1s;
        }

        .btn-complete-order-action:hover:not(:disabled) {
          background-color: #27272a;
        }

        .btn-complete-order-action:active:not(:disabled) {
          transform: translateY(1px);
        }

        .btn-complete-order-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .back-to-cart-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          margin-top: 18px;
          text-align: center;
        }

        .link-back-to-cart {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #57534e;
          text-decoration: none;
        }

        .link-back-to-cart:hover {
          color: #000000;
          text-decoration: underline;
        }

        /* Trust Guarantees Bottom Row */
        .trust-guarantees-bottom-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 10px;
          margin-bottom: 20px;
        }

        .guarantee-capsule-item {
          background-color: #ffffff;
          border: 1px solid #eeece5;
          padding: 10px 22px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #44403c;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        /* Voucher Modal */
        .voucher-modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
        }

        .voucher-modal-card {
          background-color: #ffffff;
          width: 100%;
          max-width: 460px;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .modal-title {
          font-size: 18px;
          margin: 0;
        }

        .btn-close-modal {
          background: none;
          border: none;
          cursor: pointer;
          color: #78716c;
        }

        .modal-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
        }

        .voucher-input-code {
          flex: 1;
          height: 40px;
          padding: 0 12px;
          border: 1px solid #d6d3d1;
          border-radius: 6px;
          font-size: 13px;
          outline: none;
          text-transform: uppercase;
        }

        .btn-submit-code {
          height: 40px;
          padding: 0 16px;
          background-color: #111827;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .available-vouchers-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 240px;
          overflow-y: auto;
        }

        .list-heading {
          font-size: 11px;
          letter-spacing: 0.05em;
          color: #78716c;
          margin-bottom: 2px;
        }

        .voucher-card-item {
          border: 1px solid #e7e5e0;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #faf9f6;
        }

        .v-card-code {
          font-size: 12px;
          font-weight: 700;
          color: #854d0e;
          display: block;
        }

        .v-card-title {
          font-size: 12.5px;
          font-weight: 600;
          margin: 2px 0;
        }

        .v-card-desc {
          font-size: 11px;
          color: #78716c;
          margin: 0;
        }

        .v-card-expiry {
          font-size: 10px;
          color: #a8a29e;
          display: block;
          margin-top: 3px;
        }

        .btn-choose-voucher {
          background-color: #111827;
          color: #ffffff;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .modal-remove-footer {
          margin-top: 14px;
          text-align: center;
        }

        .btn-remove-code-link {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 11.5px;
          cursor: pointer;
          text-decoration: underline;
        }

        .spinner-border {
          width: 14px;
          height: 14px;
          border: 2px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
