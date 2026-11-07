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

  async init() {
    if (this.isReady) return;
    if (this.isLoading) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = (async () => {
      console.log(`[FashionCLIP] Đang nạp mô hình ${this.modelId}...`);
      const startTime = Date.now();

      this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId);
      this.processor = await AutoProcessor.from_pretrained(this.modelId);
      this.textModel = await CLIPTextModelWithProjection.from_pretrained(this.modelId);
      this.visionModel = await CLIPVisionModelWithProjection.from_pretrained(this.modelId);

      this.isReady = true;
      this.isLoading = false;
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[FashionCLIP] Mô hình đã sẵn sàng trong RAM (${duration}s)!`);
    })();

    return this.loadPromise;
  }

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
}

export const fashionClipService = new FashionClipService();

