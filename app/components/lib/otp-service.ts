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
const TEMP_USER_KEY_PREFIX = "temp_user:";

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

interface TempUserData {
  name: string;
  email: string;
  phone: string;
  password: string; // hashed password
}

// Store temporary user data (for registration)
export async function storeTempUserData(
  email: string,
  userData: TempUserData,
  type: "register" | "login" | "reset_password"
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase();
  const tempKey = `${TEMP_USER_KEY_PREFIX}${normalizedEmail}:${type}`;
  
  try {
    // Data sementara berlaku lebih lama dari OTP (10 menit)
    const tempDataTTL = 10 * 60; // 10 menit

    // Ensure we store as JSON string
    const dataToStore = JSON.stringify(userData);
    
    console.log(`[OTP Debug] Storing temp user data for ${normalizedEmail}:`, userData);

    if (isRedisAvailable() && redis) {
      // Store as string
      await redis.set(tempKey, dataToStore, { ex: tempDataTTL });
      console.log(`[OTP] Stored temp user data in Redis for ${normalizedEmail}`);
    } else {
      memorySet(tempKey, dataToStore, tempDataTTL);
      console.log(`[OTP] Stored temp user data in memory for ${normalizedEmail} (Redis not available)`);
    }

    // Verify it was stored correctly
    if (isRedisAvailable() && redis) {
      const stored = await redis.get(tempKey);
      console.log(`[OTP Debug] Verified stored data type:`, typeof stored, stored);
    }

    return { success: true };
  } catch (error) {
    console.error("Error storing temp user data:", error);
    return { success: false, error: "Gagal menyimpan data sementara" };
  }
}

// Get temporary user data
export async function getTempUserData(
  email: string,
  type: "register" | "login" | "reset_password"
): Promise<TempUserData | null> {
  const normalizedEmail = email.toLowerCase();
  const tempKey = `${TEMP_USER_KEY_PREFIX}${normalizedEmail}:${type}`;

  try {
    let tempData: unknown = null;

    if (isRedisAvailable() && redis) {
      tempData = await redis.get(tempKey);
      console.log(`[OTP Debug] getTempUserData from Redis:`, {
        type: typeof tempData,
        value: tempData
      });
    } else {
      tempData = memoryGet(tempKey);
      console.log(`[OTP Debug] getTempUserData from memory:`, {
        type: typeof tempData,
        value: tempData
      });
    }

    if (!tempData) {
      console.log(`[OTP Debug] No temp data found for ${normalizedEmail}`);
      return null;
    }

    // Handle different response formats
    let parsedData: TempUserData;
    
    if (typeof tempData === 'string') {
      try {
        parsedData = JSON.parse(tempData);
      } catch (parseError) {
        console.error(`[OTP Debug] Failed to parse tempData as JSON:`, tempData, parseError);
        return null;
      }
    } else if (typeof tempData === 'object' && tempData !== null) {
      // If it's already an object, use it directly
      parsedData = tempData as TempUserData;
    } else {
      console.error(`[OTP Debug] Unexpected tempData type:`, typeof tempData);
      return null;
    }

    // Validate the structure
    if (!parsedData.name || !parsedData.email || !parsedData.phone || !parsedData.password) {
      console.error(`[OTP Debug] Invalid temp data structure:`, parsedData);
      return null;
    }

    console.log(`[OTP Debug] Successfully retrieved temp data for ${normalizedEmail}`);
    return parsedData;
  } catch (error) {
    console.error("Error getting temp user data:", error);
    return null;
  }
}

// Delete temporary user data
export async function deleteTempUserData(
  email: string,
  type: "register" | "login" | "reset_password"
): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  const tempKey = `${TEMP_USER_KEY_PREFIX}${normalizedEmail}:${type}`;

  try {
    if (isRedisAvailable() && redis) {
      const result = await redis.del(tempKey);
      console.log(`[OTP] Cleared temp user data for ${normalizedEmail}, result: ${result}`);
    } else {
      memoryDel(tempKey);
      console.log(`[OTP] Cleared temp user data from memory for ${normalizedEmail}`);
    }
  } catch (error) {
    console.error("Error deleting temp user data:", error);
  }
}

