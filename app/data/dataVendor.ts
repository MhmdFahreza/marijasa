// app/data/dataVendor.ts
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
        gallery: [],
        avatar: "https://i.pravatar.cc/120?img=12",
        serviceAreas: ["Jakarta Barat", "Jakarta Utara", "Tangerang", "Cirebon", "Subang"],
        phone: "+6281234567890",
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
        gallery: [],
        avatar: "https://i.pravatar.cc/120?img=32",
        serviceAreas: ["Jakarta Selatan", "Depok", "Bogor", "Sukabumi", "Cianjur"],
        phone: "+6282345678901",
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
        gallery: [],
        avatar: "https://i.pravatar.cc/120?img=5",
        serviceAreas: ["Jakarta Pusat", "Bandung", "Cimahi", "Tasikmalaya", "Garut"],
        phone: "+6283456789012",
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
        gallery: [],
        avatar: "https://i.pravatar.cc/120?img=47",
        serviceAreas: ["Bekasi", "Karawang", "Cilegon", "Serang", "Pandeglang"],
        phone: "+6284567890123",
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
        gallery: [],
        avatar: "https://i.pravatar.cc/120?img=21",
        serviceAreas: ["Semarang", "Solo", "Magelang", "Salatiga", "Purwokerto"],
        phone: "+6285678901234",
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
        gallery: [],
        avatar: "https://i.pravatar.cc/120?img=8",
        serviceAreas: ["Yogyakarta", "Bantul", "Sleman", "Magelang", "Klaten"],
        phone: "+6286789012345",
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
        gallery: [],
        avatar: "https://i.pravatar.cc/120?img=57",
        serviceAreas: ["Surabaya", "Sidoarjo", "Gresik", "Mojokerto", "Pasuruan"],
        phone: "+6287890123456",
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

// Helper function to get vendor by ID with memory sync
export const getVendorById = (id: string) => {
    // PRIORITAS 1: Cek localStorage mitraUser (untuk vendor yang sedang login)
    if (typeof window !== 'undefined') {
        try {
            const mitraUser = localStorage.getItem('mitraUser');
            if (mitraUser) {
                const parsedMitra = JSON.parse(mitraUser);
                if (parsedMitra.id === id) {
                    return parsedMitra;
                }
            }
        } catch (e) {
            console.error('Error parsing mitraUser:', e);
        }
    }

    // PRIORITAS 2: Cek sessionStorage updatedVendorsData
    if (typeof window !== 'undefined') {
        try {
            const updatedVendorsData = sessionStorage.getItem('updatedVendorsData');
            if (updatedVendorsData) {
                const updatedVendors = JSON.parse(updatedVendorsData);
                const updatedVendor = updatedVendors[id];
                if (updatedVendor) {
                    return updatedVendor;
                }
            }
        } catch (e) {
            console.error('Error parsing updated vendors data:', e);
        }
    }
    
    // PRIORITAS 3: Fallback ke data original
    return Vendors.find(vendor => vendor.id === id);
};

// Helper function to get all vendors with memory sync
export const getAllVendors = () => {
    if (typeof window !== 'undefined') {
        try {
            // Ambil mitraUser dari localStorage
            const mitraUser = localStorage.getItem('mitraUser');
            let mitraData: any = null;
            if (mitraUser) {
                mitraData = JSON.parse(mitraUser);
            }

            // Ambil updated vendors dari sessionStorage
            const updatedVendorsData = sessionStorage.getItem('updatedVendorsData');
            let updatedVendors: Record<string, any> = {};
            if (updatedVendorsData) {
                updatedVendors = JSON.parse(updatedVendorsData);
            }

            // Merge data: prioritaskan mitraUser untuk vendor yang sedang login
            return Vendors.map(vendor => {
                // Jika ini vendor yang sedang login, gunakan data dari localStorage
                if (mitraData && mitraData.id === vendor.id) {
                    return { ...vendor, ...mitraData };
                }
                
                // Jika ada update di sessionStorage, gunakan itu
                const updated = updatedVendors[vendor.id];
                if (updated) {
                    return { ...vendor, ...updated };
                }
                
                // Fallback ke data original
                return vendor;
            });
        } catch (e) {
            console.error('Error in getAllVendors:', e);
        }
    }
    return Vendors;
};

// Helper function to update vendor data
export const updateVendorData = (vendorId: string, updates: Partial<Vendor>) => {
    if (typeof window !== 'undefined') {
        try {
            // Update sessionStorage
            const updatedVendorsData = sessionStorage.getItem('updatedVendorsData');
            const updatedVendors: Record<string, any> = updatedVendorsData ? JSON.parse(updatedVendorsData) : {};
            
            const currentVendor = getVendorById(vendorId);
            
            updatedVendors[vendorId] = {
                ...currentVendor,
                ...updates
            };
            
            sessionStorage.setItem('updatedVendorsData', JSON.stringify(updatedVendors));
            
            // Update localStorage jika ini vendor yang sedang login
            const mitraUser = localStorage.getItem('mitraUser');
            if (mitraUser) {
                const parsedMitra = JSON.parse(mitraUser);
                if (parsedMitra.id === vendorId) {
                    const updatedMitra = {
                        ...parsedMitra,
                        ...updates
                    };
                    localStorage.setItem('mitraUser', JSON.stringify(updatedMitra));
                }
            }
            
            // Trigger custom event
            const event = new CustomEvent('vendorDataUpdated', {
                detail: { vendorId, updates }
            });
            window.dispatchEvent(event);
            
            return true;
        } catch (e) {
            console.error('Error updating vendor data:', e);
            return false;
        }
    }
    return false;
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

    return "ac"; 
};