import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';
import ManagerSidebar from '../../components/ManagerSidebar';
import ManagerHeader from '../../components/ManagerHeader';
import {
  Settings,
  UserPlus,
  Shield,
  Key,
  Mail,
  Phone,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Lock,
  Unlock,
  Store,
  Sliders,
  Server
} from 'lucide-react';

const configStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&display=swap');

  .sc-layout {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    width: 100%;
    min-height: 100vh;
    background: #F7F6F3;
    font-family: 'Inter', sans-serif;
    box-sizing: border-box;
    color: #111111;
  }

  .sc-main-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 100vh;
    box-sizing: border-box;
    background: #F7F6F3;
  }

  .sc-scroll-body {
    display: flex;
    flex-direction: column;
    padding: 32px 36px 60px;
    gap: 24px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Header Section */
  .sc-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
  }

  .sc-title-heading {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px;
    font-weight: 700;
    color: #111111;
    margin: 0;
    line-height: 1.2;
    letter-spacing: -0.3px;
  }

  .sc-title-sub {
    font-size: 13px;
    color: #78716C;
    margin: 6px 0 0 0;
    font-weight: 400;
  }

  /* Tab Row */
  .sc-tabs-card {
    background: #FFFFFF;
    border: 1px solid #EDE8DE;
    border-radius: 12px;
    padding: 6px;
    display: inline-flex;
    gap: 6px;
    width: fit-content;
  }

  .sc-tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #6B7280;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sc-tab-btn:hover {
    color: #111111;
    background: #F8F7F4;
  }

  .sc-tab-btn.active {
    background: #111111;
    color: #FFFFFF;
  }

  /* Content Cards */
  .sc-card {
    background: #FFFFFF;
    border: 1px solid #EDE8DE;
    border-radius: 12px;
    padding: 28px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    box-sizing: border-box;
  }

  .sc-card-head {
    border-bottom: 1px solid #F0EEE9;
    padding-bottom: 18px;
    margin-bottom: 24px;
  }

  .sc-card-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 20px;
    font-weight: 700;
    color: #111111;
    margin: 0 0 4px;
  }

  .sc-card-desc {
    font-size: 13px;
    color: #78716C;
    margin: 0;
  }

  /* Form Elements */
  .sc-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .sc-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sc-form-label {
    font-size: 12px;
    font-weight: 700;
    color: #57534E;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sc-input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid #E2DFD7;
    border-radius: 8px;
    padding: 10px 14px;
    background: #FFFFFF;
    transition: border-color 0.2s ease;
  }

  .sc-input-wrapper:focus-within {
    border-color: #111111;
  }

  .sc-input-field {
    border: none;
    outline: none;
    background: transparent;
    font-size: 13.5px;
    color: #111111;
    width: 100%;
    font-family: 'Inter', sans-serif;
  }

  .sc-btn-submit {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: #111111;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
  }

  .sc-btn-submit:hover {
    background: #262626;
  }

  .sc-btn-submit:active {
    transform: scale(0.98);
  }

  /* Table */
  .sc-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .sc-table th {
    background: #F8F7F4;
    padding: 12px 18px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #78716C;
    border-bottom: 1px solid #EDE8DE;
  }

  .sc-table td {
    padding: 16px 18px;
    border-bottom: 1px solid #F0EEE9;
    font-size: 13px;
    color: #1C1917;
    vertical-align: middle;
  }
