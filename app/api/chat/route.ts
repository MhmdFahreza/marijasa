import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // System prompt untuk chatbot MARIJASA
    const systemPrompt: ChatCompletionMessageParam = {
      role: "system",
      content: `Kamu adalah Chatbot MARIJASA, asisten virtual yang membantu pengguna dengan pertanyaan tentang layanan jasa rumah tangga. 

MARIJASA adalah platform yang menghubungkan pelanggan dengan penyedia jasa rumah tangga profesional seperti:
- Tukang Listrik
- Tukang AC
- Pembersihan Rumah
- Tukang Ledeng
- Tukang Sedot WC
- Tukang Kebun
- Tukang Mebel

Informasi Penting:
1. CARA MEMESAN JASA:
   - Pilih kategori jasa di halaman utama
   - Pilih vendor yang tersedia
   - Isi form pemesanan dengan detail
   - Konfirmasi pembayaran

2. BIAYA LAYANAN:
   - Biaya bervariasi tergantung jenis jasa dan vendor
   - Estimasi harga tersedia di halaman detail vendor
   - Tidak ada biaya tersembunyi

3. MENJADI MITRA:
   - Klik tombol "DAFTAR SEKARANG" di halaman utama
   - Isi form pendaftaran lengkap
   - Verifikasi diproses dalam 24 jam
   - GRATIS tanpa biaya bulanan
   - Keuntungan: akses ke banyak pelanggan, sistem pembayaran aman

4. KONTAK SUPPORT:
   - Email: support@marijasa.com
   - Telepon: (021) 1234-5678
   - Jam Operasional: Senin-Jumat, 08:00-17:00 WIB

5. KEUNGGULAN MARIJASA:
   - Akses Mudah dari Mana Saja
   - Pencarian dan Pemesanan Cepat
   - Ulasan dan Rating Transparan
   - Pembayaran Aman dan Fleksibel
   - Penyedia Jasa Terverifikasi
   - Dukungan Pelanggan 24/7

Cara Menjawab:
- Ramah, profesional, dan membantu
- Gunakan bahasa Indonesia yang baik
- Berikan jawaban yang spesifik dan relevan
- Jika tidak tahu jawabannya, arahkan ke customer support
- Gunakan emoji secukupnya untuk kesan ramah
- Tawarkan bantuan lebih lanjut di akhir respons

Jangan pernah memberikan informasi yang tidak disebutkan di atas. Jika ditanya tentang hal di luar konteks MARIJASA, dengan sopan arahkan kembali ke topik layanan kami.`,
    };

    // Konversi messages dari format custom ke format Groq
    const groqMessages: ChatCompletionMessageParam[] = messages.map((msg: any) => {
      const role = msg.sender === "user" ? "user" : "assistant";
      return {
        role: role as "user" | "assistant",
        content: msg.text,
      };
    });

    // Gabungkan system prompt dengan messages dari user
    const allMessages: ChatCompletionMessageParam[] = [
      systemPrompt,
      ...groqMessages,
    ];

    // Panggil Groq API
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
    });

    const responseText = completion.choices[0]?.message?.content || 
      "Maaf, saya mengalami kesulitan memproses permintaan Anda. Silakan coba lagi.";

    return NextResponse.json({
      success: true,
      message: responseText,
    });

  } catch (error: any) {
    console.error("Groq API Error:", error);
    
    return NextResponse.json(
      {
        error: "Terjadi kesulihan pada server",
        details: error.message,
      },
      { status: 500 }
    );
  }
}