"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SyaratKetentuanPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg">
                <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            <ArrowLeft className="size-5" />
                            <span className="text-sm font-medium">Kembali ke Beranda</span>
                        </Link>
                        <Link
                            href="/"
                            className="font-semibold text-xl text-[#7CE0A8] dark:text-[#7CE0A8]"
                        >
                            MARIJASA
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#7CE0A8]/10 via-white to-[#7CE0A8]/5 dark:from-[#7CE0A8]/5 dark:via-neutral-900 dark:to-[#7CE0A8]/5 border-b border-gray-200 dark:border-neutral-800">
                <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Syarat & Ketentuan
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                            Ketentuan penggunaan layanan MARIJASA
                        </p>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                            Terakhir diperbarui: 2 Februari 2025
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-12 sm:py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6 sm:p-8 lg:p-12">
                        
                        {/* Introduction */}
                        <div className="mb-8 sm:mb-12">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                                Selamat datang di MARIJASA. Dengan mengakses dan menggunakan platform kami, Anda menyetujui untuk terikat dengan syarat dan ketentuan berikut. Harap membaca dengan saksama sebelum menggunakan layanan kami.
                            </p>
                        </div>

                        {/* Section 1 */}
                        <div className="mb-8 sm:mb-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center size-8 rounded-lg bg-[#7CE0A8]/20 text-[#7CE0A8] text-sm font-semibold">1</span>
                                Definisi
                            </h2>
                            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <p><strong className="text-gray-900 dark:text-white">Platform:</strong> Aplikasi dan website MARIJASA yang menyediakan layanan marketplace jasa.</p>
                                <p><strong className="text-gray-900 dark:text-white">Pengguna:</strong> Setiap individu atau entitas yang menggunakan platform MARIJASA.</p>
                                <p><strong className="text-gray-900 dark:text-white">Penyedia Jasa:</strong> Pengguna yang menawarkan dan menyediakan jasa melalui platform.</p>
                                <p><strong className="text-gray-900 dark:text-white">Pencari Jasa:</strong> Pengguna yang mencari dan menggunakan jasa yang ditawarkan di platform.</p>
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="mb-8 sm:mb-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center size-8 rounded-lg bg-[#7CE0A8]/20 text-[#7CE0A8] text-sm font-semibold">2</span>
                                Ketentuan Umum
                            </h2>
                            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">2.1 Persyaratan Pengguna</p>
                                    <ul className="list-disc list-inside space-y-2 ml-2">
                                        <li>Pengguna harus berusia minimal 17 tahun atau sudah memiliki KTP</li>
                                        <li>Wajib memberikan informasi yang akurat dan benar saat pendaftaran</li>
                                        <li>Bertanggung jawab atas keamanan akun dan password</li>
                                        <li>Tidak diperbolehkan berbagi akun dengan pihak lain</li>
                                    </ul>
                                </div>
                                
                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">2.2 Penggunaan Platform</p>
                                    <ul className="list-disc list-inside space-y-2 ml-2">
                                        <li>Platform hanya boleh digunakan untuk tujuan yang sah dan legal</li>
                                        <li>Dilarang menggunakan platform untuk kegiatan penipuan atau ilegal</li>
                                        <li>Tidak diperbolehkan mengganggu atau merusak sistem platform</li>
                                        <li>Dilarang menggunakan bot atau sistem otomatis tanpa izin</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div className="mb-8 sm:mb-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center size-8 rounded-lg bg-[#7CE0A8]/20 text-[#7CE0A8] text-sm font-semibold">3</span>
                                Ketentuan Penyedia Jasa
                            </h2>
                            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">3.1 Verifikasi</p>
                                    <p>Penyedia jasa wajib melengkapi proses verifikasi identitas yang meliputi KTP, foto diri, dan dokumen pendukung lainnya sesuai kategori jasa yang ditawarkan.</p>
                                </div>
                                
                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">3.2 Kualitas Layanan</p>
                                    <ul className="list-disc list-inside space-y-2 ml-2">
                                        <li>Memberikan layanan sesuai dengan deskripsi yang tertera</li>
                                        <li>Menyelesaikan pekerjaan tepat waktu sesuai kesepakatan</li>
                                        <li>Berkomunikasi dengan profesional dan sopan</li>
                                        <li>Bertanggung jawab penuh atas kualitas jasa yang diberikan</li>
                                    </ul>
                                </div>

                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">3.3 Harga dan Komisi</p>
                                    <p>Platform akan memotong komisi sebesar 10-15% dari setiap transaksi yang berhasil diselesaikan. Penyedia jasa bebas menentukan harga layanan sesuai dengan pasar.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 4 */}
                        <div className="mb-8 sm:mb-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center size-8 rounded-lg bg-[#7CE0A8]/20 text-[#7CE0A8] text-sm font-semibold">4</span>
                                Ketentuan Pencari Jasa
                            </h2>
                            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">4.1 Pemesanan</p>
                                    <ul className="list-disc list-inside space-y-2 ml-2">
                                        <li>Pastikan membaca detail layanan dengan saksama sebelum memesan</li>
                                        <li>Berikan brief atau instruksi yang jelas kepada penyedia jasa</li>
                                        <li>Lakukan pembayaran melalui metode yang tersedia di platform</li>
                                    </ul>
                                </div>
                                
                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">4.2 Pembayaran</p>
                                    <p>Dana akan ditahan oleh sistem escrow platform dan akan diteruskan ke penyedia jasa setelah pesanan selesai dan Anda menyatakan puas dengan hasilnya.</p>
                                </div>

                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">4.3 Revisi dan Komplain</p>
                                    <p>Pencari jasa berhak meminta revisi sesuai dengan ketentuan yang disepakati. Jika terdapat masalah, dapat mengajukan komplain melalui sistem support dalam waktu 3x24 jam setelah pekerjaan selesai.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 5 */}
                        <div className="mb-8 sm:mb-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center size-8 rounded-lg bg-[#7CE0A8]/20 text-[#7CE0A8] text-sm font-semibold">5</span>
                                Transaksi dan Pembayaran
                            </h2>
                            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">5.1 Metode Pembayaran</p>
                                    <p>Platform menyediakan berbagai metode pembayaran termasuk transfer bank, e-wallet, dan virtual account.</p>
                                </div>
                                
                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">5.2 Sistem Escrow</p>
                                    <p>Semua transaksi menggunakan sistem escrow untuk melindungi kedua belah pihak. Dana hanya akan dilepas ke penyedia jasa setelah pesanan dinyatakan selesai.</p>
                                </div>

                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">5.3 Refund</p>
                                    <p>Pengembalian dana hanya dapat dilakukan dalam kondisi tertentu seperti penyedia jasa membatalkan pesanan atau tidak memenuhi kesepakatan. Proses refund memakan waktu 3-7 hari kerja.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 6 */}
                        <div className="mb-8 sm:mb-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center size-8 rounded-lg bg-[#7CE0A8]/20 text-[#7CE0A8] text-sm font-semibold">6</span>
                                Hak Kekayaan Intelektual
                            </h2>
                            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <p>Semua konten, logo, desain, dan materi di platform MARIJASA adalah hak milik MARIJASA dan dilindungi oleh undang-undang hak cipta.</p>
                                <p>Pengguna tidak diperbolehkan untuk menyalin, memodifikasi, atau mendistribusikan konten platform tanpa izin tertulis.</p>
                                <p>Hasil kerja dari penyedia jasa menjadi hak milik pencari jasa setelah pembayaran selesai, kecuali disepakati lain.</p>
                            </div>
                        </div>

                        {/* Section 7 */}
                        <div className="mb-8 sm:mb-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center size-8 rounded-lg bg-[#7CE0A8]/20 text-[#7CE0A8] text-sm font-semibold">7</span>
                                Larangan dan Sanksi
                            </h2>
                            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <p className="font-semibold text-red-900 dark:text-red-200 mb-2">Tindakan yang Dilarang:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-2 text-red-800 dark:text-red-300">
                                        <li>Melakukan penipuan atau memberikan informasi palsu</li>
                                        <li>Melakukan transaksi di luar platform</li>
                                        <li>Menggunakan platform untuk kegiatan ilegal</li>
                                        <li>Melecehkan atau mengintimidasi pengguna lain</li>
                                        <li>Mengirim spam atau konten yang tidak pantas</li>
                                        <li>Manipulasi rating atau review</li>
                                    </ul>
                                </div>
                                
                                <div className="pl-4 border-l-2 border-[#7CE0A8]/30">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">Sanksi:</p>
                                    <p>Pelanggaran terhadap ketentuan dapat mengakibatkan peringatan, suspensi sementara, atau penghapusan akun permanen tanpa pengembalian dana.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 8 */}
                        <div className="mb-8 sm:mb-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center size-8 rounded-lg bg-[#7CE0A8]/20 text-[#7CE0A8] text-sm font-semibold">8</span>
                                Penyelesaian Sengketa
                            </h2>
                            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <p>Jika terjadi sengketa antara pengguna, MARIJASA akan bertindak sebagai mediator untuk mencari solusi terbaik.</p>
                                <p>Pengguna dapat mengajukan sengketa melalui sistem support dalam waktu maksimal 14 hari setelah transaksi.</p>
                                <p>Keputusan mediasi dari MARIJASA bersifat final dan mengikat kedua belah pihak.</p>
                                <p>Jika mediasi gagal, penyelesaian akan dilakukan melalui jalur hukum yang berlaku di Indonesia.</p>
                            </div>
                        </div>

                        {/* Section 9 */}
                        <div className="mb-8 sm:mb-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center size-8 rounded-lg bg-[#7CE0A8]/20 text-[#7CE0A8] text-sm font-semibold">9</span>
                                Batasan Tanggung Jawab
                            </h2>
                            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <p>MARIJASA bertindak sebagai platform perantara dan tidak bertanggung jawab atas:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Kualitas atau kegagalan layanan yang diberikan oleh penyedia jasa</li>
                                    <li>Kerugian langsung atau tidak langsung akibat penggunaan platform</li>
                                    <li>Kehilangan data atau gangguan teknis di luar kendali kami</li>
                                    <li>Tindakan atau kelalaian pengguna</li>
                                </ul>
                                <p className="mt-3">MARIJASA akan berusaha semaksimal mungkin untuk menjaga keamanan dan kelancaran platform, namun tidak menjamin platform bebas dari gangguan atau error.</p>
                            </div>
                        </div>

                        {/* Section 10 */}
                        <div className="mb-8 sm:mb-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center size-8 rounded-lg bg-[#7CE0A8]/20 text-[#7CE0A8] text-sm font-semibold">10</span>
                                Perubahan Syarat & Ketentuan
                            </h2>
                            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <p>MARIJASA berhak untuk mengubah atau memperbarui syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya.</p>
                                <p>Perubahan akan berlaku segera setelah dipublikasikan di platform.</p>
                                <p>Pengguna dianjurkan untuk secara berkala memeriksa halaman ini untuk mengetahui perubahan terbaru.</p>
                                <p>Dengan tetap menggunakan platform setelah perubahan, Anda dianggap menyetujui syarat dan ketentuan yang baru.</p>
                            </div>
                        </div>

                        {/* Section 11 */}
                        <div className="mb-8 sm:mb-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center size-8 rounded-lg bg-[#7CE0A8]/20 text-[#7CE0A8] text-sm font-semibold">11</span>
                                Hukum yang Berlaku
                            </h2>
                            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                <p>Syarat dan ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia.</p>
                                <p>Setiap perselisihan yang timbul akan diselesaikan di pengadilan yang berwenang di Indonesia.</p>
                            </div>
                        </div>

                        {/* Contact Section */}
                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-neutral-700">
                            <div className="bg-[#7CE0A8]/10 dark:bg-[#7CE0A8]/20 rounded-xl p-6 sm:p-8">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    Hubungi Kami
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-4">
                                    Jika Anda memiliki pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi kami:
                                </p>
                                <div className="space-y-2 text-sm sm:text-base">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <strong className="text-gray-900 dark:text-white">Email:</strong> legal@marijasa.com
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <strong className="text-gray-900 dark:text-white">WhatsApp:</strong> +62 812-3456-7890
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <strong className="text-gray-900 dark:text-white">Alamat:</strong> Jakarta, Indonesia
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#7CE0A8] text-white font-semibold hover:bg-[#6BD099] transition-colors focus:outline-none focus:ring-2 focus:ring-[#7CE0A8] focus:ring-offset-2"
                            >
                                Kembali ke Beranda
                            </Link>
                            <Link
                                href="/kebijakan-privasi"
                                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 font-semibold hover:border-[#7CE0A8] hover:text-[#7CE0A8] dark:hover:border-[#7CE0A8] dark:hover:text-[#7CE0A8] transition-colors focus:outline-none"
                            >
                                Lihat Kebijakan Privasi
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer minimal */}
            <footer className="border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-6">
                <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        © 2025 MARIJASA. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}