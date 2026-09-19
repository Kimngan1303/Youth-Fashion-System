import { prisma } from './prisma.js';

/**
 * Repository layer xử lý trực tiếp các câu lệnh Prisma CSDL liên quan đến Auth
 */

/**
 * Tìm Khách hàng (Customer) theo email
 * @param {String} email
 */
export const findCustomerByEmail = async (email) => {
  return await prisma.customer.findUnique({
    where: { email },
  });
};

/**
 * Tìm Khách hàng (Customer) theo số điện thoại
 * @param {String} phone
 */
export const findCustomerByPhone = async (phone) => {
  if (!phone) return null;
  return await prisma.customer.findUnique({
    where: { phone },
  });
};

/**
 * Tìm Nhân viên (Employee - Manager / Admin) theo email
 * @param {String} email
 */
export const findEmployeeByEmail = async (email) => {
  return await prisma.employee.findUnique({
    where: { email },
  });
};

/**
 * Tạo mới tài khoản Khách hàng (Customer)
 */
export const createCustomer = async ({ email, password_hash, full_name, phone }) => {
  return await prisma.customer.create({
    data: {
      email,
      password_hash,
      full_name,
      phone: phone || null,
      status: 'ACTIVE',
    },
    select: {
      customer_id: true,
      email: true,
      full_name: true,
      phone: true,
      status: true,
      created_at: true,
    },
  });
};

/**
 * Lưu Refresh Token băm vào CSDL
 */
export const saveRefreshToken = async ({ customer_id, employee_id, token_hash, expires_at }) => {
  return await prisma.refreshToken.create({
    data: {
      customer_id: customer_id ? BigInt(customer_id) : null,
      employee_id: employee_id ? BigInt(employee_id) : null,
      token_hash,
      expires_at,
    },
  });
};

/**
 * Tìm Refresh Token theo token_hash trong CSDL
 */
export const findRefreshTokenByHash = async (token_hash) => {
  return await prisma.refreshToken.findUnique({
    where: { token_hash },
  });
};

/**
 * Xóa / Thu hồi Refresh Token khi đăng xuất
 */
export const deleteRefreshTokenByHash = async (token_hash) => {
  return await prisma.refreshToken.deleteMany({
    where: { token_hash },
  });
};

/**
 * ==============================================================================
 * REPOSITORY DÀNH RIÊNG CHO XÁC THỰC EMAIL BẰNG OTP (EMAIL VERIFICATION TOKENS)
 * ==============================================================================
 */

/**
 * Lưu mã OTP băm (token_hash) vào CSDL
 */
export const createEmailVerificationToken = async ({ customer_id, token_hash, expires_at }) => {
  return await prisma.emailVerificationToken.create({
    data: {
      customer_id: BigInt(customer_id),
      token_hash,
      expires_at,
      attempts: 0,
    },
  });
};

/**
 * Lấy token xác thực mới nhất chưa hoàn tất của khách hàng
 */
export const findLatestActiveVerificationToken = async (customer_id) => {
  return await prisma.emailVerificationToken.findFirst({
    where: {
      customer_id: BigInt(customer_id),
      verified_at: null,
    },
    orderBy: {
      created_at: 'desc',
    },
  });
};

/**
 * Tăng số lần nhập sai OTP (attempts)
 */
export const incrementTokenAttempts = async (email_verification_token_id) => {
  return await prisma.emailVerificationToken.update({
    where: {
      email_verification_token_id: BigInt(email_verification_token_id),
    },
    data: {
      attempts: { increment: 1 },
    },
  });
};

/**
 * Đánh dấu token đã xác thực thành công
 */
export const markTokenVerified = async (email_verification_token_id) => {
  return await prisma.emailVerificationToken.update({
    where: {
      email_verification_token_id: BigInt(email_verification_token_id),
    },
    data: {
      verified_at: new Date(),
    },
  });
};

/**
 * Cập nhật email_verified_at cho khách hàng
 */
export const markCustomerEmailVerified = async (customer_id) => {
  return await prisma.customer.update({
    where: {
      customer_id: BigInt(customer_id),
    },
    data: {
      email_verified_at: new Date(),
    },
  });
};

/**
 * Vô hiệu hóa (hết hạn) toàn bộ mã OTP chưa xác thực của khách hàng (khi gửi lại mã mới)
 */
export const invalidateCustomerTokens = async (customer_id) => {
  return await prisma.emailVerificationToken.updateMany({
    where: {
      customer_id: BigInt(customer_id),
      verified_at: null,
    },
    data: {
      expires_at: new Date(Date.now() - 1000), // Cho hết hạn ngay lập tức
    },
  });
};

