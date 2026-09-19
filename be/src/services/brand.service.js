import * as brandRepo from '../repositories/brand.repository.js';

/**
 * Format Brand object để serialize BigInt an toàn
 */
const formatBrand = (b) => {
  if (!b) return null;
  return {
    brand_id: String(b.brand_id),
    brand_name: b.brand_name,
    description: b.description || '',
    status: b.status,
    product_count: b._count?.products ?? 0,
    created_at: b.created_at,
    updated_at: b.updated_at,
  };
};

export const getBrandsService = async (query = {}) => {
  const brands = await brandRepo.findBrands(query);
  return brands.map(formatBrand);
};

export const getBrandByIdService = async (id) => {
  const brand = await brandRepo.findBrandById(id);
  if (!brand) {
    const error = new Error('Không tìm thấy thương hiệu');
    error.statusCode = 404;
    throw error;
  }
  return formatBrand(brand);
};

export const createBrandService = async (data) => {
  const existing = await brandRepo.findBrandByName(data.brand_name);
  if (existing) {
    const error = new Error(`Thương hiệu "${data.brand_name}" đã tồn tại`);
    error.statusCode = 400;
    throw error;
  }

  const created = await brandRepo.createBrand(data);
  return formatBrand(created);
};

export const updateBrandService = async (id, data) => {
  const existingBrand = await brandRepo.findBrandById(id);
  if (!existingBrand) {
    const error = new Error('Không tìm thấy thương hiệu để cập nhật');
    error.statusCode = 404;
    throw error;
  }

  if (data.brand_name && data.brand_name !== existingBrand.brand_name) {
    const duplicate = await brandRepo.findBrandByName(data.brand_name);
    if (duplicate) {
      const error = new Error(`Tên thương hiệu "${data.brand_name}" đã bị trùng`);
      error.statusCode = 400;
      throw error;
    }
  }

  const updated = await brandRepo.updateBrand(id, data);
  return formatBrand(updated);
};

export const deleteBrandService = async (id) => {
  const brand = await brandRepo.findBrandById(id);
  if (!brand) {
    const error = new Error('Không tìm thấy thương hiệu để xóa');
    error.statusCode = 404;
    throw error;
  }

  if (brand._count && brand._count.products > 0) {
    const error = new Error(`Không thể xóa thương hiệu "${brand.brand_name}" vì còn ${brand._count.products} sản phẩm thuộc thương hiệu này`);
    error.statusCode = 400;
    throw error;
  }

  const deleted = await brandRepo.deleteBrand(id);
  return formatBrand(deleted);
};
