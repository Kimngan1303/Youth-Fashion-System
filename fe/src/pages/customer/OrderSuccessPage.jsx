import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  CreditCard,
  Check,
  Copy,
  PackageCheck,
  Truck,
  Sparkles,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { resolveOrderItemImage } from '../../utils/productImageUtils';

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get('orderCode');
  const orderNumberParam = searchParams.get('orderNumber');
  const isSimulated = searchParams.get('simulated') === 'true';
  const payosStatusParam = searchParams.get('status');

  // Nếu người dùng hủy thanh toán hoặc quá thời gian 5 phút bị điều hướng nhầm vào đây, tự động chuyển về trang checkout
  useEffect(() => {
    const isCanceled =
      searchParams.get('cancel') === 'true' ||
      searchParams.get('canceled') === 'true' ||
      payosStatusParam === 'CANCELLED' ||
      payosStatusParam === 'EXPIRED';

    if (isCanceled) {
      navigate(`/checkout?${searchParams.toString()}`, { replace: true });
    }
  }, [searchParams, payosStatusParam, navigate]);

  const { user, setCart, removePurchasedItems } = useAuth();
  const [copied, setCopied] = useState(false);

  // Khởi tạo ngay lập tức từ sessionStorage (nếu có) để tránh màn hình bị chớp/trắng khi tải
  const [order, setOrder] = useState(() => {
    try {
      const cached = sessionStorage.getItem('yf_last_completed_order');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          !orderNumberParam ||
          parsed.order_number === orderNumberParam ||
          parsed.orderCode === Number(orderCode)
        ) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  const [paymentStatus, setPaymentStatus] = useState(() => {
    if (payosStatusParam === 'PAID') return 'PAID';
    if (order?.payment_method === 'COD' || order?.payments?.[0]?.payment_method === 'COD') {
      return 'COD';
    }
    return 'PENDING';
  });

  const [loading, setLoading] = useState(true);

  // Truy vấn chi tiết đơn hàng từ server và kiểm tra cổng PayOS
  useEffect(() => {
    const fetchOrderAndCheckPayos = async () => {
      try {
        const orderNumber = orderNumberParam || (orderCode ? `YF-${orderCode}` : null);
        if (orderNumber) {
          try {
            const res = await orderService.getOrderByNumber(orderNumber);
            if (res?.data) {
              setOrder(res.data);
              if (res.data.payments?.[0]?.payment_method === 'COD') {
                setPaymentStatus('COD');
              } else if (res.data.payments?.[0]?.payment_status === 'SUCCESS') {
                setPaymentStatus('PAID');
              }
            }
          } catch (e) {
            console.warn('Không tìm thấy thông tin đơn hàng từ API:', e);
          }
        }

        // Nếu có orderCode (từ cổng PayOS chuyển về), gọi API tra cứu trạng thái giao dịch
        if (orderCode) {
          try {
            const statusRes = await orderService.checkPayosStatus(orderCode);
            if (statusRes?.data?.status === 'PAID' || isSimulated || payosStatusParam === 'PAID') {
              setPaymentStatus('PAID');
            } else {
              setPaymentStatus(statusRes?.data?.status || 'PENDING');
            }
          } catch (err) {
            console.warn('Lỗi khi tra cứu PayOS status:', err);
            if (isSimulated || payosStatusParam === 'PAID') {
              setPaymentStatus('PAID');
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndCheckPayos();
  }, [orderCode, orderNumberParam, isSimulated, payosStatusParam]);

  // Xóa các sản phẩm đã thanh toán thành công khỏi giỏ hàng
  useEffect(() => {
    if (paymentStatus === 'PAID' || payosStatusParam === 'PAID' || paymentStatus === 'COD' || order?.payments?.[0]?.payment_method === 'COD') {
      let itemsToRemove = [];
      try {
        const pendingItems = JSON.parse(sessionStorage.getItem('yf_pending_checkout_items') || '[]');
        if (Array.isArray(pendingItems) && pendingItems.length > 0) {
          itemsToRemove = pendingItems;
        }
      } catch (e) {}

      if (itemsToRemove.length === 0 && order?.order_items?.length > 0) {
        itemsToRemove = order.order_items;
      }

      if (itemsToRemove.length > 0 && removePurchasedItems) {
        removePurchasedItems(itemsToRemove);
      }

      sessionStorage.removeItem('yf_checkout_voucher');
      sessionStorage.removeItem('yf_checkout_note');
      sessionStorage.removeItem('yf_pending_checkout_items');
      sessionStorage.removeItem('yf_buy_now_item');
    }
  }, [paymentStatus, payosStatusParam, order, removePurchasedItems]);

  // Khi thanh toán PayOS thành công (Hình 2): Chính thức ghi nhận đơn hàng vào danh sách đơn của Khách hàng và Quản lý
  useEffect(() => {
    if ((paymentStatus === 'PAID' || payosStatusParam === 'PAID') && (order || orderCode)) {
      try {
        const orderCodeStr = String(orderCode || order?.order_id || '').replace(/\D/g, '');
        const targetNumber = order?.order_number || orderNumberParam || `YF-${orderCodeStr}`;

        let pendingData = null;
        try {
          const rawPending = sessionStorage.getItem('yf_pending_payos_order');
          if (rawPending) pendingData = JSON.parse(rawPending);
        } catch (e) {}

        const nowStr = new Date().toLocaleDateString('vi-VN');
        const userOrderKey = user ? `yf_customer_orders_${user.customer_id || user.id || user.email}` : 'yf_customer_orders';

        const finalOrderEntry = {
          ...(pendingData || {}),
          order_id: String(order?.order_id || orderCodeStr),
          order_number: targetNumber,
          order_code: targetNumber.startsWith('YF') ? targetNumber : `YF - ${targetNumber}`,
          payment_method: 'PAYOS',
          payment_label: 'PayOS - Đã thanh toán',
          payment_status: 'PAID',
          status: 'PENDING',
          order_status: 'PENDING',
          status_label: 'CHỜ XÁC NHẬN',
          total_amount: Number(order?.total_amount || pendingData?.total_amount || 0),
          created_at: pendingData?.created_at || nowStr,
          created_date: pendingData?.created_date || new Date().toISOString(),
          recipient_name: order?.recipient_name || order?.customer?.full_name || pendingData?.recipient_name || user?.full_name || 'Khách hàng',
          recipient_phone: order?.recipient_phone || order?.customer?.phone || pendingData?.recipient_phone || user?.phone || '090****000',
          recipient_email: order?.recipient_email || order?.customer?.email || pendingData?.recipient_email || user?.email || '',
          address: order?.shipping_address_line || pendingData?.address || '',
          shipping_address: order?.shipping_address_line || pendingData?.shipping_address || '',
          items: (order?.order_items || pendingData?.items || []).map((it) => ({
            id: it.order_item_id || it.variant_id || it.id,
            name: it.product_name || it.name,
            image: resolveOrderItemImage(it),
            size: it.size ? (String(it.size).startsWith('Size') ? it.size : `Size ${it.size}`) : 'Size M',
            color: it.color ? (String(it.color).startsWith('Màu') ? it.color : `Màu ${it.color}`) : 'Tiêu chuẩn',
            quantity: Number(it.quantity || 1),
            price: Number(it.unit_price || it.price || 0),
          })),
        };

        const mockSet = new Set(['891', '890', '889', '888', '887', '886', '885', '884', '88210', '85420', '79114', '72015', '68192']);

        // Lưu vào danh sách đơn của khách hàng
        const rawCust = JSON.parse(localStorage.getItem(userOrderKey) || localStorage.getItem('yf_customer_orders') || '[]');
        const existingCust = (Array.isArray(rawCust) ? rawCust : []).filter(o => {
          const rawId = String(o.order_id || '').trim();
          const rawCode = String(o.order_code || o.order_number || '').replace(/\D/g, '');
          return !mockSet.has(rawId) && !mockSet.has(rawCode) && rawId !== String(order?.order_id) && rawCode !== orderCodeStr;
        });
        const updatedCust = [finalOrderEntry, ...existingCust];
        localStorage.setItem(userOrderKey, JSON.stringify(updatedCust));
        localStorage.setItem('yf_customer_orders', JSON.stringify(updatedCust));
        localStorage.setItem('yf_orders_reset_all_v3', 'true');

        // Lưu vào danh sách quản lý đơn hàng của Admin / Manager
        const rawMgr = JSON.parse(localStorage.getItem('yf_manager_orders') || '[]');
        const existingMgr = (Array.isArray(rawMgr) ? rawMgr : []).filter(o => {
          const rawId = String(o.order_id || '').trim();
          const rawCode = String(o.order_code || o.order_number || '').replace(/\D/g, '');
          return !mockSet.has(rawId) && !mockSet.has(rawCode) && rawId !== String(order?.order_id) && rawCode !== orderCodeStr;
        });
        localStorage.setItem('yf_manager_orders', JSON.stringify([finalOrderEntry, ...existingMgr]));

        // Xóa đơn này khỏi danh sách đơn đã xóa (nếu có lỡ lưu trước đó)
        try {
          const rawDel = localStorage.getItem('yf_deleted_order_ids');
          if (rawDel) {
            const delList = JSON.parse(rawDel);
            const filteredDel = delList.filter(d => String(d) !== String(order?.order_id) && String(d) !== targetNumber && String(d) !== orderCodeStr);
            localStorage.setItem('yf_deleted_order_ids', JSON.stringify(filteredDel));
          }
        } catch (e) {}

        sessionStorage.setItem('yf_last_completed_order', JSON.stringify(finalOrderEntry));
        sessionStorage.removeItem('yf_pending_payos_order');
        sessionStorage.removeItem('yf_pending_order_code');

        window.dispatchEvent(new Event('order_status_updated'));
        window.dispatchEvent(new Event('yf_order_status_changed'));
      } catch (e) {
        console.error('Lỗi khi lưu đơn hàng PayOS thành công:', e);
      }
    }
  }, [paymentStatus, payosStatusParam, order, orderCode, orderNumberParam, user]);

  const displayOrderNumber =
    order?.order_number || orderNumberParam || (orderCode ? `YF-${orderCode}` : 'YF-ORDER');

  const handleCopyOrderNumber = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(displayOrderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPaidViaPayos = paymentStatus === 'PAID' || payosStatusParam === 'PAID';
  const isCod =
    order?.payment_method === 'COD' ||
    order?.payments?.[0]?.payment_method === 'COD' ||
    paymentStatus === 'COD';

  return (
    <div className="order-success-page">
      {/* 1. Header Breadcrumbs */}
      <div className="checkout-top-nav-bar no-print">
        <div className="checkout-container">
          <nav className="checkout-breadcrumb">
            <Link to="/" className="b-link">TRANG CHỦ</Link>
            <span className="b-sep">&gt;</span>
            <Link to="/cart" className="b-link">GIỎ HÀNG</Link>
            <span className="b-sep">&gt;</span>
            <span className="b-current">XÁC NHẬN ĐƠN HÀNG</span>
          </nav>
        </div>
      </div>

      <div className="checkout-container main-content-wrap">
        {/* 2. Stepper Progress Bar (Bước 03 Hoàn Tất) */}
        <div className="checkout-stepper-row no-print">
          {/* Bước 01: Giỏ Hàng đã xong */}
          <div className="step-pill step-completed">
            <span className="step-icon-circle checked">
              <Check size={14} strokeWidth={3} />
            </span>
            <div className="step-text-group">
              <span className="step-label">BƯỚC 01</span>
              <span className="step-title">Giỏ Hàng</span>
            </div>
          </div>

          {/* Bước 02: Thanh Toán đã xong */}
          <div className="step-pill step-completed">
            <span className="step-icon-circle checked">
              <Check size={14} strokeWidth={3} />
            </span>
            <div className="step-text-group">
              <span className="step-label">BƯỚC 02</span>
              <span className="step-title">Thanh Toán</span>
            </div>
          </div>

          {/* Bước 03: Hoàn tất đơn hàng (ACTIVE ĐANG CHỌN) */}
          <div className="step-pill step-active">
            <span className="step-number-circle">03</span>
            <div className="step-text-group">
              <span className="step-label">HOÀN TẤT</span>
              <span className="step-title">Xác Nhận Đơn Hàng</span>
            </div>
          </div>
        </div>

        {/* 3. Tiêu đề xác nhận */}
        <div className="header-confirmation-area text-center">
          <h1 className="checkout-page-title font-serif">Xác Nhận Đơn Hàng</h1>
          <p className="checkout-page-desc text-stone-500 text-sm">
            Hệ thống Youth Fashion đã ghi nhận đơn hàng và đang chuẩn bị đóng gói theo tiêu chuẩn cao cấp.
          </p>
        </div>

        {/* 4. Thẻ nội dung thông báo thành công chính */}
        <div className="success-content-card">
          {/* Animated Success Badge */}
          <div className="success-icon-badge-box">
            <div className="success-icon-pulse-ring">
              <CheckCircle2 size={54} className="text-emerald-700" strokeWidth={2} />
            </div>
          </div>

          <h2 className="success-hero-title font-serif">ĐƠN HÀNG ĐÃ ĐẶT THÀNH CÔNG!</h2>
          <p className="success-hero-desc">
            Cảm ơn quý khách đã tin tưởng và lựa chọn thiết kế của{' '}
            <strong className="font-semibold text-stone-900">Youth Fashion</strong>. Đơn hàng đang được bộ phận vận hành tiến hành xử lý ưu tiên.
          </p>

          {/* Row chứa Mã đơn hàng & Badge thanh toán */}
          <div className="order-tags-row">
            <div className="badge-order-number-wrap">
              <span className="badge-order-number">MÃ ĐƠN HÀNG: {displayOrderNumber}</span>
              <button
                type="button"
                className="btn-copy-code"
                onClick={handleCopyOrderNumber}
                title="Sao chép mã đơn hàng"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            {isPaidViaPayos ? (
              <span className="badge-payment-status badge-paid">
                <Check size={13} strokeWidth={2.5} />
                <span>ĐÃ THANH TOÁN QUA PAYOS (VIETQR)</span>
              </span>
            ) : isCod ? (
              <span className="badge-payment-status badge-cod">
                <Truck size={13} />
                <span>THANH TOÁN KHI NHẬN HÀNG (COD)</span>
              </span>
            ) : (
              <span className="badge-payment-status badge-pending">
                <Clock size={13} />
                <span>ĐANG CHỜ XÁC NHẬN THANH TOÁN</span>
              </span>
            )}
          </div>

          {/* Banner thời gian giao hàng dự kiến */}
          <div className="delivery-estimate-banner">
            <div className="estimate-left">
              <Clock size={18} className="text-stone-700" />
              <span>
                Thời gian giao hàng dự kiến: <strong>2 - 4 giờ</strong> (Hỏa tốc nội thành Hà Nội) hoặc <strong>2 - 3 ngày</strong> (Toàn quốc).
              </span>
            </div>
            <span className="estimate-tag">Miễn Phí Vận Chuyển</span>
          </div>

          {/* 3 Cột Thông Tin Đơn Hàng */}
          {order && (
            <div className="order-details-grid-card">
              <div className="details-col">
                <div className="col-header">
                  <MapPin size={15} className="col-icon" />
                  <span className="col-title">NGƯỜI NHẬN HÀNG</span>
                </div>
                <div className="col-body">
                  <div className="field-val-primary">{order.recipient_name || 'Quý khách'}</div>
                  <div className="field-val-sub">{order.recipient_phone || 'Chưa có SĐT'}</div>
                  {order.recipient_email && (
                    <div className="field-val-sub text-stone-500">{order.recipient_email}</div>
                  )}
                </div>
              </div>

              <div className="details-col">
                <div className="col-header">
                  <Truck size={15} className="col-icon" />
                  <span className="col-title">ĐỊA CHỈ NHẬN HÀNG</span>
                </div>
                <div className="col-body">
                  <div className="field-val-primary">
                    {[
                      order.shipping_address_line,
                      order.shipping_ward,
                      order.shipping_district,
                      order.shipping_city,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                  <div className="field-val-sub text-emerald-800 font-medium">
                    Giao Hàng Hỏa Tốc (Miễn phí)
                  </div>
                </div>
              </div>

              <div className="details-col">
                <div className="col-header">
                  <CreditCard size={15} className="col-icon" />
                  <span className="col-title">PHƯƠNG THỨC THANH TOÁN</span>
                </div>
                <div className="col-body">
                  <div className="field-val-primary">
                    {isPaidViaPayos
                      ? 'Cổng PayOS (Chuyển khoản VietQR Pro)'
                      : 'Thanh Toán Khi Nhận Hàng (COD)'}
                  </div>
                  <div className="field-val-sub">
                    Trạng thái:{' '}
                    <strong className={isPaidViaPayos ? 'text-emerald-700' : 'text-amber-800'}>
                      {isPaidViaPayos ? 'Đã hoàn tất thanh toán' : 'Chờ đồng kiểm & thu tiền khi giao'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Danh sách sản phẩm trong đơn hàng */}
          {order?.order_items && order.order_items.length > 0 && (
            <div className="order-items-table-card">
              <div className="items-table-header">
                <PackageCheck size={16} className="text-stone-700" />
                <span className="table-heading-title">
                  CHI TIẾT SẢN PHẨM ({order.order_items.length} SẢN PHẨM)
                </span>
              </div>

              <div className="items-rows-wrap">
                {order.order_items.map((item, idx) => {
                  const itemImg = resolveOrderItemImage(item);
                  return (
                    <div key={item.order_item_id || idx} className="order-item-detail-row">
                      <img
                        src={itemImg}
                        alt={item.product_name || item.name}
                        className="item-detail-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = resolveOrderItemImage(item);
                        }}
                      />
                      <div className="item-detail-meta">
                        <h4 className="item-detail-name">{item.product_name}</h4>
                        <div className="item-detail-specs">
                          <span>Màu: <strong>{item.color || 'Màu tiêu chuẩn'}</strong></span>
                          <span className="dot-sep">•</span>
                          <span>Size: <strong>{item.size || 'M'}</strong></span>
                          {item.sku && (
                            <>
                              <span className="dot-sep">•</span>
                              <span className="text-stone-400">SKU: {item.sku}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="item-detail-pricing">
                        <span className="item-detail-qty">SL: {item.quantity || 1}</span>
                        <span className="item-detail-total font-semibold">
                          {Number(item.subtotal || (item.unit_price * (item.quantity || 1)) || 0).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bảng chi tiết tài chính */}
              <div className="order-financial-breakdown">
                <div className="fin-row">
                  <span className="fin-label">Tổng giá trị hàng</span>
                  <span className="fin-val">
                    {Number(
                      order.raw_subtotal ||
                        order.order_items?.reduce((s, i) => s + Number(i.subtotal || i.unit_price * i.quantity || 0), 0) ||
                        order.total_amount ||
                        0
                    ).toLocaleString('vi-VN')}đ
                  </span>
                </div>

                {(order.voucher_discount || order.discount_amount) > 0 && (
                  <div className="fin-row text-amber-800">
                    <span className="fin-label">Ưu đãi giảm giá Voucher</span>
                    <span className="fin-val font-semibold">
                      -{Number(order.voucher_discount || order.discount_amount).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}

                <div className="fin-row">
                  <span className="fin-label">Vận chuyển VIP</span>
                  <span className="fin-val text-emerald-700 font-semibold">MIỄN PHÍ (0đ)</span>
                </div>

                <div className="fin-row fin-total-row">
                  <span className="fin-label-total">TỔNG CỘNG THANH TOÁN</span>
                  <span className="fin-val-total font-serif">
                    {Number(order.total_amount || 0).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Các nút hành động chính (QUAY VỀ MUA SẮM TIẾP) */}
          <div className="success-action-buttons-wrap no-print">
            <Link to="/products" className="btn-action-primary">
              <ShoppingBag size={18} />
              <span>QUAY VỀ MUA SẮM TIẾP</span>
            </Link>

            <Link to="/profile?tab=orders" className="btn-action-secondary">
              <span>XEM LỊCH SỬ ĐƠN HÀNG</span>
              <ArrowRight size={17} />
            </Link>
          </div>

          {/* Cam kết thương hiệu */}
          <div className="success-trust-badges-row no-print">
            <div className="trust-pill">
              <ShieldCheck size={16} className="text-stone-700" />
              <span>Bảo mật tuyệt đối</span>
            </div>
            <div className="trust-pill">
              <Sparkles size={16} className="text-stone-700" />
              <span>Sản phẩm may thủ công cao cấp</span>
            </div>
            <div className="trust-pill">
              <Clock size={16} className="text-stone-700" />
              <span>Đổi trả miễn phí 30 ngày</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .order-success-page {
          background-color: #faf9f5;
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1c1917;
          padding-bottom: 90px;
        }

        .checkout-top-nav-bar {
          background-color: #ffffff;
          border-bottom: 1px solid #f0eee6;
          padding: 14px 0;
        }

        .checkout-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .main-content-wrap {
          padding-top: 24px;
        }

        .checkout-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .checkout-breadcrumb .b-link {
          color: #78716c;
          text-decoration: none;
          transition: color 0.15s;
        }

        .checkout-breadcrumb .b-link:hover {
          color: #000000;
        }

        .checkout-breadcrumb .b-sep {
          color: #d6d3d1;
          font-size: 10px;
        }

        .checkout-breadcrumb .b-current {
          color: #000000;
          font-weight: 700;
        }

        /* Stepper khớp pixel-perfect */
        .checkout-stepper-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 10px;
          margin-bottom: 26px;
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

        .header-confirmation-area {
          margin-bottom: 28px;
        }

        .checkout-page-title {
          font-size: 28px;
          letter-spacing: 0.02em;
          color: #1c1917;
          margin-bottom: 6px;
        }

        .checkout-page-desc {
          margin: 0;
        }

        /* Thẻ nội dung chính */
        .success-content-card {
          background-color: #ffffff;
          border: 1px solid #eeece5;
          border-radius: 16px;
          padding: 44px 38px;
          box-shadow: 0 3px 20px rgba(0,0,0,0.03);
          text-align: center;
        }

        @media (max-width: 640px) {
          .success-content-card {
            padding: 30px 18px;
          }
        }

        .success-icon-badge-box {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .success-icon-pulse-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #ecfdf5;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.12);
        }

        .success-hero-title {
          font-size: 30px;
          letter-spacing: 0.04em;
          color: #111827;
          margin-bottom: 8px;
        }

        .success-hero-desc {
          font-size: 14.5px;
          color: #78716c;
          max-width: 620px;
          margin: 0 auto 24px;
          line-height: 1.6;
        }

        .order-tags-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }

        .badge-order-number-wrap {
          display: flex;
          align-items: center;
          background-color: #f5f5f4;
          border: 1px solid #e7e5e4;
          border-radius: 9999px;
          padding: 3px 6px 3px 14px;
        }

        .badge-order-number {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #1c1917;
          margin-right: 8px;
        }

        .btn-copy-code {
          background: #ffffff;
          border: 1px solid #d6d3d1;
          color: #44403c;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-copy-code:hover {
          background-color: #000000;
          color: #ffffff;
          border-color: #000000;
        }

        .badge-payment-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 6px 14px;
          border-radius: 9999px;
        }

        .badge-paid {
          background-color: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .badge-cod {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .badge-pending {
          background-color: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .delivery-estimate-banner {
          background-color: #fdfbf7;
          border: 1px solid #f3eedf;
          border-radius: 10px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          text-align: left;
          font-size: 13px;
          color: #44403c;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .estimate-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .estimate-tag {
          background-color: #f3efe6;
          color: #78716c;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 6px;
        }

        /* 3 Cột Thông tin */
        .order-details-grid-card {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          background-color: #fbfbf9;
          border: 1px solid #f0eee8;
          border-radius: 12px;
          padding: 22px;
          text-align: left;
          margin-bottom: 28px;
        }

        @media (max-width: 768px) {
          .order-details-grid-card {
            grid-template-columns: 1fr;
          }
        }

        .details-col {
          display: flex;
          flex-direction: column;
        }

        .col-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        .col-icon {
          color: #78716c;
        }

        .col-title {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #78716c;
        }

        .field-val-primary {
          font-size: 13.5px;
          font-weight: 600;
          color: #1c1917;
          line-height: 1.4;
        }

        .field-val-sub {
          font-size: 12px;
          color: #78716c;
          margin-top: 3px;
          line-height: 1.4;
        }

        /* Bảng sản phẩm */
        .order-items-table-card {
          background-color: #ffffff;
          border: 1px solid #edebe3;
          border-radius: 12px;
          padding: 20px;
          text-align: left;
          margin-bottom: 34px;
        }

        .items-table-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f0eee6;
          margin-bottom: 14px;
        }

        .table-heading-title {
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #44403c;
        }

        .items-rows-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-item-detail-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 12px;
          border-bottom: 1px dashed #f0eee6;
        }

        .order-item-detail-row:last-child {
          border-bottom: none;
          padding-bottom: 4px;
        }

        .item-detail-img {
          width: 54px;
          height: 68px;
          object-fit: cover;
          border-radius: 6px;
          background-color: #f5f5f4;
          border: 1px solid #e7e5e4;
          flex-shrink: 0;
        }

        .item-detail-meta {
          flex: 1;
          min-width: 0;
        }

        .item-detail-name {
          font-size: 13px;
          font-weight: 600;
          color: #1c1917;
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-detail-specs {
          font-size: 11.5px;
          color: #78716c;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .dot-sep {
          color: #d6d3d1;
        }

        .item-detail-pricing {
          text-align: right;
          flex-shrink: 0;
        }

        .item-detail-qty {
          display: block;
          font-size: 11px;
          color: #a8a29e;
          margin-bottom: 2px;
        }

        .item-detail-total {
          font-size: 13.5px;
          color: #111827;
        }

        /* Chi tiết tài chính */
        .order-financial-breakdown {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid #f0eee6;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .fin-row {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          color: #57534e;
        }

        .fin-total-row {
          margin-top: 6px;
          padding-top: 12px;
          border-top: 1px solid #e7e5e4;
          font-size: 14px;
        }

        .fin-label-total {
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #111827;
        }

        .fin-val-total {
          font-size: 22px;
          font-weight: 700;
          color: #000000;
        }

        /* Các nút bấm hành động */
        .success-action-buttons-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .btn-action-primary {
          background-color: #000000;
          color: #ffffff;
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
          transition: all 0.2s;
        }

        .btn-action-primary:hover {
          background-color: #27272a;
          transform: translateY(-1px);
        }

        .btn-action-secondary {
          background-color: #ffffff;
          color: #1c1917;
          border: 1px solid #d6d3d1;
          padding: 14px 26px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
        }

        .btn-action-secondary:hover {
          background-color: #f5f5f4;
          border-color: #a8a29e;
        }

        .btn-action-outline {
          background-color: transparent;
          color: #57534e;
          border: 1px solid #e7e5e4;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-action-outline:hover {
          background-color: #f5f5f4;
          color: #1c1917;
        }

        .success-trust-badges-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          padding-top: 20px;
          border-top: 1px solid #f2f0ea;
        }

        .trust-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #78716c;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          .order-success-page {
            background-color: #ffffff;
            padding: 0;
          }
          .success-content-card {
            border: none;
            box-shadow: none;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
