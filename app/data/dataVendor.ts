import { Vendor } from "../components/ui/vendor-card";

export const Vendors: Vendor[] = [
    {
        id: "1",
        name: "Edi Taulany Karya Baru",
        verified: true,
        rating: 4.3,
        reviewCount: 74,
        tags: ["Tukang AC", "Instalasi AC", "Cuci AC"],
        summary:
            "Spesialis instalasi, perbaikan, dan perawatan AC rumah serta kantor. Menangani AC split, cassette, dan central dengan standar kerja rapi, cepat, dan bergaransi 30 hari.",
        gallery: [
            { src: "https://picsum.photos/seed/a1/200/200", alt: "Instalasi AC di ruang tamu" },
            { src: "https://picsum.photos/seed/a2/200/200", alt: "Servis AC kantor" },
            { src: "https://picsum.photos/seed/a3/200/200", alt: "Pembersihan unit outdoor" },
            { src: "https://picsum.photos/seed/a4/200/200", alt: "Pengecekan tekanan freon" },
        ],
        avatar: "https://i.pravatar.cc/120?img=12",
        serviceAreas: ["Jakarta Barat", "Jakarta Utara", "Tangerang", "Cirebon", "Subang"],
        phone: "+6281234567890",
        // Login credentials
        email: "edi.taulany@gmail.com",
        password: "edi12345",
        description: "Spesialis instalasi, perbaikan, dan perawatan AC rumah serta kantor. Menangani AC split, cassette, dan central dengan standar kerja rapi, cepat, dan bergaransi 30 hari. Pengalaman lebih dari 10 tahun dalam bidang AC.",
        joinDate: "2023-01-15",
        specialties: ["AC Split", "AC Cassette", "AC Central", "Pembersihan AC", "Perbaikan AC"],
        services: [
            {
                id: "1",
                name: "Instalasi AC Baru",
                price: 500000,
                priceType: "fixed",
                description: "Pemasangan AC split baru termasuk instalasi standar",
                active: true,
                estimatedTime: "3-4 jam"
            },
            {
                id: "2",
                name: "Perbaikan AC",
                price: 150000,
                priceType: "hourly",
                description: "Troubleshooting dan perbaikan AC tidak dingin",
                active: true,
                estimatedTime: "2-3 jam"
            },
            {
                id: "3",
                name: "Cuci AC",
                price: 100000,
                priceType: "unit",
                description: "Pembersihan dan perawatan AC rutin",
                active: true,
                estimatedTime: "1-2 jam"
            }
        ]
    },
    {
        id: "2",
        name: "Berkah Teknik Listrik",
        verified: true,
        rating: 4.7,
        reviewCount: 89,
        tags: ["Tukang Listrik", "Panel Listrik", "Instalasi Rumah"],
        summary:
            "Layanan instalasi dan perapihan kabel, pemasangan MCB, penambahan titik listrik, hingga panel distribusi untuk rumah dan ruko. Fokus pada keamanan, kerapian, dan kepatuhan standar nasional.",
        gallery: [
            { src: "https://picsum.photos/seed/b1/200/200", alt: "Pemasangan panel listrik" },
            { src: "https://picsum.photos/seed/b2/200/200", alt: "Penataan kabel di dinding" },
            { src: "https://picsum.photos/seed/b3/200/200", alt: "Pengecekan instalasi listrik" },
        ],
        avatar: "https://i.pravatar.cc/120?img=32",
        serviceAreas: ["Jakarta Selatan", "Depok", "Bogor", "Sukabumi", "Cianjur"],
        phone: "+6282345678901",
        // Login credentials
        email: "berkah.listrik@gmail.com",
        password: "berkah12345",
        description: "Layanan instalasi dan perapihan kabel, pemasangan MCB, penambahan titik listrik, hingga panel distribusi untuk rumah dan ruko. Fokus pada keamanan, kerapian, dan kepatuhan standar nasional. Berpengalaman lebih dari 8 tahun.",
        joinDate: "2023-03-20",
        specialties: ["Instalasi Listrik", "Panel MCB", "Wiring", "Troubleshooting", "Maintenance"],
        services: [
            {
                id: "1",
                name: "Instalasi Listrik Rumah",
                price: 750000,
                priceType: "fixed",
                description: "Instalasi listrik rumah baru standar nasional",
                active: true,
                estimatedTime: "1-2 hari"
            },
            {
                id: "2",
                name: "Perbaikan Instalasi",
                price: 200000,
                priceType: "hourly",
                description: "Troubleshooting dan perbaikan instalasi listrik",
                active: true,
                estimatedTime: "3-4 jam"
            }
        ]
    },
    {
        id: "3",
        name: "Clean&Co",
        verified: false,
        rating: 4.2,
        reviewCount: 56,
        tags: ["Tukang Pembersihan Rumah", "Deep Cleaning"],
        summary:
            "Jasa kebersihan profesional untuk apartemen, rumah, dan kantor. Termasuk general cleaning, deep cleaning pasca renovasi, sanitasi kamar mandi, dan pembersihan sofa serta karpet.",
        gallery: [
            { src: "https://picsum.photos/seed/c1/200/200", alt: "Pembersihan ruang keluarga" },
            { src: "https://picsum.photos/seed/c2/200/200", alt: "Tim membersihkan dapur" },
            { src: "https://picsum.photos/seed/c3/200/200", alt: "Vacuum karpet profesional" },
        ],
        avatar: "https://i.pravatar.cc/120?img=5",
        serviceAreas: ["Jakarta Pusat", "Bandung", "Cimahi", "Tasikmalaya", "Garut"],
        phone: "+6283456789012",
        // Login credentials
        email: "info@cleanandco.com",
        password: "clean12345",
        description: "Jasa kebersihan profesional untuk apartemen, rumah, dan kantor. Termasuk general cleaning, deep cleaning pasca renovasi, sanitasi kamar mandi, dan pembersihan sofa serta karpet. Tim profesional dan berpengalaman.",
        joinDate: "2023-05-10",
        specialties: ["General Cleaning", "Deep Cleaning", "Sofa Cleaning", "Carpet Cleaning", "Sanitasi"],
        services: [
            {
                id: "1",
                name: "General Cleaning",
                price: 300000,
                priceType: "fixed",
                description: "Pembersihan rumah standar 3 kamar",
                active: true,
                estimatedTime: "4-5 jam"
            },
            {
                id: "2",
                name: "Deep Cleaning",
                price: 500000,
                priceType: "fixed",
                description: "Pembersihan menyeluruh termasuk area sulit",
                active: true,
                estimatedTime: "6-8 jam"
            }
        ]
    },
    {
        id: "4",
        name: "Jaya Plumbing",
        verified: true,
        rating: 4.8,
        reviewCount: 112,
        tags: ["Tukang Ledeng", "Bongkar Pasang Wastafel", "Perbaikan Kebocoran"],
        summary:
            "Menangani bocor pipa, mampet, instalasi pompa air, wastafel, kloset, hingga toren. Respon cepat dengan diagnosa jelas sebelum pengerjaan dan hasil rapi tanpa banyak bongkar.",
        gallery: [
            { src: "https://picsum.photos/seed/d1/200/200", alt: "Perbaikan pipa bocor" },
            { src: "https://picsum.photos/seed/d2/200/200", alt: "Instalasi wastafel baru" },
            { src: "https://picsum.photos/seed/d3/200/200", alt: "Pemasangan pompa air" },
        ],
        avatar: "https://i.pravatar.cc/120?img=47",
        serviceAreas: ["Bekasi", "Karawang", "Cilegon", "Serang", "Pandeglang"],
        phone: "+6284567890123",
        // Login credentials
        email: "jaya.plumbing@gmail.com",
        password: "jaya12345",
        description: "Menangani bocor pipa, mampet, instalasi pompa air, wastafel, kloset, hingga toren. Respon cepat dengan diagnosa jelas sebelum pengerjaan dan hasil rapi tanpa banyak bongkar. Pengalaman 12 tahun.",
        joinDate: "2022-11-08",
        specialties: ["Perbaikan Pipa", "Instalasi Wastafel", "Pompa Air", "Kloset", "Toren"],
        services: [
            {
                id: "1",
                name: "Perbaikan Pipa Bocor",
                price: 250000,
                priceType: "fixed",
                description: "Perbaikan pipa air bocor termasuk material",
                active: true,
                estimatedTime: "2-3 jam"
            },
            {
                id: "2",
                name: "Instalasi Wastafel",
                price: 400000,
                priceType: "fixed",
                description: "Instalasi wastafel baru lengkap dengan sambungan",
                active: true,
                estimatedTime: "3-4 jam"
            }
        ]
    },
    {
        id: "5",
        name: "Sedot WC Barokah",
        verified: false,
        rating: 4.1,
        reviewCount: 42,
        tags: ["Tukang Sedot WC", "Saluran Mampet"],
        summary:
            "Layanan sedot WC dan saluran mampet dengan armada siap panggil. Menjaga area kerja tetap bersih, proses cepat, dan transparan dalam estimasi biaya.",
        gallery: [
            { src: "https://picsum.photos/seed/e1/200/200", alt: "Armada sedot WC" },
            { src: "https://picsum.photos/seed/e2/200/200", alt: "Penanganan saluran mampet" },
            { src: "https://picsum.photos/seed/e3/200/200", alt: "Peralatan sedot profesional" },
        ],
        avatar: "https://i.pravatar.cc/120?img=21",
        serviceAreas: ["Semarang", "Solo", "Magelang", "Salatiga", "Purwokerto"],
        phone: "+6285678901234",
        // Login credentials
        email: "sedot.barokah@gmail.com",
        password: "barokah12345",
        description: "Layanan sedot WC dan saluran mampet dengan armada siap panggil. Menjaga area kerja tetap bersih, proses cepat, dan transparan dalam estimasi biaya. Siap 24 jam.",
        joinDate: "2023-07-22",
        specialties: ["Sedot WC", "Saluran Mampet", "Septic Tank", "Emergency Service"],
        services: [
            {
                id: "1",
                name: "Sedot WC Reguler",
                price: 350000,
                priceType: "fixed",
                description: "Penyedotan septic tank kapasitas standar",
                active: true,
                estimatedTime: "1-2 jam"
            }
        ]
    },
    {
        id: "6",
        name: "Green Yard",
        verified: true,
        rating: 4.9,
        reviewCount: 93,
        tags: ["Tukang Kebun", "Perawatan Taman", "Desain Landscape"],
        summary:
            "Layanan penataan taman minimalis, vertical garden, pemangkasan pohon, hingga perawatan rumput rutin. Menghadirkan ruang hijau estetik dan fungsional untuk rumah dan kantor.",
        gallery: [
            { src: "https://picsum.photos/seed/f1/200/200", alt: "Taman rumah minimalis" },
            { src: "https://picsum.photos/seed/f2/200/200", alt: "Pemangkasan tanaman hias" },
            { src: "https://picsum.photos/seed/f3/200/200", alt: "Penataan landscape halaman" },
        ],
        avatar: "https://i.pravatar.cc/120?img=8",
        serviceAreas: ["Yogyakarta", "Bantul", "Sleman", "Magelang", "Klaten"],
        phone: "+6286789012345",
        // Login credentials
        email: "greenyard@gmail.com",
        password: "green12345",
        description: "Layanan penataan taman minimalis, vertical garden, pemangkasan pohon, hingga perawatan rumput rutin. Menghadirkan ruang hijau estetik dan fungsional untuk rumah dan kantor. Ahli landscape sejak 2020.",
        joinDate: "2023-02-14",
        specialties: ["Landscape Design", "Vertical Garden", "Pemangkasan", "Perawatan Taman", "Taman Minimalis"],
        services: [
            {
                id: "1",
                name: "Perawatan Taman Bulanan",
                price: 400000,
                priceType: "fixed",
                description: "Perawatan taman termasuk pemangkasan dan pemupukan",
                active: true,
                estimatedTime: "2-3 jam"
            }
        ]
    },
    {
        id: "7",
        name: "Karya Furnitur",
        verified: true,
        rating: 4.6,
        reviewCount: 67,
        tags: ["Tukang Mebel", "Custom Lemari", "Kitchen Set"],
        summary:
            "Workshop furnitur custom untuk lemari, kitchen set, rak TV, dan meja kerja. Menggunakan material pilihan dengan finishing rapi dan desain menyesuaikan kebutuhan ruangan.",
        gallery: [
            { src: "https://picsum.photos/seed/g1/200/200", alt: "Lemari custom built-in" },
            { src: "https://picsum.photos/seed/g2/200/200", alt: "Kitchen set minimalis" },
            { src: "https://picsum.photos/seed/g3/200/200", alt: "Meja kerja custom" },
        ],
        avatar: "https://i.pravatar.cc/120?img=57",
        serviceAreas: ["Surabaya", "Sidoarjo", "Gresik", "Mojokerto", "Pasuruan"],
        phone: "+6287890123456",
        // Login credentials
        email: "karya.furnitur@gmail.com",
        password: "karya12345",
        description: "Workshop furnitur custom untuk lemari, kitchen set, rak TV, dan meja kerja. Menggunakan material pilihan dengan finishing rapi dan desain menyesuaikan kebutuhan ruangan. Workshop sejak 2018.",
        joinDate: "2022-09-05",
        specialties: ["Kitchen Set", "Lemari Custom", "Meja Kerja", "Rak TV", "Furniture Design"],
        services: [
            {
                id: "1",
                name: "Kitchen Set Custom",
                price: 2500000,
                priceType: "fixed",
                description: "Pembuatan kitchen set custom sesuai ukuran",
                active: true,
                estimatedTime: "7-10 hari"
            }
        ]
    },
];

