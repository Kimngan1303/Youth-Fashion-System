import { z } from 'zod';

export const addToWishlistSchema = z.object({
  product_id: z.coerce
    .number({ required_error: 'ID sản phẩm là bắt buộc' })
    .positive('ID sản phẩm phải lớn hơn 0'),
});

export const toggleWishlistSchema = z.object({
  product_id: z.coerce
    .number({ required_error: 'ID sản phẩm là bắt buộc' })
    .positive('ID sản phẩm phải lớn hơn 0'),
});

export const syncWishlistSchema = z.object({
  product_ids: z
    .array(z.coerce.number().positive('ID sản phẩm không hợp lệ'))
    .optional(),
  items: z
    .array(
      z.object({
        product_id: z.coerce.number().positive('ID sản phẩm không hợp lệ'),
      })
    )
    .optional(),
}).refine(
  (data) => (data.product_ids && data.product_ids.length > 0) || (data.items && data.items.length > 0) || Array.isArray(data.product_ids) || Array.isArray(data.items),
  { message: 'Danh sách sản phẩm đồng bộ không được rỗng' }
);

export const validateWishlistBody = (schema) => (req, res, next) => {
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

