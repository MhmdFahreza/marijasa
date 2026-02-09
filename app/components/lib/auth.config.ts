// app/components/lib/auth.config.ts - FIXED FOR VERCEL SERVERLESS
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
  // 1. Production: NEXTAUTH_URL (set in Vercel)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/+$/, "").trim();
  }

  // 2. Vercel auto-sets VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Fallback
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "").trim();
  }

  // 4. Development
  return "http://localhost:3000";
}

const BASE_URL = getBaseUrl();

// ============================================
// ❌ REMOVED: pendingGoogleSessions Map
// In-memory Map does NOT work reliably on Vercel serverless
// because signIn and jwt callbacks may run in different instances.
// Session/token creation is now done directly in the jwt callback.
// ============================================

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
            throw new Error(
              "Email belum terdaftar. Silakan daftar terlebih dahulu."
            );
          }
        } else {
          const normalizedPhone = normalizePhone(identifier);

          user = await prisma.user.findFirst({
            where: { phone: normalizedPhone },
          });

          if (!user) {
            throw new Error(
              "Nomor telepon belum terdaftar. Silakan daftar terlebih dahulu."
            );
          }
        }

        if (!user.password) {
          throw new Error(
            "Akun ini terdaftar melalui Google. Silakan login dengan Google."
          );
        }

        if (!user.email_verified) {
          throw new Error(
            "Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu."
          );
        }

        if (!user.is_active) {
          throw new Error("Akun Anda tidak aktif. Silakan hubungi admin.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

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
    // NO session/token creation here (moved to jwt)
    // ============================================
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          console.log("[Google OAuth signIn] ========== START ==========");

          const userEmail = user.email?.toLowerCase();

          if (!userEmail) {
            console.error("[Google OAuth signIn] ❌ No email from Google");
            return `${BASE_URL}/login?error=NO_EMAIL`;
          }

          console.log(`[Google OAuth signIn] Processing: ${userEmail}`);

          // Check if user is registered
          const existingUser = await prisma.user.findUnique({
            where: { email: userEmail },
          });

          if (!existingUser) {
            console.log(`[Google OAuth signIn] ❌ Not registered: ${userEmail}`);
            return `${BASE_URL}/login?error=USER_NOT_REGISTERED`;
          }

          if (!existingUser.is_active) {
            console.log(`[Google OAuth signIn] ❌ Inactive: ${userEmail}`);
            return `${BASE_URL}/login?error=ACCOUNT_INACTIVE`;
          }

          // Update email_verified and avatar in one query
          const updateData: Record<string, any> = {};
          if (!existingUser.email_verified) {
            updateData.email_verified = true;
          }
          if (!existingUser.avatar && user.image) {
            updateData.avatar = user.image;
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { email: userEmail },
              data: updateData,
            });
          }

          console.log(`[Google OAuth signIn] ✅ Validated: ${userEmail}`);
          console.log("[Google OAuth signIn] ========== SUCCESS ==========");

          return true;
        } catch (error) {
          console.error("[Google OAuth signIn] ========== ERROR ==========");
          console.error("[Google OAuth signIn] Error:", error);

          const errorMessage =
            error instanceof Error ? error.message : "GOOGLE_SIGNIN_ERROR";
          return `${BASE_URL}/login?error=${encodeURIComponent(errorMessage)}`;
        }
      }

      return true;
    },

    // ============================================
    // jwt: Creates session/tokens for Google OAuth
    // This runs in the SAME request as signIn on Vercel,
    // but we don't rely on in-memory state anymore.
    // ============================================
    async jwt({ token, user, account }) {
      // ===== INITIAL SIGN-IN (user & account are only available on first call) =====
      if (user && account) {
        // --- Google OAuth ---
        if (account.provider === "google" && user.email) {
          try {
            console.log("[JWT] Google OAuth initial sign-in for:", user.email);

            const email = user.email.toLowerCase();

            // Fetch DB user to get user_id and other fields
            const dbUser = await prisma.user.findUnique({
              where: { email },
              select: {
                user_id: true,
                email: true,
                name: true,
                phone: true,
                avatar: true,
                role: true,
              },
            });

            if (dbUser) {
              // Set token fields from DB
              token.id = dbUser.user_id;
              token.email = dbUser.email;
              token.name = dbUser.name;
              token.role = dbUser.role;
              token.phone = dbUser.phone;
              token.picture = dbUser.avatar || user.image || "/profile.svg";

              // ✅ CREATE SESSION AND TOKENS HERE (serverless-safe)
              const sessionId = createSessionId();

              // Store session in Redis
              await storeSession(sessionId, {
                userId: dbUser.user_id,
                email: dbUser.email,
                role: dbUser.role,
                createdAt: Date.now(),
                lastActivity: Date.now(),
              });

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

              // Store tokens in Redis
              await storeTokens(sessionId, accessToken, refreshToken);

              // Store in JWT token for middleware to read
              token.sessionId = sessionId;
              token.accessToken = accessToken;
              token.refreshToken = refreshToken;

              console.log(`[JWT] ✅ Session created for Google user: ${dbUser.email}, sessionId: ${sessionId.substring(0, 8)}...`);
            } else {
              console.error(`[JWT] ❌ DB user not found for: ${email}`);
            }
          } catch (error) {
            console.error("[JWT] ❌ Error creating session for Google user:", error);
            // Don't throw - let NextAuth continue with basic token
            // The user will need to re-login but won't get a 500
          }
        }
        // --- Credentials ---
        else if (account.provider === "credentials") {
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
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session.user as any).phone = token.phone as string;
        (session.user as any).sessionId = token.sessionId as string;
        (session.user as any).accessToken = token.accessToken as string;
        (session.user as any).refreshToken = token.refreshToken as string;
        session.user.name = token.name as string;
        session.user.image = (token.picture as string) || "/profile.svg";
      }
      return session;
    },

    // ============================================
    // redirect: Handle post-auth redirects
    // ============================================
    async redirect({ url, baseUrl }) {
      console.log("[Redirect] url:", url);
      console.log("[Redirect] baseUrl:", baseUrl);

      const CORRECT_BASE_URL = BASE_URL;

      // Handle errors
      if (url.includes("error=")) {
        console.log("[Redirect] Error detected");

        if (url.startsWith(CORRECT_BASE_URL)) {
          return url;
        }

        try {
          const urlObj = new URL(
            url.startsWith("http") ? url : `${CORRECT_BASE_URL}${url}`
          );
          const errorParam = urlObj.searchParams.get("error");
          return `${CORRECT_BASE_URL}/login?error=${errorParam}`;
        } catch (e) {
          return `${CORRECT_BASE_URL}/login?error=CALLBACK_ERROR`;
        }
      }

      // Google callback - redirect to home
      if (url.includes("/api/auth/callback/google")) {
        console.log("[Redirect] Google callback - redirecting to home");
        return CORRECT_BASE_URL;
      }

      // URL starts with correct base
      if (url.startsWith(CORRECT_BASE_URL)) {
        return url;
      }

      // Relative URL
      if (url.startsWith("/")) {
        return `${CORRECT_BASE_URL}${url}`;
      }

      // Default
      return CORRECT_BASE_URL;
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
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, ...message) {
      const codeStr = String(code);
      if (codeStr.includes("DEP0169")) {
        return; // Suppress deprecation warning
      }
      console.error("[NextAuth Error]", code, ...message);
    },
    warn(code, ...message) {
      const codeStr = String(code);
      if (!codeStr.includes("session") && !codeStr.includes("DEP0169")) {
        console.warn("[NextAuth Warning]", code, ...message);
      }
    },
    debug: (code, ...message) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[NextAuth Debug]", code, ...message);
      }
    },
  },
};