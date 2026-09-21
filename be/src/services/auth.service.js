import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../repositories/prisma.js';
import {
  findCustomerByEmail,
  findCustomerByPhone,
  findCustomerById,
  findEmployeeByEmail,
  createCustomer,
  saveRefreshToken,
  deleteRefreshTokenByHash,
  findRefreshTokenByHash,
  createEmailVerificationToken,
  findLatestActiveVerificationToken,
  incrementTokenAttempts,
  markTokenVerified,
  markCustomerEmailVerified,
  invalidateCustomerTokens,
  updateCustomerProfile,
  updateCustomerPassword,
} from '../repositories/auth.repository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../helpers/jwt.helper.js';
import { sendVerificationOTP } from './email.service.js';

/**
 * Service layer chứa toàn bộ Business Logic cho tính năng Đăng ký, Đăng nhập, Đăng xuất, Refresh Token, OTP, Profile
 */

/**
 * Xử lý nghiệp vụ Đăng ký tài khoản Khách hàng (Customer) kèm sinh mã OTP xác thực email
 * @param {Object} param0 { email, password, full_name, phone }
 */
export const registerService = async ({ email, password, full_name, phone }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Kiểm tra xem email đã tồn tại chưa
  const existingCustomer = await findCustomerByEmail(normalizedEmail);
  const existingEmployee = await findEmployeeByEmail(normalizedEmail);

  if (existingEmployee) {
    throw { statusCode: 400, message: 'Email này đã được sử dụng trong hệ thống' };
  }

  // 2. Kiểm tra số điện thoại (nếu có)
  let cleanPhone = phone ? phone.toString().replace(/[\s.\-()]/g, '') : null;
  if (cleanPhone) {
    const existingPhone = await findCustomerByPhone(cleanPhone);
    if (existingPhone && (!existingCustomer || existingPhone.customer_id !== existingCustomer.customer_id)) {
      throw { statusCode: 400, message: 'Số điện thoại này đã được sử dụng' };
    }
  }

  // 3. Mã hóa mật khẩu bằng bcrypt (10 rounds)
  const password_hash = await bcrypt.hash(password, 10);

  let customer = null;

  if (existingCustomer) {
    // Nếu tài khoản đã xác thực email -> Báo lỗi trùng email
    if (existingCustomer.email_verified_at) {
      throw { statusCode: 400, message: 'Email này đã được đăng ký và xác thực. Vui lòng đăng nhập.' };
    }

    // Nếu tài khoản chưa xác thực email -> Cập nhật thông tin mới và gửi mã OTP mới
    customer = await prisma.customer.update({
      where: { customer_id: existingCustomer.customer_id },
      data: {
        full_name,
        password_hash,
        phone: cleanPhone,
        status: 'ACTIVE',
      },
    });
  } else {
    // 4. Lưu Khách hàng mới vào CSDL với trạng thái chưa xác thực email (email_verified_at = null)
    customer = await prisma.customer.create({
      data: {
        email: normalizedEmail,
        password_hash,
        full_name,
        phone: cleanPhone,
        status: 'ACTIVE',
        email_verified_at: null,
      },
    });
  }

  // 5. Vô hiệu hóa bất kỳ token OTP cũ nào của khách hàng
  await invalidateCustomerTokens(customer.customer_id);

  // 6. Sinh mã OTP ngẫu nhiên 6 chữ số (100000 - 999999)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 7. Băm OTP bằng SHA-256 an toàn
  const token_hash = crypto.createHash('sha256').update(`${normalizedEmail}:${otp}`).digest('hex');
  const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

  // 8. Lưu OTP băm vào CSDL
  await createEmailVerificationToken({
    customer_id: customer.customer_id,
    token_hash,
    expires_at,
  });

  // 9. Gửi email chứa OTP qua Resend / SMTP
  await sendVerificationOTP(normalizedEmail, otp);

  return {
    customer_id: customer.customer_id.toString(),
    email: customer.email,
    full_name: customer.full_name,
    requires_verification: true,
    message: 'Mã xác thực 6 chữ số đã được gửi đến email của bạn.',
  };
};

/**
 * Xử lý nghiệp vụ Xác thực Email bằng mã OTP
 * @param {Object} param0 { email, otp }
 */