// Clear all OTP and temp data for an email
export async function clearAllRegistrationData(
  email: string,
  type: "register" | "login" | "reset_password"
): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  
  await clearOTPData(normalizedEmail, type);
  await deleteTempUserData(normalizedEmail, type);
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
    let cooldown: unknown = null;
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

    const otpDataString = JSON.stringify(otpData);

    if (isRedisAvailable() && redis) {
      // Store OTP as JSON string
      await redis.set(otpKey, otpDataString, { ex: OTP_TTL });
      
      // Set cooldown
      await redis.set(cooldownKey, "1", { ex: COOLDOWN_SECONDS });

      // Reset attempts on new OTP
      await redis.del(attemptsKey);

      // Update metadata
      const existingMeta = await redis.get(metaKey);
      let meta: OTPMeta;
      
      if (existingMeta && typeof existingMeta === 'string') {
        try {
          meta = JSON.parse(existingMeta);
        } catch {
          meta = { totalSent: 0, lastSentAt: 0, email: normalizedEmail };
        }
      } else {
        meta = { totalSent: 0, lastSentAt: 0, email: normalizedEmail };
      }

      meta.totalSent += 1;
      meta.lastSentAt = Date.now();

      await redis.set(metaKey, JSON.stringify(meta), { ex: META_TTL });
      
      console.log(`[OTP] Stored in Redis for ${normalizedEmail}`);
    } else {
      // Fallback to memory store
      memorySet(otpKey, otpDataString, OTP_TTL);
      memorySet(cooldownKey, "1", COOLDOWN_SECONDS);
      memoryDel(attemptsKey);

      const existingMetaStr = memoryGet(metaKey);
      let meta: OTPMeta;
      
      if (existingMetaStr) {
        try {
          meta = JSON.parse(existingMetaStr);
        } catch {
          meta = { totalSent: 0, lastSentAt: 0, email: normalizedEmail };
        }
      } else {
        meta = { totalSent: 0, lastSentAt: 0, email: normalizedEmail };
      }

      meta.totalSent += 1;
      meta.lastSentAt = Date.now();

      memorySet(metaKey, JSON.stringify(meta), META_TTL);

      console.log(`[OTP] Stored in memory for ${normalizedEmail} (Redis not available)`);
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
    console.log(`[OTP Debug] Verifying OTP for ${normalizedEmail}, type: ${type}`);

    // Check attempts
    let attempts = 0;

    if (isRedisAvailable() && redis) {
      const currentAttempts = await redis.get(attemptsKey);
      console.log(`[OTP Debug] Current attempts:`, currentAttempts);
      
      if (currentAttempts) {
        if (typeof currentAttempts === 'number') {
          attempts = currentAttempts;
        } else if (typeof currentAttempts === 'string') {
          attempts = parseInt(currentAttempts) || 0;
        }
      }
    } else {
      const currentAttempts = memoryGet(attemptsKey);
      attempts = currentAttempts ? parseInt(currentAttempts) : 0;
    }

    console.log(`[OTP Debug] Attempts count: ${attempts}`);

    if (attempts >= MAX_ATTEMPTS) {
      return {
        success: false,
        error: "Terlalu banyak percobaan. Silakan minta kode OTP baru.",
        remainingAttempts: 0,
      };
    }

    // Get OTP data
    let otpData: OTPData | null = null;

    if (isRedisAvailable() && redis) {
      const storedData = await redis.get(otpKey);
      console.log(`[OTP Debug] Retrieved OTP from Redis:`, {
        type: typeof storedData,
        value: storedData
      });
      
      if (storedData) {
        if (typeof storedData === 'string') {
          try {
            otpData = JSON.parse(storedData);
          } catch (e) {
            console.error(`[OTP Debug] Failed to parse OTP as JSON:`, e);
          }
        } else if (typeof storedData === 'object' && storedData !== null) {
          otpData = storedData as OTPData;
        }
      }
    } else {
      const storedDataStr = memoryGet(otpKey);
      if (storedDataStr) {
        try {
          otpData = JSON.parse(storedDataStr);
        } catch (e) {
          console.error(`[OTP Debug] Failed to parse OTP from memory:`, e);
        }
      }
    }

    if (!otpData) {
      return {
        success: false,
        error: "Kode OTP tidak ditemukan atau sudah kadaluarsa. Silakan minta kode baru.",
        remainingAttempts: MAX_ATTEMPTS - attempts - 1,
      };
    }

    // Verify OTP hash
    const inputHash = hashOTP(otp, otpData.salt);
    console.log(`[OTP Debug] Input hash: ${inputHash}, Stored hash: ${otpData.hashedOtp}`);
    
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

    console.log(`[OTP] Verification successful for ${normalizedEmail}`);
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
      if (currentAttempts) {
        if (typeof currentAttempts === 'number') {
          attempts = currentAttempts;
        } else if (typeof currentAttempts === 'string') {
          attempts = parseInt(currentAttempts) || 0;
        }
      }
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
    console.log(`[OTP] Cleared OTP data for ${normalizedEmail}`);
  } catch (error) {
    console.error("Error clearing OTP data:", error);
  }
}

// Get OTP metadata
export async function getOTPMetaData(
  email: string,
  type: "register" | "login" | "reset_password"
): Promise<OTPMeta | null> {
  const normalizedEmail = email.toLowerCase();
  const metaKey = `${META_KEY_PREFIX}${normalizedEmail}:${type}`;

  try {
    let metaData: string | null = null;

    if (isRedisAvailable() && redis) {
      metaData = (await redis.get(metaKey)) as string | null;
    } else {
      metaData = memoryGet(metaKey);
    }

    if (metaData) {
      try {
        return JSON.parse(metaData);
      } catch {
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting OTP metadata:", error);
    return null;
  }
}