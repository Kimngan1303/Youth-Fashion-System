import * as lookbookRepo from '../repositories/lookbook.repository.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

export const getAllLookbooksService = async (params) => {
  const lookbooks = await lookbookRepo.findAllLookbooks(params);
  return lookbooks.map(item => ({
    id: Number(item.lookbook_id),
    type: item.type,
    lookCode: item.look_code,
    sectionRole: item.section_role,
    title: item.title,
    code: item.code,
    season: item.season,
    badge: item.badge,
    position: item.position,
    productCount: item.product_count,
    status: item.status.toLowerCase(),
    image: item.image,
    description: item.description,
    price: item.price,
    originalPrice: item.original_price,
    ctaText: item.cta_text,
    quote: item.quote,
    stockInfo: item.stock_info,
    campaignAudio: item.campaign_audio,
    conversionRate: item.conversion_rate,
    products: item.products,
    hotspots: item.hotspots,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
};

export const getLookbookByIdService = async (id) => {
  const item = await lookbookRepo.findLookbookById(id);
  if (!item) {
    const error = new Error('Không tìm thấy lookbook');
    error.statusCode = 404;
    throw error;
  }
  return {
    id: Number(item.lookbook_id),
    type: item.type,
    lookCode: item.look_code,
    sectionRole: item.section_role,
    title: item.title,
    code: item.code,
    season: item.season,
    badge: item.badge,
    position: item.position,
    productCount: item.product_count,
    status: item.status.toLowerCase(),
    image: item.image,
    description: item.description,
    price: item.price,
    originalPrice: item.original_price,
    ctaText: item.cta_text,
    quote: item.quote,
    stockInfo: item.stock_info,
    campaignAudio: item.campaign_audio,
    conversionRate: item.conversion_rate,
    products: item.products,
    hotspots: item.hotspots,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
};

export const createLookbookService = async (data, file) => {
  const targetPos = String(data.position !== undefined ? data.position : '1').trim();
  const existing = await lookbookRepo.findLookbookByPosition(targetPos);
  if (existing) {
    const posLabel = targetPos.toLowerCase() === 'banner' ? 'Banner' : `#${targetPos}`;
    const error = new Error(`Vị trí ${posLabel} đã được sử dụng bởi Lookbook "${existing.title}". Mỗi vị trí chỉ có thể chọn 1 Lookbook.`);
    error.statusCode = 400;
    throw error;
  }

  let imageUrl = data.image;
  if (file) {
    const uploadResult = await uploadToCloudinary(file.buffer, 'youthfashion/lookbooks');
    imageUrl = uploadResult.secure_url;
  }

  let products = data.products;
  if (typeof products === 'string') {
    try {
      products = JSON.parse(products);
    } catch (e) {
      products = [];
    }
  }

  const payload = {
    ...data,
    image: imageUrl,
    products,
  };

  const created = await lookbookRepo.createLookbook(payload);
  return {
    id: Number(created.lookbook_id),
    ...payload,
    status: created.status.toLowerCase(),
  };
};

export const updateLookbookService = async (id, data, file) => {
  await getLookbookByIdService(id);

  if (data.position !== undefined) {
    const targetPos = String(data.position).trim();
    const existing = await lookbookRepo.findLookbookByPosition(targetPos);
    if (existing && Number(existing.lookbook_id) !== Number(id)) {
      const posLabel = targetPos.toLowerCase() === 'banner' ? 'Banner' : `#${targetPos}`;
      const error = new Error(`Vị trí ${posLabel} đã được sử dụng bởi Lookbook "${existing.title}". Mỗi vị trí chỉ có thể chọn 1 Lookbook.`);
      error.statusCode = 400;
      throw error;
    }
  }

  const payload = { ...data };

  if (file) {
    const uploadResult = await uploadToCloudinary(file.buffer, 'youthfashion/lookbooks');
    payload.image = uploadResult.secure_url;
  }

  if (typeof payload.products === 'string') {
    try {
      payload.products = JSON.parse(payload.products);
    } catch (e) {
      payload.products = [];
    }
  }

  const updated = await lookbookRepo.updateLookbook(id, payload);
  return {
    id: Number(updated.lookbook_id),
    ...payload,
    status: updated.status.toLowerCase(),
  };
};

export const deleteLookbookService = async (id) => {
  await getLookbookByIdService(id);
  await lookbookRepo.deleteLookbook(id);
  return { message: 'Đã xóa lookbook thành công' };
};

export const swapLookbookPositionsService = async (id1, id2) => {
  const item1 = await lookbookRepo.findLookbookById(id1);
  const item2 = await lookbookRepo.findLookbookById(id2);
  if (!item1 || !item2) {
    const error = new Error('Không tìm thấy lookbook để đổi vị trí');
    error.statusCode = 404;
    throw error;
  }

  const pos1 = item1.position;
  const pos2 = item2.position;

  await lookbookRepo.swapPositions(id1, pos2, id2, pos1);

  return {
    message: 'Đổi vị trí thành công',
    item1: { id: Number(item1.lookbook_id), position: pos2 },
    item2: { id: Number(item2.lookbook_id), position: pos1 },
  };
};