`;

export default function SystemConfig() {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('CREATE_ADMIN'); // 'CREATE_ADMIN' | 'ADMIN_LIST' | 'STORE_CONFIG'

  // Form State tạo tài khoản Admin
  const [formData, setFormData] = useState({
    employee_code: `ADM_${Date.now().toString().slice(-4)}`,
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    employee_role: 'ADMIN',
  });
  const [submitting, setSubmitting] = useState(false);

  // Danh sách quản trị viên
  const [adminList, setAdminList] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Cấu hình cửa hàng
  const [storeConfig, setStoreConfig] = useState({
    store_name: 'YouthFashion System Flagship',
    hotline: '1900 8888',
    support_email: 'support@youthfashion.vn',
    address: 'Số 123 Phố Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
    is_open: true,
  });

  // Tải danh sách Admin
  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    try {
      const res = await adminService.getUsers({ role: 'EMPLOYEE' });
      if (res?.data) {
        setAdminList(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách quản trị viên:', err);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Xử lý submit Tạo Admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password) {
      showError('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      showError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      showError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setSubmitting(true);
    try {
      await adminService.createAdmin({
        employee_code: formData.employee_code,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        employee_role: formData.employee_role,
      });

      showSuccess(`Khởi tạo tài khoản ${formData.employee_role === 'ADMIN' ? 'Admin' : 'Manager'} "${formData.full_name}" thành công!`);

      // Reset form
      setFormData({
        employee_code: `ADM_${Date.now().toString().slice(-4)}`,
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
        employee_role: 'ADMIN',
      });

      fetchAdmins();
      setActiveTab('ADMIN_LIST');
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể tạo tài khoản quản trị');
    } finally {
      setSubmitting(false);
    }
  };

  // Khóa / Mở khóa Admin
  const handleToggleAdminStatus = async (admin) => {
    const nextStatus = admin.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await adminService.updateUserStatus('EMPLOYEE', admin.id, nextStatus);
      setAdminList((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, status: nextStatus } : a))
      );
      showSuccess(`Đã ${nextStatus === 'ACTIVE' ? 'kích hoạt' : 'khóa'} tài khoản "${admin.full_name}"`);
    } catch (err) {
      showError('Không thể cập nhật trạng thái');
    }
  };

  // Xóa tài khoản nhân viên
  const handleDeleteAdmin = async (admin) => {
    if (admin.email === 'admin@gmail.com') {
      showError('Không thể xóa tài khoản Quản trị viên gốc của hệ thống');
      return;
    }

    if (!window.confirm(`Xác nhận xóa tài khoản "${admin.full_name}"?`)) return;

    try {
      await adminService.deleteUser('EMPLOYEE', admin.id);
      setAdminList((prev) => prev.filter((a) => a.id !== admin.id));
      showSuccess(`Đã xóa tài khoản "${admin.full_name}" thành công`);
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể xóa tài khoản này');
    }
  };

  return (
    <div className="sc-layout">
      <style>{configStyles}</style>

      {/* SIDEBAR BÊN TRÁI */}
      <ManagerSidebar activeMenu="system-config" />

      {/* MAIN CONTENT AREA */}
      <main className="sc-main-content">
        <ManagerHeader showSearch={false} />

        <div className="sc-scroll-body">
          {/* HEADER ROW */}
          <div className="sc-header-row">
            <div>
              <h1 className="sc-title-heading">Cấu Hình Hệ Thống & Quản Trị Viên</h1>
              <p className="sc-title-sub">
                Khởi tạo tài khoản quản trị viên tối cao, cấu hình phân quyền truy cập và thông số vận hành YouthFashion.
              </p>
            </div>
          </div>

          {/* TABS CHỌN TÍNH NĂNG */}
          <div className="sc-tabs-card">
            <button
              type="button"
              className={`sc-tab-btn ${activeTab === 'CREATE_ADMIN' ? 'active' : ''}`}
              onClick={() => setActiveTab('CREATE_ADMIN')}
            >
              <UserPlus size={16} />
              Tạo Tài Khoản Admin
            </button>
            <button
              type="button"
              className={`sc-tab-btn ${activeTab === 'ADMIN_LIST' ? 'active' : ''}`}
              onClick={() => setActiveTab('ADMIN_LIST')}
            >
              <Shield size={16} />
              Danh Sách Quản Trị ({adminList.length})
            </button>
            <button
              type="button"
              className={`sc-tab-btn ${activeTab === 'STORE_CONFIG' ? 'active' : ''}`}
              onClick={() => setActiveTab('STORE_CONFIG')}
            >
              <Store size={16} />
              Thông Số Cửa Hàng
            </button>
          </div>

          {/* TAB 1: FORM TẠO TÀI KHOẢN ADMIN */}
          {activeTab === 'CREATE_ADMIN' && (
            <div className="sc-card">
              <div className="sc-card-head">
                <h2 className="sc-card-title">Khởi Tạo Tài Khoản Quản Trị Viên Mới</h2>
                <p className="sc-card-desc">
                  Tài khoản Admin có quyền lực cao nhất: quản lý toàn bộ sản phẩm, người dùng, tài chính và cấu hình bảo mật.
                </p>
              </div>

              <form onSubmit={handleCreateAdmin}>
                <div className="sc-form-grid">
                  {/* Mã nhân sự */}
                  <div className="sc-form-group">
                    <label className="sc-form-label">Mã Nhân Sự / Quản Trị *</label>
                    <div className="sc-input-wrapper">
                      <User size={16} color="#78716C" />
                      <input
                        type="text"
                        className="sc-input-field"
                        placeholder="VD: ADM_002"
                        value={formData.employee_code}
                        onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Họ và tên */}
                  <div className="sc-form-group">
                    <label className="sc-form-label">Họ Và Tên Quản Trị Viên *</label>
                    <div className="sc-input-wrapper">
                      <User size={16} color="#78716C" />
                      <input
                        type="text"
                        className="sc-input-field"
                        placeholder="VD: Nguyễn Văn Hoàng"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Email đăng nhập */}
                  <div className="sc-form-group">
                    <label className="sc-form-label">Email Đăng Nhập Quản Trị *</label>
                    <div className="sc-input-wrapper">
                      <Mail size={16} color="#78716C" />
                      <input
                        type="email"
                        className="sc-input-field"
                        placeholder="VD: admin.hoang@youthfashion.vn"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div className="sc-form-group">
                    <label className="sc-form-label">Số Điện Thoại Liên Hệ</label>
                    <div className="sc-input-wrapper">
                      <Phone size={16} color="#78716C" />
                      <input
                        type="text"
                        className="sc-input-field"
                        placeholder="VD: 0988 777 666"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Mật khẩu */}
                  <div className="sc-form-group">
                    <label className="sc-form-label">Mật Khẩu Khởi Tạo *</label>
                    <div className="sc-input-wrapper">
                      <Key size={16} color="#78716C" />
                      <input
                        type="password"
                        className="sc-input-field"
                        placeholder="Tối thiểu 6 ký tự..."
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Xác nhận mật khẩu */}
                  <div className="sc-form-group">
                    <label className="sc-form-label">Xác Nhận Mật Khẩu *</label>
                    <div className="sc-input-wrapper">
                      <Key size={16} color="#78716C" />
                      <input
                        type="password"
                        className="sc-input-field"
                        placeholder="Nhập lại mật khẩu..."
                        value={formData.confirm_password}
                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Phân quyền cấp bậc */}
                  <div className="sc-form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="sc-form-label">Cấp Bậc & Quyền Hạn Hệ Thống *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 4 }}>
                      <div
                        onClick={() => setFormData({ ...formData, employee_role: 'ADMIN' })}
                        style={{
                          padding: '16px',
                          border: `2px solid ${formData.employee_role === 'ADMIN' ? '#111111' : '#E2DFD7'}`,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          background: formData.employee_role === 'ADMIN' ? '#FFFDF8' : '#FFFFFF',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Shield size={18} color="#111111" />
                          <strong style={{ fontSize: '14px', color: '#111111' }}>Quản Trị Viên Tối Cao (Admin)</strong>
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#78716C', lineHeight: 1.4 }}>
                          Toàn quyền kiểm soát: Quản lý người dùng, tạo tài khoản Admin, cấu hình bảo mật và toàn bộ chức năng cửa hàng.
                        </p>
                      </div>

                      <div
                        onClick={() => setFormData({ ...formData, employee_role: 'MANAGER' })}
                        style={{
                          padding: '16px',
                          border: `2px solid ${formData.employee_role === 'MANAGER' ? '#111111' : '#E2DFD7'}`,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          background: formData.employee_role === 'MANAGER' ? '#FFFDF8' : '#FFFFFF',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Sliders size={18} color="#9333EA" />
                          <strong style={{ fontSize: '14px', color: '#9333EA' }}>Quản Lý Cửa Hàng (Store Manager)</strong>
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#78716C', lineHeight: 1.4 }}>
                          Quản lý sản phẩm, danh mục, thương hiệu, lookbook và chăm sóc đơn hàng khách hàng.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="sc-btn-submit" disabled={submitting}>
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    TẠO TÀI KHOẢN QUẢN TRỊ
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: DANH SÁCH QUẢN TRỊ VIÊN HIỆN TẠI */}
          {activeTab === 'ADMIN_LIST' && (
            <div className="sc-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid #EDE8DE' }}>
                <h2 className="sc-card-title">Danh Sách Quản Trị Viên & Nhân Sự Cấp Cao</h2>
                <p className="sc-card-desc">
                  Danh sách nhân sự có quyền truy cập bảng điều khiển quản trị hệ thống YouthFashion.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>MÃ NHÂN SỰ</th>
                      <th style={{ width: '25%' }}>HỌ VÀ TÊN</th>
                      <th style={{ width: '25%' }}>EMAIL ĐĂNG NHẬP</th>
                      <th style={{ width: '15%' }}>VAI TRÒ</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>TRẠNG THÁI</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAdmins ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#78716C' }}>
                          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                          Đang tải danh sách quản trị viên...
                        </td>
                      </tr>
                    ) : (
                      adminList.map((emp) => (
                        <tr key={emp.id}>
                          <td>
                            <strong style={{ color: '#111', fontSize: '13px' }}>{emp.user_code}</strong>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#111' }}>{emp.full_name}</div>
                            <div style={{ fontSize: '12px', color: '#78716C' }}>{emp.phone || 'Chưa có SĐT'}</div>
                          </td>
                          <td>
                            <span style={{ color: '#2563EB', fontWeight: 500 }}>{emp.email}</span>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: emp.role === 'ADMIN' ? '#111111' : '#FAF5FF',
                                color: emp.role === 'ADMIN' ? '#FFFFFF' : '#9333EA',
                              }}
                            >
                              {emp.role === 'ADMIN' ? 'Admin Toàn Quyền' : 'Store Manager'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleAdminStatus(emp)}
                              style={{
                                border: 'none',
                                background: emp.status === 'ACTIVE' ? '#ECFDF5' : '#FEE2E2',
                                color: emp.status === 'ACTIVE' ? '#059669' : '#DC2626',
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {emp.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}
                                title="Xóa tài khoản"
                                onClick={() => handleDeleteAdmin(emp)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: THÔNG SỐ CỬA HÀNG */}
          {activeTab === 'STORE_CONFIG' && (
            <div className="sc-card">
              <div className="sc-card-head">
                <h2 className="sc-card-title">Cấu Hình Thông Tin Hệ Thống YouthFashion</h2>
                <p className="sc-card-desc">
                  Các thông số thương hiệu hiển thị trên chân trang (footer) và hóa đơn bán hàng.
                </p>
              </div>

              <div className="sc-form-grid">
                <div className="sc-form-group">
                  <label className="sc-form-label">Tên Cửa Hàng / Chuỗi Hệ Thống</label>
                  <input
                    type="text"
                    className="sc-input-wrapper sc-input-field"
                    value={storeConfig.store_name}
                    onChange={(e) => setStoreConfig({ ...storeConfig, store_name: e.target.value })}
                  />
                </div>

                <div className="sc-form-group">
                  <label className="sc-form-label">Hotline Chăm Sóc Khách Hàng</label>
                  <input
                    type="text"
                    className="sc-input-wrapper sc-input-field"
                    value={storeConfig.hotline}
                    onChange={(e) => setStoreConfig({ ...storeConfig, hotline: e.target.value })}
                  />
                </div>

                <div className="sc-form-group">
                  <label className="sc-form-label">Email Hỗ Trợ Kỹ Thuật</label>
                  <input
                    type="email"
                    className="sc-input-wrapper sc-input-field"
                    value={storeConfig.support_email}
                    onChange={(e) => setStoreConfig({ ...storeConfig, support_email: e.target.value })}
                  />
                </div>

                <div className="sc-form-group">
                  <label className="sc-form-label">Trụ Sở Flagship</label>
                  <input
                    type="text"
                    className="sc-input-wrapper sc-input-field"
                    value={storeConfig.address}
                    onChange={(e) => setStoreConfig({ ...storeConfig, address: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="sc-btn-submit"
                  onClick={() => showSuccess('Đã lưu cấu hình thông số hệ thống thành công')}
                >
                  <CheckCircle size={16} />
                  LƯU CẤU HÌNH HỆ THỐNG
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
