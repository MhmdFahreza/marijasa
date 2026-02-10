// app/components/lib/auth.config.ts - OPTIMIZED TO PREVENT 500 ERROR
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
// Get BASE_URL - CRITICAL for OAuth callback
// ============================================
function getBaseUrl(): string {
  // Priority 1: NEXTAUTH_URL (most important for OAuth!)
  if (process.env.NEXTAUTH_URL) {
    const url = process.env.NEXTAUTH_URL.replace(/\/+$/, "").trim();
    return url;
  }
  
  // Priority 2: NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "").trim();
    return url;
  }
  
  // Priority 3: VERCEL_URL
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    return url;
  }
  
  // Fallback
  return "http://localhost:3000";
}

const BASE_URL = getBaseUrl();

// ============================================
// Timeout helper with shorter timeout
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
        setTimeout(() => reject(new Error(`${label} timeout`)), timeoutMs)
      ),
    ]);
    return result;
  } catch (error) {
    console.error(`[Auth] ${label} failed:`, error instanceof Error ? error.message : error);
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
    // signIn: Validate user before allowing login
    // ============================================
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          console.log("[Google signIn] 🔐 START for:", user.email);

          const userEmail = user.email?.toLowerCase();
          if (!userEmail) {
            console.error("[Google signIn] ❌ No email from Google");
            return `${BASE_URL}/login?error=NO_EMAIL`;
          }

          // ✅ OPTIMIZED: Single query with only necessary fields
          const existingUser = await withTimeout(
            prisma.user.findUnique({ 
              where: { email: userEmail },
              select: {
                user_id: true,
                email: true,
                is_active: true,
                email_verified: true,
                avatar: true,
              }
            }),
            5000, // Reduced from 7000
            null,
            "Prisma findUser"
          );

          if (!existingUser) {
            console.error("[Google signIn] ❌ User not found:", userEmail);
            return `${BASE_URL}/login?error=USER_NOT_REGISTERED`;
          }

          if (!existingUser.is_active) {
            console.error("[Google signIn] ❌ User inactive:", userEmail);
            return `${BASE_URL}/login?error=ACCOUNT_INACTIVE`;
          }

          // ✅ OPTIMIZED: Update only if needed, non-blocking
          const needsUpdate = !existingUser.email_verified || (!existingUser.avatar && user.image);
          
          if (needsUpdate) {
            const updateData: Record<string, any> = {};
            if (!existingUser.email_verified) {
              updateData.email_verified = true;
            }
            if (!existingUser.avatar && user.image) {
              updateData.avatar = user.image;
            }

            // ✅ Fire and forget - don't block login
            prisma.user.update({ 
              where: { email: userEmail }, 
              data: updateData 
            }).catch((err) => {
              console.error("[Google signIn] ⚠️ Update failed:", err);
            });
          }

          console.log("[Google signIn] ✅ Validation complete");
          return true;
        }

        return true;
      } catch (error) {
        console.error("[Google signIn] ❌ Error:", error);
        return `${BASE_URL}/login?error=SIGNIN_ERROR`;
      }
    },

    // ============================================
    // jwt: Create session & tokens for Google OAuth
    // ============================================
    async jwt({ token, user, account }) {
      try {
        // ===== INITIAL SIGN-IN =====
        if (user && account) {
          console.log("[JWT] 🔐 Initial sign-in, provider:", account.provider);

          if (account.provider === "google" && user.email) {
            const email = user.email.toLowerCase();

            // ✅ OPTIMIZED: Fetch user with timeout
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
              5000, // Reduced from 7000
              null,
              "JWT findUser"
            );

            if (!dbUser) {
              console.error("[JWT] ❌ User not found:", email);
              // Set minimal token data
              token.id = user.id;
              token.email = email;
              token.name = user.name;
              token.picture = user.image || "/profile.svg";
              return token;
            }

            // Set token fields
            token.id = dbUser.user_id;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.role = dbUser.role;
            token.phone = dbUser.phone;
            token.picture = dbUser.avatar || user.image || "/profile.svg";

            // ✅ CREATE SESSION AND TOKENS (optimized)
            try {
              const sessionId = createSessionId();

              // ✅ OPTIMIZED: Parallel execution instead of sequential
              const [sessionResult, accessToken, refreshToken] = await Promise.all([
                withTimeout(
                  storeSession(sessionId, {
                    userId: dbUser.user_id,
                    email: dbUser.email,
                    role: dbUser.role,
                    createdAt: Date.now(),
                    lastActivity: Date.now(),
                  }),
                  3000, // Reduced timeout
                  { success: false },
                  "JWT storeSession"
                ),
                Promise.resolve(
                  generateAccessToken({
                    userId: dbUser.user_id,
                    email: dbUser.email,
                    role: dbUser.role,
                    sessionId,
                  })
                ),
                Promise.resolve(
                  generateRefreshToken({
                    userId: dbUser.user_id,
                    email: dbUser.email,
                    role: dbUser.role,
                    sessionId,
                  })
                ),
              ]);

              if (!sessionResult || !(sessionResult as any).success) {
                console.error("[JWT] ⚠️ Session storage failed");
                return token; // Continue without custom session
              }

              // Store tokens (fire and forget to save time)
              storeTokens(sessionId, accessToken, refreshToken).catch((err) => {
                console.error("[JWT] ⚠️ Token storage failed:", err);
              });

              // Add to JWT token
              token.sessionId = sessionId;
              token.accessToken = accessToken;
              token.refreshToken = refreshToken;

              console.log("[JWT] ✅ Session & tokens created");
            } catch (sessionError) {
              console.error("[JWT] ⚠️ Session creation error:", sessionError);
              // Don't crash - user can still login via NextAuth session
            }
          } else if (account.provider === "credentials") {
            token.id = user.id;
            token.role = (user as any).role;
            token.phone = (user as any).phone;
          }
        }

        return token;
      } catch (error) {
        console.error("[JWT] ❌ Error:", error);
        return token;
      }
    },

    // ============================================
    // session: Pass data to client session
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
        console.error("[Session] ❌ Error:", error);
      }
      return session;
    },

    // ============================================
    // redirect: Handle post-auth redirects
    // ============================================
    async redirect({ url, baseUrl }) {
      try {
        // Handle errors
        if (url.includes("error=")) {
          if (url.startsWith(BASE_URL)) {
            return url;
          }

          try {
            const urlObj = new URL(url.startsWith("http") ? url : `${BASE_URL}${url}`);
            const errorParam = urlObj.searchParams.get("error");
            return `${BASE_URL}/login?error=${errorParam || "CALLBACK_ERROR"}`;
          } catch {
            return `${BASE_URL}/login?error=CALLBACK_ERROR`;
          }
        }

        // Google callback - redirect to home
        if (url.includes("/api/auth/callback/google")) {
          return BASE_URL;
        }

        // URL starts with BASE_URL
        if (url.startsWith(BASE_URL)) {
          return url;
        }

        // Relative URL
        if (url.startsWith("/")) {
          return `${BASE_URL}${url}`;
        }

        // Default
        return BASE_URL;
      } catch (error) {
        console.error("[Redirect] ❌ Error:", error);
        return BASE_URL;
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
  debug: false, // ✅ Disable debug in production to reduce overhead
  logger: {
    error(code, ...message) {
      const codeStr = String(code);
      if (codeStr.includes("DEP0169")) return;
      console.error("[NextAuth Error]", code, ...message);
    },
    warn(code, ...message) {
      const codeStr = String(code);
      if (codeStr.includes("DEP0169")) return;
      // Suppress warnings in production
      if (process.env.NODE_ENV === "development" && !codeStr.includes("session")) {
        console.warn("[NextAuth Warning]", code, ...message);
      }
    },
    debug(...message) {
      // Only debug in development
      if (process.env.NODE_ENV === "development") {
        console.log("[NextAuth Debug]", ...message);
      }
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log("[NextAuth Event] 🎉 User signed in:", {
        email: user.email,
        provider: account?.provider,
      });
    },
    async signOut({ token }) {
      console.log("[NextAuth Event] 👋 User signed out:", {
        email: (token as any)?.email,
      });
    },
  },
};