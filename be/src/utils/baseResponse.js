export class BaseResponse {

  static success(res, message = 'Success', data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      status: true,
      message,
      data,
    });
  }

  static error(res, message = 'Error', errors = [], statusCode = 400) {
    return res.status(statusCode).json({
      status: false,
      message,
      errors,
    });
  }
}
