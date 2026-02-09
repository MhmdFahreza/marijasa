// app/components/lib/auth.config.ts - FULLY FIXED FOR VERCEL SERVERLESS
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/app/components/lib/prisma";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  createSessionId,
  storeSession,
  storeTokens,
} from "@/app/components/lib/token-service";

// Normalize phone number to +62 format
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s-]/g, "");
  if (cleaned.startsWith("08")) {
    cleaned = "+62" + cleaned.substring(1);
  } else if (cleaned.startsWith("62")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+62")) {
    cleaned = "+62" + cleaned;
  }
  return cleaned;
}

// ============================================
// PRODUCTION-SAFE: Get the correct base URL
// ============================================
function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/+$/, "").trim();
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "").trim();
  }
  return "http://localhost:3000";
}

const BASE_URL = getBaseUrl();

// ============================================
// Helper: Run async operation with timeout
// Prevents Vercel serverless function timeout
// ============================================
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
  label: string
): Promise<T> {
  try {
    const result = await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    return result;
  } catch (error) {
    console.error(`[Auth Config] ${label} failed:`, error);
    return fallback;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Email/Nomor telepon dan password harus diisi");
        }

        const identifier = credentials.identifier.trim();
        const isEmail = identifier.includes("@");
        let user = null;

        if (isEmail) {
          user = await prisma.user.findUnique({
            where: { email: identifier.toLowerCase() },
          });
          if (!user) {
            throw new Error("Email belum terdaftar. Silakan daftar terlebih dahulu.");
          }
        } else {
          const normalizedPhone = normalizePhone(identifier);
          user = await prisma.user.findFirst({
            where: { phone: normalizedPhone },
          });
          if (!user) {
            throw new Error("Nomor telepon belum terdaftar. Silakan daftar terlebih dahulu.");
          }
        }

        if (!user.password) {
          throw new Error("Akun ini terdaftar melalui Google. Silakan login dengan Google.");
        }
        if (!user.email_verified) {
          throw new Error("Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.");
        }
        if (!user.is_active) {
          throw new Error("Akun Anda tidak aktif. Silakan hubungi admin.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Password salah. Silakan coba lagi.");
        }

        return {
          id: user.user_id,
          email: user.email,
          name: user.name,
          image: user.avatar || "/profile.svg",
          role: user.role,
          phone: user.phone,
        };
      },
    }),
  ],
  callbacks: {
    // ============================================
    // signIn: ONLY validates user, updates DB fields
    // ============================================
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          console.log("[Google signIn] START for:", user.email);

          const userEmail = user.email?.toLowerCase();
          if (!userEmail) {
            console.error("[Google signIn] ❌ No email");
            return `${BASE_URL}/login?error=NO_EMAIL`;
          }

          // Find user with timeout protection
          const existingUser = await withTimeout(
            prisma.user.findUnique({ where: { email: userEmail } }),
            8000,
            null,
            "Prisma findUser"
          );

          if (!existingUser) {
            console.log("[Google signIn] ❌ Not registered:", userEmail);
            return `${BASE_URL}/login?error=USER_NOT_REGISTERED`;
          }

          if (!existingUser.is_active) {
            console.log("[Google signIn] ❌ Inactive:", userEmail);
            return `${BASE_URL}/login?error=ACCOUNT_INACTIVE`;
          }

          // Update fields (non-blocking, with timeout)
          const updateData: Record<string, any> = {};
          if (!existingUser.email_verified) updateData.email_verified = true;
          if (!existingUser.avatar && user.image) updateData.avatar = user.image;

          if (Object.keys(updateData).length > 0) {
            // Fire and forget - don't block the flow
            withTimeout(
              prisma.user.update({ where: { email: userEmail }, data: updateData }),
              5000,
              null,
              "Prisma updateUser"
            ).catch((err) => console.error("[Google signIn] Update failed:", err));
          }

          console.log("[Google signIn] ✅ Validated:", userEmail);
          return true;
        } catch (error) {
          console.error("[Google signIn] ❌ Error:", error);
          const msg = error instanceof Error ? error.message : "GOOGLE_SIGNIN_ERROR";
          return `${BASE_URL}/login?error=${encodeURIComponent(msg)}`;
        }
      }

      return true;
    },

    // ============================================
    // jwt: Creates session/tokens for Google OAuth
    // ✅ CRITICAL: All operations wrapped with timeout + try-catch
    // ============================================
    async jwt({ token, user, account }) {
      // ===== INITIAL SIGN-IN =====
      if (user && account) {
        console.log("[JWT] Initial sign-in, provider:", account.provider);

        if (account.provider === "google" && user.email) {
          try {
            console.log("[JWT] Google OAuth for:", user.email);

            const email = user.email.toLowerCase();

            // Fetch DB user with timeout
            const dbUser = await withTimeout(
              prisma.user.findUnique({
                where: { email },
                select: {
                  user_id: true,
                  email: true,
                  name: true,
                  phone: true,
                  avatar: true,
                  role: true,
                },
              }),
              8000,
              null,
              "JWT Prisma findUser"
            );

            if (!dbUser) {
              console.error("[JWT] ❌ DB user not found:", email);
              // Still set basic token data from Google profile
              token.id = user.id;
              token.email = email;
              token.name = user.name;
              token.picture = user.image || "/profile.svg";
              return token;
            }

            // Set token fields from DB
            token.id = dbUser.user_id;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.role = dbUser.role;
            token.phone = dbUser.phone;
            token.picture = dbUser.avatar || user.image || "/profile.svg";

            // ✅ CREATE SESSION AND TOKENS (with timeout protection)
            try {
              const sessionId = createSessionId();
              console.log("[JWT] Creating session:", sessionId.substring(0, 8) + "...");

              // Store session in Redis (with timeout)
              const sessionStored = await withTimeout(
                storeSession(sessionId, {
                  userId: dbUser.user_id,
                  email: dbUser.email,
                  role: dbUser.role,
                  createdAt: Date.now(),
                  lastActivity: Date.now(),
                }),
                5000,
                { success: false },
                "JWT storeSession"
              );

              if (!sessionStored || !(sessionStored as any).success) {
                console.error("[JWT] ❌ Failed to store session in Redis");
                return token;
              }

              // Generate tokens
              const accessToken = generateAccessToken({
                userId: dbUser.user_id,
                email: dbUser.email,
                role: dbUser.role,
                sessionId,
              });

              const refreshToken = generateRefreshToken({
                userId: dbUser.user_id,
                email: dbUser.email,
                role: dbUser.role,
                sessionId,
              });

              // Store tokens in Redis (with timeout)
              await withTimeout(
                storeTokens(sessionId, accessToken, refreshToken),
                5000,
                { success: false },
                "JWT storeTokens"
              );

              // Store in JWT token for middleware/client
              token.sessionId = sessionId;
              token.accessToken = accessToken;
              token.refreshToken = refreshToken;

              console.log("[JWT] ✅ Session created for:", dbUser.email);
            } catch (sessionError) {
              console.error("[JWT] ❌ Session creation error:", sessionError);
              // Don't crash NextAuth - user can still work via NextAuth session
            }
          } catch (error) {
            console.error("[JWT] ❌ Google OAuth error:", error);
            // Set minimal token data so NextAuth doesn't crash
            token.id = user.id;
            token.email = user.email;
            token.name = user.name;
            token.picture = user.image || "/profile.svg";
          }
        } else if (account.provider === "credentials") {
          token.id = user.id;
          token.role = (user as any).role;
          token.phone = (user as any).phone;
        }
      }

      return token;
    },

    // ============================================
    // session: Pass data from JWT to session
    // ============================================
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = (token.id as string) || "";
          session.user.role = (token.role as string) || "USER";
          (session.user as any).phone = (token.phone as string) || null;
          (session.user as any).sessionId = (token.sessionId as string) || null;
          (session.user as any).accessToken = (token.accessToken as string) || null;
          (session.user as any).refreshToken = (token.refreshToken as string) || null;
          session.user.name = (token.name as string) || "User";
          session.user.image = (token.picture as string) || "/profile.svg";
        }
      } catch (error) {
        console.error("[Session] Error:", error);
      }
      return session;
    },

    // ============================================
    // redirect: Handle post-auth redirects
    // ============================================
    async redirect({ url, baseUrl }) {
      console.log("[Redirect] url:", url, "| baseUrl:", baseUrl);

      const CORRECT_BASE_URL = BASE_URL;

      try {
        // Handle errors
        if (url.includes("error=")) {
          if (url.startsWith(CORRECT_BASE_URL)) return url;

          try {
            const urlObj = new URL(
              url.startsWith("http") ? url : `${CORRECT_BASE_URL}${url}`
            );
            const errorParam = urlObj.searchParams.get("error");
            return `${CORRECT_BASE_URL}/login?error=${errorParam || "UNKNOWN"}`;
          } catch {
            return `${CORRECT_BASE_URL}/login?error=CALLBACK_ERROR`;
          }
        }

        // Google callback - redirect to home
        if (url.includes("/api/auth/callback/google")) {
          return CORRECT_BASE_URL;
        }

        // URL starts with correct base
        if (url.startsWith(CORRECT_BASE_URL)) return url;

        // Relative URL
        if (url.startsWith("/")) return `${CORRECT_BASE_URL}${url}`;

        // Default
        return CORRECT_BASE_URL;
      } catch (error) {
        console.error("[Redirect] Error:", error);
        return CORRECT_BASE_URL;
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
  logger: {
    error(code, ...message) {
      const codeStr = String(code);
      if (codeStr.includes("DEP0169")) return;
      console.error("[NextAuth Error]", code, ...message);
    },
    warn(code, ...message) {
      const codeStr = String(code);
      if (codeStr.includes("DEP0169")) return;
      if (!codeStr.includes("session")) {
        console.warn("[NextAuth Warning]", code, ...message);
      }
    },
    debug: () => {},
  },
};