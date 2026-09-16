import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  User, Package, Lock, Heart, LogOut, CheckCircle, 
  Camera, MapPin, Calendar, Clock, CreditCard, ChevronRight, AlertCircle, Tag, Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

const ProfilePage = () => {
  const { user, updateUserProfile, orders, wishlist } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'info';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  
  // Form State initialized from user context
  const [formData, setFormData] = useState({
    full_name: user?.full_name || 'Nguyễn Hoàng Thảo My',
    phone: user?.phone || '0908 123 456',
    email: user?.email || 'thaomy.nguyen@atelier-youth.vn',
    avatar_url: user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    gender: user?.gender || 'Nữ',
    dob: user?.dob || '10/18/1994',
    province: user?.address?.province || 'Thành phố Hồ Chí Minh',
    district: user?.address?.district || 'Quận 1',
    ward: user?.address?.ward || 'Phường Bến Nghé',
    detailAddress: user?.address?.detail || 'Số 154, Đường Đồng Khởi'
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const fileInputRef = useRef(null);

  const handleAvatarFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatarUrl = reader.result;
        setFormData(prev => ({ ...prev, avatar_url: newAvatarUrl }));
        if (updateUserProfile) {
          updateUserProfile({ avatar_url: newAvatarUrl });
        }
        setSaveSuccessMsg('Đã cập nhật ảnh đại diện mới thành công!');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Password State
  const [passData, setPassData] = useState({ currentPass: '', newPass: '', confirmPass: '' });
  const [passMsg, setPassMsg] = useState('');

  // Synchronize when tab query param changes
  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab'));
    }
  }, [searchParams]);

  // Keep form data synced if user context updates
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || prev.full_name,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        avatar_url: user.avatar_url || prev.avatar_url,
        gender: user.gender || prev.gender,
        dob: user.dob || prev.dob
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUserProfile({
      full_name: formData.full_name,
      phone: formData.phone,
      gender: formData.gender,
      dob: formData.dob,
      address: {
        province: formData.province,
        district: formData.district,
        ward: formData.ward,
        detail: formData.detailAddress
      }
    });

    setSaveSuccessMsg('Đã cập nhật thông tin hồ sơ cá nhân thành công!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handlePassChange = (e) => {
    e.preventDefault();
    if (passData.newPass !== passData.confirmPass) {
      setPassMsg('Mật khẩu mới xác nhận không khớp!');
      return;
    }
    setPassMsg('Đã đổi mật khẩu thành công!');
    setPassData({ currentPass: '', newPass: '', confirmPass: '' });
    setTimeout(() => setPassMsg(''), 4000);
  };

  const handleCopyVoucher = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  // Vouchers List matching design "4 MÃ"
  const vouchersList = [
    {
      code: 'YOUTH-VIP10',
      title: 'Chiết khấu 10% Đặc Quyền VIP',
      desc: 'Áp dụng cho mọi đơn hàng thời trang nguyên giá.',
      expiry: 'Hạn dùng: 31/12/2026',
      badge: 'Đặc quyền VIP'
    },
    {
      code: 'ATELIER-500K',
      title: 'Giảm 500.000đ cho đơn từ 3.000.000đ',
      desc: 'Áp dụng cho bộ sưu tập Fall/Winter Atelier mới nhất.',
      expiry: 'Hạn dùng: 15/10/2026',
      badge: 'Bộ Sưu Tập Mới'
    },
    {
      code: 'BDAY-2026',
      title: 'Quà Tặng Sinh Nhật 1.000.000đ',
      desc: 'Dành riêng cho thành viên VIP trong tháng sinh nhật.',
      expiry: 'Hạn dùng: Tháng sinh nhật',
      badge: 'Sinh Nhật VIP'
    },
    {
      code: 'FREESHIP-PREMIUM',
      title: 'Miễn Phí Vận Chuyển Hỏa Tốc',
      desc: 'Áp dụng cho mọi đơn hàng không giới hạn giá trị.',
      expiry: 'Hạn dùng: Vô thời hạn',
      badge: 'Vận Chuyển'
    }
  ];

  // Helper Countdown timer component for 5-minute payment deadline
  const CountdownTimer = ({ deadline }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
      if (!deadline) return;
      const targetTime = new Date(deadline).getTime();

      const updateTimer = () => {
        const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
        setTimeLeft(diff);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }, [deadline]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    if (timeLeft <= 0) {
      return <span className="timer-expired">Hết thời hạn thanh toán</span>;
    }

    return (
      <span className="timer-active">
        <Clock size={14} /> Còn {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} để thanh toán
      </span>
    );
  };

  // Filter orders by status
  const filteredOrders = orders.filter(ord => {
    if (orderStatusFilter === 'ALL') return true;
    return ord.status === orderStatusFilter;
  });

  return (
    <div className="profile-page-bg">
      {/* 1. Breadcrumbs Bar */}
      <div className="profile-breadcrumb-bar">
        <div className="container profile-breadcrumb-content">
          <Link to="/" className="bc-link">TRANG CHỦ</Link>
          <span className="bc-sep">&gt;</span>
          <span className="bc-link">TÀI KHOẢN CỦA TÔI</span>
          <span className="bc-sep">&gt;</span>
          <span className="bc-current">HỒ SƠ CÁ NHÂN</span>
        </div>
      </div>

      <div className="container main-profile-wrapper">
        {/* 2. Top Luxury Membership Header Banner */}
        <div className="profile-hero-banner">
          <div className="hero-banner-left">
            <div className="hero-avatar-box" title="Bấm để thay đổi ảnh đại diện">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleAvatarFileChange} 
                style={{ display: 'none' }} 
              />
              <img 
                src={formData.avatar_url} 
                alt={user?.full_name || 'Nguyễn Hoàng Thảo My'} 
                className="hero-avatar-img" 
                onClick={() => fileInputRef.current?.click()}
              />
              <button 
                type="button" 
                className="avatar-change-btn" 
                onClick={() => fileInputRef.current?.click()}
                title="Thay đổi ảnh đại diện"
              >
                <Camera size={13} />
              </button>
            </div>

            <div className="hero-info-content">
              <div className="hero-subtitle">
                <span className="gold-text-hero">THÀNH VIÊN ĐẶC QUYỀN</span> <span className="dot">•</span> {user?.member_since || 'Từ Tháng 03/2023'}
              </div>
              <h1 className="hero-user-name font-serif">{user?.full_name || 'Nguyễn Hoàng Thảo My'}</h1>
              <div className="hero-tier-pill">
                <span className="tier-medal">🏅</span>
                <span>{user?.tier || 'VIP GOLD ATELIER MEMBER'}</span>
              </div>
            </div>
          </div>

          <div className="hero-banner-right">
            <div className="stats-box">
              <div className="stat-col">
                <span className="stat-label">TỔNG CHI TIÊU</span>
                <span className="stat-value">{user?.total_spent || '34.5M'}</span>
                <span className="stat-sub gold-sub">{user?.discount || 'Chiết khấu 10% trọn đời'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Content Grid (Sidebar + Right Content) */}
        <div className="profile-content-grid">
          {/* Left Sidebar */}
          <aside className="profile-sidebar-card">
            <h4 className="sidebar-header-title">TRUNG TÂM QUẢN TRỊ KHÁCH HÀNG</h4>

            <div className="sidebar-nav-list">
              {/* Menu Item 1: Hồ Sơ Cá Nhân */}
              <button 
                className={`nav-item-btn ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <div className="nav-item-left">
                  <User size={18} />
                  <span>HỒ SƠ CÁ NHÂN</span>
                </div>
                {activeTab === 'info' && <ChevronRight size={16} className="active-arrow" />}
              </button>

              {/* Menu Item 2: Lịch Sử Đơn Hàng */}
              <button 
                className={`nav-item-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <div className="nav-item-left">
                  <Package size={18} />
                  <span>LỊCH SỬ ĐƠN HÀNG</span>
                </div>
                <span className="nav-badge-pill grey-badge">
                  {orders.length > 0 ? String(orders.length).padStart(2, '0') : '0'}
                </span>
              </button>

              {/* Menu Item 3: Voucher & Mã Ưu Đãi */}
              <button 
                className={`nav-item-btn ${activeTab === 'vouchers' ? 'active' : ''}`}
                onClick={() => setActiveTab('vouchers')}
              >
                <div className="nav-item-left">
                  <Tag size={18} />
                  <span>VOUCHER & MÃ ƯU ĐÃI</span>
                </div>
                <span className="nav-badge-pill gold-badge">4 MÃ</span>
              </button>

              {/* Menu Item 4: Đổi Mật Khẩu */}
              <button 
                className={`nav-item-btn ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                <div className="nav-item-left">
                  <Lock size={18} />
                  <span>ĐỔI MẬT KHẨU</span>
                </div>
                {activeTab === 'password' && <ChevronRight size={16} className="active-arrow" />}
              </button>

              {/* Menu Item 5: Đăng Xuất */}
              <button 
                className="nav-item-btn logout-item-btn"
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
                    alert('Đã đăng xuất tài khoản!');
                  }
                }}
              >
                <div className="nav-item-left text-danger">
                  <LogOut size={18} />
                  <span>ĐĂNG XUẤT</span>
                </div>
              </button>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="profile-main-card">
            {/* TAB 1: Thông Tin Cá Nhân */}
            {activeTab === 'info' && (
              <div className="content-inner animate-fade-in">
                <div className="content-title-header">
                  <h2 className="content-main-heading font-serif">Thông Tin Cá Nhân</h2>
                  <p className="content-sub-heading">Cập nhật hồ sơ định danh và thông tin liên hệ bảo mật</p>
                </div>

                {saveSuccessMsg && (
                  <div className="profile-alert alert-success">
                    <CheckCircle size={16} /> {saveSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="profile-form">
                  <div className="form-fields-2col">
                    {/* Họ Và Tên */}
                    <div className="field-group">
                      <label className="field-label">HỌ VÀ TÊN</label>
                      <input 
                        type="text" 
                        name="full_name"
                        className="custom-input"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Địa Chỉ Email */}
                    <div className="field-group">
                      <label className="field-label">ĐỊA CHỈ EMAIL</label>
                      <input 
                        type="email" 
                        name="email"
                        className="custom-input input-disabled"
                        value={formData.email}
                        readOnly
                        disabled
                      />
                    </div>

                    {/* Số Điện Thoại Di Động */}
                    <div className="field-group">
                      <label className="field-label">SỐ ĐIỆN THOẠI DI ĐỘNG</label>
                      <input 
                        type="tel" 
                        name="phone"
                        className="custom-input"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Ngày Sinh Nhật */}
                    <div className="field-group">
                      <label className="field-label">NGÀY SINH NHẬT (ĐẶC QUYỀN QUÀ VIP)</label>
                      <input 
                        type="text" 
                        name="dob"
                        className="custom-input"
                        value={formData.dob}
                        onChange={handleInputChange}
                        placeholder="MM/DD/YYYY"
                      />
                    </div>
                  </div>

                  {/* Giới Tính */}
                  <div className="field-group full-width-group">
                    <label className="field-label">GIỚI TÍNH</label>
                    <div className="gender-radio-options">
                      {['Nữ', 'Nam', 'Khác / Không tiết lộ'].map((g) => (
                        <label key={g} className="custom-radio-label">
                          <input 
                            type="radio" 
                            name="gender" 
                            value={g}
                            checked={formData.gender === g}
                            onChange={handleInputChange}
                            className="custom-radio-input"
                          />
                          <span className="radio-text">{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="form-submit-row">
                    <button type="submit" className="save-profile-btn">
                      LƯU THAY ĐỔI HỒ SƠ
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: Lịch Sử Đơn Hàng */}
            {activeTab === 'orders' && (
              <div className="content-inner animate-fade-in">
                <div className="content-title-header">
                  <h2 className="content-main-heading font-serif">Lịch Sử Đơn Hàng</h2>
                  <p className="content-sub-heading">Theo dõi chi tiết và trạng thái tất cả các đơn hàng mua sắm của bạn.</p>
                </div>

                {/* Status Filter Tabs */}
                <div className="status-filter-tabs">
                  {[
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
                    { key: 'PAID', label: 'Đã thanh toán' },
                    { key: 'COMPLETED', label: 'Hoàn thành' },
                    { key: 'CANCELLED', label: 'Đã hủy' }
                  ].map(st => (
                    <button
                      key={st.key}
                      className={`status-tab ${orderStatusFilter === st.key ? 'active' : ''}`}
                      onClick={() => setOrderStatusFilter(st.key)}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Order List */}
                <div className="orders-list">
                  {filteredOrders.length === 0 ? (
                    <div className="empty-state-card animate-fade-in">
                      <div className="empty-state-icon-wrapper">
                        <Package size={40} strokeWidth={1.5} className="empty-box-icon" />
                      </div>
                      <h3 className="empty-state-title font-serif">Chưa Có Đơn Hàng Nào</h3>
                      <p className="empty-state-desc">
                        {orderStatusFilter === 'ALL'
                          ? 'Lịch sử mua sắm của bạn hiện đang trống. Hãy khám phá ngay các bộ sưu tập thời trang mới nhất để tìm cho mình phong cách đẳng cấp.'
                          : 'Hiện không có đơn hàng nào thuộc trạng thái này.'}
                      </p>
                      <Link to="/" className="btn-empty-shop">
                        <span>KHÁM PHÁ BỘ SƯU TẬP</span>
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  ) : (
                    filteredOrders.map(ord => (
                      <div key={ord.order_id} className="order-item-card">
                        <div className="order-card-header">
                          <div>
                            <span className="order-code">MÃ ĐƠN HÀNG: #{ord.order_code}</span>
                            <span className="order-date"> | Đặt lúc {ord.created_at}</span>
                          </div>

                          <div className="order-status-badge">
                            {ord.status === 'PENDING_PAYMENT' && (
                              <span className="badge-pending">Chờ thanh toán (PayOS)</span>
                            )}
                            {ord.status === 'PAID' && (
                              <span className="badge-paid">Đã thanh toán</span>
                            )}
                            {ord.status === 'COMPLETED' && (
                              <span className="badge-completed">Hoàn thành</span>
                            )}
                            {ord.status === 'CANCELLED' && (
                              <span className="badge-cancelled">Đã hủy</span>
                            )}
                          </div>
                        </div>

                        {/* Items list */}
                        <div className="order-items-wrapper">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="order-product-row">
                              <img src={item.image} alt={item.name} className="item-thumb" />
                              <div className="item-details">
                                <h4 className="item-title font-serif">{item.name}</h4>
                                <span className="item-variant">Màu: {item.color} | Size: {item.size}</span>
                                <span className="item-qty">Số lượng: x{item.quantity}</span>
                              </div>
                              <div className="item-price-col">
                                <span>{item.price.toLocaleString('vi-VN')}đ</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer & Actions */}
                        <div className="order-card-footer">
                          {ord.status === 'PENDING_PAYMENT' && ord.payment_deadline && (
                            <div className="payment-countdown-box">
                              <CountdownTimer deadline={ord.payment_deadline} />
                            </div>
                          )}

                          <div className="order-total-group">
                            <span>Tổng tiền: </span>
                            <span className="total-price-text">{ord.total_amount.toLocaleString('vi-VN')}đ</span>
                          </div>

                          {ord.status === 'PENDING_PAYMENT' && (
                            <button className="btn-pay-now">
                              <CreditCard size={15} /> THANH TOÁN NGAY VIA PAYOS
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Voucher & Mã Ưu Đãi */}
            {activeTab === 'vouchers' && (
              <div className="content-inner animate-fade-in">
                <div className="content-title-header">
                  <h2 className="content-main-heading font-serif">Voucher & Mã Ưu Đãi VIP</h2>
                  <p className="content-sub-heading">Danh sách mã quà tặng & đặc quyền chiết khấu của riêng bạn.</p>
                </div>

                {copiedCode && (
                  <div className="profile-alert alert-success">
                    <CheckCircle size={16} /> Đã sao chép mã voucher <strong>{copiedCode}</strong> vào bộ nhớ tạm!
                  </div>
                )}

                <div className="vouchers-grid">
                  {vouchersList.map((v, idx) => (
                    <div key={idx} className="voucher-card">
                      <div className="voucher-left-stub">
                        <Tag size={24} className="stub-icon" />
                        <span className="stub-tag">{v.badge}</span>
                      </div>
                      <div className="voucher-details">
                        <h4 className="voucher-title">{v.title}</h4>
                        <p className="voucher-desc">{v.desc}</p>
                        <div className="voucher-footer">
                          <span className="voucher-expiry">{v.expiry}</span>
                          <button 
                            className="copy-code-btn"
                            onClick={() => handleCopyVoucher(v.code)}
                          >
                            <Copy size={13} /> {v.code}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Đổi Mật Khẩu */}
            {activeTab === 'password' && (
              <div className="content-inner animate-fade-in">
                <div className="content-title-header">
                  <h2 className="content-main-heading font-serif">Đổi Mật Khẩu</h2>
                  <p className="content-sub-heading">Đảm bảo an toàn tài khoản bằng cách cập nhật mật khẩu định kỳ.</p>
                </div>

                {passMsg && (
                  <div className={`profile-alert ${passMsg.includes('thành công') ? 'alert-success' : 'alert-danger'}`}>
                    <AlertCircle size={16} /> {passMsg}
                  </div>
                )}

                <form onSubmit={handlePassChange} className="password-form">
                  <div className="field-group">
                    <label className="field-label">MẬT KHẨU HIỆN TẠI *</label>
                    <input 
                      type="password" 
                      className="custom-input"
                      value={passData.currentPass}
                      onChange={(e) => setPassData(p => ({ ...p, currentPass: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">MẬT KHẨU MỚI *</label>
                    <input 
                      type="password" 
                      className="custom-input"
                      value={passData.newPass}
                      onChange={(e) => setPassData(p => ({ ...p, newPass: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">XÁC NHẬN MẬT KHẨU MỚI *</label>
                    <input 
                      type="password" 
                      className="custom-input"
                      value={passData.confirmPass}
                      onChange={(e) => setPassData(p => ({ ...p, confirmPass: e.target.value }))}
                      required
                    />
                  </div>

                  <button type="submit" className="save-profile-btn" style={{ marginTop: '12px' }}>
                    CẬP NHẬT MẬT KHẨU
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      <style>{`
        /* Profile Page Global Layout */
        .profile-page-bg {
          background-color: #f7f7f8;
          min-height: auto;
          padding-bottom: 40px;
        }

        /* 1. Breadcrumbs Bar */
        .profile-breadcrumb-bar {
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 14px 0;
          margin-bottom: 28px;
        }

        .profile-breadcrumb-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #6b7280;
        }

        .bc-link {
          color: #6b7280;
          text-decoration: none;
          transition: color 0.15s;
        }

        .bc-link:hover {
          color: #111827;
        }

        .bc-sep {
          color: #d1d5db;
          font-size: 10px;
        }

        .bc-current {
          color: #111827;
          font-weight: 700;
        }

        .main-profile-wrapper {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* 2. Top Hero Membership Banner */
        .profile-hero-banner {
          background: linear-gradient(135deg, #1d1e22 0%, #121316 100%);
          border-radius: 16px;
          padding: 32px 36px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        }

        .hero-banner-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .hero-avatar-box {
          position: relative;
          cursor: pointer;
        }

        .hero-avatar-img {
          width: 92px;
          height: 92px;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid rgba(212, 175, 55, 0.5);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: opacity 0.2s;
        }

        .hero-avatar-box:hover .hero-avatar-img {
          opacity: 0.85;
        }

        .avatar-change-btn {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background-color: #ffffff;
          color: #111827;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #121316;
          cursor: pointer;
          transition: transform 0.2s, background-color 0.2s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        .avatar-change-btn:hover {
          background-color: #d4af37;
          color: #ffffff;
          transform: scale(1.1);
        }

        .hero-avatar-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background-color: #d4af37;
          color: #111827;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #121316;
        }

        .check-badge-icon {
          color: #121316;
          stroke-width: 2.5;
        }

        .hero-info-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hero-subtitle {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          color: #9ca3af;
          text-transform: uppercase;
        }

        .gold-text-hero {
          color: #d4af37;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .hero-subtitle .dot {
          margin: 0 4px;
          color: #6b7280;
        }

        .hero-user-name {
          font-size: 26px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .hero-tier-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: #e6c667;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          padding: 5px 14px;
          border-radius: 20px;
          width: fit-content;
          margin-top: 2px;
        }

        .tier-medal {
          font-size: 12px;
        }

        /* Right Stats Box */
        .stats-box {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px 28px;
          display: flex;
          align-items: center;
          gap: 32px;
          backdrop-filter: blur(8px);
        }

        .stat-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #9ca3af;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.1;
        }

        .stat-sub {
          font-size: 11px;
          color: #9ca3af;
        }

        .gold-sub {
          color: #d4af37;
          font-weight: 500;
        }

        .stat-divider {
          width: 1px;
          height: 48px;
          background-color: rgba(255, 255, 255, 0.12);
        }

        /* 3. Main Grid Layout */
        .profile-content-grid {
          display: grid;
          grid-template-columns: 305px 1fr;
          gap: 28px;
          align-items: start;
        }

        /* Sidebar Styling */
        .profile-sidebar-card {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 24px 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }

        .sidebar-header-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #6b7280;
          margin-bottom: 18px;
          padding-left: 8px;
          white-space: nowrap;
        }

        .sidebar-nav-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nav-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 14px;
          border-radius: 10px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: #374151;
          background-color: transparent;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .nav-item-btn:hover {
          background-color: #f3f4f6;
          color: #111827;
        }

        .nav-item-btn.active {
          background-color: #000000;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .nav-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .nav-item-left span {
          white-space: nowrap;
        }

        .active-arrow {
          color: #ffffff;
          flex-shrink: 0;
        }

        .nav-badge-pill {
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 12px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .grey-badge {
          background-color: #f3f4f6;
          color: #374151;
        }

        .gold-badge {
          background-color: #fef3c7;
          color: #92400e;
        }

        .logout-item-btn {
          margin-top: 10px;
          border-top: 1px solid #f3f4f6;
          border-radius: 0;
          padding-top: 16px;
        }

        .logout-item-btn:hover {
          background-color: #fef2f2;
        }

        .text-danger {
          color: #dc2626 !important;
        }

        /* Right Content Area Styling */
        .profile-main-card {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 36px 40px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          min-height: 520px;
        }

        .content-title-header {
          margin-bottom: 30px;
        }

        .content-main-heading {
          font-size: 26px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 6px;
        }

        .content-sub-heading {
          font-size: 13px;
          color: #6b7280;
        }

        .profile-alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .alert-success {
          background-color: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .alert-danger {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Form Grid Layout */
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-fields-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .full-width-group {
          grid-column: 1 / -1;
        }

        .field-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #4b5563;
        }

        .custom-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          color: #111827;
          background-color: #ffffff;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .custom-input:focus {
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.05);
        }

        .input-disabled {
          background-color: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
          border-color: #e5e7eb;
        }

        .gender-radio-options {
          display: flex;
          align-items: center;
          gap: 28px;
          padding-top: 4px;
        }

        .custom-radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #111827;
        }

        .custom-radio-input {
          accent-color: #000000;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .form-submit-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .save-profile-btn {
          background-color: #000000;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 14px 28px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .save-profile-btn:hover {
          background-color: #27272a;
        }

        /* Vouchers Tab */
        .vouchers-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .voucher-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          display: flex;
          overflow: hidden;
          background-color: #ffffff;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .voucher-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
        }

        .voucher-left-stub {
          background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
          color: #ffffff;
          width: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          text-align: center;
          position: relative;
        }

        .stub-icon {
          color: #d4af37;
        }

        .stub-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #e5e7eb;
        }

        .voucher-details {
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .voucher-title {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .voucher-desc {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .voucher-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .voucher-expiry {
          font-size: 11px;
          color: #9ca3af;
        }

        .copy-code-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #000000;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 6px;
          transition: background 0.15s;
        }

        .copy-code-btn:hover {
          background-color: #374151;
        }

        /* Password Form */
        .password-form {
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Order History Styles */
        .status-filter-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #f1f3f5;
          padding-bottom: 14px;
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .status-filter-tabs::-webkit-scrollbar {
          display: none;
        }

        .status-tab {
          padding: 7px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          background-color: transparent;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          white-space: nowrap;
          cursor: pointer;
        }

        .status-tab:hover {
          color: #111827;
          background-color: #f3f4f6;
        }

        .status-tab.active {
          background-color: #111827;
          color: #ffffff;
          border-color: #111827;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Luxury Empty State */
        .empty-state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 64px 24px;
          background: #fafafa;
          border: 1px dashed #e5e7eb;
          border-radius: 16px;
        }

        .empty-state-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .empty-box-icon {
          color: #4b5563;
        }

        .empty-state-title {
          font-size: 22px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 10px;
        }

        .empty-state-desc {
          font-size: 13.5px;
          color: #6b7280;
          max-width: 440px;
          line-height: 1.6;
          margin-bottom: 26px;
        }

        .btn-empty-shop {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #111827;
          color: #ffffff;
          padding: 12px 28px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          text-decoration: none;
        }

        .btn-empty-shop:hover {
          background-color: #000000;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
          color: #ffffff;
        }

        /* Order Item Card (when items exist) */
        .order-item-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background-color: #ffffff;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .order-item-card:hover {
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
        }

        .order-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background-color: #fafafa;
          border-bottom: 1px solid #f0f0f0;
          font-size: 12.5px;
        }

        .order-code {
          font-weight: 700;
          color: #111827;
        }

        .order-date {
          color: #6b7280;
        }

        .order-status-badge span {
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .badge-pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .badge-paid {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .badge-completed {
          background-color: #d1fae5;
          color: #065f46;
        }

        .badge-cancelled {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .order-items-wrapper {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .order-product-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .item-thumb {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #f1f3f5;
        }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .item-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .item-variant, .item-qty {
          font-size: 12px;
          color: #6b7280;
        }

        .item-price-col {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }

        .order-card-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 20px;
          padding: 14px 20px;
          background-color: #fafafa;
          border-top: 1px solid #f0f0f0;
          font-size: 13px;
        }

        .payment-countdown-box {
          margin-right: auto;
          font-size: 12px;
          font-weight: 600;
          color: #b45309;
        }

        .timer-active {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fffbeb;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #fde68a;
        }

        .timer-expired {
          color: #ef4444;
          font-weight: 600;
        }

        .order-total-group {
          color: #4b5563;
        }

        .total-price-text {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }

        .btn-pay-now {
          background-color: #000000;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          transition: background 0.15s;
        }

        .btn-pay-now:hover {
          background-color: #374151;
        }

        /* Responsive Media Queries */
        @media (max-width: 1024px) {
          .profile-hero-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
          }

          .hero-banner-right {
            width: 100%;
          }

          .stats-box {
            width: 100%;
            justify-content: space-around;
          }

          .profile-content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .form-fields-2col,
          .vouchers-grid {
            grid-template-columns: 1fr;
          }

          .profile-main-card {
            padding: 24px 20px;
          }

          .stats-box {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .stat-divider {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
