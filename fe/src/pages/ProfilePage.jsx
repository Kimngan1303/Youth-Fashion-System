import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  User, Package, Lock, Heart, LogOut, CheckCircle,
  Camera, MapPin, Calendar, Clock, CreditCard, ChevronRight, AlertCircle, Tag, Copy, LayoutDashboard, Eye, EyeOff,
  Search, Truck, Check, X, Star, RefreshCw, FileText, ShieldCheck, ChevronLeft, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { voucherService } from '../services/voucherService';
import { orderService } from '../services/orderService';

// Chuẩn hóa ngày hiển thị sang dạng DD/MM/YYYY
const normalizeDobToVn = (dob) => {
  if (!dob) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) return dob;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    const [y, m, d] = dob.split('-');
    return `${d}/${m}/${y}`;
  }
  const parts = dob.split(/[\/\-.]/);
  if (parts.length === 3 && parts[2].length === 4) {
    let d = parts[0].padStart(2, '0');
    let m = parts[1].padStart(2, '0');
    let y = parts[2];
    if (parseInt(d, 10) <= 12 && parseInt(m, 10) > 12) {
      [d, m] = [m, d];
    }
    return `${d}/${m}/${y}`;
  }
  return dob;
};

// Chuyển đổi DD/MM/YYYY sang YYYY-MM-DD cho input date picker
const convertVnDateToIso = (vnStr) => {
  if (!vnStr) return '';
  const parts = vnStr.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
};

// Tự động chèn dấu / khi người dùng chỉ cần gõ số ngày sinh (VD: 18101994 -> 18/10/1994)
const formatDobInput = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

// Kiểm tra tính hợp lệ của ngày sinh (ngày tồn tại, tháng 1-12, không vượt quá hôm nay)
const validateDob = (dobStr) => {
  if (!dobStr || !dobStr.trim()) return 'Ngày sinh nhật không được để trống';
  const parts = dobStr.split('/');
  if (parts.length !== 3 || dobStr.length !== 10) {
    return 'Vui lòng nhập đủ 8 số ngày sinh (VD: 18101994)';
  }
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return 'Ngày sinh chỉ được chứa số';
  }
  if (month < 1 || month > 12) {
    return 'Tháng sinh không hợp lệ (từ 01 đến 12)';
  }
  if (day < 1 || day > 31) {
    return 'Ngày sinh không hợp lệ (từ 01 đến 31)';
  }
  const dateObj = new Date(year, month - 1, day);
  if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
    return `Ngày ${dobStr} không tồn tại trong lịch`;
  }
  if (year < 1900) {
    return 'Năm sinh không được nhỏ hơn 1900';
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (dateObj > today) {
    return 'Ngày sinh không được lớn hơn ngày hiện tại';
  }
  return '';
};

// 5 Đơn hàng chuẩn theo giao diện Luxury Haute Couture Youth Fashion
const INITIAL_SAMPLE_ORDERS = [
  {
    order_id: '88210',
    order_code: 'YF - 88210',
    created_at: '24/10/2025',
    payment_method: 'Thanh toán: Chuyển khoản',
    status: 'SHIPPING',
    status_label: 'ĐANG GIAO HÀNG HỎA TỐC',
    total_amount: 14850000,
    items: [
      {
        id: 1,
        name: 'Áo Măng Tô Dạ Camel Cashmere Nguyên Bản',
        collection_tag: 'FALL/WINTER COUTURE ATELIER',
        size: 'Size M',
        color: 'Camel Sand',
        service_note: 'Dịch vụ kèm: ★ May gấp, & Chỉnh ve áo theo số đo riêng',
        quantity: 1,
        price: 14850000,
        original_price: 16500000,
        discount_text: 'Đã áp dụng VIP Gold -10% (-1.650.000₫)',
        image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500'
      }
    ],
    stepper: {
      estimated_delivery: 'Hôm nay, 14:00 - 17:30',
      tracking_code: 'GHN-VFP-494124',
      driver_name: 'Lê Hoàng Nam (Hotline: 0906 234 567)',
      steps: [
        { id: 1, name: 'Xác nhận', time: '24/10 09:15', status: 'completed' },
        { id: 2, name: 'Đóng gói', time: '24/10 11:20', status: 'completed' },
        { id: 3, name: 'Vận chuyển hỏa tốc', time: 'Đang điều phối', status: 'active' },
        { id: 4, name: 'Nhận hàng', time: 'Dự kiến: Hôm nay 24/10', status: 'pending' }
      ]
    }
  },
  {
    order_id: '85420',
    order_code: 'YF - 85420',
    created_at: '12/09/2025',
    payment_method: 'Phương thức: Visa ending in 8199',
    status: 'COMPLETED',
    status_label: 'GIAO THÀNH CÔNG (14/09/2025)',
    delivered_date: '14/09/2025',
    total_amount: 4630000,
    items: [
      {
        id: 2,
        name: 'Áo Tweed Cropped Đính Khuy Kim Loại Vàng',
        size: 'Size S',
        color: 'Màu Trắng Kem Ivory',
        warranty_tag: 'Bảo hành trọn đời',
        quantity: 1,
        price: 2680000,
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500'
      },
      {
        id: 3,
        name: 'Quần Tây Ống Rộng Lụa Satin Cao Cấp',
        size: 'Size M',
        color: 'Màu Đen Noir',
        service_note: 'Chỉnh sửa chiều dài ống quần: Chuẩn 100cm',
        quantity: 1,
        price: 1950000,
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500'
      }
    ]
  },
  {
    order_id: '79114',
    order_code: 'YF - 79114',
    created_at: '18/07/2025',
    payment_method: 'Thanh toán: Chuyển khoản VietQR',
    status: 'COMPLETED',
    status_label: 'GIAO THÀNH CÔNG',
    total_amount: 5400000,
    items: [
      {
        id: 4,
        name: 'Đầm Dạ Hội Lụa Tơ Tằm Tự Nhiên Xếp Ly Thủ Công',
        size: 'Size M',
        color: 'Màu Emerald Green',
        quantity: 1,
        price: 5400000,
        image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500'
      }
    ]
  },
  {
    order_id: '72015',
    order_code: 'YF - 72015',
    created_at: '05/05/2025',
    payment_method: 'Thanh toán: Tiền mặt khi nhận hàng (COD)',
    status: 'COMPLETED',
    status_label: 'GIAO THÀNH CÔNG',
    total_amount: 6890000,
    items: [
      {
        id: 5,
        name: 'Set Veston Nữ May Đo Cao Cấp Signature',
        size: 'Size S',
        color: 'Màu Midnight Navy',
        quantity: 1,
        price: 6890000,
        image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500'
      }
    ]
  },
  {
    order_id: '68192',
    order_code: 'YF - 68192',
    created_at: '15/03/2025',
    payment_method: 'Thanh toán: Chuyển khoản VietQR',
    status: 'CANCELLED',
    status_label: 'ĐÃ HỦY',
    cancel_reason: 'Khách hàng đổi sang trang phục thiết kế khác',
    total_amount: 2150000,
    items: [
      {
        id: 6,
        name: 'Áo Sơ Mi Lụa Cổ Nơ Điệu Đà Haute Couture',
        size: 'Size M',
        color: 'Màu Pure Pearl',
        quantity: 1,
        price: 2150000,
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500'
      }
    ]
  }
];

