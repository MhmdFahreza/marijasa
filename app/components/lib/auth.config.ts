// app/components/lib/auth.config.ts - FIXED & SIMPLIFIED
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
    return process.env.NEXTAUTH_URL.trim();
  }

  // 2. Vercel auto-sets VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Fallback
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.trim();
  }

  // 4. Development
  return "http://localhost:3000";
}

const BASE_URL = getBaseUrl();

// Store session data temporarily for cookie setting
const pendingGoogleSessions = new Map<string, {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  timestamp: number;
}>();

// Cleanup old pending sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingGoogleSessions.entries()) {
    if (now - data.timestamp > 5 * 60 * 1000) { // 5 minutes
      pendingGoogleSessions.delete(email);
    }
  }
}, 5 * 60 * 1000);

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
    async signIn({ user, account, profile }) {
      // Handle Google OAuth
      if (account?.provider === "google") {
        try {
          console.log("[Google OAuth signIn] ========== START ==========");
          
          const userEmail = user.email?.toLowerCase();

          if (!userEmail) {
            console.error("[Google OAuth signIn] ❌ No email from Google");
            return `${BASE_URL}/login?error=NO_EMAIL`;
          }

          console.log(`[Google OAuth signIn] Processing: ${userEmail}`);

          // Check if user registered
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

          // Update email_verified
          if (!existingUser.email_verified) {
            await prisma.user.update({
              where: { email: userEmail },
              data: { email_verified: true },
            });
          }

          // Update avatar if needed
          if (!existingUser.avatar && user.image) {
            await prisma.user.update({
              where: { email: userEmail },
              data: { avatar: user.image },
            });
          }

          // ✅ CREATE SESSION AND TOKENS HERE
          const sessionId = createSessionId();

          // Store session in Redis
          await storeSession(sessionId, {
            userId: existingUser.user_id,
            email: existingUser.email,
            role: existingUser.role,
            createdAt: Date.now(),
            lastActivity: Date.now(),
          });

          // Generate tokens
          const accessToken = generateAccessToken({
            userId: existingUser.user_id,
            email: existingUser.email,
            role: existingUser.role,
            sessionId,
          });

          const refreshToken = generateRefreshToken({
            userId: existingUser.user_id,
            email: existingUser.email,
            role: existingUser.role,
            sessionId,
          });

          // Store tokens in Redis
          await storeTokens(sessionId, accessToken, refreshToken);

          // Store in temporary map for cookie setting
          pendingGoogleSessions.set(userEmail, {
            sessionId,
            accessToken,
            refreshToken,
            timestamp: Date.now(),
          });

          console.log(`[Google OAuth signIn] ✅ Success: ${userEmail}`);
          console.log("[Google OAuth signIn] ========== SUCCESS ==========");
          
          return true;
        } catch (error) {
          console.error("[Google OAuth signIn] ========== ERROR ==========");
          console.error("[Google OAuth signIn] Error:", error);
          
          const errorMessage = error instanceof Error ? error.message : "GOOGLE_SIGNIN_ERROR";
          return `${BASE_URL}/login?error=${errorMessage}`;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phone = (user as any).phone;

        // For Google OAuth, get session data from pending map
        if (account?.provider === "google" && user.email) {
          const sessionData = pendingGoogleSessions.get(user.email.toLowerCase());
          
          if (sessionData) {
            token.sessionId = sessionData.sessionId;
            token.accessToken = sessionData.accessToken;
            token.refreshToken = sessionData.refreshToken;
            
            // Clean up
            pendingGoogleSessions.delete(user.email.toLowerCase());
            
            console.log(`[JWT] Retrieved session for Google user: ${user.email}`);
          } else {
            console.warn(`[JWT] No pending session found for: ${user.email}`);
          }
        }
      }

      // Refresh user data for Google OAuth
      if (account?.provider === "google" && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email.toLowerCase() },
          });

          if (dbUser) {
            token.id = dbUser.user_id;
            token.role = dbUser.role;
            token.phone = dbUser.phone;
            token.name = dbUser.name;
            token.picture = dbUser.avatar || "/profile.svg";
          }
        } catch (error) {
          console.error("[JWT] Error fetching user:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session.user as any).phone = token.phone as string;
        (session.user as any).sessionId = token.sessionId as string;
        (session.user as any).accessToken = token.accessToken as string;
        (session.user as any).refreshToken = token.refreshToken as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string || "/profile.svg";
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log('[Redirect] url:', url);
      console.log('[Redirect] baseUrl:', baseUrl);

      const CORRECT_BASE_URL = BASE_URL;

      // Handle errors
      if (url.includes("error=")) {
        console.log('[Redirect] Error detected');
        
        if (url.startsWith(CORRECT_BASE_URL)) {
          return url;
        }
        
        try {
          const urlObj = new URL(url.startsWith('http') ? url : `${CORRECT_BASE_URL}${url}`);
          const errorParam = urlObj.searchParams.get('error');
          return `${CORRECT_BASE_URL}/login?error=${errorParam}`;
        } catch (e) {
          return `${CORRECT_BASE_URL}/login?error=CALLBACK_ERROR`;
        }
      }

      // ✅ SIMPLIFIED: Direct redirect to home for Google OAuth
      // No intermediate callback page needed
      if (url.includes('/api/auth/callback/google')) {
        console.log('[Redirect] Google callback - redirecting to home');
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