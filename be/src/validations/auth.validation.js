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
    .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
  full_name: z
    .string({ required_error: 'Họ và tên là bắt buộc' })
    .min(1, { message: 'Họ và tên không được để trống' }),
  phone: z.string().optional(),
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
