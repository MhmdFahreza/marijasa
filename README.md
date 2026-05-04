<div align="center">

<!-- Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=Marijasa&fontSize=80&fontColor=fff&animation=twinkling&fontAlignY=35&desc=Platform%20Penyedia%20Jasa%20Tukang%20%26%20Teknisi%20Rumah%20Tangga&descAlignY=60&descSize=18" width="100%"/>

<!-- Badges -->
<p>
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-UI%20Library-000000?style=for-the-badge&logo=shadcnui&logoColor=white" />
</p>

<p>
  <img src="https://img.shields.io/github/stars/marijasa/marijasa?style=social" />
  <img src="https://img.shields.io/github/forks/marijasa/marijasa?style=social" />
</p>

**🔧 Temukan Tukang & Teknisi Terpercaya — Kapan Saja, Di Mana Saja**

[🚀 Demo Live](#) · [📖 Dokumentasi](#) · [🐛 Laporkan Bug](../../issues) · [✨ Request Fitur](../../issues)

</div>

---

## 📋 Daftar Isi

- [Tentang Marijasa](#-tentang-marijasa)
- [Fitur Unggulan](#-fitur-unggulan)
- [Tech Stack](#-tech-stack)
- [Mulai Cepat](#-mulai-cepat)
- [Struktur Proyek](#-struktur-proyek)
- [Environment Variables](#-environment-variables)
- [Kontribusi](#-kontribusi)

---

## 🏠 Tentang Marijasa

**Marijasa** adalah platform digital yang menghubungkan pengguna dengan **tukang dan teknisi rumah tangga profesional** di sekitar mereka. Mulai dari perbaikan listrik, saluran air, AC, hingga renovasi rumah — semuanya bisa ditemukan hanya dalam beberapa klik.

> 💬 **Tidak tahu masalahnya apa?** Tidak perlu khawatir! Gunakan fitur **Chatbot AI** kami untuk konsultasi awal secara gratis sebelum memesan jasa.

```
Pengguna → Deskripsikan Masalah → Chatbot AI Bantu Diagnosa → Temukan Teknisi → Beres! 🎉
```

---

## ✨ Fitur Unggulan

<table>
  <tr>
    <td width="50%">
      <h3>🤖 Chatbot AI Konsultasi</h3>
      <p>Konsultasikan masalah rumah Anda terlebih dahulu sebelum memesan. AI kami akan membantu mendiagnosa dan merekomendasikan jasa yang tepat.</p>
    </td>
    <td width="50%">
      <h3>🔍 Cari Teknisi Terdekat</h3>
      <p>Temukan tukang & teknisi profesional di sekitar Anda dengan mudah berdasarkan lokasi, rating, dan spesialisasi.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔐 Autentikasi Aman</h3>
      <p>Sistem login & register yang aman menggunakan Supabase Auth, lengkap dengan verifikasi email dan OAuth.</p>
    </td>
    <td width="50%">
      <h3>⚡ Performa Tinggi</h3>
      <p>Didukung Redis caching untuk respons yang cepat dan pengalaman pengguna yang mulus tanpa hambatan.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🎨 UI Modern & Responsif</h3>
      <p>Antarmuka yang elegan dan responsif dibangun dengan shadcn/ui — nyaman diakses dari HP maupun desktop.</p>
    </td>
    <td width="50%">
      <h3>📊 Dashboard Teknisi</h3>
      <p>Teknisi dapat mengelola profil, portofolio, jadwal, dan pesanan masuk dari satu dashboard yang lengkap.</p>
    </td>
  </tr>
</table>

---

## 🛠 Tech Stack

| Kategori | Teknologi |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) + [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Cache** | [Redis](https://redis.io/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/) |
| **Auth** | [Supabase Auth](https://supabase.com/auth) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🚀 Mulai Cepat

### Prasyarat

Pastikan kamu sudah menginstall:

- [Node.js](https://nodejs.org/) `>= 18.0.0`
- [npm](https://www.npmjs.com/) / [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)
- [Redis](https://redis.io/docs/getting-started/) (lokal atau via Docker)

### Instalasi

**1. Clone repositori ini**

```bash
git clone https://github.com/marijasa/marijasa.git
cd marijasa
```

**2. Install dependencies**

```bash
npm install
# atau
pnpm install
```

**3. Salin dan isi environment variables**

```bash
cp .env.example .env.local
```

Isi variabel yang diperlukan (lihat bagian [Environment Variables](#-environment-variables)).

**4. Setup database dengan Prisma**

```bash
npx prisma generate
npx prisma db push
```

**5. Jalankan server pengembangan**

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser kamu. 🎉

---

## 📁 Struktur Proyek

```
marijasa/
├── 📂 app/                  # Next.js App Router (halaman & routing)
│   ├── (auth)/              # Grup rute autentikasi
│   ├── (dashboard)/         # Grup rute dashboard
│   └── api/                 # API Routes (Backend)
├── 📂 generated/            # Hasil generate Prisma Client
├── 📂 prisma/               # Schema & migrasi database
│   └── schema.prisma
├── 📂 public/               # Aset statis (gambar, ikon, dll)
├── 📂 scripts/              # Script utilitas
├── 📄 components.json       # Konfigurasi shadcn/ui
├── 📄 middleware.ts          # Middleware autentikasi & routing
├── 📄 next.config.ts        # Konfigurasi Next.js
└── 📄 package.json
```

---

## 🔑 Environment Variables

Buat file `.env.local` di root proyek dan isi variabel berikut:

```env
# ─── Supabase ─────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ─── Database (Prisma) ────────────────────────────────
DATABASE_URL=your_postgresql_connection_string
DIRECT_URL=your_direct_postgresql_url

# ─── Redis ───────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── AI Chatbot ───────────────────────────────────────
OPENAI_API_KEY=your_openai_api_key
```

---

## 🤝 Kontribusi

Kontribusi selalu disambut! Ikuti langkah berikut:

1. **Fork** repositori ini
2. Buat branch fitur baru: `git checkout -b feat/fitur-keren`
3. Commit perubahan: `git commit -m 'feat: tambah fitur keren'`
4. Push ke branch: `git push origin feat/fitur-keren`
5. Buat **Pull Request**

---

## 📄 Lisensi

Didistribusikan di bawah lisensi **MIT**. Lihat `LICENSE` untuk informasi lebih lanjut.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" width="100%"/>

**Dibuat dengan ❤️ oleh tim Marijasa**

⭐ Jangan lupa beri bintang jika project ini membantu kamu!

</div>
