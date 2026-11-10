import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Service xử lý gửi Email xác thực OTP (Hỗ trợ Gmail SMTP Nodemailer & Resend)
 */
export const sendVerificationOTP = async (email, otp) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // DEV helper: In mã ra terminal để phục vụ việc kiểm thử nhanh khi cần
  if (isDev) {
    console.log(`\n======================================================`);
    console.log(`📩 [EMAIL OTP DEV DEBUG] To: ${email}`);
    console.log(`🔑 Verification OTP Code: ${otp}`);
    console.log(`⏳ Expire In: 10 minutes`);
    console.log(`======================================================\n`);
  }

  const subject = 'YouthFashion - Verify Your Email';
  
  const textContent = `Hello,

Thank you for registering with YouthFashion.

Your verification code is:

${otp}

This code will expire in 10 minutes.

If you did not create this account, please ignore this email.

Regards,
YouthFashion Team`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 40px 10px; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C1917;">
    <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E7E5E4; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: #111111; padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 3px; color: #FFFFFF; text-transform: uppercase;">
          YOUTH FASHION
        </h1>
        <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 1px; color: #A8A29E; text-transform: uppercase;">
          Atelier of Modern Elegance
        </p>
      </div>

      <!-- Main Content -->
      <div style="padding: 36px 32px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #292524;">
          Hello,
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #57534E;">
          Thank you for registering with <strong>YouthFashion</strong>. Please use the verification code below to verify your email address and activate your account.
        </p>

        <!-- OTP Code Box -->
        <div style="background-color: #F9F7F2; border: 1px dashed #D6D3D1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="display: block; font-size: 11px; font-weight: 600; letter-spacing: 2px; color: #78716C; text-transform: uppercase; margin-bottom: 8px;">
            Your Verification Code
          </span>
          <span style="display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111111; font-family: monospace;">
            ${otp}
          </span>
          <span style="display: block; font-size: 12px; color: #991B1B; margin-top: 8px; font-weight: 500;">
            ⏳ This code will expire in 10 minutes
          </span>
        </div>

        <p style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 22px; color: #78716C;">
          If you did not create this account with YouthFashion, please ignore this email. Your account will not be activated without this verification code.
        </p>

        <div style="border-top: 1px solid #F5F5F4; padding-top: 20px; margin-top: 24px;">
          <p style="margin: 0; font-size: 13.5px; color: #44403C; font-weight: 500;">
            Regards,<br/>
            <strong>The YouthFashion Team</strong>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #FAFAF9; border-top: 1px solid #F5F5F4; padding: 18px 32px; text-align: center;">
        <p style="margin: 0; font-size: 11.5px; color: #A8A29E; line-height: 18px;">
          &copy; ${new Date().getFullYear()} YouthFashion System. All rights reserved.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;

  // 1. Ưu tiên Gửi qua Gmail SMTP (Nodemailer) nếu đã cấu hình
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `YouthFashion <${smtpUser}>`,
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`✅ [Gmail SMTP Success] Email sent to ${email} (MessageID: ${info.messageId})`);
      return { success: true, method: 'smtp', messageId: info.messageId };
    } catch (smtpErr) {
      console.error('❌ [Gmail SMTP Error]', smtpErr.message);
      if (!process.env.RESEND_API_KEY && isDev) {
        return { success: true, simulated: true };
      }
    }
  }

  // 2. Gửi qua Resend nếu có cấu hình
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      const fromEmail = process.env.EMAIL_FROM || 'YouthFashion <onboarding@resend.dev>';

      const response = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject,
        text: textContent,
        html: htmlContent,
      });

      if (response.error) {
        console.error('❌ [Resend Error]', response.error);
        if (isDev) {
          return { success: true, simulated: true, error: response.error };
        }
        throw new Error(response.error.message || 'Failed to send verification email');
      }

      console.log(`✅ [Resend Success] Email sent to ${email} (ID: ${response.data?.id})`);
      return { success: true, method: 'resend', data: response.data };
    } catch (err) {
      console.error('❌ [Resend Exception]', err.message);
      if (isDev) {
        return { success: true, simulated: true };
      }
      throw err;
    }
  }

  // 3. Fallback cho môi trường Development
  if (isDev) {
    return { success: true, simulated: true };
  }
  throw new Error('No email transport (SMTP or Resend) is configured on the server');
};

