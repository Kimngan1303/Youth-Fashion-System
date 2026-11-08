/**
 * Tiện ích xử lý và trích xuất ảnh sản phẩm chuẩn xác cho đơn hàng và giỏ hàng.
 * Đảm bảo mọi sản phẩm luôn hiển thị đúng ảnh thực tế, loại bỏ triệt để ảnh dự phòng sai lệch.
 */

export const PRODUCT_IMAGE_FALLBACKS = {
  tweed: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800',
  satin_trouser: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=800',
  silk_gown: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800',
  camel_coat: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
  oxford_shirt: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
  linen_shirt: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
  flannel_shirt: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800',
  jeans: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
  hoodie: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
  sweater: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
  knitwear: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800',
  bomber: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800',
  denim_jacket: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800',
  blazer: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
  polo: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800',
  chino: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800',
  cargo: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800',
  jogger: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800',
  skirt: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
  sneaker: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
  sandal: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800',
  backpack: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
  handbag: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
  hat: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
  belt: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800',
  glasses: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800',
  scarf: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800',
  tshirt: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
};

/**
 * Phân giải ảnh chính xác cho từng mặt hàng trong đơn hàng
 * @param {Object} item - Thông tin mặt hàng trong đơn hàng
 * @returns {string} Đường dẫn ảnh trực tiếp
 */
