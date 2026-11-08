/**
 * In-Memory Sliding-Window Rate Limiter
 * Hoạt động độc lập, không cần cài thêm thư viện ngoài (zero-dependency)
 * Phục vụ giới hạn tần suất gọi API AI Search bảo vệ tài nguyên CPU.
 */
export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 20,
  message = 'Bạn đã thực hiện quá nhiều yêu cầu tìm kiếm AI. Vui lòng thử lại sau 1 phút.',
} = {}) {
  const ipRecords = new Map();

  // Dọn dẹp định kỳ các IP đã hết hạn để tránh rò rỉ RAM
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of ipRecords.entries()) {
      const validTimestamps = timestamps.filter((time) => now - time < windowMs);
      if (validTimestamps.length === 0) {
        ipRecords.delete(ip);
      } else {
        ipRecords.set(ip, validTimestamps);
      }
    }
  }, windowMs);

  // Cho phép process Node.js thoát sạch mà không bị treo bởi timer
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    // Nhận diện IP của Client (hỗ trợ proxy Nginx, Cloudflare, local socket)
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown-client-ip';

    const now = Date.now();
    const timestamps = ipRecords.get(clientIp) || [];

    // Lọc lại các timestamp còn hiệu lực trong cửa sổ thời gian
    const activeTimestamps = timestamps.filter((time) => now - time < windowMs);

    if (activeTimestamps.length >= max) {
      const oldestTime = activeTimestamps[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestTime + windowMs - now) / 1000));

      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((oldestTime + windowMs) / 1000));

      return res.status(429).json({
        success: false,
        statusCode: 429,
        message,
        retryAfter: `${retryAfterSeconds}s`,
      });
    }

    activeTimestamps.push(now);
    ipRecords.set(clientIp, activeTimestamps);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - activeTimestamps.length);

    next();
  };
}

// Cấu hình Rate Limiter mặc định cho các endpoint AI Search (20 requests / phút / IP)
export const aiSearchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Bạn đã thực hiện quá nhiều lượt tìm kiếm AI. Vui lòng thử lại sau 1 phút.',
});

