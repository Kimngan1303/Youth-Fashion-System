import { z } from 'zod';

/**
 * Validation Schemas cho Module Auth sử dụng Zod trong JavaScript
 */

// Schema kiểm tra dữ liệu đầu vào khi Đăng ký Khách hàng (Customer)
export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email({ message: 'Địa chỉ email không đúng định dạng' }),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc' })
    .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/, {
      message: 'Mật khẩu phải chứa ít nhất 6 ký tự, bao gồm chữ hoa (A-Z), chữ thường (a-z), chữ số (0-9) và ký tự đặc biệt (VD: Manh123@)',
    }),
  full_name: z
    .string({ required_error: 'Họ và tên là bắt buộc' })
    .min(1, { message: 'Họ và tên không được để trống' }),
  phone: z
    .string()
    .refine(
      (val) => !val || /^(?:(?:\+84|84|0))(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/.test(val.replace(/[\s.\-()]/g, '')),
      { message: 'Số điện thoại không đúng định dạng mạng di động Việt Nam (gồm 10 số: 032-039, 05x, 07x, 08x, 09x)' }
    )
    .optional(),
});

// Schema kiểm tra dữ liệu đầu vào khi Cập nhật hồ sơ cá nhân
export const updateProfileSchema = z.object({
  customer_id: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  full_name: z
    .string()
    .min(1, { message: 'Họ và tên không được để trống' })
    .optional(),
  phone: z
    .string({ required_error: 'Số điện thoại là bắt buộc' })
    .min(1, { message: 'Số điện thoại không được để trống' })
    .refine(
      (val) => {
        const cleaned = val.replace(/[\s.\-()]/g, '');
        return /^(?:(?:\+84|84|0))(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/.test(cleaned);
      },
      { message: 'Số điện thoại không đúng định dạng mạng di động Việt Nam (gồm 10 số: 032-039, 05x, 07x, 08x, 09x)' }
    )
    .optional(),
  avatar_url: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  address: z.any().optional(),
});

// Schema kiểm tra dữ liệu đầu vào khi Đổi mật khẩu
export const changePasswordSchema = z
  .object({
    customer_id: z.union([z.string(), z.number()]).optional(),
    id: z.union([z.string(), z.number()]).optional(),
    email: z.string().optional(),
    current_password: z
      .string({ required_error: 'Mật khẩu hiện tại là bắt buộc' })
      .min(1, { message: 'Mật khẩu hiện tại không được để trống' }),
    new_password: z
      .string({ required_error: 'Mật khẩu mới là bắt buộc' })
      .min(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/, {
        message: 'Mật khẩu mới phải bao gồm chữ hoa (A-Z), chữ thường (a-z), chữ số (0-9) và ký tự đặc biệt (VD: Manh123@)',
      }),
    confirm_password: z
      .string({ required_error: 'Xác nhận mật khẩu mới là bắt buộc' })
      .min(1, { message: 'Xác nhận mật khẩu mới không được để trống' }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Mật khẩu mới xác nhận không khớp. Vui lòng kiểm tra lại!',
    path: ['confirm_password'],
  });

// Schema kiểm tra dữ liệu đầu vào khi Đăng nhập
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email({ message: 'Địa chỉ email không đúng định dạng' }),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc' })
    .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
  user_type: z.enum(['CUSTOMER', 'EMPLOYEE'], {
    required_error: 'Loại người dùng user_type phải là CUSTOMER hoặc EMPLOYEE',
  }),
});

// Schema kiểm tra dữ liệu đầu vào khi Xác thực Email bằng OTP
export const verifyEmailSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email({ message: 'Địa chỉ email không đúng định dạng' }),
  otp: z
    .string({ required_error: 'Mã OTP là bắt buộc' })
    .length(6, { message: 'Mã OTP phải gồm đúng 6 chữ số' }),
});

// Schema kiểm tra dữ liệu đầu vào khi Yêu cầu gửi lại mã OTP (Resend)
export const resendOtpSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email({ message: 'Địa chỉ email không đúng định dạng' }),
});

// Middleware helper validate dữ liệu Zod cho Express Request
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errorMessages = result.error.errors.map((err) => err.message);
    return res.status(400).json({
      status: false,
      message: 'Dữ liệu đầu vào không hợp lệ',
      errors: errorMessages,
    });
  }
  req.body = result.data; // Gán dữ liệu đã qua validate sạch
  next();
};
