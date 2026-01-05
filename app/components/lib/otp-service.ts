// app/components/lib/otp-service.ts
import redis, { isRedisAvailable } from "./redis";
import crypto from "crypto";

// Configuration
const OTP_TTL = 5 * 60; // 5 minutes in seconds
const META_TTL = 60 * 60; // 1 hour in seconds for rate limiting metadata
const COOLDOWN_SECONDS = 60; // 60 seconds cooldown between OTP requests
const MAX_ATTEMPTS = 5; // Maximum verification attempts

// Key prefixes
const OTP_KEY_PREFIX = "otp:";
const META_KEY_PREFIX = "otp_meta:";
const COOLDOWN_KEY_PREFIX = "otp_cooldown:";
const ATTEMPTS_KEY_PREFIX = "otp_attempts:";

// In-memory fallback storage (untuk development jika Redis tidak tersedia)
const memoryStore: Map<string, { value: string; expiresAt: number }> = new Map();

// Helper untuk memory store
function memorySet(key: string, value: string, ttlSeconds: number): void {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function memoryGet(key: string): string | null {
  const item = memoryStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
}

function memoryDel(key: string): void {
  memoryStore.delete(key);
}

function memoryIncr(key: string, ttlSeconds: number): number {
  const current = memoryGet(key);
  const newValue = current ? parseInt(current) + 1 : 1;
  memorySet(key, newValue.toString(), ttlSeconds);
  return newValue;
}

function memoryTtl(key: string): number {
  const item = memoryStore.get(key);
  if (!item) return -2;
  const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : -2;
}

// Generate 6 digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP using SHA256
export function hashOTP(otp: string, salt: string): string {
  return crypto.createHash("sha256").update(otp + salt).digest("hex");
}

// Generate random salt
export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

interface OTPData {
  hashedOtp: string;
  salt: string;
  email: string;
  type: "register" | "login" | "reset_password";
  createdAt: number;
}

interface OTPMeta {
  totalSent: number;
  lastSentAt: number;
  email: string;
}

// Store OTP (Redis atau Memory)
export async function storeOTP(
  email: string,
  otp: string,
  type: "register" | "login" | "reset_password"
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase();
  const otpKey = `${OTP_KEY_PREFIX}${normalizedEmail}:${type}`;
  const metaKey = `${META_KEY_PREFIX}${normalizedEmail}:${type}`;
  const cooldownKey = `${COOLDOWN_KEY_PREFIX}${normalizedEmail}:${type}`;
  const attemptsKey = `${ATTEMPTS_KEY_PREFIX}${normalizedEmail}:${type}`;

  try {
    // Check cooldown
    let cooldown: string | null = null;
    let remainingSeconds = 0;

    if (isRedisAvailable() && redis) {
      cooldown = await redis.get(cooldownKey);
      if (cooldown) {
        remainingSeconds = await redis.ttl(cooldownKey);
      }
    } else {
      cooldown = memoryGet(cooldownKey);
      if (cooldown) {
        remainingSeconds = memoryTtl(cooldownKey);
      }
    }

    if (cooldown && remainingSeconds > 0) {
      return {
        success: false,
        error: `Tunggu ${remainingSeconds} detik sebelum meminta kode baru`,
      };
    }

    // Generate salt and hash OTP
    const salt = generateSalt();
    const hashedOtp = hashOTP(otp, salt);

    // Store OTP data
    const otpData: OTPData = {
      hashedOtp,
      salt,
      email: normalizedEmail,
      type,
      createdAt: Date.now(),
    };

    const otpDataStr = JSON.stringify(otpData);

    if (isRedisAvailable() && redis) {
      // Store OTP with TTL
      await redis.set(otpKey, otpDataStr, { ex: OTP_TTL });

      // Set cooldown
      await redis.set(cooldownKey, "1", { ex: COOLDOWN_SECONDS });

      // Reset attempts on new OTP
      await redis.del(attemptsKey);

      // Update metadata
      const existingMetaStr = await redis.get(metaKey);
      const meta: OTPMeta = existingMetaStr
        ? (JSON.parse(existingMetaStr as string) as OTPMeta)
        : { totalSent: 0, lastSentAt: 0, email: normalizedEmail };

      meta.totalSent += 1;
      meta.lastSentAt = Date.now();

      await redis.set(metaKey, JSON.stringify(meta), { ex: META_TTL });
    } else {
      // Fallback to memory store
      memorySet(otpKey, otpDataStr, OTP_TTL);
      memorySet(cooldownKey, "1", COOLDOWN_SECONDS);
      memoryDel(attemptsKey);

      const existingMetaStr = memoryGet(metaKey);
      const meta: OTPMeta = existingMetaStr
        ? (JSON.parse(existingMetaStr) as OTPMeta)
        : { totalSent: 0, lastSentAt: 0, email: normalizedEmail };

      meta.totalSent += 1;
      meta.lastSentAt = Date.now();

      memorySet(metaKey, JSON.stringify(meta), META_TTL);

      console.log(`[OTP] Using in-memory storage (Redis not available)`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error storing OTP:", error);
    return { success: false, error: "Gagal menyimpan OTP" };
  }
}

// Verify OTP
export async function verifyOTP(
  email: string,
  otp: string,
  type: "register" | "login" | "reset_password"
): Promise<{
  success: boolean;
  error?: string;
  remainingAttempts?: number;
}> {
  const normalizedEmail = email.toLowerCase();
  const otpKey = `${OTP_KEY_PREFIX}${normalizedEmail}:${type}`;
  const attemptsKey = `${ATTEMPTS_KEY_PREFIX}${normalizedEmail}:${type}`;

  try {
    // Check attempts
    let attempts = 0;

    if (isRedisAvailable() && redis) {
      const currentAttempts = await redis.get(attemptsKey);
      attempts = currentAttempts ? parseInt(currentAttempts as string) : 0;
    } else {
      const currentAttempts = memoryGet(attemptsKey);
      attempts = currentAttempts ? parseInt(currentAttempts) : 0;
    }

    if (attempts >= MAX_ATTEMPTS) {
      return {
        success: false,
        error: "Terlalu banyak percobaan. Silakan minta kode OTP baru.",
        remainingAttempts: 0,
      };
    }

    // Get OTP data
    let otpDataStr: string | null = null;

    if (isRedisAvailable() && redis) {
      otpDataStr = await redis.get(otpKey) as string | null;
    } else {
      otpDataStr = memoryGet(otpKey);
    }

    if (!otpDataStr) {
      return {
        success: false,
        error: "Kode OTP tidak ditemukan atau sudah kadaluarsa. Silakan minta kode baru.",
        remainingAttempts: MAX_ATTEMPTS - attempts - 1,
      };
    }

    const otpData: OTPData = JSON.parse(otpDataStr);

    // Verify OTP hash
    const inputHash = hashOTP(otp, otpData.salt);
    if (inputHash !== otpData.hashedOtp) {
      // Increment attempts
      if (isRedisAvailable() && redis) {
        await redis.incr(attemptsKey);
        await redis.expire(attemptsKey, OTP_TTL);
      } else {
        memoryIncr(attemptsKey, OTP_TTL);
      }

      const remainingAttempts = MAX_ATTEMPTS - attempts - 1;
      return {
        success: false,
        error: `Kode OTP salah. Sisa percobaan: ${remainingAttempts}`,
        remainingAttempts,
      };
    }

    // OTP valid - delete it to prevent reuse
    if (isRedisAvailable() && redis) {
      await redis.del(otpKey);
      await redis.del(attemptsKey);
    } else {
      memoryDel(otpKey);
      memoryDel(attemptsKey);
    }

    return { success: true };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, error: "Gagal memverifikasi OTP" };
  }
}

// Check cooldown status
export async function checkCooldown(
  email: string,
  type: "register" | "login" | "reset_password"
): Promise<{ onCooldown: boolean; remainingSeconds: number }> {
  const normalizedEmail = email.toLowerCase();
  const cooldownKey = `${COOLDOWN_KEY_PREFIX}${normalizedEmail}:${type}`;

  try {
    if (isRedisAvailable() && redis) {
      const cooldown = await redis.get(cooldownKey);
      if (cooldown) {
        const remainingSeconds = await redis.ttl(cooldownKey);
        return { onCooldown: true, remainingSeconds };
      }
    } else {
      const cooldown = memoryGet(cooldownKey);
      if (cooldown) {
        const remainingSeconds = memoryTtl(cooldownKey);
        return { onCooldown: remainingSeconds > 0, remainingSeconds };
      }
    }
    return { onCooldown: false, remainingSeconds: 0 };
  } catch (error) {
    console.error("Error checking cooldown:", error);
    return { onCooldown: false, remainingSeconds: 0 };
  }
}

// Get remaining attempts
export async function getRemainingAttempts(
  email: string,
  type: "register" | "login" | "reset_password"
): Promise<number> {
  const normalizedEmail = email.toLowerCase();
  const attemptsKey = `${ATTEMPTS_KEY_PREFIX}${normalizedEmail}:${type}`;

  try {
    let attempts = 0;

    if (isRedisAvailable() && redis) {
      const currentAttempts = await redis.get(attemptsKey);
      attempts = currentAttempts ? parseInt(currentAttempts as string) : 0;
    } else {
      const currentAttempts = memoryGet(attemptsKey);
      attempts = currentAttempts ? parseInt(currentAttempts) : 0;
    }

    return MAX_ATTEMPTS - attempts;
  } catch (error) {
    console.error("Error getting remaining attempts:", error);
    return MAX_ATTEMPTS;
  }
}

// Clear all OTP data for an email
export async function clearOTPData(
  email: string,
  type: "register" | "login" | "reset_password"
): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  const otpKey = `${OTP_KEY_PREFIX}${normalizedEmail}:${type}`;
  const cooldownKey = `${COOLDOWN_KEY_PREFIX}${normalizedEmail}:${type}`;
  const attemptsKey = `${ATTEMPTS_KEY_PREFIX}${normalizedEmail}:${type}`;

  try {
    if (isRedisAvailable() && redis) {
      await redis.del(otpKey);
      await redis.del(cooldownKey);
      await redis.del(attemptsKey);
    } else {
      memoryDel(otpKey);
      memoryDel(cooldownKey);
      memoryDel(attemptsKey);
    }
  } catch (error) {
    console.error("Error clearing OTP data:", error);
  }
}