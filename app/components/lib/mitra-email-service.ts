// app/components/lib/mitra-email-service.ts

const APP_NAME = "MariJasa";
const DEFAULT_FROM_EMAIL = "noreply@marijasa.my.id";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;

interface SendMitraEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export async function sendMitraApprovalEmail(
  email: string,
  name: string,
  status: "approved" | "rejected",
  notes?: string
): Promise<SendMitraEmailResult> {
  const subject = status === "approved" 
    ? `🎉 Selamat! Pendaftaran Mitra ${APP_NAME} Anda telah Disetujui`
    : `Pemberitahuan Pendaftaran Mitra ${APP_NAME}`;
  
  const html = status === "approved"
    ? getApprovalEmailTemplate(name, notes)
    : getRejectionEmailTemplate(name, notes);

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.log("\n========================================");
    console.log(`📧 [MITRA EMAIL - NO API KEY]`);
    console.log(`   To: ${email}`);
    console.log(`   Status: ${status}`);
    console.log(`   Name: ${name}`);
    console.log(`   Notes: ${notes || 'N/A'}`);
    console.log("   ⚠️  Set RESEND_API_KEY di .env untuk kirim email sungguhan");
    console.log("========================================\n");
    
    return { 
      success: true, 
      messageId: `dev-no-key-${Date.now()}`,
    };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log(`\n📧 [MITRA EMAIL] Sending ${status} notification to: ${email}`);
    console.log(`   From: ${FROM_EMAIL}`);
    console.log(`   Subject: ${subject}`);

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      
      // Fallback for development
      if (process.env.NODE_ENV === "development") {
        console.log(`\n📧 [FALLBACK] Email would be sent to ${email}\n`);
        return { 
          success: true, 
          messageId: `fallback-${Date.now()}`,
        };
      }
      
      return { success: false, error: error.message };
    }

    console.log(`✅ [MITRA EMAIL] Sent successfully! Message ID: ${data?.id}\n`);
    return { success: true, messageId: data?.id };
    
  } catch (error: any) {
    console.error("❌ Email sending error:", error);
    
    // Fallback for development
    if (process.env.NODE_ENV === "development") {
      console.log("\n========================================");
      console.log(`📧 [FALLBACK] Email would be sent to ${email}`);
      console.log("========================================\n");
      return { 
        success: true, 
        messageId: `fallback-${Date.now()}`,
      };
    }
    
    return { success: false, error: error.message || "Gagal mengirim email" };
  }
}

function getApprovalEmailTemplate(name: string, notes?: string): string {
  const primaryColor = "#7CE0A8";
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/mitra/login`
    : "https://www.marijasa.my.id/mitra/login";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pendaftaran Disetujui - ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%); border-radius: 16px 16px 0 0;">
              <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: ${primaryColor};">${APP_NAME}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #333333; text-align: center;">
                Selamat, ${name}!
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
                Pendaftaran Anda sebagai Mitra ${APP_NAME} telah <strong style="color: ${primaryColor};">DISETUJUI</strong>!
              </p>
              
              <!-- Success Box -->
              <div style="background-color: ${primaryColor}10; border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 30px 0; border: 1px solid ${primaryColor}30;">
                <p style="margin: 0 0 15px 0; font-size: 16px; color: #333333;">
                  Akun mitra Anda sudah aktif dan siap digunakan!
                </p>
                <p style="margin: 0; font-size: 14px; color: #666666;">
                  Anda sekarang dapat login ke dashboard mitra dan mulai menerima pesanan dari pelanggan.
                </p>
              </div>
              
              ${notes ? `
              <div style="background-color: #f8f9fa; border-left: 4px solid ${primaryColor}; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #888888; font-weight: 600;">
                  Catatan dari Admin:
                </p>
                <p style="margin: 0; font-size: 14px; color: #666666;">
                  ${notes}
                </p>
              </div>
              ` : ''}
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="display: inline-block; padding: 15px 40px; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Login ke Dashboard Mitra
                </a>
              </div>
              
              <!-- Next Steps -->
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 0 0 20px 0;">
                <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #333333;">
                  📋 Langkah Selanjutnya:
                </p>
                <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #666666;">
                  <li>Login ke akun mitra Anda</li>
                  <li>Lengkapi profil dan informasi layanan</li>
                  <li>Atur harga untuk setiap layanan</li>
                  <li>Mulai terima pesanan dari pelanggan!</li>
                </ol>
              </div>
              
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #888888; text-align: center;">
                Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi tim support kami.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #888888;">
                Terima kasih telah bergabung bersama kami!
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

function getRejectionEmailTemplate(name: string, reason?: string): string {
  const primaryColor = "#7CE0A8";
  const registerUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/mitra/daftar`
    : "https://www.marijasa.my.id/mitra/daftar";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pemberitahuan Pendaftaran - ${APP_NAME}</title>
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
                Halo, ${name}
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #666666; text-align: center;">
                Terima kasih atas minat Anda untuk menjadi Mitra ${APP_NAME}.
              </p>
              
              <!-- Info Box -->
              <div style="background-color: #fff8e6; border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 30px 0; border: 1px solid #ffc107;">
                <p style="margin: 0 0 10px 0; font-size: 16px; color: #856404;">
                  Maaf, pendaftaran Anda belum dapat kami setujui saat ini.
                </p>
              </div>
              
              ${reason ? `
              <div style="background-color: #f8f9fa; border-left: 4px solid #ffc107; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #888888; font-weight: 600;">
                  Alasan:
                </p>
                <p style="margin: 0; font-size: 14px; color: #666666;">
                  ${reason}
                </p>
              </div>
              ` : ''}
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                Jangan berkecil hati! Anda dapat mendaftar kembali setelah memperbaiki persyaratan yang diperlukan.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${registerUrl}" style="display: inline-block; padding: 15px 40px; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Daftar Ulang
                </a>
              </div>
              
              <!-- Tips Box -->
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 0 0 20px 0;">
                <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #333333;">
                  💡 Tips untuk Pendaftaran Berikutnya:
                </p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #666666;">
                  <li>Pastikan semua dokumen yang diunggah jelas dan terbaca</li>
                  <li>Foto KTP harus sesuai dengan data yang diisi</li>
                  <li>Foto selfie dengan KTP harus menunjukkan wajah dengan jelas</li>
                  <li>SKCK masih berlaku (tidak expired)</li>
                  <li>Informasi layanan dan deskripsi lengkap</li>
                </ul>
              </div>
              
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #888888; text-align: center;">
                Jika Anda memiliki pertanyaan, silakan hubungi tim support kami.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #888888;">
                Kami berharap dapat bekerja sama dengan Anda di masa depan!
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