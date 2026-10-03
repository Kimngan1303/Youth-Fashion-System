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

export const findLookbookByPosition = async (position) => {
  const posStr = String(position).trim();
  return await prisma.lookbook.findFirst({
    where: {
      position: {
        in: [posStr, posStr.toLowerCase(), posStr.toUpperCase()]
      }
    },
  });
};

export const getAutoCode = (pos) => {
  const p = String(pos || '').trim().toLowerCase();
  if (p === 'banner') return 'LB - BANNER';
  const num = parseInt(p, 10);
  return isNaN(num) ? `LB - ${p.toUpperCase()}` : `LB - LOOK${num < 10 ? '0' + num : num}`;
};

export const getAutoLookCode = (pos) => {
  const p = String(pos || '').trim().toLowerCase();
  if (p === 'banner') return 'BANNER';
  const num = parseInt(p, 10);
  return isNaN(num) ? p.toUpperCase() : `LOOK ${num < 10 ? '0' + num : num}`;
};

export const getAutoSectionRole = (pos) => {
  const p = String(pos || '').trim().toLowerCase();
  if (p === 'banner') return 'Khối Banner';
  const num = parseInt(p, 10);
  return isNaN(num) ? `Khối Look ${p}` : `Khối Look ${num < 10 ? '0' + num : num}`;
};

export const createLookbook = async (data) => {
  const pos = String(data.position || '1');
  return await prisma.lookbook.create({
    data: {
      type: data.type || (pos.toLowerCase() === 'banner' ? 'hero' : 'look'),
      code: data.code || getAutoCode(pos),
      look_code: data.lookCode || data.look_code || getAutoLookCode(pos),
      section_role: data.sectionRole || data.section_role || getAutoSectionRole(pos),
      title: data.title,
      season: data.season || null,
      badge: data.badge || null,
      position: pos,
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
  if (data.position !== undefined) {
    const pos = String(data.position);
    updateData.position = pos;
    updateData.code = getAutoCode(pos);
    updateData.look_code = getAutoLookCode(pos);
    updateData.section_role = getAutoSectionRole(pos);
  } else {
    if (data.code !== undefined) updateData.code = data.code;
    if (data.lookCode !== undefined || data.look_code !== undefined) updateData.look_code = data.lookCode || data.look_code;
    if (data.sectionRole !== undefined || data.section_role !== undefined) updateData.section_role = data.sectionRole || data.section_role;
  }
  if (data.title !== undefined) updateData.title = data.title;
  if (data.season !== undefined) updateData.season = data.season;
  if (data.badge !== undefined) updateData.badge = data.badge;
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

export const swapPositions = async (id1, newPos1, id2, newPos2) => {
  const codeLb1 = getAutoCode(newPos1);
  const code1 = getAutoLookCode(newPos1);
  const role1 = getAutoSectionRole(newPos1);
  const codeLb2 = getAutoCode(newPos2);
  const code2 = getAutoLookCode(newPos2);
  const role2 = getAutoSectionRole(newPos2);

  return await prisma.$transaction([
    prisma.lookbook.update({
      where: { lookbook_id: BigInt(id1) },
      data: { position: `__temp_${Date.now()}` },
    }),
    prisma.lookbook.update({
      where: { lookbook_id: BigInt(id2) },
      data: {
        position: String(newPos2),
        code: codeLb2,
        look_code: code2,
        section_role: role2,
      },
    }),
    prisma.lookbook.update({
      where: { lookbook_id: BigInt(id1) },
      data: {
        position: String(newPos1),
        code: codeLb1,
        look_code: code1,
        section_role: role1,
      },
    }),
  ]);
};
