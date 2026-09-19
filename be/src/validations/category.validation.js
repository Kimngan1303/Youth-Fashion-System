import { z } from 'zod';

export const createCategorySchema = z.object({
  category_name: z
    .string({ required_error: 'Tên danh mục là bắt buộc' })
    .min(2, { message: 'Tên danh mục phải có ít nhất 2 ký tự' }),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    invalid_type_error: 'Trạng thái phải là ACTIVE hoặc INACTIVE',
  }).optional().default('ACTIVE'),
});

export const updateCategorySchema = z.object({
  category_name: z.string().min(2, { message: 'Tên danh mục phải có ít nhất 2 ký tự' }).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const validateCategoryBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errorMessages = result.error.errors.map((err) => err.message);
    return res.status(400).json({
      status: false,
      message: 'Dữ liệu danh mục không hợp lệ',
      errors: errorMessages,
    });
  }
  next();
};
