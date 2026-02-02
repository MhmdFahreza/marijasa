import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import prisma from "@/app/components/lib/prisma";  // Gunakan prisma instance yang sudah ada

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model untuk text-only
const TEXT_MODELS = [
  "meta-llama/llama-guard-4-12b",
  "moonshotai/kimi-k2-instruct",
  "llama-3.1-70b-versatile",
  "mixtral-8x7b-32768",
];

// Model untuk vision (image + text)
const VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
];

async function getTopVendors() {
  try {
    const vendors = await prisma.vendor.findMany({
      where: {
        status: "ACTIVE",
        verified: true,
      },
      orderBy: [
        { rating: "desc" },
        { review_count: "desc" },
      ],
      take: 10,
      select: {
        vendor_id: true,
        name: true,
        category: true,
        rating: true,
        review_count: true,
        description: true,
        service_areas: true,
        specialties: true,
        phone: true,
        avatar: true,
      },
    });

    return vendors;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

async function getAvailableCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      orderBy: { sort_order: "asc" },
      select: {
        category_id: true,
        name: true,
        description: true,
        slug: true,
      },
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

async function searchVendors(query: string) {
  try {
    const vendors = await prisma.vendor.findMany({
      where: {
        status: "ACTIVE",
        verified: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { specialties: { has: query } },
        ],
      },
      orderBy: [
        { rating: "desc" },
        { review_count: "desc" },
      ],
      take: 10,
      select: {
        vendor_id: true,
        name: true,
        category: true,
        rating: true,
        review_count: true,
        description: true,
        phone: true,
        service_areas: true,
        avatar: true,
        specialties: true,
      },
    });

    return vendors;
  } catch (error) {
    console.error("Error searching vendors:", error);
    return [];
  }
}

async function generateSystemPrompt() {
  const topVendors = await getTopVendors();
  const categories = await getAvailableCategories();

  const vendorList = topVendors
    .map(
      (v, idx) =>
        `${idx + 1}. ${v.name} (${v.category || "Umum"})
Rating: ${v.rating}/5 dari ${v.review_count} ulasan
Area Layanan: ${v.service_areas.join(", ")}
Spesialisasi: ${v.specialties.join(", ")}
ID: ${v.vendor_id}`
    )
    .join("\n\n");

  const categoryList = categories
    .map((c) => `${c.name}: ${c.description || ""}`)
    .join("\n");

  return `Kamu adalah MARIJASA AI Assistant, chatbot pintar yang membantu pengguna dengan pertanyaan tentang layanan jasa rumah tangga di platform MARIJASA.

KEMAMPUAN VISION:
Kamu memiliki kemampuan untuk melihat dan menganalisis gambar yang dikirim oleh pengguna. Jika pengguna mengirim gambar:
- Analisis gambar dengan teliti
- Identifikasi masalah atau kerusakan yang terlihat (jika ada)
- Berikan penjelasan tentang apa yang kamu lihat
- Jika relevan, rekomendasikan jenis jasa yang mungkin diperlukan
- Berikan tips atau saran berdasarkan gambar

Contoh penggunaan:
- User mengirim foto AC yang rusak → Analisis kondisi AC, identifikasi kemungkinan masalah, sarankan untuk memanggil teknisi AC
- User mengirim foto pipa bocor → Jelaskan tingkat keparahan, berikan tips darurat, sarankan untuk memanggil tukang ledeng
- User mengirim foto kerusakan listrik → Peringatkan tentang bahaya, sarankan untuk tidak menyentuh, rekomendasikan teknisi listrik

TENTANG MARIJASA:
MARIJASA adalah platform yang menghubungkan pelanggan dengan penyedia jasa rumah tangga profesional dan terverifikasi. Platform ini menyediakan berbagai layanan seperti perbaikan listrik, AC, ledeng, pembersihan rumah, tukang bangunan, dan masih banyak lagi.

KATEGORI JASA TERSEDIA:
${categoryList}

TOP 10 MITRA TERBAIK KAMI:
${vendorList || "Belum ada data mitra tersedia."}

INFORMASI LENGKAP TENTANG LAYANAN MARIJASA:

1. CARA MEMESAN JASA:
   - Kunjungi halaman https://marijasa.com/jasa
   - Pilih kategori jasa yang dibutuhkan
   - Browse dan bandingkan mitra berdasarkan rating dan ulasan
   - Klik profil mitra untuk melihat detail lengkap
   - Klik tombol "Pesan Sekarang" pada profil mitra
   - Isi form pemesanan dengan detail yang dibutuhkan
   - Pilih metode pembayaran yang tersedia
   - Konfirmasi pemesanan
   - Mitra akan menghubungi Anda setelah pembayaran dikonfirmasi
   - Setelah selesai, berikan rating dan ulasan

2. CARA DAFTAR AKUN USER/PELANGGAN:
   - Kunjungi: https://marijasa.com/auth/register
   - Isi form pendaftaran dengan data lengkap (nama, email, telepon, password)
   - Centang "Saya setuju dengan syarat dan ketentuan"
   - Klik tombol "Daftar"
   - Verifikasi email akan dikirim ke inbox Anda
   - Klik link verifikasi di email
   - Akun Anda sudah aktif dan siap digunakan
   - Anda juga bisa login dengan Google untuk proses yang lebih cepat

3. CARA DAFTAR MENJADI MITRA/VENDOR:
   - Kunjungi: https://marijasa.com/mitra/daftar
   - Isi form pendaftaran mitra dengan lengkap
   - Upload dokumen yang diperlukan:
     * KTP (wajib)
     * Foto selfie dengan KTP (wajib)
     * SKCK (opsional tapi direkomendasikan)
     * SIUP (untuk perusahaan)
     * Portfolio/CV (opsional)
   - Pilih tipe mitra (Individu/Perusahaan)
   - Pilih kategori jasa yang dikuasai
   - Tentukan area layanan
   - Buat deskripsi jasa yang menarik
   - Klik "Daftar Sekarang"
   - Tim kami akan verifikasi dalam 24 jam
   - Anda akan menerima email notifikasi status verifikasi
   - Jika disetujui, akun mitra Anda aktif dan bisa mulai menerima pesanan

4. KEUNTUNGAN MENJADI MITRA:
   - GRATIS pendaftaran, tidak ada biaya bulanan atau biaya tahunan
   - Akses ke ribuan pelanggan potensial di seluruh Indonesia
   - Sistem pembayaran yang aman dan mudah
   - Dashboard lengkap untuk mengelola pesanan
   - Support 24/7 dari tim MARIJASA
   - Sistem rating dan ulasan yang transparan
   - Notifikasi real-time untuk setiap pesanan baru
   - Penarikan dana yang fleksibel

5. BIAYA LAYANAN:
   - Biaya jasa bervariasi tergantung mitra dan jenis layanan
   - Estimasi harga dapat dilihat di profil setiap mitra
   - Biaya layanan platform: Rp 10.000 per transaksi
   - Biaya transaksi: 2.5% untuk pembayaran non-tunai (e-wallet, transfer bank)
   - Pembayaran tunai tidak dikenakan biaya transaksi
   - TIDAK ada biaya tersembunyi
   - Total biaya = Harga jasa + Biaya layanan + Biaya transaksi (jika non-tunai)

6. METODE PEMBAYARAN:
   - Transfer Bank (BCA, Mandiri, BNI, BRI, dan bank lainnya)
   - E-Wallet (GoPay, OVO, Dana, ShopeePay, LinkAja)
   - QRIS (scan & pay dengan berbagai aplikasi)
   - Tunai (bayar langsung ke mitra setelah pekerjaan selesai)
   - Pembayaran aman dilindungi oleh sistem escrow MARIJASA
   - Dana pelanggan hanya diteruskan ke mitra setelah pekerjaan selesai

7. CARA CARI MITRA TERBAIK:
   - Gunakan filter kategori di halaman /jasa
   - Urutkan berdasarkan rating tertinggi (recommended)
   - Perhatikan jumlah ulasan (semakin banyak, semakin terpercaya)
   - Baca ulasan dan lihat foto hasil kerja mitra
   - Cek area layanan mitra (pastikan melayani area Anda)
   - Lihat badge "Verified" untuk mitra terverifikasi
   - Bandingkan minimal 3 mitra sebelum memutuskan
   - Perhatikan spesialisasi mitra sesuai kebutuhan Anda

8. KEAMANAN & JAMINAN:
   - Semua mitra melalui proses verifikasi ketat dengan dokumen resmi
   - Data pribadi dilindungi dengan enkripsi tingkat tinggi
   - Sistem escrow untuk keamanan pembayaran
   - Rating dan ulasan real dari pelanggan yang sudah menggunakan jasa
   - Customer support 24/7 siap membantu via chat, email, atau telepon
   - Garansi kepuasan pelanggan dengan sistem komplain yang jelas
   - Proses pengembalian dana jika terjadi masalah serius

9. KONTAK & SUPPORT:
   - Email: muhammadfahreza0838@gmail.com
   - Telepon: 021-1234-5678
   - WhatsApp: 0812-3456-7890
   - Jam Operasional: Senin-Jumat, 08:00-17:00 WIB (Darurat 24/7)
   - Live Chat: Tersedia di website 24/7
   - Website: https://marijasa.com
   - Social Media: @marijasa di Instagram, Facebook, Twitter

CARA MENJAWAB PERTANYAAN:

UNTUK PERTANYAAN DENGAN GAMBAR:
- Analisis gambar dengan teliti dan detail
- Jelaskan apa yang kamu lihat dalam gambar
- Identifikasi masalah atau kerusakan (jika ada)
- Berikan saran atau rekomendasi yang relevan
- Jika diperlukan, tawarkan untuk merekomendasikan mitra yang sesuai
- Gunakan bahasa yang mudah dipahami

UNTUK PERTANYAAN UMUM / INFORMASI:
- Berikan jawaban yang LENGKAP, DETAIL, dan INFORMATIF
- Jelaskan sedetail mungkin sesuai dengan informasi yang ada
- Gunakan bahasa yang mudah dipahami namun tetap profesional
- Berikan langkah-langkah yang jelas jika diperlukan
- Tambahkan tips atau saran yang relevan
- JANGAN langsung memberikan rekomendasi mitra kecuali diminta
- Jawab dengan 3-5 paragraf untuk pertanyaan yang membutuhkan penjelasan detail
- Gunakan contoh konkret untuk memperjelas penjelasan

UNTUK PERTANYAAN TEKNIS / TROUBLESHOOTING:
- Berikan solusi step-by-step yang jelas
- Jelaskan kemungkinan penyebab masalah
- Berikan tips pencegahan untuk masa depan
- Sertakan informasi kapan harus memanggil profesional
- Jelaskan risiko jika dikerjakan sendiri vs menggunakan jasa profesional

UNTUK REKOMENDASI MITRA (HANYA jika user EKSPLISIT meminta):

User harus menggunakan kata-kata seperti:
- "Rekomendasikan mitra/vendor/tukang..."
- "Carikan saya tukang/teknisi..."
- "Siapa mitra terbaik untuk..."
- "Tolong kasih rekomendasi..."
- "Minta rekomendasi vendor..."

PENTING - JUMLAH REKOMENDASI:
- Jika user minta "TERBAIK", "PALING BAGUS", "NOMOR 1", atau "SATU" → Berikan HANYA 1 mitra terbaik
- Jika user minta "BEBERAPA", "PILIHAN", "2-3", atau tidak spesifik jumlah → Berikan 3-5 mitra
- Sesuaikan jumlah dengan permintaan user

Jika user bertanya umum seperti "AC saya rusak", "Listrik mati", "Pipa bocor":
- JANGAN langsung kasih rekomendasi
- Jelaskan dulu kemungkinan penyebab dan solusi umum
- Setelah menjelaskan, baru tawarkan: "Jika Anda memerlukan bantuan profesional, saya bisa merekomendasikan mitra terbaik kami."

ATURAN PENTING FORMAT RESPONSE:
- Untuk pertanyaan umum: Jawab dengan teks biasa yang informatif
- Untuk rekomendasi vendor: WAJIB gunakan format JSON yang valid
- JANGAN campur teks biasa dengan JSON
- JANGAN tambahkan penjelasan di luar JSON untuk rekomendasi vendor

Ingat: Kamu adalah AI Assistant yang cerdas, informatif, dan fokus membantu user mendapatkan solusi terbaik untuk masalah rumah tangga mereka!`;
}

function detectRecommendationCount(query: string): number {
  const lowerQuery = query.toLowerCase();
  
  const singleKeywords = [
    'terbaik',
    'paling bagus',
    'paling baik',
    'nomor 1',
    'nomor satu',
    'yang terbaik',
    'satu',
    'satunya',
    '1'
  ];
  
  if (singleKeywords.some(kw => lowerQuery.includes(kw))) {
    return 1;
  }
  
  if (lowerQuery.includes('2') || lowerQuery.includes('dua')) return 2;
  if (lowerQuery.includes('3') || lowerQuery.includes('tiga')) return 3;
  if (lowerQuery.includes('4') || lowerQuery.includes('empat')) return 4;
  if (lowerQuery.includes('5') || lowerQuery.includes('lima')) return 5;
  
  return 3;
}

function analyzeQuery(query: string): {
  isRecommendationRequest: boolean;
  category?: string;
  isVendorSearch: boolean;
  recommendationCount: number;
} {
  const lowerQuery = query.toLowerCase();

  const recommendKeywords = [
    "rekomendasikan mitra",
    "rekomendasikan vendor",
    "rekomendasikan tukang",
    "rekomendasikan teknisi",
    "rekomendasi mitra",
    "rekomendasi vendor",
    "rekomendasi tukang",
    "rekomendasi teknisi",
    "carikan mitra",
    "carikan vendor",
    "carikan tukang",
    "carikan teknisi",
    "cari mitra",
    "cari vendor",
    "cari tukang",
    "siapa mitra terbaik",
    "siapa vendor terbaik",
    "siapa tukang terbaik",
    "siapa teknisi terbaik",
    "tolong rekomendasikan",
    "tolong carikan",
    "minta rekomendasi",
    "kasih rekomendasi",
    "suggest mitra",
    "suggest vendor",
    "bantu carikan",
    "bantu rekomendasikan",
  ];

  const isRecommendationRequest = recommendKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  const categoryKeywords: { [key: string]: string[] } = {
    listrik: ["listrik", "elektrik", "kabel", "lampu", "saklar", "mcb"],
    ac: ["ac", "air conditioner", "pendingin", "freon"],
    pembersihanrumah: ["bersih", "cleaning", "cuci", "pel", "sapu"],
    ledeng: ["ledeng", "pipa", "air", "keran", "wastafel"],
    sedotwc: ["sedot", "wc", "toilet", "septictank", "septic"],
    kebun: ["kebun", "taman", "tanaman", "rumput"],
    furnitur: ["mebel", "furniture", "kursi", "lemari", "meja"],
  };

  let detectedCategory: string | undefined;
  
  if (isRecommendationRequest) {
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => lowerQuery.includes(kw))) {
        detectedCategory = category;
        break;
      }
    }
  }

  const isVendorSearch = isRecommendationRequest;
  const recommendationCount = detectRecommendationCount(query);

  return {
    isRecommendationRequest,
    category: detectedCategory,
    isVendorSearch,
    recommendationCount,
  };
}

