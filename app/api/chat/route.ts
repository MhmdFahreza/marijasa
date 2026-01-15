import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { PrismaClient } from "@/app/generated/prisma";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const AI_MODELS = [
  "moonshotai/kimi-k2-instruct",
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "mixtral-8x7b-32768",
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
      take: 5,
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
   - Email: support@marijasa.com
   - Telepon: (021) 1234-5678
   - WhatsApp: +62 812-3456-7890
   - Jam Operasional: Senin-Jumat, 08:00-17:00 WIB (Darurat 24/7)
   - Live Chat: Tersedia di website 24/7
   - Website: https://marijasa.com
   - Social Media: @marijasa di Instagram, Facebook, Twitter

CARA MENJAWAB PERTANYAAN:

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

Jika user bertanya umum seperti "AC saya rusak", "Listrik mati", "Pipa bocor":
- JANGAN langsung kasih rekomendasi
- Jelaskan dulu kemungkinan penyebab dan solusi umum
- Setelah menjelaskan, baru tawarkan: "Jika Anda memerlukan bantuan profesional, saya bisa merekomendasikan mitra terbaik kami."

Jika user memang minta rekomendasi mitra:
- Berikan response dalam format JSON:
{
  "type": "vendor_recommendation",
  "message": "Pesan singkat yang ramah (max 2-3 kalimat, TANPA simbol markdown)",
  "vendors": [array of vendors]
}

ATURAN PENTING:
- JANGAN jawab pertanyaan di luar konteks MARIJASA
- JANGAN berikan informasi palsu atau mengada-ada
- JANGAN gunakan emoji berlebihan (max 2-3 per response)
- JANGAN gunakan simbol markdown seperti **, -, ##, ###, atau sejenisnya
- SELALU ramah, profesional, dan membantu
- JIKA tidak tahu jawaban pasti, arahkan ke customer support
- Berikan jawaban yang PANJANG dan LENGKAP untuk pertanyaan general
- HANYA berikan rekomendasi vendor jika user EKSPLISIT meminta
- Gunakan bahasa Indonesia yang natural dan mudah dipahami

Ingat: Kamu adalah AI Assistant yang cerdas, informatif, dan fokus membantu user mendapatkan solusi terbaik untuk masalah rumah tangga mereka!`;
}

function analyzeQuery(query: string): {
  isRecommendationRequest: boolean;
  category?: string;
  isVendorSearch: boolean;
} {
  const lowerQuery = query.toLowerCase();

  // Keywords yang SANGAT SPESIFIK untuk rekomendasi vendor
  // Hanya trigger jika user EKSPLISIT minta rekomendasi
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

  // Cek apakah query mengandung keyword rekomendasi yang EKSPLISIT
  const isRecommendationRequest = recommendKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  // Keywords untuk kategori (untuk search)
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
  
  // Hanya detect category jika memang request rekomendasi
  if (isRecommendationRequest) {
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => lowerQuery.includes(kw))) {
        detectedCategory = category;
        break;
      }
    }
  }

  // Vendor search hanya true jika EKSPLISIT minta rekomendasi
  const isVendorSearch = isRecommendationRequest;

  return {
    isRecommendationRequest,
    category: detectedCategory,
    isVendorSearch,
  };
}

async function tryModels(
  messages: ChatCompletionMessageParam[],
  systemPrompt: string
): Promise<string> {
  const allMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  let lastError: Error | null = null;

  for (const model of AI_MODELS) {
    try {
      console.log(`Trying model: ${model}`);

      const completion = await groq.chat.completions.create({
        model: model,
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
      });

      const responseText = completion.choices[0]?.message?.content;

      if (responseText) {
        console.log(`Success with model: ${model}`);
        return responseText;
      }
    } catch (error: any) {
      console.error(`Error with model ${model}:`, error.message);
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

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const lastUserMessage = messages[messages.length - 1]?.text || "";
    const queryAnalysis = analyzeQuery(lastUserMessage);
    const systemPrompt = await generateSystemPrompt();

    const groqMessages: ChatCompletionMessageParam[] = messages.map(
      (msg: any) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      })
    );

    // HANYA jika user EKSPLISIT minta rekomendasi vendor
    if (queryAnalysis.isVendorSearch && queryAnalysis.isRecommendationRequest) {
      let vendors: any[] = [];

      if (queryAnalysis.category) {
        vendors = await searchVendors(queryAnalysis.category);
      } else {
        const topVendors = await getTopVendors();
        vendors = topVendors.slice(0, 3);
      }

      if (vendors.length > 0) {
        const enhancedMessages = [...groqMessages];
        enhancedMessages[enhancedMessages.length - 1] = {
          role: "user",
          content: `${lastUserMessage}

INSTRUKSI KHUSUS: User meminta rekomendasi mitra. Saya telah menemukan ${vendors.length} mitra terbaik yang sesuai. Berikan response dalam format JSON berikut (HARUS valid JSON):

{
  "type": "vendor_recommendation",
  "message": "Pesan singkat yang ramah (max 2-3 kalimat, TANPA simbol markdown seperti **, -, ##)",
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

PENTING: 
- Response HARUS valid JSON
- JANGAN tambahkan teks apapun di luar JSON
- Pesan di field "message" harus natural dan TANPA simbol markdown
- Jangan gunakan **, -, ##, atau simbol formatting lainnya`,
        };

        const responseText = await tryModels(enhancedMessages, systemPrompt);

        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            return NextResponse.json({
              success: true,
              message: responseText,
              data: jsonData,
            });
          }
        } catch (e) {
          console.error("JSON parse error:", e);
        }

        return NextResponse.json({
          success: true,
          message: responseText,
        });
      }
    }

    // Untuk pertanyaan general, langsung jawab tanpa rekomendasi vendor
    const responseText = await tryModels(groqMessages, systemPrompt);

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