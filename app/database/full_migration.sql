-- ==========================================
-- MARIJASA DATABASE - FULL MIGRATION + SEED
-- Run this single file to setup entire database
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- STEP 1: DROP ALL EXISTING OBJECTS
-- ==========================================

-- Drop triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
DROP TRIGGER IF EXISTS update_admins_updated_at ON "admins";
DROP TRIGGER IF EXISTS update_vendors_updated_at ON "vendors";
DROP TRIGGER IF EXISTS update_services_updated_at ON "services";
DROP TRIGGER IF EXISTS update_bookings_updated_at ON "bookings";
DROP TRIGGER IF EXISTS update_reviews_updated_at ON "reviews";
DROP TRIGGER IF EXISTS update_vendor_rating_trigger ON "reviews";
DROP TRIGGER IF EXISTS update_vendor_rating_on_delete_trigger ON "reviews";

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_vendor_rating() CASCADE;
DROP FUNCTION IF EXISTS update_vendor_rating_on_delete() CASCADE;

-- Drop tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS "booking_items" CASCADE;
DROP TABLE IF EXISTS "reviews" CASCADE;
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "vendor_gallery" CASCADE;
DROP TABLE IF EXISTS "services" CASCADE;
DROP TABLE IF EXISTS "vendors" CASCADE;
DROP TABLE IF EXISTS "admins" CASCADE;
DROP TABLE IF EXISTS "otp_codes" CASCADE;
DROP TABLE IF EXISTS "verification_tokens" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop ENUM types
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "VendorStatus" CASCADE;
DROP TYPE IF EXISTS "ServicePriceType" CASCADE;
DROP TYPE IF EXISTS "BookingStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
DROP TYPE IF EXISTS "OTPType" CASCADE;

-- ==========================================
-- STEP 2: CREATE ENUM TYPES
-- ==========================================
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "VendorStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');
CREATE TYPE "ServicePriceType" AS ENUM ('FIXED', 'HOURLY', 'UNIT');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "OTPType" AS ENUM ('REGISTER', 'LOGIN', 'RESET_PASSWORD');

-- ==========================================
-- STEP 3: CREATE ALL TABLES
-- ==========================================

-- USERS TABLE
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT,
    "avatar" TEXT DEFAULT '/profile.svg',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- ACCOUNTS TABLE (NextAuth)
CREATE TABLE "accounts" (
    "account_id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "accounts_provider_provider_account_id_key" UNIQUE ("provider", "provider_account_id")
);

CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- SESSIONS TABLE (NextAuth)
CREATE TABLE "sessions" (
    "session_id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "session_token" TEXT NOT NULL UNIQUE,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- VERIFICATION TOKENS TABLE (NextAuth)
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "verification_tokens_identifier_token_key" UNIQUE ("identifier", "token")
);

