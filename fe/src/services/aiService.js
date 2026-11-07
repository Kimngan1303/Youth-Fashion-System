import axiosClient from './axiosClient';

/**
 * Service giao tiếp với các API AI Search & Recommendations của Backend
 */
export const aiService = {
  /**
   * Tìm kiếm sản phẩm bằng câu mô tả văn bản (Semantic Text Search)
   * @param {string} query - Từ khóa hoặc câu mô tả tự nhiên
   * @param {number} topK - Số lượng kết quả cần lấy (mặc định 10)
   */
  searchByText: async (query, topK = 10) => {
    const response = await axiosClient.post('/ai/search/text', {
      query,
      top_k: topK,
    });
    return response.data;
  },

  /**
   * Tìm kiếm sản phẩm bằng hình ảnh (Visual Search)
   * @param {File} imageFile - File hình ảnh từ input hoặc drag & drop
   * @param {number} topK - Số lượng kết quả cần lấy (mặc định 10)
   */
  searchByImage: async (imageFile, topK = 10) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('top_k', topK);

    const response = await axiosClient.post('/ai/search/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Tìm kiếm kết hợp Ảnh và Văn bản (Hybrid Multimodal Search)
   * @param {File} imageFile - File hình ảnh
   * @param {string} query - Câu mô tả chi tiết kèm theo
   * @param {number} topK - Số lượng kết quả
   * @param {number} imgWeight - Trọng số ảnh (mặc định 0.7)
   * @param {number} txtWeight - Trọng số text (mặc định 0.3)
   */
  searchHybrid: async (imageFile, query, topK = 10, imgWeight = 0.7, txtWeight = 0.3) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('query', query);
    formData.append('top_k', topK);
    formData.append('image_weight', imgWeight);
    formData.append('text_weight', txtWeight);

    const response = await axiosClient.post('/ai/search/hybrid', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Lấy danh sách sản phẩm gợi ý thông minh cho trang chủ
   * @param {number} limit - Số lượng sản phẩm
   */
  getRecommendations: async (limit = 8) => {
    const response = await axiosClient.get(`/ai/recommendations?limit=${limit}`);
    return response.data;
  },
};

