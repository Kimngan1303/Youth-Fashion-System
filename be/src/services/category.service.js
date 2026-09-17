import * as categoryRepo from '../repositories/category.repository.js';

/**
 * Format Category object để serialize BigInt an toàn
 */
const formatCategory = (cat) => {
  if (!cat) return null;
  return {
    category_id: String(cat.category_id),
    category_name: cat.category_name,
    description: cat.description || '',
    status: cat.status,
    product_count: cat._count?.products ?? 0,
    created_at: cat.created_at,
    updated_at: cat.updated_at,
  };
};

export const getCategoriesService = async (query = {}) => {
  const categories = await categoryRepo.findCategories(query);
  return categories.map(formatCategory);
};

export const getCategoryByIdService = async (id) => {
  const category = await categoryRepo.findCategoryById(id);
  if (!category) {
    const error = new Error('Không tìm thấy danh mục');
    error.statusCode = 404;
    throw error;
  }
  return formatCategory(category);
};

export const createCategoryService = async (data) => {
  const existing = await categoryRepo.findCategoryByName(data.category_name);
  if (existing) {
    const error = new Error(`Danh mục "${data.category_name}" đã tồn tại`);
    error.statusCode = 400;
    throw error;
  }

  const created = await categoryRepo.createCategory(data);
  return formatCategory(created);
};

export const updateCategoryService = async (id, data) => {
  const existingCategory = await categoryRepo.findCategoryById(id);
  if (!existingCategory) {
    const error = new Error('Không tìm thấy danh mục để cập nhật');
    error.statusCode = 404;
    throw error;
  }

  if (data.category_name && data.category_name !== existingCategory.category_name) {
    const duplicate = await categoryRepo.findCategoryByName(data.category_name);
    if (duplicate) {
      const error = new Error(`Tên danh mục "${data.category_name}" đã bị trùng`);
      error.statusCode = 400;
      throw error;
    }
  }

  const updated = await categoryRepo.updateCategory(id, data);
  return formatCategory(updated);
};

export const deleteCategoryService = async (id) => {
  const category = await categoryRepo.findCategoryById(id);
  if (!category) {
    const error = new Error('Không tìm thấy danh mục để xóa');
    error.statusCode = 404;
    throw error;
  }

  if (category._count && category._count.products > 0) {
    const error = new Error(`Không thể xóa danh mục "${category.category_name}" vì còn ${category._count.products} sản phẩm liên quan`);
    error.statusCode = 400;
    throw error;
  }

  const deleted = await categoryRepo.deleteCategory(id);
  return formatCategory(deleted);
};
