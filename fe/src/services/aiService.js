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
   * Lấy danh sách sản phẩm gợi ý thông minh dựa trên lịch sử tìm kiếm & catalog
   * @param {number} limit - Số lượng sản phẩm
   * @param {string[]} keywords - Danh sách từ khóa (dành cho guest từ localStorage)
   */
  getRecommendations: async (limit = 8, keywords = []) => {
    let url = `/ai/recommendations?limit=${limit}`;
    if (keywords && keywords.length > 0) {
      const encoded = keywords.map((k) => encodeURIComponent(k)).join(',');
      url += `&keywords=${encoded}`;
    }
    const response = await axiosClient.get(url);
    return response.data;
  },

  /**
   * Lấy lịch sử tìm kiếm người dùng (đã đăng nhập)
   * @param {number} limit - Số lượng từ khóa gần nhất
   */
  getSearchHistory: async (limit = 15) => {
    const response = await axiosClient.get(`/ai/search/history?limit=${limit}`);
    return response.data;
  },

  /**
   * Xóa toàn bộ hoặc 1 từ khóa lịch sử tìm kiếm
   * @param {string|null} query - Từ khóa cần xóa (null để xóa tất cả)
   */
  clearSearchHistory: async (query = null) => {
    const response = await axiosClient.delete('/ai/search/history', {
      data: { query },
    });
    return response.data;
  },
};

