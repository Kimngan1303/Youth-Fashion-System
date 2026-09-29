import prisma from './prisma.js';

export const findAllLookbooks = async ({ status, search } = {}) => {
  const where = {};
  if (status) {
    where.status = status.toUpperCase();
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { code: { contains: search } },
      { season: { contains: search } },
    ];
  }

  return await prisma.lookbook.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });
};

export const findLookbookById = async (id) => {
  return await prisma.lookbook.findUnique({
    where: { lookbook_id: BigInt(id) },
  });
};

export const createLookbook = async (data) => {
  return await prisma.lookbook.create({
    data: {
      type: data.type || 'look',
      look_code: data.lookCode || data.look_code || 'LOOK',
      section_role: data.sectionRole || data.section_role || null,
      title: data.title,
      code: data.code,
      season: data.season || null,
      badge: data.badge || null,
      position: String(data.position || '1'),
      product_count: Number(data.productCount || data.product_count || 1),
      status: (data.status || 'PUBLISHED').toUpperCase(),
      image: data.image,
      description: data.description || null,
      price: data.price || null,
      original_price: data.originalPrice || data.original_price || null,
      cta_text: data.ctaText || data.cta_text || null,
      quote: data.quote || null,
      stock_info: data.stockInfo || data.stock_info || null,
      campaign_audio: data.campaignAudio || data.campaign_audio || null,
      conversion_rate: data.conversionRate || data.conversion_rate || '0%',
      products: data.products || null,
      hotspots: data.hotspots || null,
    },
  });
};

export const updateLookbook = async (id, data) => {
  const updateData = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.lookCode !== undefined || data.look_code !== undefined) updateData.look_code = data.lookCode || data.look_code;
  if (data.sectionRole !== undefined || data.section_role !== undefined) updateData.section_role = data.sectionRole || data.section_role;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.code !== undefined) updateData.code = data.code;
  if (data.season !== undefined) updateData.season = data.season;
  if (data.badge !== undefined) updateData.badge = data.badge;
  if (data.position !== undefined) updateData.position = String(data.position);
  if (data.productCount !== undefined || data.product_count !== undefined) updateData.product_count = Number(data.productCount || data.product_count);
  if (data.status !== undefined) updateData.status = data.status.toUpperCase();
  if (data.image !== undefined) updateData.image = data.image;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.originalPrice !== undefined || data.original_price !== undefined) updateData.original_price = data.originalPrice || data.original_price;
  if (data.ctaText !== undefined || data.cta_text !== undefined) updateData.cta_text = data.ctaText || data.cta_text;
  if (data.quote !== undefined) updateData.quote = data.quote;
  if (data.stockInfo !== undefined || data.stock_info !== undefined) updateData.stock_info = data.stockInfo || data.stock_info;
  if (data.campaignAudio !== undefined || data.campaign_audio !== undefined) updateData.campaign_audio = data.campaignAudio || data.campaign_audio;
  if (data.conversionRate !== undefined || data.conversion_rate !== undefined) updateData.conversion_rate = data.conversionRate || data.conversion_rate;
  if (data.products !== undefined) updateData.products = data.products;
  if (data.hotspots !== undefined) updateData.hotspots = data.hotspots;

  return await prisma.lookbook.update({
    where: { lookbook_id: BigInt(id) },
    data: updateData,
  });
};

export const deleteLookbook = async (id) => {
  return await prisma.lookbook.delete({
    where: { lookbook_id: BigInt(id) },
  });
};
