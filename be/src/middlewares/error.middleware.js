export function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Chuyển đổi các lỗi hệ thống / Prisma / MySQL thành thông báo thân thiện với người dùng
  if (typeof message === 'string') {
    if (
      message.includes("Out of range value for column 'stock'") ||
      (message.includes('column') && message.includes('stock'))
    ) {
      statusCode = 400;
      message = 'Số lượng tồn kho không được là số âm (tối thiểu là 0)!';
    } else if (
      message.includes('Out of range value for column') ||
      (message.includes('column') && message.includes('price'))
    ) {
      statusCode = 400;
      message = 'Giá sản phẩm không hợp lệ hoặc không được là số âm!';
    } else if (message.includes('Invalid `prisma.') || message.includes('invocation:')) {
      statusCode = 400;
      message = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin sản phẩm và số lượng tồn kho!';
    }
  }

  res.status(statusCode).json({
    status: false,
    message,
    errors: err.errors || []
  });
}