// Helper function to find vendor by email
export const findVendorByEmail = (email: string) => {
    return Vendors.find(vendor => vendor.email === email);
};

// Helper function to validate vendor login
export const validateVendorLogin = (email: string, password: string) => {
    const vendor = findVendorByEmail(email);
    if (vendor && vendor.password === password) {
        return vendor;
    }
    return null;
};

// Helper function to get all vendor data
export const getVendorById = (id: string) => {
    return Vendors.find(vendor => vendor.id === id);
};

// Helper function to get category from tags
export const getCategoryFromTags = (tags: string[]): string => {
    const tagToCategory: Record<string, string> = {
        "Tukang AC": "ac",
        "Instalasi AC": "ac",
        "Cuci AC": "ac",
        "Tukang Listrik": "electrical",
        "Panel Listrik": "electrical",
        "Instalasi Rumah": "electrical",
        "Tukang Pembersihan Rumah": "cleaning",
        "Deep Cleaning": "cleaning",
        "Tukang Ledeng": "plumbing",
        "Bongkar Pasang Wastafel": "plumbing",
        "Perbaikan Kebocoran": "plumbing",
        "Tukang Sedot WC": "sedot-wc",
        "Saluran Mampet": "sedot-wc",
        "Tukang Kebun": "garden",
        "Perawatan Taman": "garden",
        "Desain Landscape": "garden",
        "Tukang Mebel": "furniture",
        "Custom Lemari": "furniture",
        "Kitchen Set": "furniture"
    };

    for (const tag of tags) {
        if (tagToCategory[tag]) {
            return tagToCategory[tag];
        }
    }

    return "ac"; // default category
};