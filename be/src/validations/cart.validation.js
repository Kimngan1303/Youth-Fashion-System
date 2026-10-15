import { z } from 'zod';

export const addToCartSchema = z.object({
  variant_id: z.coerce
    .number({ required_error: 'ID biến thể sản phẩm là bắt buộc' })
    .positive('ID biến thể phải lớn hơn 0'),
  quantity: z.coerce
    .number({ invalid_type_error: 'Số lượng phải là số' })
    .int('Số lượng phải là số nguyên')
    .min(1, 'Số lượng tối thiểu là 1')
    .default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce
    .number({ required_error: 'Số lượng là bắt buộc' })
    .int('Số lượng phải là số nguyên')
    .min(0, 'Số lượng không được âm'),
});

export const syncCartSchema = z.object({
  items: z
    .array(
      z.object({
        variant_id: z.coerce.number().positive('ID biến thể không hợp lệ'),
        quantity: z.coerce.number().int().min(1, 'Số lượng tối thiểu là 1').default(1),
      })
    )
    .default([]),
});

export const validateCartBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errorMessages = result.error.errors.map((err) => err.message);
    return res.status(400).json({
      status: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errorMessages,
    });
  }
  req.validatedBody = result.data;
  next();
};