export const verifyEmailService = async ({ email, otp }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Tìm thông tin khách hàng
  const customer = await findCustomerByEmail(normalizedEmail);
  if (!customer) {
    throw { statusCode: 400, message: 'Tài khoản không tồn tại trong hệ thống' };
  }

  // 2. Nếu khách hàng đã được xác thực trước đó
  if (customer.email_verified_at) {
    return {
      alreadyVerified: true,
      message: 'Email này đã được xác thực trước đó. Bạn có thể đăng nhập ngay.',
    };
  }

  // 3. Tìm mã token xác thực còn hiệu lực mới nhất
  const activeToken = await findLatestActiveVerificationToken(customer.customer_id);
  if (!activeToken) {
    throw { statusCode: 400, message: 'Yêu cầu xác thực không tồn tại hoặc đã được sử dụng. Vui lòng bấm gửi lại mã mới.' };
  }

  // 4. Kiểm tra thời hạn hết hạn của OTP (10 phút)
  if (activeToken.expires_at < new Date()) {
    throw { statusCode: 400, message: 'Mã OTP đã hết hạn (quá 10 phút). Vui lòng nhấn gửi lại mã mới.' };
  }

  // 5. Kiểm tra số lần nhập sai (tối đa 5 lần)
  if (activeToken.attempts >= 5) {
    throw { statusCode: 400, message: 'Bạn đã nhập sai mã OTP quá 5 lần. Vì lý do bảo mật, vui lòng yêu cầu mã OTP mới.' };
  }

  // 6. Băm mã OTP nhập vào để so khớp an toàn
  const inputHash = crypto.createHash('sha256').update(`${normalizedEmail}:${otp.trim()}`).digest('hex');

  if (inputHash !== activeToken.token_hash) {
    // Tăng số lần thử sai
    await incrementTokenAttempts(activeToken.email_verification_token_id);
    const attemptsLeft = Math.max(0, 4 - activeToken.attempts);
    throw {
      statusCode: 400,
      message: attemptsLeft > 0 
        ? `Mã OTP không chính xác. Bạn còn ${attemptsLeft} lần thử.` 
        : 'Bạn đã nhập sai mã OTP 5 lần. Vui lòng nhấn gửi lại mã mới.',
    };
  }

  // 7. Khớp mã OTP -> Đánh dấu token hoàn tất và cập nhật email_verified_at cho khách hàng
  await markTokenVerified(activeToken.email_verification_token_id);
  await markCustomerEmailVerified(customer.customer_id);

  return {
    success: true,
    email: customer.email,
    message: 'Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.',
  };
};

/**
 * Xử lý nghiệp vụ Gửi lại mã OTP xác thực (Resend OTP)
 * @param {Object} param0 { email }
 */
export const resendVerificationOtpService = async ({ email }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Kiểm tra tài khoản khách hàng
  const customer = await findCustomerByEmail(normalizedEmail);
  if (!customer) {
    throw { statusCode: 400, message: 'Email này chưa được đăng ký trong hệ thống' };
  }

  if (customer.email_verified_at) {
    throw { statusCode: 400, message: 'Tài khoản này đã được xác thực email. Bạn có thể đăng nhập ngay.' };
  }

  // 2. Kiểm tra Cooldown 60 giây giữa các lần yêu cầu
  const activeToken = await findLatestActiveVerificationToken(customer.customer_id);
  if (activeToken) {
    const elapsedSeconds = (Date.now() - new Date(activeToken.created_at).getTime()) / 1000;
    if (elapsedSeconds < 60) {
      const waitSeconds = Math.ceil(60 - elapsedSeconds);
      throw {
        statusCode: 429,
        message: `Vui lòng đợi ${waitSeconds} giây trước khi yêu cầu gửi lại mã mới.`,
        retryAfter: waitSeconds,
      };
    }
  }

  // 3. Vô hiệu hóa toàn bộ mã OTP cũ
  await invalidateCustomerTokens(customer.customer_id);

  // 4. Sinh mã OTP mới 6 số
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const token_hash = crypto.createHash('sha256').update(`${normalizedEmail}:${otp}`).digest('hex');
  const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

  // 5. Lưu mã mới vào CSDL
  await createEmailVerificationToken({
    customer_id: customer.customer_id,
    token_hash,
    expires_at,
  });

  // 6. Gửi OTP qua Resend
  await sendVerificationOTP(normalizedEmail, otp);

  return {
    success: true,
    email: normalizedEmail,
    message: 'Mã xác thực mới đã được gửi đến email của bạn.',
  };
};

/**
 * Xử lý nghiệp vụ Đăng nhập
 * @param {Object} param0 { email, password, user_type }
 */
