-- ==========================================
-- MARIJASA DATABASE MIGRATION
-- Create all tables for User, Vendor, and Booking system
-- ==========================================

-- Create ENUM types
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "VendorStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');
CREATE TYPE "ServicePriceType" AS ENUM ('FIXED', 'HOURLY', 'UNIT');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "avatar" TEXT DEFAULT '/profile.svg',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "users_email_idx" ON "users"("email");

-- ==========================================
-- OTP CODES TABLE
-- ==========================================
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "otp_codes_email_type_idx" ON "otp_codes"("email", "type");
CREATE INDEX "otp_codes_code_idx" ON "otp_codes"("code");

-- ==========================================
-- ADMINS TABLE
-- ==========================================
CREATE TABLE "admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "admins_email_idx" ON "admins"("email");

-- ==========================================
-- VENDORS TABLE
-- ==========================================
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "avatar" TEXT DEFAULT 'https://i.pravatar.cc/120',
    "description" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "serviceAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "specialties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "vendors_email_idx" ON "vendors"("email");
CREATE INDEX "vendors_status_idx" ON "vendors"("status");
CREATE INDEX "vendors_category_idx" ON "vendors"("category");

-- ==========================================
-- SERVICES TABLE
-- ==========================================
CREATE TABLE "services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceType" "ServicePriceType" NOT NULL DEFAULT 'FIXED',
    "estimatedTime" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "services_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "services_vendorId_idx" ON "services"("vendorId");
CREATE INDEX "services_active_idx" ON "services"("active");

-- ==========================================
-- VENDOR GALLERY TABLE
-- ==========================================
CREATE TABLE "vendor_gallery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_gallery_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "vendor_gallery_vendorId_idx" ON "vendor_gallery"("vendorId");

-- ==========================================
-- BOOKINGS TABLE
-- ==========================================
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingNumber" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");
CREATE INDEX "bookings_vendorId_idx" ON "bookings"("vendorId");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_bookingNumber_idx" ON "bookings"("bookingNumber");

-- ==========================================
-- BOOKING ITEMS TABLE
-- ==========================================
CREATE TABLE "booking_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booking_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "booking_items_bookingId_idx" ON "booking_items"("bookingId");
CREATE INDEX "booking_items_serviceId_idx" ON "booking_items"("serviceId");

-- ==========================================
-- REVIEWS TABLE
-- ==========================================
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

CREATE INDEX "reviews_vendorId_idx" ON "reviews"("vendorId");
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updatedAt
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
            WHERE "vendorId" = NEW."vendorId"
        ),
        "reviewCount" = (
            SELECT COUNT(*)
            FROM "reviews"
            WHERE "vendorId" = NEW."vendorId"
        )
    WHERE "id" = NEW."vendorId";
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update vendor rating
CREATE TRIGGER update_vendor_rating_trigger
AFTER INSERT OR UPDATE ON "reviews"
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating();

-- ==========================================
-- SEED DATA - Default Admin
-- ==========================================
INSERT INTO "admins" ("id", "email", "name", "password", "createdAt", "updatedAt")
VALUES (
    'admin_default_001',
    'Marijasa@gmail.com',
    'Administrator',
    '$2a$10$dummy_hashed_password_admin1234',  -- In production, use properly hashed password
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Note: Password 'admin1234' should be hashed using bcrypt before production
-- Use this command in your application: bcrypt.hash('admin1234', 10)
