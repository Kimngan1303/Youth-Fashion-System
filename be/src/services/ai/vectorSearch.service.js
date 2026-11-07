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
    this.isLoaded = false;
  }

  /**
   * Nạp vector từ file JSON vào RAM (In-Memory)
   */
  loadVectors() {
    try {
      if (fs.existsSync(STORAGE_PATH)) {
        const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
        this.vectorsCache = JSON.parse(raw);
        this.isLoaded = true;
        console.log(`[VectorSearch] Đã nạp ${this.vectorsCache.length} vector sản phẩm vào bộ nhớ RAM.`);
      } else {
        this.vectorsCache = [];
        this.isLoaded = true;
      }
    } catch (err) {
      console.error('[VectorSearch] Lỗi đọc file vector embeddings:', err.message);
      this.vectorsCache = [];
      this.isLoaded = true;
    }
    return this.vectorsCache;
  }

  /**
   * Lưu danh sách vector hiện tại ra file JSON
   */
  saveVectors() {
    try {
      const dir = path.dirname(STORAGE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORAGE_PATH, JSON.stringify(this.vectorsCache, null, 2), 'utf-8');
      console.log(`[VectorSearch] Đã lưu ${this.vectorsCache.length} vector vào ${STORAGE_PATH}`);
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

      // Nếu đã có vector và ảnh chưa bị thay đổi -> Giữ nguyên, không tốn tài nguyên tính lại
      if (existing && existing.image_url === p.image_url && existing.embedding?.length === 512) {
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
   * @param {number} topK - Số lượng kết quả cần lấy
   * @param {number} minThreshold - Điểm tương đồng tối thiểu (mặc định 0.15)
   */
  searchSimilar(queryVector, topK = 10, minThreshold = 0.10) {
    if (!this.isLoaded) {
      this.loadVectors();
    }

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
      .filter((item) => item.similarity >= minThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}

export const vectorSearchService = new VectorSearchService();

