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
