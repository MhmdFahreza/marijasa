-- seed-master-data.sql
-- Seed Categories
INSERT INTO categories (category_id, slug, name, description, sort_order, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'listrik', 'Tukang Listrik', 'Jasa instalasi dan perbaikan listrik', 1, true, now(), now()),
(gen_random_uuid(), 'ac', 'Tukang AC', 'Jasa service dan instalasi AC', 2, true, now(), now()),
(gen_random_uuid(), 'pembersihanrumah', 'Tukang Pembersihan Rumah', 'Jasa kebersihan dan pembersihan rumah', 3, true, now(), now()),
(gen_random_uuid(), 'ledeng', 'Tukang Ledeng', 'Jasa perbaikan pipa dan ledeng', 4, true, now(), now()),
(gen_random_uuid(), 'sedotwc', 'Tukang Sedot WC', 'Jasa sedot WC dan septic tank', 5, true, now(), now()),
(gen_random_uuid(), 'kebun', 'Tukang Kebun', 'Jasa perawatan taman dan kebun', 6, true, now(), now()),
(gen_random_uuid(), 'furnitur', 'Tukang Mebel', 'Jasa pembuatan dan perbaikan mebel', 7, true, now(), now())
ON CONFLICT (slug) DO NOTHING;

-- Seed Cities (Indonesia Major Cities)
INSERT INTO cities (city_id, name, province, sort_order, is_active, created_at, updated_at) VALUES
-- A
(gen_random_uuid(), 'Aceh Barat', 'Aceh', 0, true, now(), now()),
(gen_random_uuid(), 'Aceh Besar', 'Aceh', 0, true, now(), now()),
(gen_random_uuid(), 'Agam', 'Sumatera Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Ambon', 'Maluku', 0, true, now(), now()),
-- B
(gen_random_uuid(), 'Badung', 'Bali', 0, true, now(), now()),
(gen_random_uuid(), 'Balikpapan', 'Kalimantan Timur', 10, true, now(), now()),
(gen_random_uuid(), 'Banda Aceh', 'Aceh', 0, true, now(), now()),
(gen_random_uuid(), 'Bandar Lampung', 'Lampung', 15, true, now(), now()),
(gen_random_uuid(), 'Bandung', 'Jawa Barat', 20, true, now(), now()),
(gen_random_uuid(), 'Bandung Barat', 'Jawa Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Banjar', 'Jawa Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Banjarbaru', 'Kalimantan Selatan', 0, true, now(), now()),
(gen_random_uuid(), 'Banjarmasin', 'Kalimantan Selatan', 25, true, now(), now()),
(gen_random_uuid(), 'Banyumas', 'Jawa Tengah', 0, true, now(), now()),
(gen_random_uuid(), 'Banyuwangi', 'Jawa Timur', 0, true, now(), now()),
(gen_random_uuid(), 'Batam', 'Kepulauan Riau', 30, true, now(), now()),
(gen_random_uuid(), 'Batu', 'Jawa Timur', 0, true, now(), now()),
(gen_random_uuid(), 'Bekasi', 'Jawa Barat', 35, true, now(), now()),
(gen_random_uuid(), 'Bengkulu', 'Bengkulu', 0, true, now(), now()),
(gen_random_uuid(), 'Bitung', 'Sulawesi Utara', 0, true, now(), now()),
(gen_random_uuid(), 'Blitar', 'Jawa Timur', 0, true, now(), now()),
(gen_random_uuid(), 'Bogor', 'Jawa Barat', 40, true, now(), now()),
(gen_random_uuid(), 'Bojonegoro', 'Jawa Timur', 0, true, now(), now()),
(gen_random_uuid(), 'Bontang', 'Kalimantan Timur', 0, true, now(), now()),
(gen_random_uuid(), 'Bukittinggi', 'Sumatera Barat', 0, true, now(), now()),
-- C
(gen_random_uuid(), 'Ciamis', 'Jawa Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Cianjur', 'Jawa Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Cilacap', 'Jawa Tengah', 0, true, now(), now()),
(gen_random_uuid(), 'Cilegon', 'Banten', 0, true, now(), now()),
(gen_random_uuid(), 'Cimahi', 'Jawa Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Cirebon', 'Jawa Barat', 45, true, now(), now()),
-- D
(gen_random_uuid(), 'Demak', 'Jawa Tengah', 0, true, now(), now()),
(gen_random_uuid(), 'Denpasar', 'Bali', 50, true, now(), now()),
(gen_random_uuid(), 'Depok', 'Jawa Barat', 55, true, now(), now()),
(gen_random_uuid(), 'Dumai', 'Riau', 0, true, now(), now()),
-- G
(gen_random_uuid(), 'Garut', 'Jawa Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Gorontalo', 'Gorontalo', 0, true, now(), now()),
(gen_random_uuid(), 'Gresik', 'Jawa Timur', 0, true, now(), now()),
-- I
(gen_random_uuid(), 'Indramayu', 'Jawa Barat', 0, true, now(), now()),
-- J
(gen_random_uuid(), 'Jakarta Barat', 'DKI Jakarta', 60, true, now(), now()),
(gen_random_uuid(), 'Jakarta Pusat', 'DKI Jakarta', 61, true, now(), now()),
(gen_random_uuid(), 'Jakarta Selatan', 'DKI Jakarta', 62, true, now(), now()),
(gen_random_uuid(), 'Jakarta Timur', 'DKI Jakarta', 63, true, now(), now()),
(gen_random_uuid(), 'Jakarta Utara', 'DKI Jakarta', 64, true, now(), now()),
(gen_random_uuid(), 'Jambi', 'Jambi', 0, true, now(), now()),
(gen_random_uuid(), 'Jayapura', 'Papua', 0, true, now(), now()),
(gen_random_uuid(), 'Jember', 'Jawa Timur', 0, true, now(), now()),
(gen_random_uuid(), 'Jepara', 'Jawa Tengah', 0, true, now(), now()),
-- K
(gen_random_uuid(), 'Karawang', 'Jawa Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Kediri', 'Jawa Timur', 0, true, now(), now()),
(gen_random_uuid(), 'Kendari', 'Sulawesi Tenggara', 0, true, now(), now()),
(gen_random_uuid(), 'Kupang', 'Nusa Tenggara Timur', 0, true, now(), now()),
-- L
(gen_random_uuid(), 'Lampung Selatan', 'Lampung', 0, true, now(), now()),
(gen_random_uuid(), 'Lombok Barat', 'Nusa Tenggara Barat', 0, true, now(), now()),
-- M
(gen_random_uuid(), 'Madiun', 'Jawa Timur', 0, true, now(), now()),
(gen_random_uuid(), 'Magelang', 'Jawa Tengah', 0, true, now(), now()),
(gen_random_uuid(), 'Makassar', 'Sulawesi Selatan', 70, true, now(), now()),
(gen_random_uuid(), 'Malang', 'Jawa Timur', 75, true, now(), now()),
(gen_random_uuid(), 'Manado', 'Sulawesi Utara', 80, true, now(), now()),
(gen_random_uuid(), 'Mataram', 'Nusa Tenggara Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Medan', 'Sumatera Utara', 85, true, now(), now()),
-- P
(gen_random_uuid(), 'Padang', 'Sumatera Barat', 90, true, now(), now()),
(gen_random_uuid(), 'Palangkaraya', 'Kalimantan Tengah', 0, true, now(), now()),
(gen_random_uuid(), 'Palembang', 'Sumatera Selatan', 95, true, now(), now()),
(gen_random_uuid(), 'Palu', 'Sulawesi Tengah', 0, true, now(), now()),
(gen_random_uuid(), 'Pasuruan', 'Jawa Timur', 0, true, now(), now()),
(gen_random_uuid(), 'Pekalongan', 'Jawa Tengah', 0, true, now(), now()),
(gen_random_uuid(), 'Pekanbaru', 'Riau', 100, true, now(), now()),
(gen_random_uuid(), 'Pontianak', 'Kalimantan Barat', 105, true, now(), now()),
(gen_random_uuid(), 'Probolinggo', 'Jawa Timur', 0, true, now(), now()),
(gen_random_uuid(), 'Purwokerto', 'Jawa Tengah', 0, true, now(), now()),
-- S
(gen_random_uuid(), 'Salatiga', 'Jawa Tengah', 0, true, now(), now()),
(gen_random_uuid(), 'Samarinda', 'Kalimantan Timur', 110, true, now(), now()),
(gen_random_uuid(), 'Semarang', 'Jawa Tengah', 115, true, now(), now()),
(gen_random_uuid(), 'Serang', 'Banten', 0, true, now(), now()),
(gen_random_uuid(), 'Sidoarjo', 'Jawa Timur', 0, true, now(), now()),
(gen_random_uuid(), 'Solo', 'Jawa Tengah', 120, true, now(), now()),
(gen_random_uuid(), 'Sorong', 'Papua Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Subang', 'Jawa Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Sukabumi', 'Jawa Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Sumedang', 'Jawa Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Surabaya', 'Jawa Timur', 125, true, now(), now()),
(gen_random_uuid(), 'Surakarta', 'Jawa Tengah', 0, true, now(), now()),
-- T
(gen_random_uuid(), 'Tangerang', 'Banten', 130, true, now(), now()),
(gen_random_uuid(), 'Tangerang Selatan', 'Banten', 135, true, now(), now()),
(gen_random_uuid(), 'Tanjungpinang', 'Kepulauan Riau', 0, true, now(), now()),
(gen_random_uuid(), 'Tarakan', 'Kalimantan Utara', 0, true, now(), now()),
(gen_random_uuid(), 'Tasikmalaya', 'Jawa Barat', 0, true, now(), now()),
(gen_random_uuid(), 'Tegal', 'Jawa Tengah', 0, true, now(), now()),
(gen_random_uuid(), 'Ternate', 'Maluku Utara', 0, true, now(), now()),
-- Y
(gen_random_uuid(), 'Yogyakarta', 'DI Yogyakarta', 140, true, now(), now())
ON CONFLICT (name) DO NOTHING;