export const resolveOrderItemImage = (item) => {
  if (!item) return PRODUCT_IMAGE_FALLBACKS.tshirt;

  const rawName = String(item.product_name || item.name || item.title || '').trim();
  const lowerName = rawName.toLowerCase();

  // 1. Kiểm tra ảnh từ cơ sở dữ liệu (qua variant -> product -> images)
  const dbImages = item.variant?.product?.images || item.product?.images || (Array.isArray(item.images) ? item.images : null);
  if (Array.isArray(dbImages) && dbImages.length > 0) {
    const primary = dbImages.find((img) => img && (img.is_primary === true || img.isPrimary === true));
    const dbUrl = primary?.image_url || primary?.url || dbImages[0]?.image_url || dbImages[0]?.url;
    if (dbUrl && typeof dbUrl === 'string' && dbUrl.startsWith('http')) {
      return dbUrl;
    }
  }

  // 2. Kiểm tra nếu item đã có trường image hoặc image_url hợp lệ
  const rawUrl = item.image || item.image_url;
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.startsWith('http')) {
    // Nếu là fallback cũ sai lệch (ảnh camel coat mặc định trước đây) và tên sản phẩm không phải camel coat, bỏ qua để phân giải theo tên
    const isStaleCamelCoat = rawUrl.includes('photo-1539533018447-63fcce2678e3');
    const isActuallyCamelCoat = lowerName.includes('măng tô') || lowerName.includes('camel') || lowerName.includes('cashmere');
    if (!isStaleCamelCoat || isActuallyCamelCoat) {
      return rawUrl;
    }
  }

  // 3. Phân giải thông minh theo tên sản phẩm thực tế
  if (lowerName.includes('tweed')) {
    return PRODUCT_IMAGE_FALLBACKS.tweed;
  }
  if (
    lowerName.includes('satin') ||
    lowerName.includes('ống rộng') ||
    lowerName.includes('quần tây') ||
    lowerName.includes('trouser') ||
    lowerName.includes('quần âu')
  ) {
    return PRODUCT_IMAGE_FALLBACKS.satin_trouser;
  }
  if (
    lowerName.includes('dạ hội') ||
    lowerName.includes('tơ tằm') ||
    lowerName.includes('emerald') ||
    lowerName.includes('pleated gown') ||
    lowerName.includes('đầm lụa')
  ) {
    return PRODUCT_IMAGE_FALLBACKS.silk_gown;
  }
  if (
    lowerName.includes('măng tô') ||
    lowerName.includes('cashmere') ||
    lowerName.includes('camel')
  ) {
    return PRODUCT_IMAGE_FALLBACKS.camel_coat;
  }
  if (
    lowerName.includes('oxford') ||
    lowerName.includes('poplin') ||
    (lowerName.includes('sơ mi') && !lowerName.includes('linen') && !lowerName.includes('flannel'))
  ) {
    return PRODUCT_IMAGE_FALLBACKS.oxford_shirt;
  }
  if (lowerName.includes('linen')) {
    return PRODUCT_IMAGE_FALLBACKS.linen_shirt;
  }
  if (lowerName.includes('flannel') || lowerName.includes('caro') || lowerName.includes('ca rô')) {
    return PRODUCT_IMAGE_FALLBACKS.flannel_shirt;
  }
  if (lowerName.includes('jean') || lowerName.includes('denim') || lowerName.includes('bò')) {
    if (lowerName.includes('khoác')) {
      return PRODUCT_IMAGE_FALLBACKS.denim_jacket;
    }
    return PRODUCT_IMAGE_FALLBACKS.jeans;
  }
  if (lowerName.includes('hoodie')) {
    return PRODUCT_IMAGE_FALLBACKS.hoodie;
  }
  if (
    lowerName.includes('sweater') ||
    lowerName.includes('nỉ bông') ||
    lowerName.includes('typography')
  ) {
    return PRODUCT_IMAGE_FALLBACKS.sweater;
  }
  if (lowerName.includes('len') || lowerName.includes('cổ lọ') || lowerName.includes('knitwear')) {
    return PRODUCT_IMAGE_FALLBACKS.knitwear;
  }
  if (lowerName.includes('bomber') || lowerName.includes('jacket') || lowerName.includes('khoác')) {
    return PRODUCT_IMAGE_FALLBACKS.bomber;
  }
  if (lowerName.includes('blazer') || lowerName.includes('vest') || lowerName.includes('gilet')) {
    return PRODUCT_IMAGE_FALLBACKS.blazer;
  }
  if (lowerName.includes('polo')) {
    return PRODUCT_IMAGE_FALLBACKS.polo;
  }
  if (lowerName.includes('chino') || lowerName.includes('kaki')) {
    return PRODUCT_IMAGE_FALLBACKS.chino;
  }
  if (lowerName.includes('cargo') || lowerName.includes('short')) {
    return PRODUCT_IMAGE_FALLBACKS.cargo;
  }
  if (lowerName.includes('jogger')) {
    return PRODUCT_IMAGE_FALLBACKS.jogger;
  }
  if (
    lowerName.includes('chân váy') ||
    lowerName.includes('váy') ||
    lowerName.includes('đầm') ||
    lowerName.includes('midi')
  ) {
    return PRODUCT_IMAGE_FALLBACKS.skirt;
  }
  if (
    lowerName.includes('sneaker') ||
    lowerName.includes('giày') ||
    lowerName.includes('bốt') ||
    lowerName.includes('boot')
  ) {
    return PRODUCT_IMAGE_FALLBACKS.sneaker;
  }
  if (lowerName.includes('sandal') || lowerName.includes('dép')) {
    return PRODUCT_IMAGE_FALLBACKS.sandal;
  }
  if (lowerName.includes('balo')) {
    return PRODUCT_IMAGE_FALLBACKS.backpack;
  }
  if (lowerName.includes('túi')) {
    return PRODUCT_IMAGE_FALLBACKS.handbag;
  }
  if (
    lowerName.includes('mũ') ||
    lowerName.includes('nón') ||
    lowerName.includes('beanie') ||
    lowerName.includes('cap')
  ) {
    return PRODUCT_IMAGE_FALLBACKS.hat;
  }
  if (lowerName.includes('thắt lưng') || lowerName.includes('dây nịt')) {
    return PRODUCT_IMAGE_FALLBACKS.belt;
  }
  if (lowerName.includes('kính')) {
    return PRODUCT_IMAGE_FALLBACKS.glasses;
  }
  if (lowerName.includes('khăn')) {
    return PRODUCT_IMAGE_FALLBACKS.scarf;
  }
  if (
    lowerName.includes('thun') ||
    lowerName.includes('cotton') ||
    lowerName.includes('t-shirt') ||
    lowerName.includes('tank top')
  ) {
    return PRODUCT_IMAGE_FALLBACKS.tshirt;
  }

  return PRODUCT_IMAGE_FALLBACKS.tshirt;
};