/**
 * Service xử lý gửi Email chứa mã OTP Đặt lại mật khẩu (Reset Password)
 */
export const sendPasswordResetOTP = async (email, otp) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // DEV helper: In mã ra terminal để phục vụ việc kiểm thử nhanh khi cần
  if (isDev) {
    console.log(`\n======================================================`);
    console.log(`📩 [RESET PASSWORD OTP DEV DEBUG] To: ${email}`);
    console.log(`🔑 Password Reset OTP Code: ${otp}`);
    console.log(`⏳ Expire In: 15 minutes`);
    console.log(`======================================================\n`);
  }

  const subject = 'Youth Fashion - Yêu cầu Đặt lại Mật khẩu (Reset Password)';
  
  const textContent = `Xin chào,

Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Youth Fashion của bạn.

Mã xác thực OTP của bạn là:

${otp}

Mã này có hiệu lực trong vòng 15 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, xin vui lòng bỏ qua email này hoặc liên hệ hỗ trợ.

Trân trọng,
Youth Fashion Team`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 40px 10px; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C1917;">
    <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E7E5E4; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: #111111; padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 3px; color: #FFFFFF; text-transform: uppercase;">
          YOUTH FASHION
        </h1>
        <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 1px; color: #A8A29E; text-transform: uppercase;">
          Atelier of Modern Elegance
        </p>
      </div>

      <!-- Main Content -->
      <div style="padding: 36px 32px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #292524;">
          Xin chào quý khách,
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #57534E;">
          Hệ thống nhận được yêu cầu cấp lại mật khẩu cho tài khoản <strong>${email}</strong> tại <strong>Youth Fashion</strong>. Vui lòng sử dụng mã OTP bên dưới để xác nhận và thiết lập mật khẩu mới:
        </p>

        <!-- OTP Code Box -->
        <div style="background-color: #F9F7F2; border: 1px dashed #D6D3D1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="display: block; font-size: 11px; font-weight: 600; letter-spacing: 2px; color: #78716C; text-transform: uppercase; margin-bottom: 8px;">
            MÃ XÁC THỰC ĐẶT LẠI MẬT KHẨU
          </span>
          <span style="display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111111; font-family: monospace;">
            ${otp}
          </span>
          <span style="display: block; font-size: 12px; color: #991B1B; margin-top: 8px; font-weight: 500;">
            ⏳ Mã có hiệu lực trong 15 phút
          </span>
        </div>

        <p style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 22px; color: #78716C;">
          Nếu quý khách không thực hiện yêu cầu này, vui lòng bỏ qua email. Mật khẩu hiện tại của quý khách vẫn được bảo vệ an toàn.
        </p>

        <div style="border-top: 1px solid #F5F5F4; padding-top: 20px; margin-top: 24px;">
          <p style="margin: 0; font-size: 13.5px; color: #44403C; font-weight: 500;">
            Trân trọng,<br/>
            <strong>Đội ngũ Chăm sóc Khách hàng Youth Fashion</strong>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #FAFAF9; border-top: 1px solid #F5F5F4; padding: 18px 32px; text-align: center;">
        <p style="margin: 0; font-size: 11.5px; color: #A8A29E; line-height: 18px;">
          &copy; ${new Date().getFullYear()} Youth Fashion System. All rights reserved.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;

  // 1. Ưu tiên Gửi qua Gmail SMTP (Nodemailer) nếu đã cấu hình
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `YouthFashion <${smtpUser}>`,
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`✅ [Gmail SMTP Success] Reset OTP sent to ${email} (MessageID: ${info.messageId})`);
      return { success: true, method: 'smtp', messageId: info.messageId };
    } catch (smtpErr) {
      console.error('❌ [Gmail SMTP Error]', smtpErr.message);
      if (!process.env.RESEND_API_KEY && isDev) {
        return { success: true, simulated: true };
      }
    }
  }

  // 2. Gửi qua Resend nếu có cấu hình
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      const fromEmail = process.env.EMAIL_FROM || 'YouthFashion <onboarding@resend.dev>';

      const response = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject,
        text: textContent,
        html: htmlContent,
      });

      if (response.error) {
        console.error('❌ [Resend Error]', response.error);
        if (isDev) {
          return { success: true, simulated: true, error: response.error };
        }
        throw new Error(response.error.message || 'Failed to send reset password email');
      }

      console.log(`✅ [Resend Success] Reset OTP sent to ${email} (ID: ${response.data?.id})`);
      return { success: true, method: 'resend', data: response.data };
    } catch (err) {
      console.error('❌ [Resend Exception]', err.message);
      if (isDev) {
        return { success: true, simulated: true };
      }
      throw err;
    }
  }

  // 3. Fallback cho môi trường Development
  if (isDev) {
    return { success: true, simulated: true };
  }
  throw new Error('No email transport (SMTP or Resend) is configured on the server');
};

