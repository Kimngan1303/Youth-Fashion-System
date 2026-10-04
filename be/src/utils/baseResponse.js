/**
 * Helper chuẩn hóa phản hồi HTTP Response cho toàn bộ dự án YouthFashion
 */
export class BaseResponse {
  /**
   * Phản hồi thành công (Standard Success Response)
   * @param {Object} res - Express Response Object
   * @param {String} message - Thông điệp phản hồi
   * @param {Object|Array} data - Dữ liệu trả về cho client
   * @param {Number} statusCode - Mã trạng thái HTTP (mặc định 200)
   */
  static success(res, message = 'Success', data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      status: true,
      message,
      data,
    });
  }

  /**
   * Phản hồi thất bại (Standard Error Response)
   * @param {Object} res - Express Response Object
   * @param {String} message - Thông điệp báo lỗi
   * @param {Array} errors - Danh sách chi tiết các lỗi (nếu có)
   * @param {Number} statusCode - Mã trạng thái HTTP (mặc định 400)
   */
  static error(res, message = 'Error', errors = [], statusCode = 400) {
    return res.status(statusCode).json({
      status: false,
      message,
      errors,
    });
  }
}
