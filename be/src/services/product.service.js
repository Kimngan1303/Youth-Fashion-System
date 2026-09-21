import * as productRepo from '../repositories/product.repository.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const formatProduct = (product) => {
  if (!product) return null;
  return {
    ...product,
    product_id: product.product_id ? String(product.product_id) : product.product_id,
    category_id: product.category_id ? String(product.category_id) : product.category_id,
    brand_id: product.brand_id ? String(product.brand_id) : product.brand_id,
    variants: product.variants
      ? product.variants.map((v) => ({
        ...v,
        variant_id: String(v.variant_id),
        product_id: String(v.product_id),
        price: Number(v.price),
      }))
      : [],
    images: product.images
      ? product.images.map((img) => ({
        ...img,
        image_id: String(img.image_id),
        product_id: String(img.product_id),
      }))
      : [],
  };
};

/**
 * Lấy danh sách sản phẩm với phân trang, tìm kiếm và lọc
 */
export const getProductsService = async (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, parseInt(query.limit, 10) || 10);
  const { category_id, brand_id, search, status } = query;

  const { items, total } = await productRepo.findProducts({
    page,
    limit,
    category_id,
    brand_id,
    search_name: search,
    status,
  });

  const formattedItems = items.map(formatProduct);
  const totalPages = Math.ceil(total / limit);

  return {
    products: formattedItems,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

/**
 * Lấy thông tin chi tiết một sản phẩm theo ID
 */
export const getProductByIdService = async (productId) => {
  const product = await productRepo.findProductById(productId);
  if (!product) {
    const error = new Error('Không tìm thấy sản phẩm');
    error.statusCode = 404;
    throw error;
  }
  return formatProduct(product);
};

/**
 * Tạo mới sản phẩm kèm biến thể và hình ảnh
 */
export const createProductService = async (body, files = []) => {
  const { product_name, description, category_id, brand_id, status } = body;

  if (!product_name || !category_id || !brand_id) {
    const error = new Error('Vui lòng điền đầy đủ tên sản phẩm, danh mục và thương hiệu');
    error.statusCode = 400;
    throw error;
  }

  // Parse variants từ string JSON (khi gửi qua multipart/form-data) hoặc object
  let variants = [];
  if (body.variants) {
    try {
      variants = typeof body.variants === 'string' ? JSON.parse(body.variants) : body.variants;
    } catch (e) {
      variants = [];
    }
  }

  // Upload hình ảnh lên Cloudinary nếu có file đính kèm
  const uploadedImages = [];
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadToCloudinary(file.buffer, 'youthfashion/products');
      uploadedImages.push({
        image_url: result.secure_url,
        alt_text: `${product_name} - ${i + 1}`,
        is_primary: i === 0,
        display_order: i + 1,
      });
    }
  } else if (body.image_urls) {
    // Trường hợp truyền danh sách URL ảnh có sẵn
    const urls = typeof body.image_urls === 'string' ? JSON.parse(body.image_urls) : body.image_urls;
    urls.forEach((url, idx) => {
      uploadedImages.push({
        image_url: url,
        alt_text: `${product_name} - ${idx + 1}`,
        is_primary: idx === 0,
        display_order: idx + 1,
      });
    });
  }

  const newProduct = await productRepo.createProduct({
    product_name,
    description,
    category_id,
    brand_id,
    status: status || 'ACTIVE',
    variants,
    images: uploadedImages,
  });

  return formatProduct(newProduct);
};

/**
 * Cập nhật thông tin sản phẩm
 */
export const updateProductService = async (productId, body, files = []) => {
  const existingProduct = await productRepo.findProductById(productId);
  if (!existingProduct) {
    const error = new Error('Không tìm thấy sản phẩm để cập nhật');
    error.statusCode = 404;
    throw error;
  }

  let variants = undefined;
  if (body.variants !== undefined) {
    try {
      variants = typeof body.variants === 'string' ? JSON.parse(body.variants) : body.variants;
    } catch (e) {
      variants = [];
    }
  }

  const updated = await productRepo.updateProduct(productId, {
    product_name: body.product_name,
    description: body.description,
    category_id: body.category_id,
    brand_id: body.brand_id,
    status: body.status,
    variants,
  });

  // Nếu có upload thêm ảnh mới khi update
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadToCloudinary(file.buffer, 'youthfashion/products');
      await productRepo.addProductImage(productId, {
        image_url: result.secure_url,
        alt_text: `${updated.product_name} extra image`,
        is_primary: false,
        display_order: updated.images.length + i + 1,
      });
    }
  }

  const finalProduct = await productRepo.findProductById(productId);
  return formatProduct(finalProduct);
};

/**
 * Xóa sản phẩm
 */
export const deleteProductService = async (productId) => {
  const existingProduct = await productRepo.findProductById(productId);
  if (!existingProduct) {
    const error = new Error('Không tìm thấy sản phẩm để xóa');
    error.statusCode = 404;
    throw error;
  }
  await productRepo.deleteProduct(productId);
  return { message: 'Đã xóa sản phẩm thành công' };
};

/**
 * Upload và thêm 1 ảnh cho sản phẩm
 */
export const addProductImageService = async (productId, file, isPrimary = false) => {
  if (!file) {
    const error = new Error('Vui lòng chọn file hình ảnh');
    error.statusCode = 400;
    throw error;
  }

  const result = await uploadToCloudinary(file.buffer, 'youthfashion/products');
  const newImage = await productRepo.addProductImage(productId, {
    image_url: result.secure_url,
    alt_text: 'Product Image',
    is_primary: isPrimary === true || isPrimary === 'true',
  });

  return {
    ...newImage,
    image_id: String(newImage.image_id),
    product_id: String(newImage.product_id),
  };
};

/**
 * Xóa 1 ảnh của sản phẩm theo image_id
 */
export const deleteProductImageService = async (imageId) => {
  await productRepo.deleteProductImage(imageId);
  return { message: 'Đã xóa hình ảnh thành công' };
};

/**
 * Đặt 1 ảnh làm ảnh chính cho sản phẩm
 */
export const setPrimaryProductImageService = async (productId, imageId) => {
  const updatedImage = await productRepo.setPrimaryProductImage(productId, imageId);
  return {
    ...updatedImage,
    image_id: String(updatedImage.image_id),
    product_id: String(updatedImage.product_id),
  };
};

/**
 * Lấy danh mục và thương hiệu cho bộ lọc Dropdown
 */
export const getCategoriesAndBrandsService = async () => {
  const [categories, brands] = await Promise.all([
    productRepo.findAllCategories(),
    productRepo.findAllBrands(),
  ]);

  return {
    categories: categories.map((c) => ({ ...c, category_id: String(c.category_id) })),
    brands: brands.map((b) => ({ ...b, brand_id: String(b.brand_id) })),
  };
};
