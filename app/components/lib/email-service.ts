// app/components/lib/email-service.ts

// Email sender configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@yourdomain.com";
const APP_NAME = "MariJasa";

interface SendOTPEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export async function sendOTPEmail(
  email: string,
  otp: string,
  type: "register" | "login" | "reset_password"
): Promise<SendOTPEmailResult> {
  const subject = getEmailSubject(type);
  const html = getEmailTemplate(otp, type);

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    // Fallback: log OTP to console in development
    console.log("========================================");
    console.log(`[EMAIL SERVICE] Resend API not configured`);
    console.log(`[EMAIL SERVICE] OTP for ${email}: ${otp}`);
    console.log(`[EMAIL SERVICE] Type: ${type}`);
    console.log("========================================");
    
    // Return success untuk development
    return { 
      success: true, 
      messageId: `dev-${Date.now()}`,
    };
  }

  try {
    // Dynamic import Resend hanya jika API key tersedia
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] OTP sent to ${email}, messageId: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Email sending error:", error);
    
    // Fallback untuk development jika Resend gagal
    if (process.env.NODE_ENV === "development") {
      console.log("========================================");
      console.log(`[EMAIL SERVICE - FALLBACK] OTP for ${email}: ${otp}`);
      console.log("========================================");
      return { success: true, messageId: `fallback-${Date.now()}` };
    }
    
    return { success: false, error: "Gagal mengirim email" };
  }
}

function getEmailSubject(type: "register" | "login" | "reset_password"): string {
  switch (type) {
    case "register":
      return `Kode Verifikasi Pendaftaran ${APP_NAME}`;
    case "login":
      return `Kode Verifikasi Login ${APP_NAME}`;
    case "reset_password":
      return `Kode Reset Password ${APP_NAME}`;
    default:
      return `Kode Verifikasi ${APP_NAME}`;
  }
}

function getEmailTemplate(
  otp: string,
  type: "register" | "login" | "reset_password"
): string {
  const actionText = getActionText(type);
  const primaryColor = "#7CE0A8";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Verifikasi ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: ${primaryColor};">${APP_NAME}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #333333; text-align: center;">
                ${actionText}
              </h2>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
                Gunakan kode verifikasi di bawah ini untuk melanjutkan proses ${type === "register" ? "pendaftaran" : type === "login" ? "login" : "reset password"} Anda:
              </p>
              
              <!-- OTP Code Box -->
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">
                  Kode Verifikasi
                </p>
                <p style="margin: 0; font-size: 42px; font-weight: 700; color: ${primaryColor}; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </p>
              </div>
              
              <!-- Warning -->
              <div style="background-color: #fff8e6; border-left: 4px solid #ffc107; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>⚠️ Penting:</strong> Kode ini hanya berlaku selama <strong>5 menit</strong>. Jangan bagikan kode ini kepada siapapun.
                </p>
              </div>
              
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #888888; text-align: center;">
                Jika Anda tidak meminta kode ini, abaikan email ini dan akun Anda akan tetap aman.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #888888;">
                Butuh bantuan? Hubungi tim support kami
              </p>
              <p style="margin: 0; font-size: 12px; color: #aaaaaa;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getActionText(type: "register" | "login" | "reset_password"): string {
  switch (type) {
    case "register":
      return "Verifikasi Email Anda";
    case "login":
      return "Verifikasi Login";
    case "reset_password":
      return "Reset Password";
    default:
      return "Verifikasi";
  }
}