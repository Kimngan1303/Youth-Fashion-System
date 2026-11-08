import {
  AutoTokenizer,
  AutoProcessor,
  CLIPTextModelWithProjection,
  CLIPVisionModelWithProjection,
} from '@xenova/transformers';

/**
 * Singleton Service quản lý vòng đời mô hình CLIP
 * Tải 1 lần duy nhất vào bộ nhớ RAM khi server khởi động hoặc khi có request đầu tiên.
 */
class FashionClipService {
  constructor() {
    this.modelId = 'Xenova/clip-vit-base-patch32';
    this.tokenizer = null;
    this.processor = null;
    this.textModel = null;
    this.visionModel = null;
    this.isLoading = false;
    this.isReady = false;
    this.loadPromise = null;
  }

  /**
   * Khởi tạo và nạp mô hình CLIP vào bộ nhớ RAM
   * - Hỗ trợ Singleton: Nhiều request gọi đồng thời cùng chia sẻ một Promise nạp duy nhất.
   * - Khôi phục lỗi an toàn: Nếu nạp thất bại, trạng thái isLoading và loadPromise sẽ được reset để cho phép thử lại (retry).
   */
  async init(timeoutMs = 60000) {
    if (this.isReady) return;
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;

    const loadTask = async () => {
      console.log(`[FashionCLIP] Bắt đầu nạp mô hình ${this.modelId}...`);
      const startTime = Date.now();

      try {
        this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId);
        this.processor = await AutoProcessor.from_pretrained(this.modelId);
        this.textModel = await CLIPTextModelWithProjection.from_pretrained(this.modelId);
        this.visionModel = await CLIPVisionModelWithProjection.from_pretrained(this.modelId);

        this.isReady = true;
        this.isLoading = false;
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[FashionCLIP] Mô hình ${this.modelId} đã sẵn sàng trong RAM (${duration}s)!`);
      } catch (err) {
        this.isReady = false;
        this.isLoading = false;
        this.loadPromise = null;
        this.tokenizer = null;
        this.processor = null;
        this.textModel = null;
        this.visionModel = null;
        console.error(`[FashionCLIP] Khởi tạo mô hình thất bại: ${err.message}`);
        throw new Error(`Không thể nạp mô hình AI CLIP: ${err.message}`);
      }
    };

    // Thiết lập timeout bảo vệ để tránh request bị treo vô hạn
    const timeoutTask = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout (${timeoutMs / 1000}s) khi tải mô hình AI CLIP`));
      }, timeoutMs);
    });

    this.loadPromise = Promise.race([loadTask(), timeoutTask])
      .catch((err) => {
        this.isReady = false;
        this.isLoading = false;
        this.loadPromise = null;
        throw err;
      });

    return this.loadPromise;
  }

  /**
   * Lấy instance của các thành phần mô hình
   */
  async getModels() {
    if (!this.isReady) {
      await this.init();
    }
    return {
      tokenizer: this.tokenizer,
      processor: this.processor,
      textModel: this.textModel,
      visionModel: this.visionModel,
    };
  }

  /**
   * Lấy trạng thái hoạt động hiện tại của mô hình
   */
  getStatus() {
    return {
      isReady: this.isReady,
      isLoading: this.isLoading,
      modelId: this.modelId,
    };
  }

  /**
   * Reset trạng thái mô hình (Dành cho kiểm thử hoặc reload)
   */
  reset() {
    this.tokenizer = null;
    this.processor = null;
    this.textModel = null;
    this.visionModel = null;
    this.isReady = false;
    this.isLoading = false;
    this.loadPromise = null;
  }
}

export const fashionClipService = new FashionClipService();