export const loginService = async ({ email, password, user_type }) => {
  let user = null;
  let role = 'CUSTOMER';

  // 1. Kiểm tra tài khoản dựa trên loại người dùng (CUSTOMER hoặc EMPLOYEE)
  if (user_type === 'CUSTOMER') {
    user = await findCustomerByEmail(email.trim().toLowerCase());
    if (!user) {
      throw { statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' };
    }
    if (user.status !== 'ACTIVE') {
      throw { statusCode: 403, message: 'Tài khoản khách hàng đang bị khóa hoặc ngưng hoạt động' };
    }
    // KIỂM TRA BẮT BUỘC: Tài khoản khách hàng phải xác thực email mới được phép đăng nhập
    if (!user.email_verified_at) {
      throw {
        statusCode: 403,
        message: 'Vui lòng xác thực email trước khi đăng nhập.',
        unverifiedEmail: user.email,
      };
    }
    role = 'CUSTOMER';
  } else if (user_type === 'EMPLOYEE') {
    user = await findEmployeeByEmail(email.trim().toLowerCase());
    if (!user) {
      throw { statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' };
    }
    if (user.status !== 'ACTIVE') {
      throw { statusCode: 403, message: 'Tài khoản nhân viên đang bị khóa hoặc ngưng hoạt động' };
    }
    role = user.employee_role; // MANAGER hoặc ADMIN
  }

  // 2. Kiểm tra mật khẩu Bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' };
  }

  // 3. Sinh cặp Token (Access Token & Refresh Token)
  const userId = user_type === 'CUSTOMER' ? user.customer_id : user.employee_id;
  const tokenPayload = {
    id: userId.toString(),
    email: user.email,
    role,
    user_type,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ id: userId.toString(), user_type });

  // 4. Băm mã Refresh Token để lưu an toàn vào CSDL
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

  await saveRefreshToken({
    customer_id: user_type === 'CUSTOMER' ? userId : null,
    employee_id: user_type === 'EMPLOYEE' ? userId : null,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      customer_id: user_type === 'CUSTOMER' ? user.customer_id.toString() : undefined,
      id: userId.toString(),
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || null,
      avatar_url: user.avatar_url || null,
      gender: user.gender || null,
      dob: user.dob || null,
      role,
      user_type,
    },
  };
};

/**
 * Xử lý nghiệp vụ Đăng xuất (Thu hồi Refresh Token)
 * @param {String} refreshToken
 */
export const logoutService = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await deleteRefreshTokenByHash(tokenHash);
};

/**
 * Xử lý cấp lại Access Token mới khi hết hạn
 * @param {String} refreshToken
 */
export const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw { statusCode: 401, message: 'Refresh token không được tìm thấy' };
  }

  // 1. Kiểm tra tính hợp lệ JWT của Refresh Token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw { statusCode: 401, message: 'Refresh token không hợp lệ hoặc đã hết hạn' };
  }

  // 2. Kiểm tra token hash trong CSDL
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (!storedToken || storedToken.expires_at < new Date() || storedToken.revoked_at) {
    throw { statusCode: 401, message: 'Refresh token đã bị thu hồi hoặc hết hạn' };
  }

  // 3. Sinh Access Token mới
  const newAccessToken = generateAccessToken({
    id: decoded.id,
    user_type: decoded.user_type,
  });

  return { accessToken: newAccessToken };
};

/**
 * Xử lý cập nhật hồ sơ cá nhân của Khách hàng vào CSDL
 */
export const updateProfileService = async ({ customer_id, full_name, phone, avatar_url, gender, dob }) => {
  let cleanPhone = phone !== undefined ? (phone ? phone.toString().replace(/[\s.\-()]/g, '') : null) : undefined;
  if (cleanPhone) {
    const existingPhone = await findCustomerByPhone(cleanPhone);
    if (existingPhone && existingPhone.customer_id.toString() !== customer_id.toString()) {
      throw { statusCode: 400, message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác' };
    }
  }

  const updateData = { full_name, avatar_url, gender, dob };
  if (cleanPhone !== undefined) {
    updateData.phone = cleanPhone;
  }

  const updatedCustomer = await updateCustomerProfile(customer_id, updateData);

  return {
    customer_id: updatedCustomer.customer_id.toString(),
    email: updatedCustomer.email,
    full_name: updatedCustomer.full_name,
    phone: updatedCustomer.phone,
    avatar_url: updatedCustomer.avatar_url,
    gender: updatedCustomer.gender,
    dob: updatedCustomer.dob,
  };
};

/**
 * Xử lý nghiệp vụ Đổi mật khẩu Khách hàng và mã hóa vào CSDL MySQL
 */
export const changePasswordService = async ({ customer_id, email, current_password, new_password }) => {
  let customer = null;
  if (customer_id) {
    customer = await findCustomerById(customer_id);
  }
  if (!customer && email) {
    customer = await findCustomerByEmail(email);
  }
  if (!customer) {
    throw { statusCode: 404, message: 'Không tìm thấy thông tin tài khoản người dùng' };
  }

  // 1. Kiểm tra mật khẩu hiện tại bằng Bcrypt
  const isCurrentPasswordValid = await bcrypt.compare(current_password, customer.password_hash);
  if (!isCurrentPasswordValid) {
    throw { statusCode: 400, message: 'Mật khẩu hiện tại không chính xác' };
  }

  // 2. Mật khẩu mới không được trùng với mật khẩu hiện tại
  if (current_password === new_password) {
    throw { statusCode: 400, message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' };
  }

  // 3. Mã hóa mật khẩu mới bằng Bcrypt
  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(new_password, salt);

  // 4. Lưu password_hash mới vào CSDL MySQL
  await updateCustomerPassword(customer.customer_id, newPasswordHash);

  return { message: 'Đổi mật khẩu thành công!' };
};