-- OTP CODES TABLE
CREATE TABLE "otp_codes" (
    "otp_id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "type" "OTPType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "otp_codes_email_type_idx" ON "otp_codes"("email", "type");
CREATE INDEX "otp_codes_code_idx" ON "otp_codes"("code");
CREATE INDEX "otp_codes_user_id_idx" ON "otp_codes"("user_id");

-- ADMINS TABLE
CREATE TABLE "admins" (
    "admin_id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "admins_email_idx" ON "admins"("email");

-- VENDORS TABLE
CREATE TABLE "vendors" (
    "vendor_id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "avatar" TEXT DEFAULT 'https://i.pravatar.cc/120',
    "description" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "service_areas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "specialties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "join_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "vendors_email_idx" ON "vendors"("email");
CREATE INDEX "vendors_status_idx" ON "vendors"("status");
CREATE INDEX "vendors_category_idx" ON "vendors"("category");

-- SERVICES TABLE
CREATE TABLE "services" (
    "service_id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "vendor_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "price_type" "ServicePriceType" NOT NULL DEFAULT 'FIXED',
    "estimated_time" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "services_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "services_vendor_id_idx" ON "services"("vendor_id");
CREATE INDEX "services_is_active_idx" ON "services"("is_active");

-- VENDOR GALLERY TABLE
CREATE TABLE "vendor_gallery" (
    "gallery_id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "vendor_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_gallery_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "vendor_gallery_vendor_id_idx" ON "vendor_gallery"("vendor_id");

-- BOOKINGS TABLE
CREATE TABLE "bookings" (
    "booking_id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "booking_number" TEXT NOT NULL UNIQUE,
    "user_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "scheduled_time" VARCHAR(5) NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "service_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");
CREATE INDEX "bookings_vendor_id_idx" ON "bookings"("vendor_id");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_booking_number_idx" ON "bookings"("booking_number");

-- BOOKING ITEMS TABLE
CREATE TABLE "booking_items" (
    "booking_item_id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "booking_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booking_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "booking_items_booking_id_idx" ON "booking_items"("booking_id");
CREATE INDEX "booking_items_service_id_idx" ON "booking_items"("service_id");

-- REVIEWS TABLE
CREATE TABLE "reviews" (
    "review_id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "booking_id" UUID NOT NULL UNIQUE,
    "user_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

CREATE INDEX "reviews_vendor_id_idx" ON "reviews"("vendor_id");
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- ==========================================
-- STEP 4: CREATE FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON "admins" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON "vendors" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON "services" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON "bookings" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON "reviews" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update vendor rating when review is added/updated
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "vendors"
    SET 
        "rating" = (
            SELECT COALESCE(ROUND(AVG("rating")::numeric, 2), 0)
            FROM "reviews"
            WHERE "vendor_id" = NEW."vendor_id"
        ),
        "review_count" = (
            SELECT COUNT(*)
            FROM "reviews"
            WHERE "vendor_id" = NEW."vendor_id"
        )
    WHERE "vendor_id" = NEW."vendor_id";
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update vendor rating
CREATE TRIGGER update_vendor_rating_trigger
AFTER INSERT OR UPDATE ON "reviews"
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating();

-- Function to handle vendor rating when review is deleted
CREATE OR REPLACE FUNCTION update_vendor_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "vendors"
    SET 
        "rating" = (
            SELECT COALESCE(ROUND(AVG("rating")::numeric, 2), 0)
            FROM "reviews"
            WHERE "vendor_id" = OLD."vendor_id"
        ),
        "review_count" = (
            SELECT COUNT(*)
            FROM "reviews"
            WHERE "vendor_id" = OLD."vendor_id"
        )
    WHERE "vendor_id" = OLD."vendor_id";
    
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Trigger to update vendor rating on delete
CREATE TRIGGER update_vendor_rating_on_delete_trigger
AFTER DELETE ON "reviews"
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating_on_delete();

-- ==========================================
-- STEP 5: SEED DEFAULT ADMIN
-- ==========================================
INSERT INTO "admins" ("admin_id", "email", "name", "password", "created_at", "updated_at")
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Marijasa@gmail.com',
    'Administrator',
    '$2a$10$dummy_hashed_password_admin1234',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ==========================================
-- STEP 6: SEED VENDORS DATA
-- ==========================================

-- Vendor 1: Edi Taulany Karya Baru (AC Specialist)
INSERT INTO "vendors" (
    "vendor_id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "review_count",
    "service_areas", "specialties", "tags", "category",
    "join_date", "created_at", "updated_at"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'edi.taulany@gmail.com',
    '$2a$10$dummy_hashed_password_edi12345',
    'Edi Taulany Karya Baru',
    '+6281234567890',
    'https://i.pravatar.cc/120?img=12',
    'Spesialis instalasi, perbaikan, dan perawatan AC rumah serta kantor. Menangani AC split, cassette, dan central dengan standar kerja rapi, cepat, dan bergaransi 30 hari. Pengalaman lebih dari 10 tahun dalam bidang AC.',
    true, 'ACTIVE', 0, 0,
    ARRAY['Jakarta Barat', 'Jakarta Utara', 'Tangerang', 'Cirebon', 'Subang'],
    ARRAY['AC Split', 'AC Cassette', 'AC Central', 'Pembersihan AC', 'Perbaikan AC'],
    ARRAY['Tukang AC', 'Instalasi AC', 'Cuci AC'],
    'ac',
    '2023-01-15'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 1
INSERT INTO "services" ("service_id", "vendor_id", "name", "description", "price", "price_type", "estimated_time", "is_active", "created_at", "updated_at") VALUES
('660e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'Instalasi AC Baru', 'Pemasangan AC split baru termasuk instalasi standar', 500000, 'FIXED', '3-4 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'Perbaikan AC', 'Troubleshooting dan perbaikan AC tidak dingin', 150000, 'HOURLY', '2-3 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440001', 'Cuci AC', 'Pembersihan dan perawatan AC rutin', 100000, 'UNIT', '1-2 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Vendor 2: Berkah Teknik Listrik
INSERT INTO "vendors" (
    "vendor_id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "review_count",
    "service_areas", "specialties", "tags", "category",
    "join_date", "created_at", "updated_at"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'berkah.listrik@gmail.com',
    '$2a$10$dummy_hashed_password_berkah12345',
    'Berkah Teknik Listrik',
    '+6282345678901',
    'https://i.pravatar.cc/120?img=32',
    'Layanan instalasi dan perapihan kabel, pemasangan MCB, penambahan titik listrik, hingga panel distribusi untuk rumah dan ruko. Fokus pada keamanan, kerapian, dan kepatuhan standar nasional. Berpengalaman lebih dari 8 tahun.',
    true, 'ACTIVE', 0, 0,
    ARRAY['Jakarta Selatan', 'Depok', 'Bogor', 'Sukabumi', 'Cianjur'],
    ARRAY['Instalasi Listrik', 'Panel MCB', 'Wiring', 'Troubleshooting', 'Maintenance'],
    ARRAY['Tukang Listrik', 'Panel Listrik', 'Instalasi Rumah'],
    'electrical',
    '2023-03-20'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 2
INSERT INTO "services" ("service_id", "vendor_id", "name", "description", "price", "price_type", "estimated_time", "is_active", "created_at", "updated_at") VALUES
('660e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440002', 'Instalasi Listrik Rumah', 'Instalasi listrik rumah baru standar nasional', 750000, 'FIXED', '1-2 hari', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440002', 'Perbaikan Instalasi', 'Troubleshooting dan perbaikan instalasi listrik', 200000, 'HOURLY', '3-4 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Vendor 3: Clean&Co
INSERT INTO "vendors" (
    "vendor_id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "review_count",
    "service_areas", "specialties", "tags", "category",
    "join_date", "created_at", "updated_at"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'info@cleanandco.com',
    '$2a$10$dummy_hashed_password_clean12345',
    'Clean&Co',
    '+6283456789012',
    'https://i.pravatar.cc/120?img=5',
    'Jasa kebersihan profesional untuk apartemen, rumah, dan kantor. Termasuk general cleaning, deep cleaning pasca renovasi, sanitasi kamar mandi, dan pembersihan sofa serta karpet. Tim profesional dan berpengalaman.',
    false, 'ACTIVE', 0, 0,
    ARRAY['Jakarta Pusat', 'Bandung', 'Cimahi', 'Tasikmalaya', 'Garut'],
    ARRAY['General Cleaning', 'Deep Cleaning', 'Sofa Cleaning', 'Carpet Cleaning', 'Sanitasi'],
    ARRAY['Tukang Pembersihan Rumah', 'Deep Cleaning'],
    'cleaning',
    '2023-05-10'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 3
INSERT INTO "services" ("service_id", "vendor_id", "name", "description", "price", "price_type", "estimated_time", "is_active", "created_at", "updated_at") VALUES
('660e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440003', 'General Cleaning', 'Pembersihan rumah standar 3 kamar', 300000, 'FIXED', '4-5 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440003', 'Deep Cleaning', 'Pembersihan menyeluruh termasuk area sulit', 500000, 'FIXED', '6-8 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Vendor 4: Jaya Plumbing
INSERT INTO "vendors" (
    "vendor_id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "review_count",
    "service_areas", "specialties", "tags", "category",
    "join_date", "created_at", "updated_at"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440004',
    'jaya.plumbing@gmail.com',
    '$2a$10$dummy_hashed_password_jaya12345',
    'Jaya Plumbing',
    '+6284567890123',
    'https://i.pravatar.cc/120?img=47',
    'Menangani bocor pipa, mampet, instalasi pompa air, wastafel, kloset, hingga toren. Respon cepat dengan diagnosa jelas sebelum pengerjaan dan hasil rapi tanpa banyak bongkar. Pengalaman 12 tahun.',
    true, 'ACTIVE', 0, 0,
    ARRAY['Bekasi', 'Karawang', 'Cilegon', 'Serang', 'Pandeglang'],
    ARRAY['Perbaikan Pipa', 'Instalasi Wastafel', 'Pompa Air', 'Kloset', 'Toren'],
    ARRAY['Tukang Ledeng', 'Bongkar Pasang Wastafel', 'Perbaikan Kebocoran'],
    'plumbing',
    '2022-11-08'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 4
INSERT INTO "services" ("service_id", "vendor_id", "name", "description", "price", "price_type", "estimated_time", "is_active", "created_at", "updated_at") VALUES
('660e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440004', 'Perbaikan Pipa Bocor', 'Perbaikan pipa air bocor termasuk material', 250000, 'FIXED', '2-3 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('660e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440004', 'Instalasi Wastafel', 'Instalasi wastafel baru lengkap dengan sambungan', 400000, 'FIXED', '3-4 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Vendor 5: Sedot WC Barokah
INSERT INTO "vendors" (
    "vendor_id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "review_count",
    "service_areas", "specialties", "tags", "category",
    "join_date", "created_at", "updated_at"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440005',
    'sedot.barokah@gmail.com',
    '$2a$10$dummy_hashed_password_barokah12345',
    'Sedot WC Barokah',
    '+6285678901234',
    'https://i.pravatar.cc/120?img=21',
    'Layanan sedot WC dan saluran mampet dengan armada siap panggil. Menjaga area kerja tetap bersih, proses cepat, dan transparan dalam estimasi biaya. Siap 24 jam.',
    false, 'ACTIVE', 0, 0,
    ARRAY['Semarang', 'Solo', 'Magelang', 'Salatiga', 'Purwokerto'],
    ARRAY['Sedot WC', 'Saluran Mampet', 'Septic Tank', 'Emergency Service'],
    ARRAY['Tukang Sedot WC', 'Saluran Mampet'],
    'sedot-wc',
    '2023-07-22'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 5
INSERT INTO "services" ("service_id", "vendor_id", "name", "description", "price", "price_type", "estimated_time", "is_active", "created_at", "updated_at") VALUES
('660e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440005', 'Sedot WC Reguler', 'Penyedotan septic tank kapasitas standar', 350000, 'FIXED', '1-2 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Vendor 6: Green Yard
INSERT INTO "vendors" (
    "vendor_id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "review_count",
    "service_areas", "specialties", "tags", "category",
    "join_date", "created_at", "updated_at"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440006',
    'greenyard@gmail.com',
    '$2a$10$dummy_hashed_password_green12345',
    'Green Yard',
    '+6286789012345',
    'https://i.pravatar.cc/120?img=8',
    'Layanan penataan taman minimalis, vertical garden, pemangkasan pohon, hingga perawatan rumput rutin. Menghadirkan ruang hijau estetik dan fungsional untuk rumah dan kantor. Ahli landscape sejak 2020.',
    true, 'ACTIVE', 0, 0,
    ARRAY['Yogyakarta', 'Bantul', 'Sleman', 'Magelang', 'Klaten'],
    ARRAY['Landscape Design', 'Vertical Garden', 'Pemangkasan', 'Perawatan Taman', 'Taman Minimalis'],
    ARRAY['Tukang Kebun', 'Perawatan Taman', 'Desain Landscape'],
    'garden',
    '2023-02-14'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 6
INSERT INTO "services" ("service_id", "vendor_id", "name", "description", "price", "price_type", "estimated_time", "is_active", "created_at", "updated_at") VALUES
('660e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440006', 'Perawatan Taman Bulanan', 'Perawatan taman termasuk pemangkasan dan pemupukan', 400000, 'FIXED', '2-3 jam', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Vendor 7: Karya Furnitur
INSERT INTO "vendors" (
    "vendor_id", "email", "password", "name", "phone", "avatar", "description",
    "verified", "status", "rating", "review_count",
    "service_areas", "specialties", "tags", "category",
    "join_date", "created_at", "updated_at"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440007',
    'karya.furnitur@gmail.com',
    '$2a$10$dummy_hashed_password_karya12345',
    'Karya Furnitur',
    '+6287890123456',
    'https://i.pravatar.cc/120?img=57',
    'Workshop furnitur custom untuk lemari, kitchen set, rak TV, dan meja kerja. Menggunakan material pilihan dengan finishing rapi dan desain menyesuaikan kebutuhan ruangan. Workshop sejak 2018.',
    true, 'ACTIVE', 0, 0,
    ARRAY['Surabaya', 'Sidoarjo', 'Gresik', 'Mojokerto', 'Pasuruan'],
    ARRAY['Kitchen Set', 'Lemari Custom', 'Meja Kerja', 'Rak TV', 'Furniture Design'],
    ARRAY['Tukang Mebel', 'Custom Lemari', 'Kitchen Set'],
    'furniture',
    '2022-09-05'::timestamp,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Services for Vendor 7
INSERT INTO "services" ("service_id", "vendor_id", "name", "description", "price", "price_type", "estimated_time", "is_active", "created_at", "updated_at") VALUES
('660e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440007', 'Kitchen Set Custom', 'Pembuatan kitchen set custom sesuai ukuran', 2500000, 'FIXED', '7-10 hari', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- MIGRATION COMPLETE!
-- ==========================================
-- UUID REFERENCE MAPPING:
-- 
-- ADMIN:
-- 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' (Marijasa@gmail.com / admin1234)
--
-- VENDORS:
-- '550e8400-e29b-41d4-a716-446655440001' - Edi Taulany (edi12345)
-- '550e8400-e29b-41d4-a716-446655440002' - Berkah Teknik (berkah12345)
-- '550e8400-e29b-41d4-a716-446655440003' - Clean&Co (clean12345)
-- '550e8400-e29b-41d4-a716-446655440004' - Jaya Plumbing (jaya12345)
-- '550e8400-e29b-41d4-a716-446655440005' - Sedot WC Barokah (barokah12345)
-- '550e8400-e29b-41d4-a716-446655440006' - Green Yard (green12345)
-- '550e8400-e29b-41d4-a716-446655440007' - Karya Furnitur (karya12345)
--
-- NOTE: All passwords are dummy hashed. Replace with real bcrypt hashes in production!
-- ==========================================
