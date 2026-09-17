import { z } from 'zod';

export const createBrandSchema = z.object({
  brand_name: z
    .string({ required_error: 'Tên thương hiệu là bắt buộc' })
    .min(2, { message: 'Tên thương hiệu phải có ít nhất 2 ký tự' }),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    invalid_type_error: 'Trạng thái phải là ACTIVE hoặc INACTIVE',
  }).optional().default('ACTIVE'),
});

export const updateBrandSchema = z.object({
  brand_name: z.string().min(2, { message: 'Tên thương hiệu phải có ít nhất 2 ký tự' }).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const validateBrandBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errorMessages = result.error.errors.map((err) => err.message);
    return res.status(400).json({
      status: false,
      message: 'Dữ liệu thương hiệu không hợp lệ',
      errors: errorMessages,
    });
  }
  next();
};