// Bộ nhớ đệm chống gửi trùng lặp email thông báo đơn hàng trong thời gian ngắn (10 giây)
const recentOrderEmails = new Map();

/**
 * Service gửi Email thông báo trạng thái đơn hàng đến Gmail của khách hàng
 * Hỗ trợ các trạng thái: PENDING/ORDER_CREATED, CONFIRMED/PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUND (APPROVED/REJECTED)
 */
export const sendOrderNotificationEmail = async ({
  toEmail,
  order,
  status,
  extraData = {},
}) => {
  const isDev = process.env.NODE_ENV !== 'production';

  const recipient = (
    toEmail ||
    order?.recipient_email ||
    order?.customer?.email ||
    extraData?.recipientEmail ||
    ''
  ).trim();

  if (!recipient || !recipient.includes('@')) {
    console.warn('⚠️ [Email Service] Không tìm thấy địa chỉ Gmail hợp lệ để gửi thông báo đơn hàng');
    return { success: false, reason: 'Invalid or missing recipient email' };
  }

  const orderNumber = order?.order_number || order?.order_code || (order?.order_id ? `YF-${order.order_id}` : 'YF-ORDER');
  const orderDigits = String(orderNumber).replace(/\D/g, '') || String(order?.order_id || '');
  const s = String(status || order?.order_status || '').toUpperCase();
  const reason = extraData?.reason || order?.cancel_reason || order?.note || '';
  const rejectReason = extraData?.rejectReason || order?.reject_reason || '';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const orderLink = `${clientUrl}/profile?tab=orders&order=${orderDigits}`;

  // Kiểm tra chống spam / trùng lặp (nếu cùng người nhận, cùng đơn hàng và cùng trạng thái trong 10s)
  const dedupeKey = `${recipient.toLowerCase()}_${orderNumber}_${s}_${reason}_${rejectReason}`;
  const lastSent = recentOrderEmails.get(dedupeKey);
  if (lastSent && Date.now() - lastSent < 10000) {
    console.log(`ℹ️ [Email Dedupe] Bỏ qua gửi email trùng lặp cho: ${dedupeKey}`);
    return { success: true, deduplicated: true };
  }
  recentOrderEmails.set(dedupeKey, Date.now());

  // Xác định tiêu đề, thông điệp và màu sắc badge theo trạng thái
  let subject = `Youth Fashion - Cập nhật đơn hàng #${orderNumber}`;
  let badgeText = 'CẬP NHẬT ĐƠN HÀNG';
  let badgeBg = '#F3F4F6';
  let badgeColor = '#374151';
  let headline = `Thông báo về đơn hàng #${orderNumber}`;
  let messageBody = `Đơn hàng #${orderNumber} của Quý khách vừa được cập nhật trạng thái mới.`;
  let alertBox = null;

  if (s === 'PENDING' || s === 'ORDER_CREATED') {
    subject = `Youth Fashion - Tiếp nhận đơn hàng #${orderNumber} thành công`;
    badgeText = 'ĐÃ TIẾP NHẬN';
    badgeBg = '#E0F2FE';
    badgeColor = '#0369A1';
    headline = 'Đơn hàng của Quý khách đã được tiếp nhận';
    messageBody = `Cảm ơn Quý khách đã mua sắm tại <strong>Youth Fashion</strong>. Đơn hàng <strong>#${orderNumber}</strong> của Quý khách đã được hệ thống ghi nhận thành công và đang được chuẩn bị để xác nhận.`;
  } else if (s === 'CONFIRMED' || s === 'PAID') {
    subject = `Youth Fashion - Xác nhận đơn hàng #${orderNumber}`;
    badgeText = 'ĐÃ XÁC NHẬN';
    badgeBg = '#E0F2FE';
    badgeColor = '#0369A1';
    headline = 'Đơn hàng đã được xác nhận thành công';
    messageBody = `Đơn hàng <strong>#${orderNumber}</strong> của Quý khách đã được thanh toán/xác nhận thành công và đang được chuyển sang khâu đóng gói tiêu chuẩn Haute Couture.`;
  } else if (s === 'PROCESSING' || s === 'PREPARING') {
    subject = `Youth Fashion - Đang chuẩn bị đơn hàng #${orderNumber}`;
    badgeText = 'ĐANG ĐÓNG GÓI';
    badgeBg = '#FEF3C7';
    badgeColor = '#D97706';
    headline = 'Đơn hàng đang được chuẩn bị tại kho';
    messageBody = `Đội ngũ nhân viên kho của Youth Fashion đang kiểm tra chất lượng và đóng gói cẩn thận các sản phẩm trong đơn hàng <strong>#${orderNumber}</strong>.`;
  } else if (s === 'SHIPPED' || s === 'SHIPPING' || s === 'DELIVERING' || s === 'IN_TRANSIT') {
    subject = `Youth Fashion - Đơn hàng #${orderNumber} đang được vận chuyển`;
    badgeText = 'ĐANG VẬN CHUYỂN';
    badgeBg = '#DBEAFE';
    badgeColor = '#1D4ED8';
    headline = 'Đơn hàng đang trên đường giao tới bạn';
    messageBody = `Đơn hàng <strong>#${orderNumber}</strong> đã được bàn giao cho đối tác vận chuyển hỏa tốc Express. Shipper sẽ liên hệ với Quý khách trước khi giao hàng.`;
  } else if (s === 'DELIVERED' || s === 'COMPLETED' || s === 'SUCCESS') {
    subject = `Youth Fashion - Đơn hàng #${orderNumber} đã giao thành công`;
    badgeText = 'GIAO HÀNG THÀNH CÔNG';
    badgeBg = '#DCFCE7';
    badgeColor = '#15803D';
    headline = 'Đơn hàng đã được giao tận tay Quý khách';
    messageBody = `Đơn hàng <strong>#${orderNumber}</strong> đã được phát thành công. Youth Fashion xin chân thành cảm ơn sự tin tưởng và đồng hành của Quý khách!`;
  } else if (s === 'CANCELLED') {
    const isShop = extraData?.cancelledBy === 'SHOP' || extraData?.isShopCancelled;
    subject = `Youth Fashion - Đơn hàng #${orderNumber} đã bị hủy`;
    badgeText = isShop ? 'SHOP HỦY ĐƠN' : 'ĐÃ HỦY ĐƠN';
    badgeBg = '#FEE2E2';
    badgeColor = '#B91C1C';
    headline = 'Thông báo hủy đơn hàng';
    messageBody = isShop
      ? `Đơn hàng <strong>#${orderNumber}</strong> đã bị hủy từ phía Shop.`
      : `Đơn hàng <strong>#${orderNumber}</strong> đã được hủy theo yêu cầu của Quý khách.`;
    alertBox = {
      title: 'Lý do hủy đơn hàng',
      content: reason || 'Sản phẩm tạm thời hết hàng trong kho hoặc có thay đổi nhu cầu.',
      color: '#991B1B',
      bg: '#FEF2F2',
      border: '#FCA5A5',
    };
  } else if (s === 'APPROVED' || s === 'REFUND_APPROVED' || s === 'RETURNED') {
    subject = `Youth Fashion - Xác nhận hoàn tiền cho đơn hàng #${orderNumber}`;
    badgeText = 'ĐÃ HOÀN TIỀN';
    badgeBg = '#DCFCE7';
    badgeColor = '#15803D';
    headline = 'Yêu cầu đổi trả & hoàn tiền đã được xử lý';
    messageBody = `Shop đã phê duyệt yêu cầu đổi trả và hoàn tất thủ tục hoàn tiền cho đơn hàng <strong>#${orderNumber}</strong>. Quý khách vui lòng kiểm tra biến động tài khoản ngân hàng.`;
  } else if (s === 'REJECTED' || s === 'REFUND_REJECTED') {
    subject = `Youth Fashion - Phản hồi yêu cầu hoàn tiền đơn hàng #${orderNumber}`;
    badgeText = 'TỪ CHỐI HOÀN TIỀN';
    badgeBg = '#FEE2E2';
    badgeColor = '#B91C1C';
    headline = 'Từ chối yêu cầu đổi trả / hoàn tiền';
    messageBody = `Shop rất tiếc phải thông báo yêu cầu đổi trả & hoàn tiền cho đơn hàng <strong>#${orderNumber}</strong> chưa thể phê duyệt do chưa thỏa mãn chính sách đổi trả.`;
    alertBox = {
      title: 'Lý do từ chối từ Shop',
      content: rejectReason || reason || 'Sản phẩm không đáp ứng điều kiện đổi trả theo quy định của Youth Fashion.',
      color: '#991B1B',
      bg: '#FEF2F2',
      border: '#FCA5A5',
    };
  } else if (s === 'DELIVERY_FAILED' || s === 'FAILED_DELIVERY') {
    const willRetry = extraData?.willRetry || extraData?.retryDate;
    subject = willRetry
      ? `Youth Fashion - Thông báo hẹn giao lại đơn hàng #${orderNumber}`
      : `Youth Fashion - Thông báo giao hàng không thành công đơn hàng #${orderNumber}`;
    badgeText = willRetry ? 'HẸN GIAO LẠI' : 'GIAO THẤT BẠI';
    badgeBg = willRetry ? '#FEF3C7' : '#FEE2E2';
    badgeColor = willRetry ? '#D97706' : '#B91C1C';
    headline = willRetry
      ? 'Đơn hàng giao chưa thành công - Sẽ tiến hành giao lại'
      : 'Đơn hàng giao không thành công';
    messageBody = willRetry
      ? `Đối tác vận chuyển của Youth Fashion đã cố gắng phát đơn hàng <strong>#${orderNumber}</strong> nhưng chưa thể liên hệ hoặc giao tận tay Quý khách. Đơn vị sẽ <strong>tiến hành giao lại vào ngày ${extraData?.retryDate ? new Date(extraData.retryDate).toLocaleDateString('vi-VN') : 'làm việc tiếp theo'}</strong>. Quý khách vui lòng lưu ý điện thoại.`
      : `Đối tác vận chuyển thông báo không thể giao đơn hàng <strong>#${orderNumber}</strong> đến Quý khách. Đơn hàng sẽ được chuyển hoàn về kho của Youth Fashion.`;
    alertBox = {
      title: 'Lý do giao hàng chưa thành công',
      content: reason || extraData?.reason || 'Không thể liên lạc được với người nhận hoặc khách hẹn ngày khác.',
      color: willRetry ? '#B45309' : '#991B1B',
      bg: willRetry ? '#FFFBEB' : '#FEF2F2',
      border: willRetry ? '#FCD34D' : '#FCA5A5',
    };
  }

  // Danh sách sản phẩm (OrderItem)
  const items = order?.order_items || [];
  const recipientName = order?.recipient_name || order?.customer?.full_name || 'Quý khách';
  const recipientPhone = order?.recipient_phone || order?.customer?.phone || '';
  const shippingAddress = [
    order?.shipping_address_line,
    order?.shipping_ward,
    order?.shipping_district,
    order?.shipping_city,
  ].filter(Boolean).join(', ') || 'Địa chỉ đăng ký';

  const totalAmount = Number(order?.total_amount || 0);
  const paymentMethod = order?.payments?.[0]?.payment_method || order?.payment_method || 'Thanh toán trực tuyến';

  // Tạo HTML danh sách sản phẩm
  let itemsHtml = '';
  if (items.length > 0) {
    itemsHtml = items
      .map((item) => {
        const name = item.product_name || item.title || item.variant?.product?.product_name || 'Sản phẩm thời trang';
        const size = item.size || item.variant?.size || 'M';
        const color = item.color || item.variant?.color || '';
        const qty = item.quantity || 1;
        const price = Number(item.unit_price || item.price || 0);
        const subtotal = Number(item.subtotal || price * qty);

        return `
          <tr style="border-bottom: 1px solid #F3F4F6;">
            <td style="padding: 12px 8px; vertical-align: top;">
              <div style="font-weight: 600; font-size: 14px; color: #111827;">${name}</div>
              <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">
                Phân loại: <strong>${size}</strong> ${color ? `| Màu: <strong>${color}</strong>` : ''} &bull; SL: <strong>${qty}</strong>
              </div>
            </td>
            <td style="padding: 12px 8px; text-align: right; vertical-align: top; font-size: 14px; font-weight: 600; color: #111827; white-space: nowrap;">
              ${subtotal.toLocaleString('vi-VN')} ₫
            </td>
          </tr>
        `;
      })
      .join('');
  }

  const textContent = `Xin chào ${recipientName},

${headline}
Mã đơn hàng: #${orderNumber}
Trạng thái: ${badgeText}

${messageBody.replace(/<[^>]*>?/gm, '')}

Tổng thanh toán: ${totalAmount.toLocaleString('vi-VN')} ₫
Địa chỉ nhận hàng: ${shippingAddress}
Xem chi tiết tại: ${orderLink}

Trân trọng,
Đội ngũ Chăm sóc Khách hàng Youth Fashion`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 30px 10px; background-color: #F8F7F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C1917; line-height: 1.5;">
    <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E7E5E4; box-shadow: 0 10px 30px rgba(0,0,0,0.06); overflow: hidden;">
      
      <!-- Brand Header -->
      <div style="background-color: #0F172A; padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 4px; color: #FFFFFF; text-transform: uppercase;">
          YOUTH FASHION
        </h1>
        <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 1.5px; color: #94A3B8; text-transform: uppercase;">
          Atelier of Modern Elegance &bull; Premium Experience
        </p>
      </div>

      <!-- Status Banner -->
      <div style="padding: 24px 32px 0 32px; text-align: center;">
        <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; background-color: ${badgeBg}; color: ${badgeColor}; text-transform: uppercase;">
          ● ${badgeText}
        </span>
        <h2 style="margin: 16px 0 8px 0; font-size: 22px; font-weight: 700; color: #0F172A;">
          ${headline}
        </h2>
        <p style="margin: 0; font-size: 13.5px; color: #64748B;">
          Mã đơn hàng: <strong style="color: #0F172A; font-family: monospace; font-size: 15px;">#${orderNumber}</strong>
        </p>
      </div>

      <!-- Main Body -->
      <div style="padding: 24px 32px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">
          Kính chào <strong>${recipientName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14.5px; color: #475569; line-height: 24px;">
          ${messageBody}
        </p>

        <!-- Alert Box nếu có lý do hủy hoặc từ chối -->
        ${
          alertBox
            ? `
          <div style="background-color: ${alertBox.bg}; border-left: 4px solid ${alertBox.border}; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
            <div style="font-size: 12.5px; font-weight: 700; color: ${alertBox.color}; text-transform: uppercase; margin-bottom: 4px;">
              ${alertBox.title}
            </div>
            <div style="font-size: 14px; color: #1E293B; line-height: 20px;">
              "${alertBox.content}"
            </div>
          </div>
        `
            : ''
        }

        <!-- Bảng Sản phẩm (nếu có chi tiết sản phẩm) -->
        ${
          items.length > 0
            ? `
          <div style="margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #F8FAFC; padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 12.5px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
              Chi tiết sản phẩm đặt mua
            </div>
            <table style="width: 100%; border-collapse: collapse; padding: 8px;">
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
        `
            : ''
        }

        <!-- Thông tin giao nhận & Tổng tiền -->
        <div style="background-color: #F8FAFC; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #E2E8F0;">
          <table style="width: 100%; font-size: 13.5px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748B;">Người nhận:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0F172A;">${recipientName} ${recipientPhone ? `(${recipientPhone})` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748B; vertical-align: top;">Địa chỉ:</td>
              <td style="padding: 4px 0; text-align: right; color: #334155;">${shippingAddress}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748B;">Phương thức:</td>
              <td style="padding: 4px 0; text-align: right; color: #334155;">${paymentMethod}</td>
            </tr>
            <tr style="border-top: 1px dashed #CBD5E1;">
              <td style="padding: 10px 0 0 0; font-size: 15px; font-weight: 700; color: #0F172A;">Tổng thanh toán:</td>
              <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: 800; color: #B91C1C;">
                ${totalAmount.toLocaleString('vi-VN')} ₫
              </td>
            </tr>
          </table>
        </div>

        <!-- Nút Tra Cứu Trực Tuyến -->
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${orderLink}" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-size: 13.5px; font-weight: 700; letter-spacing: 1px; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);">
            XEM CHI TIẾT ĐƠN HÀNG TRÊN HỆ THỐNG
          </a>
        </div>

        <div style="border-top: 1px solid #F1F5F9; padding-top: 20px; margin-top: 30px;">
          <p style="margin: 0; font-size: 12.5px; color: #64748B; line-height: 20px;">
            Nếu Quý khách có bất kỳ thắc mắc hoặc cần hỗ trợ về đơn hàng, vui lòng phản hồi trực tiếp email này hoặc truy cập trang hỗ trợ trực tuyến của chúng tôi.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center;">
        <p style="margin: 0; font-size: 11.5px; color: #94A3B8; line-height: 18px;">
          &copy; ${new Date().getFullYear()} Youth Fashion System. Tất cả các quyền được bảo lưu.<br/>
          Thương hiệu thời trang giới trẻ thanh lịch & sang trọng.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;

  // 1. Ưu tiên gửi qua Gmail SMTP (Nodemailer)
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `Youth Fashion <${smtpUser}>`,
        to: recipient,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`✅ [Gmail SMTP Success] Thông báo đơn hàng #${orderNumber} (${s}) đã gửi tới: ${recipient} (MessageID: ${info.messageId})`);
      return { success: true, method: 'smtp', messageId: info.messageId };
    } catch (smtpErr) {
      console.error(`❌ [Gmail SMTP Error] Gửi thông báo đơn #${orderNumber} thất bại:`, smtpErr.message);
      if (!process.env.RESEND_API_KEY && isDev) {
        return { success: true, simulated: true };
      }
    }
  }

  // 2. Fallback gửi qua Resend
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      const fromEmail = process.env.EMAIL_FROM || 'YouthFashion <onboarding@resend.dev>';

      const response = await resend.emails.send({
        from: fromEmail,
        to: [recipient],
        subject,
        text: textContent,
        html: htmlContent,
      });

      if (response.error) {
        console.error('❌ [Resend Error]', response.error);
        if (isDev) {
          return { success: true, simulated: true, error: response.error };
        }
        throw new Error(response.error.message || 'Failed to send order email');
      }

      console.log(`✅ [Resend Success] Thông báo đơn hàng #${orderNumber} gửi tới: ${recipient} (ID: ${response.data?.id})`);
      return { success: true, method: 'resend', data: response.data };
    } catch (err) {
      console.error('❌ [Resend Exception]', err.message);
      if (isDev) {
        return { success: true, simulated: true };
      }
      throw err;
    }
  }

  if (isDev) {
    return { success: true, simulated: true };
  }
  return { success: false, reason: 'No email transport configured' };
};


