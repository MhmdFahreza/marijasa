import { ReactNode } from "react";

export type HoverProject = {
  title: string;
  description: string;
  icon?: ReactNode; 
};

export const dataReason: HoverProject[] = [
  {
    title: "1. Akses Mudah dari Mana Saja",
    description:
      "Website Marijasa dapat diakses, memudahkan pencarian dan pemesanan jasa rumah tangga.",
  },
  {
    title: "2. Pencarian dan Pemesanan Cepat",
    description:
      "Sistem pencarian penyedia jasa terdekat dan langsung pesan sesuai kebutuhan.",
  },
  {
    title: "3. Ulasan dan Rating Transparan",
    description:
      "Dapat memberikan rating kepada mitra sekaligus ulasan yang dapat dilihat oleh pengguna.",
  },
  {
    title: "4. Pembayaran Aman dan Fleksibel",
    description:
      "Berbagai metode pembayaran digital yang aman, dan jaminan transaksi yang terpercaya.",
  },
  {
    title: "5. Penyedia Jasa Terverifikasi",
    description:
      "Semua penyedia jasa terverifikasi identitas dan kemampuan.",
  },
  {
    title: "6. Dukungan Pelanggan 24/7",
    description:
      "Layanan dukungan pelanggan yang responsif, dan menyelesaikan kendala dengan cepat.",
  },
];