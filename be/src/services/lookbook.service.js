import * as lookbookRepo from '../repositories/lookbook.repository.js';

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

export const createLookbookService = async (data) => {
  const created = await lookbookRepo.createLookbook(data);
  return {
    id: Number(created.lookbook_id),
    ...data,
    status: created.status.toLowerCase(),
  };
};

export const updateLookbookService = async (id, data) => {
  await getLookbookByIdService(id);
  const updated = await lookbookRepo.updateLookbook(id, data);
  return {
    id: Number(updated.lookbook_id),
    ...data,
    status: updated.status.toLowerCase(),
  };
};

export const deleteLookbookService = async (id) => {
  await getLookbookByIdService(id);
  await lookbookRepo.deleteLookbook(id);
  return { message: 'Đã xóa lookbook thành công' };
};
