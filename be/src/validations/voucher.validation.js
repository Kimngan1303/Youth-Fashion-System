import { z } from 'zod';

export const createVoucherSchema = z.object({
  code: z
    .string({ required_error: 'Mã voucher là bắt buộc' })
    .min(2, { message: 'Mã voucher phải có ít nhất 2 ký tự' }),
  name: z
    .string({ required_error: 'Tên chương trình ưu đãi là bắt buộc' })
    .min(2, { message: 'Tên chương trình phải có ít nhất 2 ký tự' }),
  discount_type: z.enum(['percent', 'fixed', 'shipping']).optional().default('percent'),
  discount_percent: z.coerce.number().optional().default(0),
  discount_amount: z.coerce.number().optional().default(0),
  min_order: z.coerce.number().optional().default(0),
  max_discount: z.coerce.number().optional().default(0),
  total_limit: z.coerce.number().optional().default(500),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  category_limit: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).optional().default('ACTIVE'),
  badge_type: z.string().optional().default('dark'),
});

export const updateVoucherSchema = z.object({
  code: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  discount_type: z.enum(['percent', 'fixed', 'shipping']).optional(),
  discount_percent: z.coerce.number().optional(),
  discount_amount: z.coerce.number().optional(),
  min_order: z.coerce.number().optional(),
  max_discount: z.coerce.number().optional(),
  total_limit: z.coerce.number().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  category_limit: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).optional(),
  badge_type: z.string().optional(),
});

export const applyVoucherSchema = z.object({
  code: z.string({ required_error: 'Vui lòng cung cấp mã voucher' }).min(1),
  subtotal: z.coerce.number().min(0, { message: 'Giá trị đơn hàng không hợp lệ' }),
});

export const validateVoucherBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errorMessages = result.error.errors.map((err) => err.message);
    return res.status(400).json({
      status: false,
      message: 'Dữ liệu voucher không hợp lệ',
      errors: errorMessages,
    });
  }
  next();
};