const ProfilePage = () => {
  const { user, updateUserProfile, changePassword, orders, wishlist, logout, addToCart } = useAuth();
  const isManagerOrAdmin = Boolean(
    user && (
      String(user.role || '').toUpperCase() === 'MANAGER' ||
      String(user.role || '').toUpperCase() === 'ADMIN' ||
      String(user.role || '').toUpperCase() === 'EMPLOYEE' ||
      String(user.user_type || '').toUpperCase() === 'EMPLOYEE' ||
      String(user.employee_role || '').toUpperCase() === 'MANAGER' ||
      String(user.employee_role || '').toUpperCase() === 'ADMIN' ||
      user.email === 'mana@gmail.com'
    )
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
    navigate('/');
  };
  const initialTab = searchParams.get('tab') || 'vouchers';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const ordersPerPage = 3;

  // Lịch sử đơn hàng: kết hợp dữ liệu lưu trữ local, mẫu hiển thị, và backend
  const [customerOrders, setCustomerOrders] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('yf_customer_orders') || '[]');
      const combined = [...saved];
      for (const sample of INITIAL_SAMPLE_ORDERS) {
        if (!combined.some(o => (o.order_code || o.order_id) === (sample.order_code || sample.order_id))) {
          combined.push(sample);
        }
      }
      return combined;
    } catch (e) {
      return INITIAL_SAMPLE_ORDERS;
    }
  });

  // Modal theo dõi hành trình, đánh giá, bảo hành
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [reviewModalOrder, setReviewModalOrder] = useState(null);
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [selectedReviewTags, setSelectedReviewTags] = useState(['Chất liệu thượng hạng', 'Đường may tinh xảo']);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmittedAlert, setReviewSubmittedAlert] = useState('');

  // Tự động chuyển tab khi URL thay đổi (VD: chuyển từ Đặt hàng thành công sang /profile?tab=orders)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Đồng bộ đơn hàng từ backend nếu có
  useEffect(() => {
    orderService.getMyOrders()
      .then((res) => {
        if (res?.status && Array.isArray(res.data) && res.data.length > 0) {
          const apiFormatted = res.data.map((apiOrd) => ({
            order_id: String(apiOrd.order_id || apiOrd.order_number),
            order_code: apiOrd.order_number ? `#${apiOrd.order_number}` : `YF - ${apiOrd.order_id}`,
            created_at: new Date(apiOrd.created_at).toLocaleDateString('vi-VN'),
            payment_method: apiOrd.payments?.[0]?.payment_method === 'PAYOS'
              ? 'Thanh toán: Chuyển khoản VietQR'
              : 'Thanh toán: Tiền mặt khi nhận hàng (COD)',
            status: apiOrd.order_status,
            status_label: apiOrd.order_status === 'COMPLETED'
              ? 'GIAO THÀNH CÔNG'
              : (apiOrd.order_status === 'PENDING' ? 'CHỜ GIAO HÀNG' : 'ĐANG GIAO HÀNG HỎA TỐC'),
            total_amount: Number(apiOrd.total_amount || 0),
            items: (apiOrd.order_items || []).map((i) => ({
              id: i.order_item_id || i.variant_id,
              name: i.product_name,
              size: `Size ${i.size || 'M'}`,
              color: `Màu ${i.color || 'Tiêu chuẩn'}`,
              quantity: Number(i.quantity || 1),
              price: Number(i.unit_price || 0),
              image: i.variant?.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500',
              collection_tag: 'FALL/WINTER COUTURE ATELIER',
            })),
            stepper: {
              estimated_delivery: 'Dự kiến: Trong 24h tới',
              tracking_code: `GHN-VFP-${apiOrd.order_id}`,
              driver_name: 'Lê Hoàng Nam (Hotline: 0906 234 567)',
              steps: [
                { id: 1, name: 'Xác nhận', time: 'Đã hoàn tất', status: 'completed' },
                { id: 2, name: 'Đóng gói', time: 'Đã hoàn tất', status: 'completed' },
                { id: 3, name: 'Vận chuyển hỏa tốc', time: 'Đang điều phối', status: 'active' },
                { id: 4, name: 'Nhận hàng', time: 'Dự kiến hôm nay', status: 'pending' },
              ]
            }
          }));

          setCustomerOrders((prev) => {
            const merged = [...apiFormatted];
            for (const item of prev) {
              if (!merged.some((m) => m.order_code === item.order_code || m.order_id === item.order_id)) {
                merged.push(item);
              }
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [user]);
  const DEFAULT_AVATAR = '/logo-white.png';

  // Nén ảnh tải lên về chuẩn JPEG (max 400x400) để tối ưu lưu trữ CSDL & LocalStorage
  const compressAvatarImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 400;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const isValidAvatarUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('http://') || url.startsWith('https://')) return true;
    if (url.startsWith('data:image/')) return url.length > 50 && url.includes(';base64,');
    return false;
  };

  // Form State initialized from user context
  const getSavedAvatar = () => {
    if (isValidAvatarUrl(user?.avatar_url)) return user.avatar_url;
    if (user?.email) {
      const byEmail = localStorage.getItem(`avatar_url_${user.email}`);
      if (isValidAvatarUrl(byEmail)) return byEmail;
    }
    const globalAvatar = localStorage.getItem('user_avatar_url');
    if (isValidAvatarUrl(globalAvatar)) return globalAvatar;
    return DEFAULT_AVATAR;
  };

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    avatar_url: getSavedAvatar(),
    gender: user?.gender || 'Nữ',
    dob: normalizeDobToVn(user?.dob),
    province: user?.address?.province || '',
    district: user?.address?.district || '',
    ward: user?.address?.ward || '',
    detailAddress: user?.address?.detail || ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || prev.full_name || '',
        phone: user.phone || '',
        email: user.email || prev.email || '',
        avatar_url: getSavedAvatar(),
        gender: user.gender || prev.gender || 'Nữ',
        dob: normalizeDobToVn(user.dob),
        province: user.address?.province || prev.province || '',
        district: user.address?.district || prev.district || '',
        ward: user.address?.ward || prev.ward || '',
        detailAddress: user.address?.detail || prev.detailAddress || ''
      }));
    }
  }, [user]);

  const [profileAlert, setProfileAlert] = useState({ type: '', message: '' });
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [dobError, setDobError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const fileInputRef = useRef(null);
  const hiddenDateRef = useRef(null);

  // Hàm kiểm tra họ và tên
  const validateFullName = (name) => {
    if (!name || !name.trim()) {
      return 'Họ và tên không được để trống';
    }
    if (name.trim().length < 2) {
      return 'Họ và tên phải có tối thiểu 2 ký tự';
    }
    return '';
  };

  // Hàm kiểm tra định dạng số điện thoại di động Việt Nam chuẩn (Bắt buộc điền)
  const validatePhone = (phoneNumber) => {
    if (!phoneNumber || !phoneNumber.toString().trim()) {
      return 'Số điện thoại không được để trống';
    }
    const cleaned = phoneNumber.toString().replace(/[\s.\-()]/g, '');
    const vnPhoneRegex = /^(?:(?:\+84|84|0))(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;
    if (!vnPhoneRegex.test(cleaned)) {
      return 'Số điện thoại không hợp lệ (gồm 10 số thuộc các đầu mạng di động VN: 032-039, 05x, 07x, 08x, 09x)';
    }
    return '';
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      try {
        const compressedAvatarUrl = await compressAvatarImage(file);
        if (compressedAvatarUrl) {
          setFormData(prev => ({ ...prev, avatar_url: compressedAvatarUrl }));
          try {
            localStorage.setItem('user_avatar_url', compressedAvatarUrl);
            if (user?.email) {
              localStorage.setItem(`avatar_url_${user.email}`, compressedAvatarUrl);
            }
          } catch (err) {
            console.warn('LocalStorage quota warning:', err);
          }
          if (updateUserProfile) {
            await updateUserProfile({ avatar_url: compressedAvatarUrl });
          }
          setProfileAlert({ type: 'success', message: 'Đã cập nhật ảnh đại diện mới thành công!' });
          setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
        }
      } catch (err) {
        console.error('Lỗi cập nhật ảnh đại diện:', err);
      }
    }
  };

  // Password State
  const [passData, setPassData] = useState({ currentPass: '', newPass: '', confirmPass: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passAlertType, setPassAlertType] = useState('danger');
  const [newPassError, setNewPassError] = useState('');
  const [confirmPassError, setConfirmPassError] = useState('');

  // Validations matching Registration
  const validateNewPassword = (pwd) => {
    if (!pwd || !pwd.trim()) {
      return 'Mật khẩu mới không được để trống';
    }
    if (pwd.length < 6) {
      return 'Mật khẩu mới phải có tối thiểu 6 ký tự';
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/.test(pwd)) {
      return 'Mật khẩu phải bao gồm chữ hoa (A-Z), chữ thường (a-z), chữ số (0-9) và ký tự đặc biệt (VD: Manh123@)';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPwd, newPwd) => {
    if (!confirmPwd || !confirmPwd.trim()) {
      return 'Xác nhận mật khẩu mới không được để trống';
    }
    if (confirmPwd !== newPwd) {
      return 'Mật khẩu mới xác nhận không khớp. Vui lòng kiểm tra lại!';
    }
    return '';
  };

  const handleNewPassChange = (e) => {
    const val = e.target.value;
    setPassData(p => ({ ...p, newPass: val }));
    if (newPassError) {
      setNewPassError(validateNewPassword(val));
    }
    if (confirmPassError && passData.confirmPass) {
      setConfirmPassError(validateConfirmPassword(passData.confirmPass, val));
    }
  };

  const handleConfirmPassChange = (e) => {
    const val = e.target.value;
    setPassData(p => ({ ...p, confirmPass: val }));
    if (confirmPassError) {
      setConfirmPassError(validateConfirmPassword(val, passData.newPass));
    }
  };

  // Synchronize when tab query param changes
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'info';
    setActiveTab(currentTab);
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'full_name' && fullNameError) {
      setFullNameError(validateFullName(value));
    }
    if (name === 'phone' && phoneError) {
      setPhoneError(validatePhone(value));
    }
    if (name === 'gender' && genderError) {
      setGenderError('');
    }
  };

  const handleFullNameBlur = () => {
    setFullNameError(validateFullName(formData.full_name));
  };

  const handlePhoneBlur = () => {
    setPhoneError(validatePhone(formData.phone));
  };

  // Xử lý khi người dùng nhập số ngày sinh (tự chèn dấu /, chỉ cho nhập số)
  const handleDobChange = (e) => {
    const formatted = formatDobInput(e.target.value);
    setFormData(prev => ({ ...prev, dob: formatted }));
    if (dobError) {
      setDobError(validateDob(formatted));
    }
  };

  const handleDobBlur = () => {
    setDobError(validateDob(formData.dob));
  };

  // Xử lý khi người dùng chọn ngày từ bảng lịch
  const handleCalendarDateChange = (e) => {
    const isoVal = e.target.value;
    if (isoVal) {
      const [y, m, d] = isoVal.split('-');
      const vnDate = `${d}/${m}/${y}`;
      setFormData(prev => ({ ...prev, dob: vnDate }));
      setDobError('');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra Họ và tên
    const nameErr = validateFullName(formData.full_name);
    if (nameErr) {
      setFullNameError(nameErr);
      setProfileAlert({ type: 'danger', message: nameErr });
      setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
      return;
    }
    setFullNameError('');

    // 2. Kiểm tra Số điện thoại
    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      setProfileAlert({ type: 'danger', message: phoneErr });
      setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
      return;
    }
    setPhoneError('');

    // 3. Kiểm tra Ngày sinh nhật
    const dobErr = validateDob(formData.dob);
    if (dobErr) {
      setDobError(dobErr);
      setProfileAlert({ type: 'danger', message: dobErr });
      setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
      return;
    }
    setDobError('');

    // 4. Kiểm tra Giới tính
    if (!formData.gender) {
      setGenderError('Vui lòng chọn giới tính');
      setProfileAlert({ type: 'danger', message: 'Vui lòng chọn giới tính' });
      setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
      return;
    }
    setGenderError('');

    const res = await updateUserProfile({
      full_name: formData.full_name.trim(),
      phone: formData.phone ? formData.phone.trim() : '',
      avatar_url: formData.avatar_url,
      gender: formData.gender,
      dob: formData.dob.trim(),
      address: {
        province: formData.province,
        district: formData.district,
        ward: formData.ward,
        detail: formData.detailAddress
      }
    });

    if (res?.success) {
      setProfileAlert({ type: 'success', message: res?.message || 'Đã cập nhật thông tin hồ sơ cá nhân thành công!' });
    } else {
      setProfileAlert({ type: 'danger', message: res?.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại!' });
    }
    setTimeout(() => setProfileAlert({ type: '', message: '' }), 4000);
  };


  const handlePassChange = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassAlertType('danger');

    // 1. Validate Mật khẩu hiện tại không trống
    if (!passData.currentPass || !passData.currentPass.trim()) {
      setPassMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    // 2. Validate Mật khẩu mới >= 6 ký tự (giống hệt khi đăng ký)
    const nErr = validateNewPassword(passData.newPass);
    if (nErr) {
      setNewPassError(nErr);
      setPassMsg(nErr);
      return;
    }
    setNewPassError('');

    // 3. Validate Mật khẩu mới xác nhận trùng khớp
    const cErr = validateConfirmPassword(passData.confirmPass, passData.newPass);
    if (cErr) {
      setConfirmPassError(cErr);
      setPassMsg(cErr);
      return;
    }
    setConfirmPassError('');

    // 4. Validate Mật khẩu mới khác Mật khẩu hiện tại
    if (passData.currentPass === passData.newPass) {
      setPassMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    if (changePassword) {
      const res = await changePassword({
        current_password: passData.currentPass,
        new_password: passData.newPass,
        confirm_password: passData.confirmPass,
      });

      if (res?.success) {
        setPassAlertType('success');
        setPassMsg(res?.message || 'Đã đổi mật khẩu thành công và lưu vào CSDL!');
        setPassData({ currentPass: '', newPass: '', confirmPass: '' });
      } else {
        setPassAlertType('danger');
        setPassMsg(res?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại!');
      }
    } else {
      setPassAlertType('success');
      setPassMsg('Đã đổi mật khẩu thành công!');
      setPassData({ currentPass: '', newPass: '', confirmPass: '' });
    }

    setTimeout(() => setPassMsg(''), 5000);
  };

  const handleCopyVoucher = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  // Vouchers List kết nối tự động từ Kho Voucher của Quản lý
  const [vouchersList, setVouchersList] = useState(() => voucherService.getCustomerVouchers());

  useEffect(() => {
    voucherService.fetchVouchers().catch(() => {});
    const unsubscribe = voucherService.subscribe(() => {
      setVouchersList(voucherService.getCustomerVouchers());
    });
    return unsubscribe;
  }, []);

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

  // Phân loại trạng thái đơn hàng theo nhóm
  const getOrderStatusCategory = (status) => {
    const s = String(status || '').toUpperCase();
    if (['SHIPPING', 'PROCESSING', 'PREPARING', 'IN_TRANSIT', 'PAID'].includes(s)) return 'SHIPPING';
    if (['DELIVERING', 'PENDING_DELIVERY', 'CONFIRMED', 'PENDING_PAYMENT', 'PENDING'].includes(s)) return 'DELIVERING';
    if (['COMPLETED', 'DELIVERED', 'SUCCESS'].includes(s)) return 'COMPLETED';
    if (['CANCELLED', 'RETURNED', 'FAILED'].includes(s)) return 'CANCELLED';
    return 'SHIPPING';
  };

  const orderCounts = {
    ALL: customerOrders.length,
    SHIPPING: customerOrders.filter(o => getOrderStatusCategory(o.status) === 'SHIPPING').length,
    DELIVERING: customerOrders.filter(o => getOrderStatusCategory(o.status) === 'DELIVERING').length,
    COMPLETED: customerOrders.filter(o => getOrderStatusCategory(o.status) === 'COMPLETED').length,
    CANCELLED: customerOrders.filter(o => getOrderStatusCategory(o.status) === 'CANCELLED').length,
  };

  const filteredOrders = customerOrders.filter(ord => {
    if (orderStatusFilter !== 'ALL' && getOrderStatusCategory(ord.status) !== orderStatusFilter) {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      const codeMatch = String(ord.order_code || ord.order_number || ord.order_id).toLowerCase().includes(q);
      const itemMatch = (ord.items || []).some(i => String(i.name || i.product_name).toLowerCase().includes(q));
      return codeMatch || itemMatch;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const startIndex = (orderCurrentPage - 1) * ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

  const handleReorder = async (ord) => {
    if (!ord || !ord.items || ord.items.length === 0) return;
    for (const item of ord.items) {
      if (addToCart) {
        await addToCart({
          id: item.id || 1,
          title: item.name,
          price: item.price,
          image: item.image,
        }, item.size?.replace('Size ', '') || 'M', item.quantity || 1);
      }
    }
    setProfileAlert({
      type: 'success',
      message: `Đã thêm các sản phẩm từ đơn hàng #${ord.order_code || ord.order_id} vào giỏ hàng thành công!`
    });
    setTimeout(() => navigate('/cart'), 700);
  };

  return (
    <div className="profile-page-bg">
      <div className="container main-profile-wrapper" style={{ paddingTop: '28px' }}>
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
                src={formData.avatar_url || DEFAULT_AVATAR} 
                alt={user?.full_name || (isManagerOrAdmin ? 'Quản Lý Youth Fashion' : 'Khách hàng Youth Fashion')} 
                className="hero-avatar-img"
                onClick={() => fileInputRef.current?.click()}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_AVATAR;
                }}
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
                <span className="gold-text-hero">THÀNH VIÊN ĐẶC QUYỀN</span> <span className="dot">•</span> {user?.member_since || 'TỪ THÁNG 03/2023'}
              </div>
              <h1 className="hero-user-name font-serif">{user?.full_name || (isManagerOrAdmin ? 'Quản Lý Youth Fashion' : 'Khách hàng Youth Fashion')}</h1>
              <div className="hero-tier-pill">
                <span className="tier-medal">🥇</span>
                <span>{user?.tier || 'VIP GOLD ATELIER MEMBER'}</span>
              </div>
            </div>
          </div>

          <div className="hero-banner-right">
            <div className="stats-box">
              <div className="stat-col">
                <span className="stat-label">TỔNG CHI TIÊU</span>
                <span className="stat-value">{user?.total_spent || '34.5tr'}</span>
                <span className="stat-sub gold-sub">{user?.discount || `Chốt chẵn ${String(orderCounts.ALL).padStart(2, '0')} đơn đặt`}</span>
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
                  {String(orderCounts.ALL).padStart(2, '0')}
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
                <span className="nav-badge-pill gold-badge">{vouchersList.length} MÃ</span>
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
              </button>

              {/* Menu Item: Bảng Quản Lý (Đối với tài khoản manager hoặc admin) */}
              {isManagerOrAdmin && (
                <button 
                  className="nav-item-btn manager-nav-btn"
                  onClick={() => navigate('/manager')}
                >
                  <div className="nav-item-left">
                    <LayoutDashboard size={18} />
                    <span>BẢNG QUẢN LÝ</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              )}

              {/* Menu Item 5: Đăng Xuất */}
              <button
                className="nav-item-btn logout-item-btn"
                onClick={handleLogout}
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

                {profileAlert.message && (
                  <div className={`profile-alert alert-${profileAlert.type}`}>
                    {profileAlert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{profileAlert.message}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="profile-form">
                  <div className="form-fields-2col">
                    {/* Họ Và Tên */}
                    <div className="field-group">
                      <label className="field-label">
                        HỌ VÀ TÊN <span className="field-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        className={`custom-input ${fullNameError ? 'input-error' : ''}`}
                        value={formData.full_name}
                        onChange={handleInputChange}
                        onBlur={handleFullNameBlur}
                        placeholder="Nhập họ và tên của bạn"
                        required
                      />
                      {fullNameError && (
                        <div className="field-error-msg">
                          <AlertCircle size={14} />
                          <span>{fullNameError}</span>
                        </div>
                      )}
                    </div>

                    {/* Địa Chỉ Email */}
                    <div className="field-group">
                      <label className="field-label">
                        ĐỊA CHỈ EMAIL <span className="field-required">*</span>
                      </label>
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
                      <label className="field-label">
                        SỐ ĐIỆN THOẠI DI ĐỘNG <span className="field-required">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        className={`custom-input ${phoneError ? 'input-error' : ''}`}
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={handlePhoneBlur}
                        placeholder="VD: 0908 123 456"
                        required
                      />
                      {phoneError && (
                        <div className="field-error-msg">
                          <AlertCircle size={14} />
                          <span>{phoneError}</span>
                        </div>
                      )}
                    </div>

                    {/* Ngày Sinh Nhật */}
                    <div className="field-group">
                      <label className="field-label">
                        NGÀY SINH NHẬT <span className="field-required">*</span>
                      </label>
                      <div className="dob-picker-group">
                        <input
                          type="text"
                          name="dob"
                          className={`custom-input dob-text-input ${dobError ? 'input-error' : ''}`}
                          value={formData.dob}
                          onChange={handleDobChange}
                          onBlur={handleDobBlur}
                          placeholder="DD/MM/YYYY"
                          maxLength={10}
                          inputMode="numeric"
                          required
                        />
                        <button
                          type="button"
                          className="dob-calendar-btn"
                          onClick={() => hiddenDateRef.current?.showPicker ? hiddenDateRef.current.showPicker() : hiddenDateRef.current?.click()}
                          title="Mở lịch chọn ngày"
                        >
                          <Calendar size={18} />
                        </button>
                        <input
                          ref={hiddenDateRef}
                          type="date"
                          tabIndex={-1}
                          aria-hidden="true"
                          className="dob-hidden-native-input"
                          value={convertVnDateToIso(formData.dob)}
                          onChange={handleCalendarDateChange}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      {dobError && (
                        <div className="field-error-msg">
                          <AlertCircle size={14} />
                          <span>{dobError}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Giới Tính */}
                  <div className="field-group full-width-group">
                    <label className="field-label">
                      GIỚI TÍNH <span className="field-required">*</span>
                    </label>
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
                    {genderError && (
                      <div className="field-error-msg">
                        <AlertCircle size={14} />
                        <span>{genderError}</span>
                      </div>
                    )}
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
                {reviewSubmittedAlert && (
                  <div className="profile-alert alert-success animate-fade-in" style={{ marginBottom: 16 }}>
                    <CheckCircle size={16} /> {reviewSubmittedAlert}
                  </div>
                )}

                {/* Header Tiêu đề & Ô tìm kiếm */}
                <div className="orders-header-row">
                  <div className="orders-header-text">
                    <h2 className="content-main-heading font-serif">Lịch Sử Đơn Hàng</h2>
                    <p className="content-sub-heading">Theo dõi đơn đặt hàng thủ công, hành trình dịch chuyển & lịch sử tích điểm đổi quà.</p>
                  </div>

                  <div className="orders-search-box">
                    <Search size={15} className="search-box-icon" />
                    <input
                      type="text"
                      placeholder="Tìm mã đơn, tên sản phẩm..."
                      value={orderSearchQuery}
                      onChange={(e) => {
                        setOrderSearchQuery(e.target.value);
                        setOrderCurrentPage(1);
                      }}
                      className="orders-search-input"
                    />
                    {orderSearchQuery && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        onClick={() => {
                          setOrderSearchQuery('');
                          setOrderCurrentPage(1);
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter Tabs chuẩn mẫu Haute Couture */}
                <div className="status-filter-tabs">
                  {[
                    { key: 'ALL', label: `Tất cả (${String(orderCounts.ALL).padStart(2, '0')})` },
                    { key: 'SHIPPING', label: `Đang xử lý / Vận chuyển (${String(orderCounts.SHIPPING).padStart(2, '0')})` },
                    { key: 'DELIVERING', label: `Chờ giao hàng (${String(orderCounts.DELIVERING).padStart(2, '0')})` },
                    { key: 'COMPLETED', label: `Hoàn thành (${String(orderCounts.COMPLETED).padStart(2, '0')})` },
                    { key: 'CANCELLED', label: `Đã hủy / Đổi trả (${String(orderCounts.CANCELLED).padStart(2, '0')})` }
                  ].map(st => (
                    <button
                      key={st.key}
                      className={`status-tab ${orderStatusFilter === st.key ? 'active' : ''}`}
                      onClick={() => {
                        setOrderStatusFilter(st.key);
                        setOrderCurrentPage(1);
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Danh sách các đơn hàng */}
                <div className="orders-list">
                  {filteredOrders.length === 0 ? (
                    <div className="empty-state-card animate-fade-in">
                      <div className="empty-state-icon-wrapper">
                        <Package size={40} strokeWidth={1.5} className="empty-box-icon" />
                      </div>
                      <h3 className="empty-state-title font-serif">Chưa Có Đơn Hàng Nào</h3>
                      <p className="empty-state-desc">
                        {orderSearchQuery
                          ? `Không tìm thấy đơn hàng nào khớp với từ khóa "${orderSearchQuery}".`
                          : (orderStatusFilter === 'ALL'
                            ? 'Lịch sử mua sắm của bạn hiện đang trống. Hãy khám phá ngay các bộ sưu tập thời trang may đo thủ công mới nhất để tìm cho mình phong cách đẳng cấp.'
                            : 'Hiện không có đơn hàng nào thuộc trạng thái này.')}
                      </p>
                      <Link to="/" className="btn-empty-shop">
                        <span>KHÁM PHÁ BỘ SƯU TẬP</span>
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  ) : (
                    currentOrders.map(ord => {
                      const statusCat = getOrderStatusCategory(ord.status);
                      return (
                        <div key={ord.order_id} className="order-item-card animate-fade-in">
                          {/* Header Bar */}
                          <div className="order-card-header">
                            <div className="order-header-meta">
                              <span className="order-code">#{ord.order_code || ord.order_number || ord.order_id}</span>
                              <span className="meta-sep">|</span>
                              <span className="order-date">Ngày đặt: {ord.created_at}</span>
                              {ord.payment_method && (
                                <>
                                  <span className="meta-sep">|</span>
                                  <span className="order-method">{ord.payment_method}</span>
                                </>
                              )}
                            </div>

                            <div className="order-status-badge">
                              {statusCat === 'SHIPPING' && (
                                <span className="status-badge-pill badge-shipping">
                                  <Truck size={14} /> {ord.status_label || 'ĐANG GIAO HÀNG HỎA TỐC'}
                                </span>
                              )}
                              {statusCat === 'DELIVERING' && (
                                <span className="status-badge-pill badge-delivering">
                                  <Clock size={14} /> {ord.status_label || 'CHỜ GIAO HÀNG'}
                                </span>
                              )}
                              {statusCat === 'COMPLETED' && (
                                <span className="status-badge-pill badge-completed">
                                  <Check size={14} strokeWidth={2.5} /> {ord.status_label || (ord.delivered_date ? `GIAO THÀNH CÔNG (${ord.delivered_date})` : 'GIAO THÀNH CÔNG')}
                                </span>
                              )}
                              {statusCat === 'CANCELLED' && (
                                <span className="status-badge-pill badge-cancelled">
                                  <X size={14} strokeWidth={2.5} /> {ord.status_label || 'ĐÃ HỦY'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="order-items-wrapper">
                            {ord.items.map((item, idx) => (
                              <div key={item.id || idx} className="order-product-row">
                                <img
                                  src={item.image || 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500'}
                                  alt={item.name}
                                  className="item-thumb"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500';
                                  }}
                                />
                                <div className="item-details">
                                  {item.collection_tag && (
                                    <span className="item-collection-tag">{item.collection_tag}</span>
                                  )}
                                  <h4 className="item-title font-serif">{item.name}</h4>
                                  <div className="item-specs-row">
                                    <span>Kích thước: {item.size}</span>
                                    <span className="specs-dot">•</span>
                                    <span>Màu sắc: {item.color}</span>
                                    {item.quantity && (
                                      <>
                                        <span className="specs-dot">•</span>
                                        <span>Số lượng: {String(item.quantity).padStart(2, '0')}</span>
                                      </>
                                    )}
                                  </div>
                                  {item.service_note && (
                                    <div className="item-service-note">{item.service_note}</div>
                                  )}
                                  {item.warranty_tag && (
                                    <div className="item-warranty-badge">{item.warranty_tag}</div>
                                  )}
                                </div>

                                <div className="item-price-col">
                                  <span className="item-current-price">{(item.price * (item.quantity || 1)).toLocaleString('vi-VN')}₫</span>
                                  {item.discount_text && (
                                    <span className="item-discount-text">{item.discount_text}</span>
                                  )}
                                  {item.original_price && (
                                    <span className="item-original-price">{(item.original_price).toLocaleString('vi-VN')}₫</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Tiến trình đơn hàng Stepper (Dành cho đơn đang xử lý hoặc vận chuyển) */}
                          {ord.stepper && (
                            <div className="order-stepper-card">
                              <div className="stepper-header-row">
                                <span className="stepper-title">TIẾN TRÌNH ĐƠN HÀNG</span>
                                {ord.stepper.estimated_delivery && (
                                  <span className="stepper-estimated">
                                    Dự kiến nhận: <strong>{ord.stepper.estimated_delivery}</strong>
                                  </span>
                                )}
                              </div>

                              <div className="stepper-timeline">
                                <div className="stepper-line" />
                                <div
                                  className="stepper-line-active"
                                  style={{
                                    width: ord.stepper.steps.filter(s => s.status === 'completed').length === 1 ? '33%' :
                                           ord.stepper.steps.filter(s => s.status === 'completed').length === 2 ? '66%' :
                                           ord.stepper.steps.filter(s => s.status === 'completed').length >= 3 ? '100%' : '15%'
                                  }}
                                />
                                <div className="stepper-nodes-row">
                                  {ord.stepper.steps.map((st, sIdx) => {
                                    const isDone = st.status === 'completed';
                                    const isActive = st.status === 'active';
                                    return (
                                      <div key={st.id || sIdx} className={`stepper-node-col ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                                        <div className="stepper-circle">
                                          {isDone ? <Check size={14} strokeWidth={3} /> : (st.id || sIdx + 1)}
                                        </div>
                                        <span className="stepper-step-name">{st.name}</span>
                                        <span className="stepper-step-time">{st.time}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="stepper-meta-bar">
                                <div className="stepper-meta-item">
                                  <span className="meta-lbl">Mã vận đơn bưu cục: </span>
                                  <span className="meta-val font-mono">{ord.stepper.tracking_code || 'GHN-VFP-494124'}</span>
                                </div>
                                <div className="stepper-meta-item">
                                  <span className="meta-lbl">Tài xế giao nhận: </span>
                                  <span className="meta-val">{ord.stepper.driver_name || 'Lê Hoàng Nam (Hotline: 0906 234 567)'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Footer & Action Buttons */}
                          <div className="order-card-footer">
                            <div className="order-total-group">
                              {ord.items.length > 1 ? (
                                <>
                                  <span className="total-lbl">Tổng đơn hàng ({ord.items.length} sản phẩm): </span>
                                  <span className="total-price-text">{ord.total_amount.toLocaleString('vi-VN')}₫</span>
                                </>
                              ) : (
                                <>
                                  <span className="total-lbl">Tổng giá trị thanh toán: </span>
                                  <span className="total-price-text">{ord.total_amount.toLocaleString('vi-VN')}₫</span>
                                </>
                              )}
                            </div>

                            <div className="order-actions-group">
                              {statusCat === 'SHIPPING' && (
                                <button
                                  className="btn-order-action btn-black-solid"
                                  onClick={() => setTrackingModalOrder(ord)}
                                >
                                  THEO DÕI HÀNH TRÌNH CHI TIẾT
                                </button>
                              )}

                              {statusCat === 'COMPLETED' && (
                                <>
                                  {ord.order_id === '79114' && (
                                    <button
                                      className="btn-order-action btn-neutral-outline"
                                      onClick={() => setWarrantyModalOpen(true)}
                                    >
                                      Yêu Cầu Hỗ Trợ Bảo Hành
                                    </button>
                                  )}
                                  {ord.order_id === '79114' ? (
                                    <button
                                      className="btn-order-action btn-neutral-outline"
                                      onClick={() => setReviewModalOrder(ord)}
                                    >
                                      Xem Đánh Giá Của Bạn
                                    </button>
                                  ) : (
                                    <button
                                      className="btn-order-action btn-gold-outline"
                                      onClick={() => setReviewModalOrder(ord)}
                                    >
                                      ★ Viết Đánh Giá (+100 Điểm)
                                    </button>
                                  )}
                                  <button
                                    className="btn-order-action btn-dark-outline"
                                    onClick={() => handleReorder(ord)}
                                  >
                                    {ord.items.length > 1 ? 'MUA LẠI ĐƠN NÀY' : 'MUA LẠI'}
                                  </button>
                                </>
                              )}

                              {statusCat === 'CANCELLED' && (
                                <>
                                  <button
                                    className="btn-order-action btn-neutral-outline"
                                    onClick={() => alert(`Lý do hủy đơn: ${ord.cancel_reason || 'Đổi sang mẫu thiết kế khác'}`)}
                                  >
                                    Chi Tiết Hủy Đơn
                                  </button>
                                  <button
                                    className="btn-order-action btn-dark-outline"
                                    onClick={() => handleReorder(ord)}
                                  >
                                    MUA LẠI ĐƠN NÀY
                                  </button>
                                </>
                              )}

                              {statusCat === 'DELIVERING' && (
                                <button
                                  className="btn-order-action btn-black-solid"
                                  onClick={() => setTrackingModalOrder(ord)}
                                >
                                  THEO DÕI ĐƠN HÀNG
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Phân trang đơn hàng */}
                {filteredOrders.length > 0 && (
                  <div className="orders-pagination-row">
                    <div className="pagination-info">
                      Hiển thị {startIndex + 1} - {Math.min(startIndex + ordersPerPage, filteredOrders.length)} trong tổng số {filteredOrders.length > 0 ? String(filteredOrders.length).padStart(2, '0') : '0'} đơn hàng
                    </div>

                    {totalPages > 1 && (
                      <div className="pagination-controls">
                        <button
                          className="pagination-btn pagination-nav-btn"
                          disabled={orderCurrentPage === 1}
                          onClick={() => setOrderCurrentPage(p => Math.max(1, p - 1))}
                        >
                          &lt; Trang trước
                        </button>

                        {Array.from({ length: totalPages }).map((_, pIdx) => {
                          const pageNum = pIdx + 1;
                          return (
                            <button
                              key={pageNum}
                              className={`pagination-btn pagination-num-btn ${orderCurrentPage === pageNum ? 'active' : ''}`}
                              onClick={() => setOrderCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          className="pagination-btn pagination-nav-btn"
                          disabled={orderCurrentPage === totalPages}
                          onClick={() => setOrderCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                          Trang sau &gt;
                        </button>
                      </div>
                    )}
                  </div>
                )}
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

                {vouchersList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', background: '#F9F8F6', borderRadius: 12, border: '1px dashed #E2DFD7' }}>
                    <Tag size={36} color="#A8A29E" style={{ marginBottom: 12 }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1C1917', margin: '0 0 6px' }}>Hiện chưa có mã ưu đãi</h3>
                    <p style={{ fontSize: 13, color: '#78716C', margin: 0 }}>Các chương trình khuyến mãi và quà tặng mới nhất sẽ được cập nhật tại đây.</p>
                  </div>
                ) : (
                  <div className="vouchers-grid">
                    {vouchersList.map((v, idx) => (
                      <div key={v.id || idx} className="voucher-card">
                        <div className="voucher-left-stub">
                          <Tag size={22} className="stub-icon" />
                          <span className="stub-tag">
                            {v.badgeLine1}
                            {v.badgeLine2 && <><br />{v.badgeLine2}</>}
                          </span>
                        </div>
                        <div className="voucher-details">
                          <h4 className="voucher-title">{v.title}</h4>
                          <p className="voucher-desc">{v.desc}</p>
                          <div className="voucher-footer">
                            <span className="voucher-expiry">{v.expiry}</span>
                            <button
                              className="copy-code-btn"
                              onClick={() => handleCopyVoucher(v.code)}
                              title="Sao chép mã"
                            >
                              <Copy size={13} /> {v.code}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  <div className={`profile-alert alert-${passAlertType}`}>
                    {passAlertType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{passMsg}</span>
                  </div>
                )}

                <form onSubmit={handlePassChange} className="password-form">
                  {/* MẬT KHẨU HIỆN TẠI */}
                  <div className="field-group">
                    <label className="field-label">MẬT KHẨU HIỆN TẠI <span className="field-required">*</span></label>
                    <div className="password-input-relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        className="custom-input"
                        value={passData.currentPass}
                        onChange={(e) => setPassData(p => ({ ...p, currentPass: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        className="pass-eye-toggle-btn"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        title={showCurrentPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        aria-label="Toggle password visibility"
                      >
                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* MẬT KHẨU MỚI */}
                  <div className="field-group">
                    <label className="field-label">MẬT KHẨU MỚI <span className="field-required">*</span></label>
                    <div className="password-input-relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        className={`custom-input ${newPassError ? 'input-error' : ''}`}
                        value={passData.newPass}
                        onChange={handleNewPassChange}
                        onBlur={() => setNewPassError(validateNewPassword(passData.newPass))}
                        required
                      />
                      <button
                        type="button"
                        className="pass-eye-toggle-btn"
                        onClick={() => setShowNewPass(!showNewPass)}
                        title={showNewPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        aria-label="Toggle password visibility"
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {newPassError && (
                      <div className="field-error-msg">
                        <AlertCircle size={14} />
                        <span>{newPassError}</span>
                      </div>
                    )}
                  </div>

                  {/* XÁC NHẬN MẬT KHẨU MỚI */}
                  <div className="field-group">
                    <label className="field-label">XÁC NHẬN MẬT KHẨU MỚI <span className="field-required">*</span></label>
                    <div className="password-input-relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        className={`custom-input ${confirmPassError ? 'input-error' : ''}`}
                        value={passData.confirmPass}
                        onChange={handleConfirmPassChange}
                        onBlur={() => setConfirmPassError(validateConfirmPassword(passData.confirmPass, passData.newPass))}
                        required
                      />
                      <button
                        type="button"
                        className="pass-eye-toggle-btn"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        title={showConfirmPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        aria-label="Toggle password visibility"
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassError && (
                      <div className="field-error-msg">
                        <AlertCircle size={14} />
                        <span>{confirmPassError}</span>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="save-profile-btn" style={{ marginTop: '16px' }}>
                    CẬP NHẬT MẬT KHẨU
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal 1: Theo Dõi Hành Trình Chi Tiết */}
      {trackingModalOrder && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setTrackingModalOrder(null)}>
          <div className="profile-modal-box tracking-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <span className="modal-super-title">THEO DÕI HỎA TỐC 2H</span>
                <h3 className="modal-title font-serif">Mã Đơn #{trackingModalOrder.order_code || trackingModalOrder.order_id}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setTrackingModalOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="tracking-modal-card">
              <div className="carrier-badge-row">
                <span className="carrier-name">🚚 Giao Hàng Nhanh (Express VIP)</span>
                <span className="carrier-code">Mã bưu cục: {trackingModalOrder.stepper?.tracking_code || 'GHN-VFP-494124'}</span>
              </div>
              <div className="shipper-info-box">
                <User size={15} />
                <span>Tài xế giao nhận: <strong>{trackingModalOrder.stepper?.driver_name || 'Lê Hoàng Nam (Hotline: 0906 234 567)'}</strong></span>
              </div>
            </div>

            <div className="tracking-history-timeline">
              <h4 className="timeline-section-title">Nhật ký hành trình đơn hàng:</h4>
              <div className="history-step active">
                <div className="history-dot" />
                <div className="history-content">
                  <span className="history-time">Hôm nay - 14:15</span>
                  <p className="history-text">Tài xế đang điều phối hỏa tốc, dự kiến giao tới bạn trước 17:30</p>
                </div>
              </div>
              <div className="history-step">
                <div className="history-dot" />
                <div className="history-content">
                  <span className="history-time">Hôm nay - 13:30</span>
                  <p className="history-text">Kiện hàng hoàn tất kiểm định chất lượng và rời kho Tân Bình</p>
                </div>
              </div>
              <div className="history-step">
                <div className="history-dot" />
                <div className="history-content">
                  <span className="history-time">24/10 - 11:20</span>
                  <p className="history-text">Đã đóng gói hộp quà Haute Couture kèm thiệp bảo hành Youth Fashion</p>
                </div>
              </div>
              <div className="history-step">
                <div className="history-dot" />
                <div className="history-content">
                  <span className="history-time">24/10 - 09:15</span>
                  <p className="history-text">Xác nhận đơn đặt may thủ công thành công từ hệ thống</p>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button className="btn-modal-primary" onClick={() => setTrackingModalOrder(null)}>
                ĐÃ HIỂU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Viết Đánh Giá (+100 Điểm) */}
      {reviewModalOrder && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setReviewModalOrder(null)}>
          <div className="profile-modal-box review-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <span className="modal-super-title gold-text">★ ĐẶC QUYỀN THÀNH VIÊN VIP</span>
                <h3 className="modal-title font-serif">Viết Đánh Giá Sản Phẩm</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setReviewModalOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="review-reward-banner">
              <span>🎉 Nhận ngay <strong>+100 Điểm Thưởng VIP</strong> sau khi hoàn thành đánh giá!</span>
            </div>

            <div className="review-product-preview">
              <img
                src={reviewModalOrder.items?.[0]?.image || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500'}
                alt=""
                className="review-thumb"
              />
              <div>
                <h4 className="review-prod-title font-serif">{reviewModalOrder.items?.[0]?.name}</h4>
                <span className="review-prod-specs">Mã đơn: #{reviewModalOrder.order_code || reviewModalOrder.order_id}</span>
              </div>
            </div>

            <div className="review-rating-stars">
              <span className="rating-prompt">Chất lượng sản phẩm & độ vừa vặn:</span>
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= reviewRating ? 'selected' : ''}`}
                    onClick={() => setReviewRating(star)}
                  >
                    ★
                  </button>
                ))}
                <span className="rating-label-text">
                  {reviewRating === 5 ? 'Cực kỳ hài lòng (5/5)' : reviewRating === 4 ? 'Rất tốt (4/5)' : `${reviewRating}/5 sao`}
                </span>
              </div>
            </div>

            <div className="review-quick-tags">
              {['Chất liệu thượng hạng', 'Đường may tinh xảo', 'Chuẩn phom dáng', 'Đóng gói sang trọng'].map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`quick-tag-chip ${selectedReviewTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedReviewTags(prev =>
                      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                    );
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="review-textarea-wrap">
              <textarea
                rows={3}
                placeholder="Chia sẻ thêm cảm nhận của bạn về chất vải, phom dáng và dịch vụ may đo..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                className="review-textarea"
              />
            </div>

            <div className="modal-footer-actions">
              <button className="btn-modal-cancel" onClick={() => setReviewModalOrder(null)}>
                HỦY
              </button>
              <button
                className="btn-modal-primary"
                onClick={() => {
                  setReviewSubmittedAlert(`Cảm ơn bạn! Đánh giá đã được ghi nhận thành công và bạn nhận được +100 điểm thưởng VIP.`);
                  setReviewModalOrder(null);
                  setTimeout(() => setReviewSubmittedAlert(''), 5000);
                }}
              >
                GỬI ĐÁNH GIÁ & NHẬN ĐIỂM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Hỗ Trợ Bảo Hành */}
      {warrantyModalOpen && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setWarrantyModalOpen(false)}>
          <div className="profile-modal-box warranty-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <span className="modal-super-title">ATELIER CONCIERGE</span>
                <h3 className="modal-title font-serif">Chính Sách & Hỗ Trợ Bảo Hành</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setWarrantyModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="warranty-content">
              <div className="warranty-item">
                <ShieldCheck size={24} className="gold-icon" />
                <div>
                  <h5>Bảo hành đường may & khuy khóa trọn đời</h5>
                  <p>Mọi trang phục may đo tại Youth Fashion đều được hỗ trợ chăm sóc, sửa đường chỉ và thay thế phụ kiện chính hãng trọn đời sản phẩm.</p>
                </div>
              </div>

              <div className="warranty-item">
                <RefreshCw size={24} className="gold-icon" />
                <div>
                  <h5>Miễn phí chỉnh sửa số đo trong 30 ngày</h5>
                  <p>Nếu bạn muốn lên gấu váy, nới hoặc bóp eo để đạt tỷ lệ hoàn hảo nhất, vui lòng mang đến Atelier hoặc liên hệ Hotline để được hỗ trợ giao nhận tận nơi.</p>
                </div>
              </div>

              <div className="warranty-item">
                <Clock size={24} className="gold-icon" />
                <div>
                  <h5>Hotline Concierge 24/7</h5>
                  <p>Chuyên viên chăm sóc khách hàng VIP: <strong>1900 6868 (Phím 1)</strong> hoặc email: <strong>atelier@youthfashion.vn</strong></p>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button className="btn-modal-primary" onClick={() => setWarrantyModalOpen(false)}>
                ĐÃ HIỂU
              </button>
            </div>
          </div>
        </div>
      )}

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
          border-radius: 14px;
          object-fit: contain;
          background: #000000;
          border: 2px solid rgba(212, 175, 55, 0.4);
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
          background-color: #fde047;
          color: #713f12;
          font-weight: 700;
        }

        .manager-nav-btn {
          color: #0284c7 !important;
          border-left: 3px solid #0284c7;
          border-radius: 4px 10px 10px 4px;
        }

        .manager-nav-btn .nav-item-left {
          color: #0284c7;
        }

        .manager-nav-btn .nav-item-left span {
          font-weight: 600;
          color: #0284c7;
        }

        .manager-nav-btn:hover {
          background-color: #f0f9ff;
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

        .password-input-relative {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .password-input-relative .custom-input {
          padding-right: 42px;
        }

        .pass-eye-toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .pass-eye-toggle-btn:hover {
          color: #111827;
        }

        .field-required {
          color: #ef4444;
          font-weight: 700;
          margin-left: 2px;
        }

        .custom-input.input-error {
          border-color: #ef4444 !important;
          background-color: #fef2f2 !important;
        }

        .custom-input.input-error:focus {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
        }

        .field-error-msg {
          font-size: 12px;
          color: #dc2626;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          line-height: 1.4;
          font-weight: 500;
        }

        .input-disabled {
          background-color: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
          border-color: #e5e7eb;
        }

        .dob-picker-group {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .dob-text-input {
          padding-right: 44px;
          letter-spacing: 0.5px;
        }

        .dob-calendar-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          cursor: pointer;
          border-radius: 6px;
          transition: color 0.2s, background-color 0.2s, transform 0.15s;
        }

        .dob-calendar-btn:hover {
          color: #111827;
          background-color: #f3f4f6;
          transform: translateY(-50%) scale(1.08);
        }

        .dob-hidden-native-input {
          position: absolute;
          bottom: 0;
          right: 12px;
          width: 0;
          height: 0;
          opacity: 0;
          pointer-events: none;
          border: none;
          padding: 0;
          margin: 0;
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
          background-color: #181E29;
          color: #ffffff;
          width: 105px;
          min-width: 105px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 8px;
          text-align: center;
          position: relative;
        }

        .stub-icon {
          color: #facc15;
          stroke-width: 2;
        }

        .stub-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
          color: #ffffff;
          line-height: 1.35;
        }

        .voucher-details {
          padding: 18px 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .voucher-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .voucher-desc {
          font-size: 11.5px;
          color: #6b7280;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .voucher-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .voucher-expiry {
          font-size: 11.5px;
          color: #9ca3af;
        }

        .copy-code-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #000000;
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }

        .copy-code-btn:hover {
          background-color: #27272a;
        }

        /* Password Form */
        .password-form {
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Order History Styles - Haute Couture Luxury Youth Fashion */
        .orders-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .orders-header-text {
          flex: 1;
          min-width: 260px;
        }

        .orders-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #ffffff;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 8px 14px;
          width: 270px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .orders-search-box:focus-within {
          border-color: #1c1917;
          box-shadow: 0 0 0 2px rgba(28, 25, 23, 0.08);
        }

        .search-box-icon {
          color: #a8a29e;
          flex-shrink: 0;
        }

        .orders-search-input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 12.5px;
          color: #1c1917;
          width: 100%;
        }

        .orders-search-input::placeholder {
          color: #a8a29e;
        }

        .search-clear-btn {
          background: none;
          border: none;
          color: #78716c;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-filter-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 16px;
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .status-filter-tabs::-webkit-scrollbar {
          display: none;
        }

        .status-tab {
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #57534e;
          background-color: #f5f5f4;
          border: 1px solid #e7e5e4;
          transition: all 0.2s ease;
          white-space: nowrap;
          cursor: pointer;
        }

        .status-tab:hover {
          color: #1c1917;
          background-color: #e7e5e4;
          border-color: #d6d3d1;
        }

        .status-tab.active {
          background-color: #1c1917;
          color: #ffffff;
          border-color: #1c1917;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        /* Luxury Order Card */
        .order-item-card {
          border: 1px solid #e7e5e4;
          border-radius: 12px;
          background-color: #ffffff;
          overflow: hidden;
          transition: box-shadow 0.2s, border-color 0.2s;
        }

        .order-item-card:hover {
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
          border-color: #d6d3d1;
        }

        .order-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 20px;
          background-color: #fafaf9;
          border-bottom: 1px solid #f0eee9;
          font-size: 12px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .order-header-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .order-code {
          font-weight: 700;
          color: #1c1917;
        }

        .meta-sep {
          color: #d6d3d1;
          font-size: 11px;
        }

        .order-date, .order-method {
          color: #78716c;
        }

        /* Status Badge Pills */
        .status-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 20px;
          letter-spacing: 0.3px;
        }

        .badge-shipping {
          background-color: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .badge-delivering {
          background-color: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .badge-completed {
          background-color: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .badge-cancelled {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecdd3;
        }

        /* Order Items */
        .order-items-wrapper {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .order-product-row {
          display: flex;
          align-items: flex-start;
          gap: 18px;
        }

        .item-thumb {
          width: 76px;
          height: 76px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #f0eee9;
          background-color: #f5f5f4;
          flex-shrink: 0;
        }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-collection-tag {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #d97706;
          text-transform: uppercase;
        }

        .item-title {
          font-size: 14.5px;
          font-weight: 600;
          color: #1c1917;
          margin: 0;
        }

        .item-specs-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #78716c;
          flex-wrap: wrap;
        }

        .specs-dot {
          color: #d6d3d1;
          font-size: 10px;
        }

        .item-service-note {
          font-size: 12px;
          color: #b45309;
          background-color: #fffbeb;
          padding: 3px 8px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 2px;
          width: fit-content;
        }

        .item-warranty-badge {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 600;
          color: #0369a1;
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 2px 8px;
          border-radius: 4px;
          margin-top: 2px;
          width: fit-content;
        }

        .item-price-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
          min-width: 140px;
        }

        .item-current-price {
          font-size: 15px;
          font-weight: 700;
          color: #1c1917;
        }

        .item-discount-text {
          font-size: 11px;
          color: #ea580c;
          font-weight: 500;
        }

        .item-original-price {
          font-size: 12px;
          color: #a8a29e;
          text-decoration: line-through;
        }

        /* Order Stepper Component */
        .order-stepper-card {
          margin: 0 20px 18px;
          background-color: #fafaf9;
          border: 1px solid #f0eee9;
          border-radius: 10px;
          padding: 18px 22px;
        }

        .stepper-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
          font-size: 11.5px;
        }

        .stepper-title {
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #1c1917;
          text-transform: uppercase;
        }

        .stepper-estimated {
          color: #78716c;
          font-size: 11.5px;
        }

        .stepper-estimated strong {
          color: #1c1917;
        }

        .stepper-timeline {
          position: relative;
          margin-bottom: 18px;
          padding: 0 10px;
        }

        .stepper-line {
          position: absolute;
          top: 15px;
          left: 45px;
          right: 45px;
          height: 2px;
          background-color: #e7e5e4;
          z-index: 1;
        }

        .stepper-line-active {
          position: absolute;
          top: 15px;
          left: 45px;
          height: 2px;
          background-color: #d97706;
          z-index: 1;
          transition: width 0.3s;
        }

        .stepper-nodes-row {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 2;
        }

        .stepper-node-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 120px;
        }

        .stepper-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          background-color: #e7e5e4;
          color: #78716c;
          margin-bottom: 8px;
          transition: all 0.2s;
        }

        .stepper-node-col.done .stepper-circle {
          background-color: #1c1917;
          color: #ffffff;
        }

        .stepper-node-col.active .stepper-circle {
          background-color: #d97706;
          color: #ffffff;
          box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.2);
        }

        .stepper-step-name {
          font-size: 12px;
          font-weight: 600;
          color: #1c1917;
          margin-bottom: 2px;
        }

        .stepper-step-time {
          font-size: 11px;
          color: #78716c;
        }

        .stepper-node-col.active .stepper-step-time {
          color: #d97706;
          font-weight: 600;
        }

        .stepper-meta-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 14px;
          border-top: 1px dashed #e7e5e4;
          font-size: 11.5px;
          color: #57534e;
          flex-wrap: wrap;
          gap: 10px;
        }

        .meta-lbl {
          color: #78716c;
        }

        .meta-val {
          color: #1c1917;
          font-weight: 600;
        }

        /* Order Card Footer */
        .order-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 20px;
          background-color: #fafaf9;
          border-top: 1px solid #f0eee9;
          flex-wrap: wrap;
          gap: 14px;
        }

        .order-total-group {
          font-size: 13.5px;
        }

        .total-lbl {
          color: #57534e;
        }

        .total-price-text {
          font-size: 16px;
          font-weight: 700;
          color: #1c1917;
        }

        .order-actions-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-order-action {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.4px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-black-solid {
          background-color: #1c1917;
          color: #ffffff;
          border: 1px solid #1c1917;
          text-transform: uppercase;
        }

        .btn-black-solid:hover {
          background-color: #000000;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }

        .btn-dark-outline {
          background-color: transparent;
          color: #1c1917;
          border: 1.5px solid #1c1917;
          text-transform: uppercase;
        }

        .btn-dark-outline:hover {
          background-color: #1c1917;
          color: #ffffff;
        }

        .btn-gold-outline {
          background-color: #fffbeb;
          color: #b45309;
          border: 1.5px solid #fde68a;
        }

        .btn-gold-outline:hover {
          background-color: #fef3c7;
          border-color: #f59e0b;
        }

        .btn-neutral-outline {
          background-color: #ffffff;
          color: #4b5563;
          border: 1px solid #d1d5db;
        }

        .btn-neutral-outline:hover {
          background-color: #f9fafb;
          color: #111827;
          border-color: #9ca3af;
        }

        /* Pagination Styles */
        .orders-pagination-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #f1f3f5;
          font-size: 12.5px;
          color: #78716c;
          flex-wrap: wrap;
          gap: 14px;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pagination-btn {
          border: 1px solid #e7e5e4;
          background-color: #ffffff;
          color: #44403c;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: #1c1917;
          color: #1c1917;
        }

        .pagination-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .pagination-num-btn {
          min-width: 34px;
          text-align: center;
        }

        .pagination-num-btn.active {
          background-color: #1c1917;
          color: #ffffff;
          border-color: #1c1917;
        }

        /* Modals Styles */
        .profile-modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }

        .profile-modal-box {
          background-color: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          padding: 26px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f1f3f5;
        }

        .modal-super-title {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #78716c;
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }

        .modal-super-title.gold-text {
          color: #d97706;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #1c1917;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #78716c;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.15s;
        }

        .modal-close-btn:hover {
          background-color: #f5f5f4;
          color: #1c1917;
        }

        .tracking-modal-card {
          background-color: #fafaf9;
          border: 1px solid #f0eee9;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .carrier-badge-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          margin-bottom: 10px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .carrier-name {
          font-weight: 700;
          color: #1c1917;
        }

        .carrier-code {
          color: #78716c;
          font-family: monospace;
          background: #ffffff;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #e7e5e4;
        }

        .shipper-info-box {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #57534e;
          border-top: 1px dashed #e7e5e4;
          padding-top: 10px;
        }

        .timeline-section-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #1c1917;
          margin: 0 0 14px;
        }

        .tracking-history-timeline {
          margin-bottom: 24px;
          position: relative;
          padding-left: 18px;
        }

        .history-step {
          position: relative;
          padding-bottom: 18px;
          border-left: 2px solid #e7e5e4;
          padding-left: 16px;
        }

        .history-step:last-child {
          border-left: 2px solid transparent;
          padding-bottom: 0;
        }

        .history-dot {
          position: absolute;
          left: -7px;
          top: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #d6d3d1;
          border: 2px solid #ffffff;
        }

        .history-step.active .history-dot {
          background-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.2);
        }

        .history-time {
          font-size: 11px;
          font-weight: 700;
          color: #78716c;
          display: block;
          margin-bottom: 2px;
        }

        .history-step.active .history-time {
          color: #d97706;
        }

        .history-text {
          font-size: 12.5px;
          color: #1c1917;
          margin: 0;
          line-height: 1.45;
        }

        .review-reward-banner {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          color: #b45309;
          margin-bottom: 18px;
        }

        .review-product-preview {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          background-color: #fafaf9;
          border-radius: 8px;
          margin-bottom: 18px;
        }

        .review-thumb {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 6px;
        }

        .review-prod-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #1c1917;
          margin: 0 0 2px;
        }

        .review-prod-specs {
          font-size: 11.5px;
          color: #78716c;
        }

        .review-rating-stars {
          margin-bottom: 18px;
        }

        .rating-prompt {
          font-size: 12.5px;
          font-weight: 600;
          color: #1c1917;
          display: block;
          margin-bottom: 8px;
        }

        .stars-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .star-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #d6d3d1;
          cursor: pointer;
          transition: transform 0.15s, color 0.15s;
          padding: 0;
        }

        .star-btn.selected {
          color: #f59e0b;
        }

        .star-btn:hover {
          transform: scale(1.15);
        }

        .rating-label-text {
          font-size: 12px;
          font-weight: 600;
          color: #b45309;
          margin-left: 6px;
        }

        .review-quick-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .quick-tag-chip {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 11.5px;
          border: 1px solid #e7e5e4;
          background-color: #ffffff;
          color: #57534e;
          cursor: pointer;
          transition: all 0.15s;
        }

        .quick-tag-chip.active {
          background-color: #1c1917;
          color: #ffffff;
          border-color: #1c1917;
        }

        .review-textarea-wrap {
          margin-bottom: 20px;
        }

        .review-textarea {
          width: 100%;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12.5px;
          font-family: inherit;
          color: #1c1917;
          outline: none;
          resize: vertical;
        }

        .review-textarea:focus {
          border-color: #1c1917;
        }

        .modal-footer-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-modal-cancel {
          background-color: #f5f5f4;
          color: #57534e;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-modal-primary {
          background-color: #1c1917;
          color: #ffffff;
          border: none;
          padding: 10px 22px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.4px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-modal-primary:hover {
          background-color: #000000;
        }

        .warranty-content {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 24px;
        }

        .warranty-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .gold-icon {
          color: #d97706;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .warranty-item h5 {
          font-size: 13.5px;
          font-weight: 700;
          color: #1c1917;
          margin: 0 0 4px;
        }

        .warranty-item p {
          font-size: 12px;
          color: #57534e;
          margin: 0;
          line-height: 1.5;
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
