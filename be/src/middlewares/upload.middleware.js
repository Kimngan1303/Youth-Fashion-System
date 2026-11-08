import multer from 'multer';

// Use MemoryStorage to store files in memory as Buffer before uploading or inference
const storage = multer.memoryStorage();

/**
 * Kiểm tra chữ ký byte (Magic Bytes) thực tế của nội dung Buffer
 * Ngăn chặn tuyệt đối việc đổi đuôi file giả mạo (.exe, .sh, .html thành .jpg/.png)
 * @param {Buffer} buffer - Buffer dữ liệu của file
 * @returns {string|false} - Trả về mimetype thực tế ('image/jpeg', 'image/png', 'image/webp') hoặc false nếu không hợp lệ
 */
export function validateImageMagicBytes(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  // 1. JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // 3. WEBP: RIFF (bytes 0-3) .... WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return false;
}

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn tối đa 5MB
  },
  fileFilter: (req, file, cb) => {
    // Kiểm tra định dạng sơ bộ qua mimetype và extension
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const lowerName = file.originalname.toLowerCase();
    const hasValidExt = /\.(jpg|jpeg|png|webp)$/i.test(lowerName);

    if (allowedMimes.includes(file.mimetype) || (file.mimetype.startsWith('image/') && hasValidExt)) {
      cb(null, true);
    } else {
      const err = new Error('Chỉ chấp nhận file định dạng hình ảnh hợp lệ (JPEG, PNG, WEBP)');
      err.statusCode = 400;
      cb(err, false);
    }
  },
});

/**
 * Middleware upload ảnh an toàn chuyên dụng cho AI Search
 * - Bắt và format lỗi Multer (kích thước quá 5MB) sang HTTP 400 chuẩn
 * - Kiểm tra Magic Bytes chống giả mạo định dạng file
 */
export function uploadAiImage(fieldName = 'image', required = true) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 5MB)',
          });
        }
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: err.message || 'File tải lên không hợp lệ',
        });
      }

      if (required && !req.file) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Vui lòng tải lên file hình ảnh để tìm kiếm',
        });
      }

      if (req.file) {
        const detectedType = validateImageMagicBytes(req.file.buffer);
        if (!detectedType) {
          return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Nội dung file không phải là hình ảnh hợp lệ hoặc đã bị thay đổi định dạng giả mạo (Chỉ chấp nhận JPEG, PNG, WEBP)',
          });
        }
      }

      next();
    });
  };
}
