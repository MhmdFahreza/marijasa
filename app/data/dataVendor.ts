// app/data/dataVendor.ts
export type Vendor = {
    id: string;
    name: string;
    verified?: boolean;
    rating: number;
    reviewCount: number;
    tags: string[];
    summary: string;
    gallery: { src: string; alt: string }[];
    avatar?: string;
};

export const Vendors: Vendor[] = [
    {
        id: "1",
        name: "Edi Taulany Karya Baru",
        verified: true,
        rating: 4.9,
        reviewCount: 74,
        tags: ["Tukang AC", "Instalasi AC", "Cuci AC"],
        summary:
            "Penyedia jasa perbaikan dan renovasi rumah/kantor. Spesialis AC split dan central, garansi 30 hari.",
        gallery: [
            { src: "https://picsum.photos/seed/a1/200/200", alt: "Pekerjaan 1" },
            { src: "https://picsum.photos/seed/a2/200/200", alt: "Pekerjaan 2" },
            { src: "https://picsum.photos/seed/a3/200/200", alt: "Pekerjaan 3" },
        ],
        avatar: "https://i.pravatar.cc/120?img=12",
    },
    {
        id: "2",
        name: "Berkah Teknik Listrik",
        verified: true,
        rating: 4.8,
        reviewCount: 58,
        tags: ["Tukang Listrik", "Panel Listrik"],
        summary: "Instalasi, perbaikan MCB, penambahan titik, dan audit kelistrikan rumah/rumah toko.",
        gallery: [
            { src: "https://picsum.photos/seed/b1/200/200", alt: "Pekerjaan 1" },
            { src: "https://picsum.photos/seed/b2/200/200", alt: "Pekerjaan 2" },
            { src: "https://picsum.photos/seed/b3/200/200", alt: "Pekerjaan 3" },
        ],
        avatar: "https://i.pravatar.cc/120?img=32",
    },
    {
        id: "3",
        name: "Clean&Co",
        verified: false,
        rating: 4.7,
        reviewCount: 120,
        tags: ["Pembersihan Rumah", "Deep Cleaning"],
        summary: "Layanan bersih-bersih harian, mingguan, hingga deep cleaning pasca renovasi.",
        gallery: [
            { src: "https://picsum.photos/seed/c1/200/200", alt: "Pekerjaan 1" },
            { src: "https://picsum.photos/seed/c2/200/200", alt: "Pekerjaan 2" },
            { src: "https://picsum.photos/seed/c3/200/200", alt: "Pekerjaan 3" },
        ],
        avatar: "https://i.pravatar.cc/120?img=5",
    },
    {
        id: "4",
        name: "Jaya Plumbing",
        verified: true,
        rating: 4.6,
        reviewCount: 41,
        tags: ["Tukang Ledeng/Pipa", "Bongkar Pasang Wastafel"],
        summary: "Perbaikan kebocoran, ganti pipa, instalasi pompa air dan toren.",
        gallery: [
            { src: "https://picsum.photos/seed/d1/200/200", alt: "Pekerjaan 1" },
            { src: "https://picsum.photos/seed/d2/200/200", alt: "Pekerjaan 2" },
            { src: "https://picsum.photos/seed/d3/200/200", alt: "Pekerjaan 3" },
        ],
        avatar: "https://i.pravatar.cc/120?img=47",
    },
    {
        id: "5",
        name: "Sedot WC Barokah",
        verified: false,
        rating: 4.5,
        reviewCount: 33,
        tags: ["Sedot WC"],
        summary: "Sedot WC, pelancaran saluran mampet, dan pengurasan septic tank.",
        gallery: [
            { src: "https://picsum.photos/seed/e1/200/200", alt: "Pekerjaan 1" },
            { src: "https://picsum.photos/seed/e2/200/200", alt: "Pekerjaan 2" },
            { src: "https://picsum.photos/seed/e3/200/200", alt: "Pekerjaan 3" },
        ],
        avatar: "https://i.pravatar.cc/120?img=21",
    },
    {
        id: "6",
        name: "Green Yard",
        verified: true,
        rating: 4.8,
        reviewCount: 63,
        tags: ["Tukang Kebun", "Perawatan Taman"],
        summary: "Desain dan perawatan taman, pemangkasan, dan pemasangan rumput.",
        gallery: [
            { src: "https://picsum.photos/seed/f1/200/200", alt: "Pekerjaan 1" },
            { src: "https://picsum.photos/seed/f2/200/200", alt: "Pekerjaan 2" },
            { src: "https://picsum.photos/seed/f3/200/200", alt: "Pekerjaan 3" },
        ],
        avatar: "https://i.pravatar.cc/120?img=8",
    },
    {
        id: "7",
        name: "Karya Furnitur",
        verified: true,
        rating: 4.9,
        reviewCount: 85,
        tags: ["Mebel/Furnitur", "Custom Lemari"],
        summary: "Pembuatan dan perbaikan furnitur custom: lemari, kitchen set, meja belajar.",
        gallery: [
            { src: "https://picsum.photos/seed/g1/200/200", alt: "Pekerjaan 1" },
            { src: "https://picsum.photos/seed/g2/200/200", alt: "Pekerjaan 2" },
            { src: "https://picsum.photos/seed/g3/200/200", alt: "Pekerjaan 3" },
        ],
        avatar: "https://i.pravatar.cc/120?img=57",
    },
];
