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
import VIETNAM_PROVINCES from '../../data/vietnamAddresses.json';
import CustomSelect from '../../components/CustomSelect';
import { resolveOrderItemImage } from '../../utils/productImageUtils';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, cart, setCart, removePurchasedItems, updateUserProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  // 1. Lấy sản phẩm được chọn từ Mua Ngay hoặc từ Giỏ hàng
  const checkoutItems = useMemo(() => {
    if (location.state?.buyNowItem) {
      return [location.state.buyNowItem];
    }
    try {
      const savedBuyNow = sessionStorage.getItem('yf_buy_now_item');
      if (savedBuyNow) {
        const parsed = JSON.parse(savedBuyNow);
        if (parsed && typeof parsed === 'object') return [parsed];
      }
    } catch (e) {}

    const list = cart || [];
    const selected = list.filter((i) => i.selected);
    return selected.length > 0 ? selected : list;
  }, [cart, location.state]);

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
  const [fullName, setFullName] = useState(() => user?.full_name || '');
  const [phone, setPhone] = useState(() => (user?.phone && user.phone !== '0988777666' ? user.phone : ''));
  const [email, setEmail] = useState(() => user?.email || '');
  const [notifySchedule, setNotifySchedule] = useState(true);

  // Form Địa chỉ: Để trống ban đầu cho người dùng chọn và nhập, khi đặt đơn hàng mới lưu lại
  const savedAddress = (() => {
    if (user?.address?.province || user?.address?.detail) return user.address;
    try {
      const key = user ? `user_address_${user.customer_id || user.id || user.email}` : 'guest_saved_address';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  })();

  const [selectedProvince, setSelectedProvince] = useState(() => savedAddress?.province || '');
  const [selectedDistrict, setSelectedDistrict] = useState(() => savedAddress?.district || '');
  const [selectedWard, setSelectedWard] = useState(() => savedAddress?.ward || '');
  const [addressDetail, setAddressDetail] = useState(() => savedAddress?.detail || '');
  const [orderNote, setOrderNote] = useState(() => {
    return (
      location.state?.orderNote ||
      sessionStorage.getItem('yf_checkout_note') ||
      ''
    );
  });

  // State thông báo lỗi cho từng trường
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [provinceError, setProvinceError] = useState('');
  const [districtError, setDistrictError] = useState('');
  const [wardError, setWardError] = useState('');
  const [addressDetailError, setAddressDetailError] = useState('');

  // Đồng bộ thông tin nếu user context load sau
  useEffect(() => {
    if (user) {
      if (!fullName && user.full_name) setFullName(user.full_name);
      if (!phone && user.phone && user.phone !== '0988777666') setPhone(user.phone);
      if (!email && user.email) setEmail(user.email);
      if (user.address) {
        if (!selectedProvince && user.address.province) setSelectedProvince(user.address.province);
        if (!selectedDistrict && user.address.district) setSelectedDistrict(user.address.district);
        if (!selectedWard && user.address.ward) setSelectedWard(user.address.ward);
        if (!addressDetail && user.address.detail) setAddressDetail(user.address.detail);
      }
    }
  }, [user]);

  // Luôn đồng bộ danh sách voucher ACTIVE từ backend và kiểm tra voucher đã áp dụng
  useEffect(() => {
    voucherService.fetchVouchers().then(() => {
      const activeList = voucherService.getCustomerVouchers();
      setAvailableVouchers(activeList);
      setAppliedVoucher((current) => {
        if (!current) return null;
        const stillValid = activeList.some(
          (v) => String(v.code).trim().toUpperCase() === String(current.code).trim().toUpperCase()
        );
        if (!stillValid) {
          sessionStorage.removeItem('yf_checkout_voucher');
          showError(`Mã ưu đãi ${current.code} hiện không còn hiệu lực hoặc chưa được kích hoạt.`);
          return null;
        }
        return current;
      });
    }).catch(() => {});
  }, []);

  // Các hàm validate trường nhập liệu
  const validateFullName = (name) => {
    if (!name || !name.trim()) return 'Họ và tên không được để trống';
    if (name.trim().length < 2) return 'Họ và tên phải có tối thiểu 2 ký tự';
    return '';
  };

  const validatePhone = (phoneNumber) => {
    if (!phoneNumber || !phoneNumber.toString().trim()) {
      return 'Số điện thoại không được để trống';
    }
    const cleaned = phoneNumber.toString().replace(/[\s.\-()]/g, '');
    const vnPhoneRegex = /^(?:(?:\+84|84|0))(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;
    if (!vnPhoneRegex.test(cleaned)) {
      return 'Số điện thoại không hợp lệ (gồm 10 số thuộc các mạng di động VN: 03x, 05x, 07x, 08x, 09x)';
    }
    return '';
  };

  const validateEmail = (val) => {
    if (!val || !val.trim()) return 'Địa chỉ email không được để trống';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Địa chỉ email không đúng định dạng (VD: example@domain.com)';
    return '';
  };

  const validateAddressDetail = (val) => {
    if (!val || !val.trim()) return 'Địa chỉ chi tiết không được để trống';
    if (val.trim().length < 4) return 'Vui lòng nhập địa chỉ chi tiết cụ thể hơn (số nhà, tên đường...)';
    return '';
  };

  // Phương thức vận chuyển & Thanh toán
  const [shippingMethod, setShippingMethod] = useState('EXPRESS'); // 'EXPRESS' | 'STANDARD'
  const [paymentMethod, setPaymentMethod] = useState(() => {
    try {
      const search = window.location.search || '';
      if (search.includes('cancel=') || search.includes('orderCode=') || sessionStorage.getItem('yf_pending_order_code')) {
        return 'PAYOS';
      }
    } catch (e) {}
    return 'COD';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cập nhật danh sách quận/huyện theo tỉnh/thành
  const currentProvinceData = useMemo(() => {
    if (!selectedProvince) return null;
    return (
      VIETNAM_PROVINCES.find(
        (p) => p.name === selectedProvince || p.fullName === selectedProvince
      ) || null
    );
  }, [selectedProvince]);

  const currentDistricts = useMemo(() => {
    return currentProvinceData ? currentProvinceData.districts : [];
  }, [currentProvinceData]);

  const currentWards = useMemo(() => {
    if (!selectedDistrict) return [];
    const d = currentDistricts.find((item) => item.name === selectedDistrict);
    return d ? d.wards : [];
  }, [currentDistricts, selectedDistrict]);

  const handleProvinceChange = (e) => {
    const newProv = e.target.value;
    setSelectedProvince(newProv);
    setSelectedDistrict('');
    setSelectedWard('');
    if (newProv) setProvinceError('');
  };

  const handleDistrictChange = (e) => {
    const newDist = e.target.value;
    setSelectedDistrict(newDist);
    setSelectedWard('');
    if (newDist) setDistrictError('');
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

  // Lắng nghe sự kiện nếu khách bấm nút "Hủy thanh toán" hoặc quá thời hạn 5 phút trên PayOS
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = (params.get('status') || '').toUpperCase();
    const isCanceled =
      params.get('cancel') === 'true' ||
      params.get('canceled') === 'true' ||
      statusParam === 'CANCELLED' ||
      statusParam === 'EXPIRED';
    const orderCode = params.get('orderCode') || sessionStorage.getItem('yf_pending_order_code');

    if (isCanceled) {
      // 1. Gọi backend xóa bỏ đơn hàng khỏi Database MySQL (hoàn lại tồn kho và voucher)
      if (orderCode) {
        orderService.deleteOrder(orderCode).catch(() => {});
        orderService.deleteOrder(`YF-${orderCode}`).catch(() => {});
      }

      // 2. Thêm vào danh sách ID đơn đã xóa để tránh hiển thị ở trang Quản lý đơn hoặc Profile
      try {
        const rawDel = localStorage.getItem('yf_deleted_order_ids');
        const delList = rawDel ? JSON.parse(rawDel) : [];
        if (orderCode) {
          const digits = String(orderCode).replace(/\D/g, '');
          const newDel = Array.from(new Set([...delList, String(orderCode), `YF-${orderCode}`, `YF - ${orderCode}`, digits]));
          localStorage.setItem('yf_deleted_order_ids', JSON.stringify(newDel));
        }
      } catch (e) {}

      // 3. Xóa đơn hàng này khỏi localStorage (nếu có lưu)
      try {
        const filterOutOrder = (list) => {
          if (!Array.isArray(list)) return [];
          const targetDigits = String(orderCode || '').replace(/\D/g, '');
          return list.filter((o) => {
            const rawId = String(o.order_id || '').trim();
            const rawCode = String(o.order_code || o.order_number || '').trim();
            const digits = (rawCode || rawId).replace(/\D/g, '');
            if (rawId === String(orderCode) || rawCode === `YF-${orderCode}` || rawCode === `YF - ${orderCode}`) return false;
            if (targetDigits && digits === targetDigits) return false;
            return true;
          });
        };

        const custOrders = JSON.parse(localStorage.getItem('yf_customer_orders') || '[]');
        localStorage.setItem('yf_customer_orders', JSON.stringify(filterOutOrder(custOrders)));

        const userOrderKey = user ? `yf_customer_orders_${user.customer_id || user.id || user.email}` : null;
        if (userOrderKey) {
          const userOrders = JSON.parse(localStorage.getItem(userOrderKey) || '[]');
          localStorage.setItem(userOrderKey, JSON.stringify(filterOutOrder(userOrders)));
        }

        const mgrOrders = JSON.parse(localStorage.getItem('yf_manager_orders') || '[]');
        localStorage.setItem('yf_manager_orders', JSON.stringify(filterOutOrder(mgrOrders)));
      } catch (e) {}

      // 4. Xóa session đơn hàng chờ PayOS
      sessionStorage.removeItem('yf_pending_payos_order');
      sessionStorage.removeItem('yf_pending_order_code');
      sessionStorage.removeItem('yf_last_completed_order');

      // 5. Khôi phục giỏ hàng hoặc sản phẩm Mua Ngay
      try {
        const cached = sessionStorage.getItem('yf_pending_checkout_items');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasBuyNow = parsed.some((it) => it.isBuyNow);
            if (hasBuyNow) {
              sessionStorage.setItem('yf_buy_now_item', JSON.stringify(parsed[0]));
            }
            if (setCart) {
              setCart(parsed);
            }
          }
        }
      } catch (e) {}

      // 6. Xóa param cancel/status khỏi URL
      window.history.replaceState({}, '', window.location.pathname);

      // 7. Thông báo cho người dùng
      if (statusParam === 'EXPIRED') {
        showInfo('Đã hết thời gian thanh toán (5 phút). Đơn hàng chưa được tạo, các sản phẩm đã được giữ lại trong giỏ hàng để bạn tiếp tục.');
      } else {
        showInfo('Đã quá thời gian thanh toán 5 phút hoặc giao dịch đã được hủy. Các sản phẩm vẫn được giữ lại để bạn tiếp tục đặt hàng.');
      }

      // 8. Kích hoạt custom event
      window.dispatchEvent(new Event('order_status_updated'));
      window.dispatchEvent(new Event('yf_order_status_changed'));
    }
  }, [location.search, setCart, user]);

  // Xử lý Gửi Đơn Hàng & Thanh Toán
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (checkoutItems.length === 0) {
      showError('Không có sản phẩm nào trong đơn hàng để thanh toán');
      return;
    }

    // 1. Kiểm tra Họ và tên
    const nameErr = validateFullName(fullName);
    if (nameErr) {
      setFullNameError(nameErr);
      showError(nameErr);
      return;
    }
    setFullNameError('');

    // 2. Kiểm tra Số điện thoại
    const pErr = validatePhone(phone);
    if (pErr) {
      setPhoneError(pErr);
      showError(pErr);
      return;
    }
    setPhoneError('');

    // 3. Kiểm tra Email
    const emErr = validateEmail(email);
    if (emErr) {
      setEmailError(emErr);
      showError(emErr);
      return;
    }
    setEmailError('');

    // 4. Kiểm tra Tỉnh / Thành phố
    if (!selectedProvince) {
      setProvinceError('Vui lòng chọn Tỉnh / Thành phố');
      showError('Vui lòng chọn Tỉnh / Thành phố nhận hàng');
      return;
    }
    setProvinceError('');

    // 5. Kiểm tra Quận / Huyện
    if (!selectedDistrict) {
      setDistrictError('Vui lòng chọn Quận / Huyện');
      showError('Vui lòng chọn Quận / Huyện nhận hàng');
      return;
    }
    setDistrictError('');

    // 6. Kiểm tra Phường / Xã
    if (!selectedWard) {
      setWardError('Vui lòng chọn Phường / Xã');
      showError('Vui lòng chọn Phường / Xã nhận hàng');
      return;
    }
    setWardError('');

    // 7. Kiểm tra Địa chỉ chi tiết
    const addrErr = validateAddressDetail(addressDetail);
    if (addrErr) {
      setAddressDetailError(addrErr);
      showError(addrErr);
      return;
    }
    setAddressDetailError('');

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerId: user?.customer_id || user?.id || null,
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
          image: resolveOrderItemImage(item),
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
            image: resolveOrderItemImage(item),
          })),
        };
        const nowStr = new Date().toLocaleDateString('vi-VN');
        const fullAddressString = [addressDetail.trim(), selectedWard, selectedDistrict, selectedProvince].filter(Boolean).join(', ');

        const newOrderEntry = {
          order_id: String(orderCode),
          order_number: orderNumber || `YF-${orderCode}`,
          order_code: `YF - ${orderCode}`,
          created_at: nowStr,
          created_date: new Date().toISOString(),
          recipient_name: fullName.trim() || user?.full_name || 'Khách hàng',
          recipient_phone: phone.trim() || user?.phone || '090****000',
          recipient_email: email.trim() || user?.email || '',
          address: fullAddressString || 'Giao tận nơi theo đơn đặt hàng',
          shipping_address: fullAddressString || 'Giao tận nơi theo đơn đặt hàng',
          payment_method: paymentMethod === 'PAYOS' ? 'PAYOS' : (paymentMethod === 'DIRECT' ? 'DIRECT' : 'COD'),
          payment_label: paymentMethod === 'PAYOS' ? 'PayOS - Đã thanh toán' : (paymentMethod === 'DIRECT' ? 'Thanh toán trực tiếp' : 'COD - Chưa thanh toán'),
          payment_status: paymentMethod === 'PAYOS' ? 'PAID' : 'PENDING',
          status: 'PENDING',
          order_status: 'PENDING',
          status_label: 'CHỜ XÁC NHẬN',
          total_amount: finalTotal,
          items: checkoutItems.map(item => ({
            id: item.id || item.variant_id,
            name: item.title || item.product_name,
            image: resolveOrderItemImage(item),
            size: item.size || 'Size M',
            color: item.colorName || item.color || 'Tiêu chuẩn',
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            collection_tag: 'FALL/WINTER COUTURE ATELIER',
          })),
          stepper: {
            estimated_delivery: 'Dự kiến: Trong 24-48 giờ tới',
            tracking_code: `GHN-VFP-${orderCode}`,
            driver_name: 'Lê Hoàng Nam (Hotline: 0906 234 567)',
            steps: [
              { id: 1, name: 'Xác nhận', time: `${nowStr} Vừa xong`, status: 'completed' },
              { id: 2, name: 'Đóng gói', time: 'Đang chuẩn bị', status: 'completed' },
              { id: 3, name: 'Vận chuyển hỏa tốc', time: 'Đang điều phối', status: 'active' },
              { id: 4, name: 'Nhận hàng', time: 'Dự kiến 1-2 ngày', status: 'pending' },
            ]
          }
        };

        // Lưu thông tin người nhận & địa chỉ vào hồ sơ người dùng để dùng cho những lần đặt sau
        if (user && updateUserProfile) {
          updateUserProfile({
            phone: phone.trim(),
            address: {
              province: selectedProvince,
              district: selectedDistrict,
              ward: selectedWard,
              detail: addressDetail.trim(),
            },
          }).catch(() => {});
        }
        try {
          const addrKey = user ? `user_address_${user.customer_id || user.id || user.email}` : 'guest_saved_address';
          localStorage.setItem(addrKey, JSON.stringify({
            province: selectedProvince,
            district: selectedDistrict,
            ward: selectedWard,
            detail: addressDetail.trim(),
          }));
        } catch (e) {}

        if (paymentMethod === 'PAYOS') {
          // Lưu dữ liệu đơn hàng chờ thanh toán vào sessionStorage
          // TUYỆT ĐỐI KHÔNG ghi vào yf_customer_orders hay yf_manager_orders tại đây!
          // Chỉ khi người dùng thanh toán thành công ở màn hình PayOS (Hình 2) thì mới tính là đơn hàng đặt.
          try {
            sessionStorage.setItem('yf_pending_payos_order', JSON.stringify(newOrderEntry));
            sessionStorage.setItem('yf_pending_checkout_items', JSON.stringify(checkoutItems));
            sessionStorage.setItem('yf_pending_order_code', String(orderCode));
            sessionStorage.setItem('yf_pending_order_summary', JSON.stringify(orderSummary));
          } catch (e) {}

          const payosPaymentInfo = {
            orderNumber,
            orderCode,
            checkoutUrl,
            qrCode: res.data.qrCode,
            accountNumber: res.data.accountNumber || 'VQRQANOVP2204',
            accountName: res.data.accountName || 'TRAN THI KIM NGAN',
            bin: res.data.bin || '970422',
            amount: finalTotal,
            description: res.data.description || `Thanh toan ${orderNumber}`,
            expiresAt: Date.now() + 5 * 60 * 1000,
          };
          try {
            sessionStorage.setItem('yf_current_payos_payment', JSON.stringify(payosPaymentInfo));
          } catch (e) {}

          // Chuyển thẳng sang trang quét mã thanh toán PayOS (giữ nguyên toàn trang quét mã, không dùng popup)
          navigate(`/payment/payos/${orderCode}`, { state: { paymentData: payosPaymentInfo } });
        } else {
          // Phương thức COD: Ghi nhận đơn hàng ngay lập tức
          try {
            sessionStorage.setItem('yf_last_completed_order', JSON.stringify(orderSummary));
            const userOrderKey = user ? `yf_customer_orders_${user.customer_id || user.id || user.email}` : 'yf_customer_orders';
            const mockSet = new Set(['891', '890', '889', '888', '887', '886', '885', '884', '88210', '85420', '79114', '72015', '68192']);
            
            const rawExisting = JSON.parse(localStorage.getItem(userOrderKey) || localStorage.getItem('yf_customer_orders') || '[]');
            const existingOrders = (Array.isArray(rawExisting) ? rawExisting : []).filter(o => {
              const rawId = String(o.order_id || '').trim();
              const rawCode = String(o.order_code || o.order_number || '').replace(/\D/g, '');
              return !mockSet.has(rawId) && !mockSet.has(rawCode);
            });

            const updatedList = [newOrderEntry, ...existingOrders];
            localStorage.setItem(userOrderKey, JSON.stringify(updatedList));
            localStorage.setItem('yf_customer_orders', JSON.stringify(updatedList));
            localStorage.setItem('yf_orders_reset_all_v3', 'true');

            // Đảm bảo đơn hàng mới không bị vướng trong danh sách xóa
            try {
              const rawDel = localStorage.getItem('yf_deleted_order_ids');
              if (rawDel) {
                const delList = JSON.parse(rawDel);
                const orderDigits = String(orderCode).replace(/\D/g, '');
                const filteredDel = delList.filter(d => String(d) !== String(orderCode) && String(d) !== String(orderNumber) && String(d) !== orderDigits);
                localStorage.setItem('yf_deleted_order_ids', JSON.stringify(filteredDel));
              }
            } catch (e) {}

            // Đồng bộ tức thì sang danh sách quản lý đơn hàng của Manager/Admin
            try {
              const rawMgr = localStorage.getItem('yf_manager_orders');
              const mgrExisting = (rawMgr ? JSON.parse(rawMgr) : []).filter(o => {
                const rawId = String(o.order_id || '').trim();
                const rawCode = String(o.order_code || o.order_number || '').replace(/\D/g, '');
                return !mockSet.has(rawId) && !mockSet.has(rawCode);
              });
              localStorage.setItem('yf_manager_orders', JSON.stringify([newOrderEntry, ...mgrExisting]));
            } catch (e) {}
          } catch (e) {}

          // Phương thức COD: Xóa các sản phẩm đã mua khỏi giỏ hàng frontend nếu mua từ giỏ hàng
          const isBuyNowOrder = checkoutItems.some((i) => i.isBuyNow);
          if (!isBuyNowOrder && removePurchasedItems) {
            removePurchasedItems(checkoutItems);
          }

          // Dọn dẹp session checkout
          sessionStorage.removeItem('yf_checkout_voucher');
          sessionStorage.removeItem('yf_checkout_note');
          sessionStorage.removeItem('yf_pending_checkout_items');
          sessionStorage.removeItem('yf_buy_now_item');

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
            <Link to="/cart" className="b-link" onClick={() => sessionStorage.removeItem('yf_buy_now_item')}>GIỎ HÀNG</Link>
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
                  <label className="field-label">
                    HỌ VÀ TÊN <span className="field-required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`field-input ${fullNameError ? 'input-error' : ''}`}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fullNameError) setFullNameError(validateFullName(e.target.value));
                    }}
                    onBlur={() => setFullNameError(validateFullName(fullName))}
                    placeholder="Nhập họ và tên người nhận"
                  />
                  {fullNameError && (
                    <div className="field-error-text">
                      <AlertCircle size={12} />
                      <span>{fullNameError}</span>
                    </div>
                  )}
                </div>
                <div className="field-group">
                  <label className="field-label">
                    SỐ ĐIỆN THOẠI <span className="field-required">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`field-input ${phoneError ? 'input-error' : ''}`}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError(validatePhone(e.target.value));
                    }}
                    onBlur={() => setPhoneError(validatePhone(phone))}
                    placeholder="VD: 0908 123 456"
                  />
                  {phoneError && (
                    <div className="field-error-text">
                      <AlertCircle size={12} />
                      <span>{phoneError}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="field-group mt-14">
                <label className="field-label">
                  ĐỊA CHỈ EMAIL <span className="field-required">*</span>
                </label>
                <input
                  type="email"
                  className={`field-input ${emailError ? 'input-error' : ''}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(validateEmail(e.target.value));
                  }}
                  onBlur={() => setEmailError(validateEmail(email))}
                  placeholder="email@example.com"
                />
                {emailError && (
                  <div className="field-error-text">
                    <AlertCircle size={12} />
                    <span>{emailError}</span>
                  </div>
                )}
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
                  <label className="field-label">
                    TỈNH / THÀNH PHỐ <span className="field-required">*</span>
                  </label>
                  <CustomSelect
                    value={selectedProvince}
                    options={VIETNAM_PROVINCES.map((p) => p.name)}
                    onChange={(val) => handleProvinceChange({ target: { value: val } })}
                    placeholder="-- Chọn Tỉnh / Thành phố --"
                    searchPlaceholder="Tìm kiếm tỉnh thành..."
                    error={Boolean(provinceError)}
                  />
                  {provinceError && (
                    <div className="field-error-text">
                      <AlertCircle size={12} />
                      <span>{provinceError}</span>
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label className="field-label">
                    QUẬN / HUYỆN <span className="field-required">*</span>
                  </label>
                  <CustomSelect
                    value={selectedDistrict}
                    options={currentDistricts.map((d) => d.name)}
                    onChange={(val) => handleDistrictChange({ target: { value: val } })}
                    placeholder={selectedProvince ? '-- Chọn Quận / Huyện --' : '-- Chọn Tỉnh/Thành trước --'}
                    searchPlaceholder="Tìm kiếm quận huyện..."
                    disabled={!selectedProvince}
                    error={Boolean(districtError)}
                  />
                  {districtError && (
                    <div className="field-error-text">
                      <AlertCircle size={12} />
                      <span>{districtError}</span>
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label className="field-label">
                    PHƯỜNG / XÃ <span className="field-required">*</span>
                  </label>
                  <CustomSelect
                    value={selectedWard}
                    options={currentWards}
                    onChange={(val) => {
                      setSelectedWard(val);
                      if (val) setWardError('');
                    }}
                    placeholder={selectedDistrict ? '-- Chọn Phường / Xã --' : '-- Chọn Quận/Huyện trước --'}
                    searchPlaceholder="Tìm kiếm phường xã..."
                    disabled={!selectedDistrict}
                    error={Boolean(wardError)}
                  />
                  {wardError && (
                    <div className="field-error-text">
                      <AlertCircle size={12} />
                      <span>{wardError}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="field-group mt-14">
                <label className="field-label">
                  ĐỊA CHỈ CHI TIẾT (TÒA NHÀ, SỐ NHÀ, TÊN PHỐ) <span className="field-required">*</span>
                </label>
                <input
                  type="text"
                  className={`field-input ${addressDetailError ? 'input-error' : ''}`}
                  value={addressDetail}
                  onChange={(e) => {
                    setAddressDetail(e.target.value);
                    if (e.target.value.trim()) setAddressDetailError('');
                  }}
                  placeholder="Ví dụ: Căn Hộ Penthouse 1802, Tòa Nhà Heritage Plaza, 15 Tràng Tiền"
                />
                {addressDetailError && (
                  <div className="field-error-text">
                    <AlertCircle size={12} />
                    <span>{addressDetailError}</span>
                  </div>
                )}
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
                      <p className="option-desc">Giao trong 2-4 giờ tại nội thành Hà Nội.</p>
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
                        src={resolveOrderItemImage(item)}
                        alt={item.title}
                        className="p-item-thumb-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = resolveOrderItemImage(item);
                        }}
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
                <div className="voucher-empty-left">
                  <Ticket size={17} className="voucher-empty-icon" />
                  <span className="voucher-empty-title">MÃ VOUCHER</span>
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
                <span className="calc-label">Vận Chuyển</span>
                <span className="calc-value font-semibold text-amber-900">MIỄN PHÍ (0đ)</span>
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
                <Link to="/cart" className="link-back-to-cart" onClick={() => sessionStorage.removeItem('yf_buy_now_item')}>
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

        .field-required {
          color: #ef4444;
          margin-left: 3px;
          font-weight: bold;
        }

        .field-input.input-error, .field-select.input-error {
          border-color: #ef4444 !important;
          background-color: #fef2f2 !important;
        }

        .field-error-text {
          color: #ef4444;
          font-size: 11.5px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
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

        /* Custom Dropdown Styling (Opens DOWNWARDS, no overflow) */
        .custom-select-container {
          position: relative;
          width: 100%;
        }

        .custom-select-container.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
        }

        .custom-select-trigger {
          width: 100%;
          height: 42px;
          padding: 0 14px;
          background-color: #f7f6f2;
          border: 1px solid #e7e5e0;
          border-radius: 8px;
          font-size: 13.5px;
          color: #1c1917;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
          transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s;
        }

        .custom-select-trigger:focus,
        .custom-select-trigger.open {
          background-color: #ffffff;
          border-color: #111827;
          outline: none;
          box-shadow: 0 0 0 1px #111827;
        }

        .custom-select-trigger.input-error {
          border-color: #ef4444 !important;
          background-color: #fef2f2 !important;
        }

        .trigger-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .trigger-text.placeholder {
          color: #78716c;
        }

        .select-chevron {
          color: #78716c;
          transition: transform 0.2s ease;
          flex-shrink: 0;
          margin-left: 8px;
        }

        .select-chevron.rotate {
          transform: rotate(180deg);
        }

        /* Menu xổ xuống LUÔN Ở PHÍA DƯỚI, max-height 220px chống tràn màn hình */
        .custom-select-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background-color: #ffffff;
          border: 1px solid #e7e5e0;
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
          z-index: 1000;
          overflow: hidden;
          animation: fadeInDown 0.15s ease-out;
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .select-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-bottom: 1px solid #f0eee6;
          background-color: #faf9f6;
        }

        .select-search-box .search-icon {
          color: #a8a29e;
          flex-shrink: 0;
        }

        .select-search-input {
          width: 100%;
          border: none;
          background: transparent;
          outline: none;
          font-size: 12.5px;
          color: #1c1917;
        }

        .clear-search-btn {
          background: none;
          border: none;
          padding: 2px;
          color: #a8a29e;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .clear-search-btn:hover {
          color: #111827;
        }

        .select-options-list {
          max-height: 220px;
          overflow-y: auto;
          padding: 4px;
        }

        .select-options-list::-webkit-scrollbar {
          width: 5px;
        }

        .select-options-list::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .select-options-list::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .select-options-list::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .select-option-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          font-size: 13px;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.12s;
        }

        .select-option-item:hover {
          background-color: #f5f5f4;
          color: #111827;
        }

        .select-option-item.selected {
          background-color: #f4f3ef;
          font-weight: 600;
          color: #111827;
        }

        .select-option-item .check-icon {
          color: #111827;
          flex-shrink: 0;
        }

        .no-options-found {
          padding: 14px 12px;
          text-align: center;
          font-size: 12.5px;
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
          padding: 13px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .voucher-empty-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .voucher-empty-icon {
          color: #92400e;
          flex-shrink: 0;
        }

        .voucher-empty-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #44403c;
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