// Helper function untuk membuat message content dengan gambar
function createMessageContent(text: string, imageBase64?: string, imageType?: string): any {
  if (imageBase64 && imageType) {
    return [
      {
        type: "text",
        text: text || "Tolong analisis gambar ini dan berikan penjelasan detail tentang apa yang kamu lihat. Jika ada masalah atau kerusakan, jelaskan dan berikan saran."
      },
      {
        type: "image_url",
        image_url: {
          url: `data:${imageType};base64,${imageBase64}`
        }
      }
    ];
  }
  return text;
}

// Try vision models for image requests
async function tryVisionModels(
  messages: any[],
  systemPrompt: string
): Promise<string> {
  const allMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  let lastError: Error | null = null;

  for (const model of VISION_MODELS) {
    try {
      console.log(`Trying vision model: ${model}`);

      const completion = await groq.chat.completions.create({
        model: model,
        messages: allMessages as ChatCompletionMessageParam[],
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
      });

      const responseText = completion.choices[0]?.message?.content;

      if (responseText) {
        console.log(`Success with vision model: ${model}`);
        return responseText;
      }
    } catch (error: any) {
      console.error(`Error with vision model ${model}:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw (
    lastError ||
    new Error("Model vision tidak tersedia saat ini. Silakan coba lagi.")
  );
}

async function tryTextModels(
  messages: ChatCompletionMessageParam[],
  systemPrompt: string
): Promise<string> {
  const allMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  let lastError: Error | null = null;

  for (const model of TEXT_MODELS) {
    try {
      console.log(`Trying text model: ${model}`);

      const completion = await groq.chat.completions.create({
        model: model,
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
      });

      const responseText = completion.choices[0]?.message?.content;

      if (responseText) {
        console.log(`Success with text model: ${model}`);
        return responseText;
      }
    } catch (error: any) {
      console.error(`Error with text model ${model}:`, error.message);
      lastError = error;

      if (
        error.message?.includes("rate_limit") ||
        error.message?.includes("429")
      ) {
        console.log(`Rate limit hit for ${model}, trying next model...`);
        continue;
      }

      continue;
    }
  }

  throw (
    lastError ||
    new Error("Semua model AI tidak tersedia saat ini. Silakan coba lagi.")
  );
}

// Helper function untuk extract JSON dari response
function extractJSON(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                     text.match(/```\s*([\s\S]*?)\s*```/) ||
                     text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      } catch (e2) {
        console.error("Failed to parse extracted JSON:", e2);
        return null;
      }
    }
    
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, image } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const lastUserMessage = messages[messages.length - 1]?.text || "";
    const queryAnalysis = analyzeQuery(lastUserMessage);
    const systemPrompt = await generateSystemPrompt();

    // Check if there's an image in the request
    const hasImage = image && image.base64 && image.type;

    // Jika ada gambar, gunakan vision model
    if (hasImage) {
      console.log("Processing image request with vision model");
      
      // Build messages for vision model
      const visionMessages = messages.map((msg: any, index: number) => {
        const isLastMessage = index === messages.length - 1;
        
        if (msg.sender === "user") {
          // Only add image to the last user message
          if (isLastMessage && hasImage) {
            return {
              role: "user",
              content: createMessageContent(msg.text, image.base64, image.type)
            };
          }
          return {
            role: "user",
            content: msg.text
          };
        }
        return {
          role: "assistant",
          content: msg.text
        };
      });

      try {
        const responseText = await tryVisionModels(visionMessages, systemPrompt);
        
        return NextResponse.json({
          success: true,
          message: responseText,
        });
      } catch (error: any) {
        console.error("Vision model error:", error);
        return NextResponse.json({
          success: true,
          message: "Maaf, saya tidak dapat menganalisis gambar saat ini. Silakan coba lagi atau jelaskan masalah Anda dengan teks.",
        });
      }
    }

    // Text-only messages (existing logic)
    const groqMessages: ChatCompletionMessageParam[] = messages.map(
      (msg: any) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      })
    );

    // Jika request adalah rekomendasi vendor
    if (queryAnalysis.isVendorSearch && queryAnalysis.isRecommendationRequest) {
      let vendors: any[] = [];

      if (queryAnalysis.category) {
        vendors = await searchVendors(queryAnalysis.category);
      } else {
        const topVendors = await getTopVendors();
        vendors = topVendors;
      }

      vendors = vendors.slice(0, queryAnalysis.recommendationCount);

      if (vendors.length > 0) {
        const enhancedMessages = [...groqMessages];
        enhancedMessages[enhancedMessages.length - 1] = {
          role: "user",
          content: `${lastUserMessage}

INSTRUKSI KHUSUS: User meminta rekomendasi mitra. Saya telah menemukan ${vendors.length} mitra terbaik yang sesuai. 

${queryAnalysis.recommendationCount === 1 
  ? 'User meminta SATU mitra TERBAIK, jadi berikan HANYA 1 vendor.' 
  : `User meminta ${queryAnalysis.recommendationCount} mitra, jadi berikan ${vendors.length} vendors.`
}

PENTING: Response HANYA berupa JSON berikut, JANGAN tambahkan teks lain di luar JSON:

{
  "type": "vendor_recommendation",
  "message": "Pesan singkat yang ramah (max 2-3 kalimat, natural, TANPA simbol markdown seperti **, -, ##). ${
    queryAnalysis.recommendationCount === 1 
      ? 'Sebutkan ini adalah mitra TERBAIK.' 
      : 'Sebutkan ini adalah pilihan mitra terbaik.'
  }",
  "vendors": ${JSON.stringify(
    vendors.map((v) => ({
      vendor_id: v.vendor_id,
      name: v.name,
      category: v.category || "Umum",
      rating: v.rating,
      review_count: v.review_count,
      service_areas: v.service_areas,
      specialties: v.specialties,
      phone: v.phone,
      avatar: v.avatar,
      description: v.description,
    }))
  )}
}

RULES:
- HANYA output JSON di atas
- JANGAN tambahkan penjelasan atau teks apapun di luar JSON
- Message harus natural tanpa markdown
- Jumlah vendor HARUS ${vendors.length}`,
        };

        const responseText = await tryTextModels(enhancedMessages, systemPrompt);
        console.log("AI Response:", responseText);

        const jsonData = extractJSON(responseText);

        if (jsonData && jsonData.type === "vendor_recommendation") {
          return NextResponse.json({
            success: true,
            message: jsonData.message,
            data: jsonData,
          });
        } else {
          console.warn("AI did not return valid JSON, creating manual response");
          return NextResponse.json({
            success: true,
            message: queryAnalysis.recommendationCount === 1 
              ? `Berikut rekomendasi mitra terbaik untuk Anda:`
              : `Berikut ${vendors.length} rekomendasi mitra terbaik untuk Anda:`,
            data: {
              type: "vendor_recommendation",
              message: queryAnalysis.recommendationCount === 1 
                ? `Berikut rekomendasi mitra terbaik untuk Anda:`
                : `Berikut ${vendors.length} rekomendasi mitra terbaik untuk Anda:`,
              vendors: vendors.map((v) => ({
                vendor_id: v.vendor_id,
                name: v.name,
                category: v.category || "Umum",
                rating: v.rating,
                review_count: v.review_count,
                service_areas: v.service_areas,
                specialties: v.specialties,
                phone: v.phone,
                avatar: v.avatar,
                description: v.description,
              })),
            },
          });
        }
      } else {
        const noVendorMessages = [...groqMessages];
        noVendorMessages[noVendorMessages.length - 1] = {
          role: "user",
          content: `${lastUserMessage}

INSTRUKSI: User meminta rekomendasi, tapi tidak ada vendor yang tersedia untuk kategori tersebut. 
Berikan response yang informatif dan helpful, sarankan untuk:
1. Coba kategori lain
2. Hubungi customer support
3. Cek halaman /jasa untuk melihat semua mitra tersedia`,
        };

        const responseText = await tryTextModels(noVendorMessages, systemPrompt);
        return NextResponse.json({
          success: true,
          message: responseText,
        });
      }
    }

    // Untuk pertanyaan umum (bukan rekomendasi vendor)
    const responseText = await tryTextModels(groqMessages, systemPrompt);

    return NextResponse.json({
      success: true,
      message: responseText,
    });
  } catch (error: any) {
    console.error("API Error:", error);

    return NextResponse.json(
      {
        error: "Maaf, sistem sedang sibuk",
        message:
          "Mohon maaf, saat ini semua AI model kami sedang mengalami beban tinggi. Silakan coba lagi dalam beberapa saat atau hubungi support@marijasa.com untuk bantuan langsung.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}