-- ==========================================
-- SEED DATA FOR VENDORS
-- Based on existing dataVendor.ts
-- ==========================================

-- Insert Vendor 1: Edi Taulany Karya Baru (AC Specialist)
INSERT INTO "vendors" (
    "id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "reviewCount",
    "serviceAreas", "specialties", "tags", "category",
    "joinDate", "createdAt", "updatedAt"
) VALUES (
    '1',
    'edi.taulany@gmail.com',
    '$2a$10$dummy_hashed_password_edi12345',  -- Hash of 'edi12345'
    'Edi Taulany Karya Baru',
    '+6281234567890',
    'https://i.pravatar.cc/120?img=12',
    'Spesialis instalasi, perbaikan, dan perawatan AC rumah serta kantor. Menangani AC split, cassette, dan central dengan standar kerja rapi, cepat, dan bergaransi 30 hari. Pengalaman lebih dari 10 tahun dalam bidang AC.',
    true,
    'ACTIVE',
    0,
    0,
    ARRAY['Jakarta Barat', 'Jakarta Utara', 'Tangerang', 'Cirebon', 'Subang'],
    ARRAY['AC Split', 'AC Cassette', 'AC Central', 'Pembersihan AC', 'Perbaikan AC'],
    ARRAY['Tukang AC', 'Instalasi AC', 'Cuci AC'],
    'ac',
    '2023-01-15'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 1
INSERT INTO "services" ("id", "vendorId", "name", "description", "price", "priceType", "estimatedTime", "active", "createdAt", "updatedAt") VALUES
('1-1', '1', 'Instalasi AC Baru', 'Pemasangan AC split baru termasuk instalasi standar', 500000, 'FIXED', '3-4 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('1-2', '1', 'Perbaikan AC', 'Troubleshooting dan perbaikan AC tidak dingin', 150000, 'HOURLY', '2-3 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('1-3', '1', 'Cuci AC', 'Pembersihan dan perawatan AC rutin', 100000, 'UNIT', '1-2 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Vendor 2: Berkah Teknik Listrik
INSERT INTO "vendors" (
    "id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "reviewCount",
    "serviceAreas", "specialties", "tags", "category",
    "joinDate", "createdAt", "updatedAt"
) VALUES (
    '2',
    'berkah.listrik@gmail.com',
    '$2a$10$dummy_hashed_password_berkah12345',
    'Berkah Teknik Listrik',
    '+6282345678901',
    'https://i.pravatar.cc/120?img=32',
    'Layanan instalasi dan perapihan kabel, pemasangan MCB, penambahan titik listrik, hingga panel distribusi untuk rumah dan ruko. Fokus pada keamanan, kerapian, dan kepatuhan standar nasional. Berpengalaman lebih dari 8 tahun.',
    true,
    'ACTIVE',
    0,
    0,
    ARRAY['Jakarta Selatan', 'Depok', 'Bogor', 'Sukabumi', 'Cianjur'],
    ARRAY['Instalasi Listrik', 'Panel MCB', 'Wiring', 'Troubleshooting', 'Maintenance'],
    ARRAY['Tukang Listrik', 'Panel Listrik', 'Instalasi Rumah'],
    'electrical',
    '2023-03-20'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 2
INSERT INTO "services" ("id", "vendorId", "name", "description", "price", "priceType", "estimatedTime", "active", "createdAt", "updatedAt") VALUES
('2-1', '2', 'Instalasi Listrik Rumah', 'Instalasi listrik rumah baru standar nasional', 750000, 'FIXED', '1-2 hari', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2-2', '2', 'Perbaikan Instalasi', 'Troubleshooting dan perbaikan instalasi listrik', 200000, 'HOURLY', '3-4 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Vendor 3: Clean&Co
INSERT INTO "vendors" (
    "id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "reviewCount",
    "serviceAreas", "specialties", "tags", "category",
    "joinDate", "createdAt", "updatedAt"
) VALUES (
    '3',
    'info@cleanandco.com',
    '$2a$10$dummy_hashed_password_clean12345',
    'Clean&Co',
    '+6283456789012',
    'https://i.pravatar.cc/120?img=5',
    'Jasa kebersihan profesional untuk apartemen, rumah, dan kantor. Termasuk general cleaning, deep cleaning pasca renovasi, sanitasi kamar mandi, dan pembersihan sofa serta karpet. Tim profesional dan berpengalaman.',
    false,
    'ACTIVE',
    0,
    0,
    ARRAY['Jakarta Pusat', 'Bandung', 'Cimahi', 'Tasikmalaya', 'Garut'],
    ARRAY['General Cleaning', 'Deep Cleaning', 'Sofa Cleaning', 'Carpet Cleaning', 'Sanitasi'],
    ARRAY['Tukang Pembersihan Rumah', 'Deep Cleaning'],
    'cleaning',
    '2023-05-10'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 3
INSERT INTO "services" ("id", "vendorId", "name", "description", "price", "priceType", "estimatedTime", "active", "createdAt", "updatedAt") VALUES
('3-1', '3', 'General Cleaning', 'Pembersihan rumah standar 3 kamar', 300000, 'FIXED', '4-5 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('3-2', '3', 'Deep Cleaning', 'Pembersihan menyeluruh termasuk area sulit', 500000, 'FIXED', '6-8 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Vendor 4: Jaya Plumbing
INSERT INTO "vendors" (
    "id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "reviewCount",
    "serviceAreas", "specialties", "tags", "category",
    "joinDate", "createdAt", "updatedAt"
) VALUES (
    '4',
    'jaya.plumbing@gmail.com',
    '$2a$10$dummy_hashed_password_jaya12345',
    'Jaya Plumbing',
    '+6284567890123',
    'https://i.pravatar.cc/120?img=47',
    'Menangani bocor pipa, mampet, instalasi pompa air, wastafel, kloset, hingga toren. Respon cepat dengan diagnosa jelas sebelum pengerjaan dan hasil rapi tanpa banyak bongkar. Pengalaman 12 tahun.',
    true,
    'ACTIVE',
    0,
    0,
    ARRAY['Bekasi', 'Karawang', 'Cilegon', 'Serang', 'Pandeglang'],
    ARRAY['Perbaikan Pipa', 'Instalasi Wastafel', 'Pompa Air', 'Kloset', 'Toren'],
    ARRAY['Tukang Ledeng', 'Bongkar Pasang Wastafel', 'Perbaikan Kebocoran'],
    'plumbing',
    '2022-11-08'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 4
INSERT INTO "services" ("id", "vendorId", "name", "description", "price", "priceType", "estimatedTime", "active", "createdAt", "updatedAt") VALUES
('4-1', '4', 'Perbaikan Pipa Bocor', 'Perbaikan pipa air bocor termasuk material', 250000, 'FIXED', '2-3 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('4-2', '4', 'Instalasi Wastafel', 'Instalasi wastafel baru lengkap dengan sambungan', 400000, 'FIXED', '3-4 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Vendor 5: Sedot WC Barokah
INSERT INTO "vendors" (
    "id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "reviewCount",
    "serviceAreas", "specialties", "tags", "category",
    "joinDate", "createdAt", "updatedAt"
) VALUES (
    '5',
    'sedot.barokah@gmail.com',
    '$2a$10$dummy_hashed_password_barokah12345',
    'Sedot WC Barokah',
    '+6285678901234',
    'https://i.pravatar.cc/120?img=21',
    'Layanan sedot WC dan saluran mampet dengan armada siap panggil. Menjaga area kerja tetap bersih, proses cepat, dan transparan dalam estimasi biaya. Siap 24 jam.',
    false,
    'ACTIVE',
    0,
    0,
    ARRAY['Semarang', 'Solo', 'Magelang', 'Salatiga', 'Purwokerto'],
    ARRAY['Sedot WC', 'Saluran Mampet', 'Septic Tank', 'Emergency Service'],
    ARRAY['Tukang Sedot WC', 'Saluran Mampet'],
    'sedot-wc',
    '2023-07-22'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 5
INSERT INTO "services" ("id", "vendorId", "name", "description", "price", "priceType", "estimatedTime", "active", "createdAt", "updatedAt") VALUES
('5-1', '5', 'Sedot WC Reguler', 'Penyedotan septic tank kapasitas standar', 350000, 'FIXED', '1-2 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Vendor 6: Green Yard
INSERT INTO "vendors" (
    "id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "reviewCount",
    "serviceAreas", "specialties", "tags", "category",
    "joinDate", "createdAt", "updatedAt"
) VALUES (
    '6',
    'greenyard@gmail.com',
    '$2a$10$dummy_hashed_password_green12345',
    'Green Yard',
    '+6286789012345',
    'https://i.pravatar.cc/120?img=8',
    'Layanan penataan taman minimalis, vertical garden, pemangkasan pohon, hingga perawatan rumput rutin. Menghadirkan ruang hijau estetik dan fungsional untuk rumah dan kantor. Ahli landscape sejak 2020.',
    true,
    'ACTIVE',
    0,
    0,
    ARRAY['Yogyakarta', 'Bantul', 'Sleman', 'Magelang', 'Klaten'],
    ARRAY['Landscape Design', 'Vertical Garden', 'Pemangkasan', 'Perawatan Taman', 'Taman Minimalis'],
    ARRAY['Tukang Kebun', 'Perawatan Taman', 'Desain Landscape'],
    'garden',
    '2023-02-14'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 6
INSERT INTO "services" ("id", "vendorId", "name", "description", "price", "priceType", "estimatedTime", "active", "createdAt", "updatedAt") VALUES
('6-1', '6', 'Perawatan Taman Bulanan', 'Perawatan taman termasuk pemangkasan dan pemupukan', 400000, 'FIXED', '2-3 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Vendor 7: Karya Furnitur
INSERT INTO "vendors" (
    "id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "reviewCount",
    "serviceAreas", "specialties", "tags", "category",
    "joinDate", "createdAt", "updatedAt"
) VALUES (
    '7',
    'karya.furnitur@gmail.com',
    '$2a$10$dummy_hashed_password_karya12345',
    'Karya Furnitur',
    '+6287890123456',
    'https://i.pravatar.cc/120?img=57',
    'Workshop furnitur custom untuk lemari, kitchen set, rak TV, dan meja kerja. Menggunakan material pilihan dengan finishing rapi dan desain menyesuaikan kebutuhan ruangan. Workshop sejak 2018.',
    true,
    'ACTIVE',
    0,
    0,
    ARRAY['Surabaya', 'Sidoarjo', 'Gresik', 'Mojokerto', 'Pasuruan'],
    ARRAY['Kitchen Set', 'Lemari Custom', 'Meja Kerja', 'Rak TV', 'Furniture Design'],
    ARRAY['Tukang Mebel', 'Custom Lemari', 'Kitchen Set'],
    'furniture',
    '2022-09-05'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 7
INSERT INTO "services" ("id", "vendorId", "name", "description", "price", "priceType", "estimatedTime", "active", "createdAt", "updatedAt") VALUES
('7-1', '7', 'Kitchen Set Custom', 'Pembuatan kitchen set custom sesuai ukuran', 2500000, 'FIXED', '7-10 hari', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- IMPORTANT NOTES
-- ==========================================
-- 1. All passwords above are dummy hashed values
-- 2. In production, use bcrypt to hash actual passwords:
--    Example in Node.js: await bcrypt.hash('password', 10)
-- 3. Replace all dummy hashes before going to production
-- 4. Keep original passwords documented separately for testing
