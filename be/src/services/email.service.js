import { Resend } from 'resend';
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
  const resend = apiKey ? new Resend(apiKey) : null;
  const fromEmail = process.env.EMAIL_FROM || 'YouthFashion <onboarding@resend.dev>';

  if (resend) {
    try {
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
