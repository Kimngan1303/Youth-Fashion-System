import { z } from 'zod';

export const createProductSchema = z.object({
  product_name: z
    .string({ required_error: 'Tên sản phẩm là bắt buộc' })
    .min(2, { message: 'Tên sản phẩm phải có ít nhất 2 ký tự' }),
  description: z.string().optional(),
  category_id: z
    .string({ required_error: 'Danh mục sản phẩm là bắt buộc' })
    .or(z.number())
    .transform((val) => Number(val)),
  brand_id: z
    .string({ required_error: 'Thương hiệu sản phẩm là bắt buộc' })
    .or(z.number())
    .transform((val) => Number(val)),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    invalid_type_error: 'Trạng thái phải là ACTIVE hoặc INACTIVE',
  }).optional().default('ACTIVE'),
});

export const updateProductSchema = z.object({
  product_name: z.string().min(2, { message: 'Tên sản phẩm phải có ít nhất 2 ký tự' }).optional(),
  description: z.string().optional(),
  category_id: z.string().or(z.number()).transform((val) => Number(val)).optional(),
  brand_id: z.string().or(z.number()).transform((val) => Number(val)).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

/**
 * Middleware Helper kiểm tra Dữ liệu sản phẩm gửi lên
 */
export const validateProductBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errorMessages = result.error.errors.map((err) => err.message);
    return res.status(400).json({
      status: false,
      message: 'Dữ liệu sản phẩm không hợp lệ',
      errors: errorMessages,
    });
  }
  next();
};
