import sharp from 'sharp';
import { createTextEmbedding, cosineSimilarity } from './embedding.service.js';

/**
 * Visual Analyzer - Phân tích thị giác cho ảnh tìm kiếm:
 * 1. Trích xuất màu sắc chủ đạo của trang phục (loại bỏ phông nền studio).
 * 2. Phân loại Zero-shot ngành hàng thời trang bằng CLIP (TOPS, BOTTOMS, DRESSES, HEADWEAR, FOOTWEAR, BAGS).
 */

// Định nghĩa các nhóm ngành hàng lớn kèm mô tả tiếng Anh cho CLIP
const CATEGORY_PROMPTS = [
  { broad: 'TOPS', prompt: 'a shirt, t-shirt, top, jacket, hoodie or sweater' },
  { broad: 'BOTTOMS', prompt: 'pants, trousers, jeans, shorts or leggings' },
  { broad: 'DRESSES_SKIRTS', prompt: 'a dress or skirt' },
  { broad: 'HEADWEAR', prompt: 'a hat, cap or beanie' },
  { broad: 'FOOTWEAR', prompt: 'shoes, sneakers or boots' },
  { broad: 'BAGS', prompt: 'a bag, handbag or backpack' },
];

let cachedCategoryVectors = null;
let categoryVectorsPromise = null;

/**
 * Khởi tạo hoặc lấy cache vector của 6 nhóm ngành hàng lớn
 */
async function getCategoryVectors() {
  if (cachedCategoryVectors) return cachedCategoryVectors;
  if (categoryVectorsPromise) return categoryVectorsPromise;

  categoryVectorsPromise = (async () => {
    try {
      const vectors = [];
      for (const item of CATEGORY_PROMPTS) {
        const vec = await createTextEmbedding(item.prompt);
        vectors.push({ broad: item.broad, vector: vec });
      }
      cachedCategoryVectors = vectors;
      return cachedCategoryVectors;
    } catch (err) {
      console.warn('[VisualAnalyzer] Không thể nạp category vectors cho CLIP:', err.message);
      return [];
    } finally {
      categoryVectorsPromise = null;
    }
  })();

  return categoryVectorsPromise;
}

/**
 * 1. Trích xuất màu chủ đạo từ buffer ảnh người dùng tải lên
 * Loại bỏ phông nền trắng/xám studio hoặc phông nền trong suốt
 */
export async function extractDominantColor(imageBuffer) {
  if (!imageBuffer) return null;

  try {
    const { data, info } = await sharp(imageBuffer)
      .resize(48, 48, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let validPixelCount = 0;

    // Duyệt qua từng pixel (RGB)
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Loại bỏ pixel phông nền trắng tinh / studio lighting (R, G, B > 238)
      if (r > 238 && g > 238 && b > 238) continue;
      // Loại bỏ pixel quá đen tuyệt đối viền (R, G, B < 8)
      if (r < 8 && g < 8 && b < 8) continue;

      totalR += r;
      totalG += g;
      totalB += b;
      validPixelCount++;
    }

    // Nếu ảnh toàn màu trắng hoặc không đủ pixel trang phục
    if (validPixelCount < 30) {
      return { detectedColor: 'Trắng', colorGroup: 'Trắng', rgb: [245, 245, 245], confidence: 0.7 };
    }

    const avgR = Math.round(totalR / validPixelCount);
    const avgG = Math.round(totalG / validPixelCount);
    const avgB = Math.round(totalB / validPixelCount);
    const brightness = (avgR * 299 + avgG * 587 + avgB * 114) / 1000;

    let detectedColor = 'Khác';
    let colorGroup = 'Khác';

    // Logic nhận diện màu thời trang chuẩn xác
    if (avgR > 130 && avgR > avgG + 35 && avgR > avgB + 35) {
      detectedColor = 'Đỏ';
      colorGroup = 'Đỏ';
    } else if (avgR > 160 && avgB > 130 && avgG < 140 && avgR > avgG + 25) {
      detectedColor = 'Hồng';
      colorGroup = 'Hồng';
    } else if (avgR > 170 && avgG > 100 && avgG < 165 && avgB < 85) {
      detectedColor = 'Cam';
      colorGroup = 'Cam';
    } else if (avgR > 160 && avgG > 150 && avgB < 115) {
      detectedColor = 'Vàng';
      colorGroup = 'Vàng';
    } else if (avgG > 105 && avgG > avgR + 20 && avgG > avgB + 15) {
      detectedColor = 'Xanh lá';
      colorGroup = 'Xanh lá';
    } else if (avgB > 105 && avgB > avgR + 15 && avgB > avgG + 10) {
      detectedColor = 'Xanh dương';
      colorGroup = 'Xanh dương';
    } else if (avgR > 95 && avgB > 110 && avgG < 85) {
      detectedColor = 'Tím';
      colorGroup = 'Tím';
    } else if (avgR > 90 && avgG > 50 && avgB < 60 && avgR > avgB + 30 && avgR < 175) {
      detectedColor = 'Nâu';
      colorGroup = 'Nâu';
    } else if (brightness < 60) {
      detectedColor = 'Đen';
      colorGroup = 'Đen';
    } else if (brightness > 200 && Math.abs(avgR - avgG) < 20 && Math.abs(avgG - avgB) < 20) {
      detectedColor = 'Trắng';
      colorGroup = 'Trắng';
    } else if (Math.abs(avgR - avgG) < 25 && Math.abs(avgG - avgB) < 25) {
      detectedColor = 'Xám';
      colorGroup = 'Xám';
    }

    return {
      detectedColor,
      colorGroup,
      rgb: [avgR, avgG, avgB],
      hex: `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1)}`,
      validPixels: validPixelCount,
      confidence: detectedColor !== 'Khác' ? 0.88 : 0.40,
    };
  } catch (err) {
    console.warn('[VisualAnalyzer] Lỗi trích xuất màu sắc ảnh:', err.message);
    return null;
  }
}

/**
 * 2. Phân loại Zero-shot nhóm ngành hàng thời trang từ vector ảnh bằng CLIP
 * @param {number[]} imageVector - Vector 512 chiều của ảnh
 * @returns {Promise<{ broadCategory: string, confidence: number }>}
 */
export async function classifyGarmentType(imageVector) {
  if (!Array.isArray(imageVector) || imageVector.length !== 512) {
    return { broadCategory: null, confidence: 0 };
  }

  try {
    const categoryVectors = await getCategoryVectors();
    if (!categoryVectors || categoryVectors.length === 0) {
      return { broadCategory: null, confidence: 0 };
    }

    let bestCategory = null;
    let highestSim = -1;

    for (const item of categoryVectors) {
      const sim = cosineSimilarity(imageVector, item.vector);
      if (sim > highestSim) {
        highestSim = sim;
        bestCategory = item.broad;
      }
    }

    return {
      broadCategory: bestCategory,
      confidence: Number(highestSim.toFixed(4)),
    };
  } catch (err) {
    console.warn('[VisualAnalyzer] Lỗi phân loại Zero-shot ngành hàng:', err.message);
    return { broadCategory: null, confidence: 0 };
  }
}

