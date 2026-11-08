import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProductsForIndexing } from './productSearch.service.js';
import { createImageEmbedding, cosineSimilarity } from './embedding.service.js';
import { prisma } from '../../repositories/prisma.js';

const STORAGE_PATH = fileURLToPath(new URL('../../data/product_embeddings.json', import.meta.url));

/**
 * Service quản lý lưu trữ Vector và Tìm kiếm Độ tương đồng (Vector Similarity Search)
 */
class VectorSearchService {
  constructor() {
    this.vectorsCache = [];
    this.metadata = null;
    this.isLoaded = false;
  }

  /**
   * Nạp vector từ file JSON vào RAM (In-Memory)
   * Tương thích an toàn cả định dạng mảng cũ và định dạng cấu trúc mới kèm metadata
   */
  loadVectors() {
    try {
      if (fs.existsSync(STORAGE_PATH)) {
        const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          // Định dạng mảng cũ (Legacy format) -> tự động tương thích
          this.vectorsCache = parsed;
          this.metadata = {
            model_id: 'Xenova/clip-vit-base-patch32',
            embedding_dimension: 512,
            normalization_method: 'L2',
            updated_at: new Date().toISOString(),
            total_products: parsed.length,
          };
          console.log(`[VectorSearch] Đã nạp ${this.vectorsCache.length} vector sản phẩm (legacy array) vào RAM.`);
        } else if (parsed && Array.isArray(parsed.vectors)) {
          // Định dạng mới có metadata cấu trúc
          this.vectorsCache = parsed.vectors;
          this.metadata = {
            model_id: parsed.model_id || 'Xenova/clip-vit-base-patch32',
            embedding_dimension: parsed.embedding_dimension || 512,
            normalization_method: parsed.normalization_method || 'L2',
            updated_at: parsed.updated_at || new Date().toISOString(),
            total_products: parsed.vectors.length,
          };
          console.log(`[VectorSearch] Đã nạp ${this.vectorsCache.length} vector sản phẩm (Model: ${this.metadata.model_id}) vào RAM.`);
        } else {
          this.vectorsCache = [];
          this.metadata = null;
        }
        this.isLoaded = true;
      } else {
        this.vectorsCache = [];
        this.metadata = null;
        this.isLoaded = true;
      }
    } catch (err) {
      console.error('[VectorSearch] Lỗi đọc file vector embeddings:', err.message);
      this.vectorsCache = [];
      this.metadata = null;
      this.isLoaded = true;
    }
    return this.vectorsCache;
  }

  /**
   * Lưu danh sách vector hiện tại ra file JSON kèm metadata đầy đủ
   */
  saveVectors() {
    try {
      const dir = path.dirname(STORAGE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const payload = {
        model_id: 'Xenova/clip-vit-base-patch32',
        embedding_dimension: 512,
        normalization_method: 'L2',
        updated_at: new Date().toISOString(),
        total_products: this.vectorsCache.length,
        vectors: this.vectorsCache,
      };

      this.metadata = {
        model_id: payload.model_id,
        embedding_dimension: payload.embedding_dimension,
        normalization_method: payload.normalization_method,
        updated_at: payload.updated_at,
        total_products: payload.total_products,
      };

      fs.writeFileSync(STORAGE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
      console.log(`[VectorSearch] Đã lưu ${this.vectorsCache.length} vector kèm metadata vào ${STORAGE_PATH}`);
    } catch (err) {
      console.error('[VectorSearch] Lỗi ghi file vector embeddings:', err.message);
    }
  }

  /**
   * Lấy cấu hình AI Search mặc định (hoặc tự tạo nếu chưa có trong DB)
   */
  async getOrCreateAiConfig() {
    let config = await prisma.aiSearchConfig.findFirst({
      where: { is_active: true },
    });

    if (!config) {
      config = await prisma.aiSearchConfig.create({
        data: {
          config_name: 'FashionCLIP-ONNX-Default',
          model_name: 'Xenova/clip-vit-base-patch32',
          model_provider: 'HuggingFace',
          qdrant_url: 'http://localhost:6333',
          qdrant_collection: 'youth_fashion_products',
          embedding_dimension: 512,
          image_weight: 0.7,
          text_weight: 0.3,
          top_k: 20,
          is_active: true,
        },
      });
    }

    return config;
  }

  /**
   * Đồng bộ Vector Embedding cho toàn bộ Catalog sản phẩm từ MySQL
   * Quy tắc: KHÔNG TẠO LẠI nếu sản phẩm đã có vector và URL ảnh không đổi.
   */
  async syncCatalogEmbeddings(onProgress = null) {
    if (!this.isLoaded) {
      this.loadVectors();
    }

    console.log('[VectorSearch] Bắt đầu đồng bộ Vector cho danh mục sản phẩm...');
    const products = await getProductsForIndexing();
    const aiConfig = await this.getOrCreateAiConfig();

    let indexedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Tạo Map để tra cứu nhanh vector đã có theo product_id
    const existingMap = new Map(this.vectorsCache.map((item) => [item.product_id, item]));
    const updatedVectors = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];

      if (!p.image_url) {
        console.warn(`[VectorSearch] Bỏ qua SP ${p.product_id} (${p.product_name}) vì không có ảnh.`);
        skippedCount++;
        continue;
      }

      const existing = existingMap.get(p.product_id);

      // Nếu đã có vector và ảnh chưa bị thay đổi -> Giữ nguyên vector, cập nhật lại thông tin mới nhất từ MySQL
      if (existing && existing.image_url === p.image_url && existing.embedding?.length === 512) {
        existing.product_name = p.product_name;
        existing.category_name = p.category_name;
        existing.brand_name = p.brand_name;
        existing.price = p.price;
        existing.colors = p.colors;
        existing.updated_at = new Date().toISOString();
        updatedVectors.push(existing);
        skippedCount++;
        continue;
      }

      // Tạo mới hoặc cập nhật embedding
      try {
        console.log(`[VectorSearch] [${i + 1}/${products.length}] Đang tạo embedding cho: ${p.product_name}...`);
        const embedding = await createImageEmbedding(p.image_url);

        const newRecord = {
          product_id: p.product_id,
          image_id: p.image_id,
          image_url: p.image_url,
          product_name: p.product_name,
          category_name: p.category_name,
          brand_name: p.brand_name,
          price: p.price,
          colors: p.colors,
          embedding,
          updated_at: new Date().toISOString(),
        };

        updatedVectors.push(newRecord);
        indexedCount++;

        // Cập nhật hoặc tạo bản ghi trong bảng product_embeddings của MySQL
        try {
          await prisma.productEmbedding.upsert({
            where: {
              embedding_id: existing?.embedding_db_id ? BigInt(existing.embedding_db_id) : BigInt(0),
            },
            create: {
              product_id: BigInt(p.product_id),
              image_id: p.image_id ? BigInt(p.image_id) : null,
              ai_search_config_id: aiConfig.ai_search_config_id,
              qdrant_point_id: `point_${p.product_id}`,
              embedding_type: 'IMAGE',
              status: 'INDEXED',
              last_synced_at: new Date(),
            },
            update: {
              status: 'INDEXED',
              last_synced_at: new Date(),
            },
          });
        } catch (dbErr) {
          // Bỏ qua lỗi khóa chính nếu upsert không tìm thấy id 0, tạo mới trực tiếp
          await prisma.productEmbedding.create({
            data: {
              product_id: BigInt(p.product_id),
              image_id: p.image_id ? BigInt(p.image_id) : null,
              ai_search_config_id: aiConfig.ai_search_config_id,
              qdrant_point_id: `point_${p.product_id}`,
              embedding_type: 'IMAGE',
              status: 'INDEXED',
              last_synced_at: new Date(),
            },
          });
        }

        if (onProgress) {
          onProgress({ current: i + 1, total: products.length, product_name: p.product_name });
        }
      } catch (err) {
        console.error(`[VectorSearch] Lỗi xử lý SP ${p.product_id} (${p.product_name}):`, err.message);
        errorCount++;
      }
    }

    this.vectorsCache = updatedVectors;
    this.saveVectors();

    const summary = {
      total: products.length,
      indexed: indexedCount,
      skipped: skippedCount,
      errors: errorCount,
      cachedTotal: this.vectorsCache.length,
    };

    console.log('[VectorSearch] Hoàn tất đồng bộ vector:', summary);
    return summary;
  }

  /**
   * Tìm kiếm các sản phẩm có vector gần nhất với Query Vector
   * @param {number[]} queryVector - Vector 512D của từ khóa hoặc ảnh người dùng tìm kiếm
   * @param {number} topK - Số lượng kết quả cần lấy (kẹp trong [1, 50])
   * @param {number} minThreshold - Điểm tương đồng tối thiểu (kẹp trong [-1.0, 1.0])
   */
  searchSimilar(queryVector, topK = 10, minThreshold = 0.10) {
    if (!this.isLoaded) {
      this.loadVectors();
    }

    // Validation nghiêm ngặt cho queryVector (đúng 512 chiều, toàn bộ là số hữu hạn)
    if (!Array.isArray(queryVector) || queryVector.length !== 512) {
      const err = new Error(`Query vector không hợp lệ: Yêu cầu mảng 512 chiều (nhận được: ${Array.isArray(queryVector) ? queryVector.length : typeof queryVector})`);
      err.statusCode = 400;
      throw err;
    }

    const hasInvalidNumber = queryVector.some((v) => typeof v !== 'number' || !Number.isFinite(v));
    if (hasInvalidNumber) {
      const err = new Error('Query vector chứa giá trị không hợp lệ (NaN hoặc Infinity)');
      err.statusCode = 400;
      throw err;
    }

    // Giới hạn và chuẩn hóa tham số topK: [1, 50]
    const parsedTopK = parseInt(topK, 10);
    const clampedTopK = isNaN(parsedTopK) ? 10 : Math.max(1, Math.min(50, parsedTopK));

    // Giới hạn và chuẩn hóa tham số minThreshold: [-1.0, 1.0]
    const parsedThreshold = parseFloat(minThreshold);
    const clampedThreshold = isNaN(parsedThreshold) ? 0.10 : Math.max(-1.0, Math.min(1.0, parsedThreshold));

    if (this.vectorsCache.length === 0) {
      return [];
    }

    const scoredProducts = this.vectorsCache.map((item) => {
      const similarity = cosineSimilarity(queryVector, item.embedding);
      return {
        product_id: item.product_id,
        product_name: item.product_name,
        category_name: item.category_name,
        brand_name: item.brand_name,
        price: item.price,
        colors: item.colors,
        image_url: item.image_url,
        similarity: Number(similarity.toFixed(4)),
        similarity_percent: `${(similarity * 100).toFixed(1)}%`,
      };
    });

    // Lọc theo ngưỡng tương đồng và sắp xếp từ cao xuống thấp
    return scoredProducts
      .filter((item) => item.similarity >= clampedThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, clampedTopK);
  }

  /**
   * Đồng bộ tự động vector cho 1 sản phẩm khi tạo mới hoặc cập nhật
   * @param {string|number|BigInt} productId
   */
  async syncSingleProductEmbedding(productId) {
    if (!this.isLoaded) {
      this.loadVectors();
    }
    try {
      const pid = BigInt(productId);
      const p = await prisma.product.findUnique({
        where: { product_id: pid },
        include: {
          category: { select: { category_name: true } },
          brand: { select: { brand_name: true } },
          images: {
            orderBy: [{ is_primary: 'desc' }, { display_order: 'asc' }],
            take: 1,
          },
          variants: {
            select: { color: true, price: true },
          },
        },
      });

      if (!p || p.status !== 'ACTIVE' || !p.images || p.images.length === 0) {
        this.removeProduct(productId);
        return null;
      }

      const primaryImage = p.images[0].image_url;
      const primaryImageId = p.images[0].image_id;
      const uniqueColors = [...new Set(p.variants.map((v) => v.color).filter(Boolean))];
      const prices = p.variants.map((v) => Number(v.price)).filter((price) => !isNaN(price));
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

      const embedding = await createImageEmbedding(primaryImage);

      const record = {
        product_id: String(p.product_id),
        image_id: primaryImageId ? String(primaryImageId) : null,
        image_url: primaryImage,
        product_name: p.product_name,
        category_name: p.category?.category_name || 'Thời trang',
        brand_name: p.brand?.brand_name || 'YouthFashion',
        price: minPrice,
        colors: uniqueColors,
        embedding,
        updated_at: new Date().toISOString(),
      };

      const existingIndex = this.vectorsCache.findIndex((item) => String(item.product_id) === String(productId));
      if (existingIndex >= 0) {
        this.vectorsCache[existingIndex] = record;
      } else {
        this.vectorsCache.push(record);
      }

      this.saveVectors();
      console.log(`[VectorSearch] Đã tự động cập nhật Vector cho SP ${p.product_id} (${p.product_name})`);
      return record;
    } catch (err) {
      console.warn(`[VectorSearch] Không thể tự động đồng bộ vector cho SP ${productId}:`, err.message);
      return null;
    }
  }

  /**
   * Xóa sản phẩm khỏi RAM và file JSON khi bị xóa trong database
   */
  removeProduct(productId) {
    const beforeCount = this.vectorsCache.length;
    this.vectorsCache = this.vectorsCache.filter((item) => String(item.product_id) !== String(productId));
    if (this.vectorsCache.length !== beforeCount) {
      this.saveVectors();
      console.log(`[VectorSearch] Đã xóa Vector của SP ${productId} khỏi RAM và file cache.`);
    }
  }
}

export const vectorSearchService = new VectorSearchService();

