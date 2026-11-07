import { RawImage } from '@xenova/transformers';
import { fashionClipService } from './fashionClip.service.js';

/**
 * Chuẩn hóa vector về độ dài L2 = 1 (Unit Vector)
 * Giúp việc tính Cosine Similarity rút ngắn lại thành tích vô hướng (Dot Product).
 */
export function normalizeVector(vector) {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vector;
  return vector.map((v) => v / norm);
}

/**
 * Tính Cosine Similarity giữa 2 vector (đã được chuẩn hóa L2)
 * Giá trị trả về trong khoảng [-1, 1], càng gần 1 càng tương đồng.
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

/**
 * Tạo vector 512D từ văn bản (Text Embedding)
 * @param {string} text - Câu mô tả sản phẩm hoặc từ khóa tìm kiếm
 * @returns {Promise<number[]>} - Mảng 512 số thực đã chuẩn hóa
 */
export async function createTextEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Văn bản đầu vào không hợp lệ để tạo embedding');
  }

  const { tokenizer, textModel } = await fashionClipService.getModels();
  const cleanText = text.trim();

  const textInputs = tokenizer([cleanText], { padding: true, truncation: true });
  const { text_embeds } = await textModel(textInputs);

  const rawVector = Array.from(text_embeds.data);
  return normalizeVector(rawVector);
}

/**
 * Tạo vector 512D từ hình ảnh (Image Embedding)
 * @param {string|Buffer} imageInput - Đường dẫn file, URL online, hoặc Buffer ảnh
 * @returns {Promise<number[]>} - Mảng 512 số thực đã chuẩn hóa
 */
export async function createImageEmbedding(imageInput) {
  if (!imageInput) {
    throw new Error('Hình ảnh đầu vào không hợp lệ để tạo embedding');
  }

  const { processor, visionModel } = await fashionClipService.getModels();

  let rawImage;
  if (Buffer.isBuffer(imageInput)) {
    // Chuyển Buffer thành Blob để RawImage đọc
    const blob = new Blob([imageInput]);
    rawImage = await RawImage.fromBlob(blob);
  } else if (typeof imageInput === 'string') {
    rawImage = await RawImage.read(imageInput);
  } else {
    throw new Error('Định dạng hình ảnh không được hỗ trợ');
  }

  const imageInputs = await processor(rawImage);
  const { image_embeds } = await visionModel(imageInputs);

  const rawVector = Array.from(image_embeds.data);
  return normalizeVector(rawVector);
}

/**
 * Hòa trộn 2 vector ảnh và text có trọng số (Hybrid Multimodal Fusion)
 * @param {number[]} imageVec - Vector từ hình ảnh
 * @param {number[]} textVec - Vector từ văn bản
 * @param {number} imgWeight - Trọng số ảnh (mặc định 0.70)
 * @param {number} txtWeight - Trọng số text (mặc định 0.30)
 * @returns {number[]} - Vector hybrid 512D đã chuẩn hóa
 */
export function createHybridEmbedding(imageVec, textVec, imgWeight = 0.7, txtWeight = 0.3) {
  if (!imageVec || !textVec || imageVec.length !== textVec.length) {
    throw new Error('Kích thước hai vector không khớp để hòa trộn');
  }

  const hybrid = new Array(imageVec.length);
  for (let i = 0; i < imageVec.length; i++) {
    hybrid[i] = imgWeight * imageVec[i] + txtWeight * textVec[i];
  }

  return normalizeVector(hybrid);
}

