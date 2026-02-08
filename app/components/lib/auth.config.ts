// app/components/lib/auth.config.ts - FIXED VERSION WITH BETTER ERROR HANDLING
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
  // 1. Production: NEXTAUTH_URL (MUST be set in Vercel)
  if (process.env.NEXTAUTH_URL) {
    const url = process.env.NEXTAUTH_URL.trim();
    console.log('[Auth Config] Using NEXTAUTH_URL:', url);
    return url;
  }

  // 2. Vercel auto-sets VERCEL_URL (production/preview deployments)
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    console.log('[Auth Config] Using VERCEL_URL:', url);
    return url;
  }

  // 3. Fallback for other deployments
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim();
    console.log('[Auth Config] Using NEXT_PUBLIC_APP_URL:', url);
    return url;
  }

  // 4. Development fallback
  const devUrl = "http://localhost:3000";
  console.log('[Auth Config] Using development fallback:', devUrl);
  return devUrl;
}

const BASE_URL = getBaseUrl();

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

          // CRITICAL FIX: Instead of returning false (which causes access_denied),
          // we throw an error or redirect to error page
          if (!userEmail) {
            console.error("[Google OAuth signIn] ❌ No email provided from Google");
            // Throw error instead of returning false
            throw new Error("NO_EMAIL");
          }

          console.log(`[Google OAuth signIn] Processing login for: ${userEmail}`);

          // Check if user is registered in database
          const existingUser = await prisma.user.findUnique({
            where: { email: userEmail },
          });

          if (!existingUser) {
            console.log(`[Google OAuth signIn] ❌ User not registered: ${userEmail}`);
            // Throw error instead of returning redirect URL
            throw new Error("USER_NOT_REGISTERED");
          }

          // Check if account is active
          if (!existingUser.is_active) {
            console.log(`[Google OAuth signIn] ❌ Account inactive: ${userEmail}`);
            throw new Error("ACCOUNT_INACTIVE");
          }

          // Update email_verified if not already
          if (!existingUser.email_verified) {
            await prisma.user.update({
              where: { email: userEmail },
              data: { email_verified: true },
            });
            console.log(`[Google OAuth signIn] ✅ Email verified for: ${userEmail}`);
          }

          // Only update avatar if user doesn't have one
          if (!existingUser.avatar && user.image) {
            await prisma.user.update({
              where: { email: userEmail },
              data: { avatar: user.image },
            });
            console.log(`[Google OAuth signIn] ✅ Avatar updated for: ${userEmail}`);
          }

          console.log(`[Google OAuth signIn] ✅ Sign in successful for: ${userEmail}`);
          console.log("[Google OAuth signIn] ========== SUCCESS ==========");
          
          return true;
        } catch (error) {
          console.error("[Google OAuth signIn] ========== ERROR ==========");
          console.error("[Google OAuth signIn] Error:", error);
          
          // Convert error to redirect URL
          const errorMessage = error instanceof Error ? error.message : "GOOGLE_SIGNIN_ERROR";
          const errorUrl = `${BASE_URL}/login?error=${errorMessage}`;
          
          console.log("[Google OAuth signIn] Redirecting to error URL:", errorUrl);
          
          // Return redirect URL for error page
          // This prevents the access_denied error
          return errorUrl;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phone = (user as any).phone;

        // For Google OAuth, create session and tokens
        if (account?.provider === "google") {
          try {
            console.log("[Google OAuth jwt] ========== START ==========");
            
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email!.toLowerCase() },
            });

            if (dbUser) {
              console.log(`[Google OAuth jwt] Creating session for: ${dbUser.email}`);
              
              // Create session ID
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

              // Store in token for later retrieval
              token.sessionId = sessionId;
              token.accessToken = accessToken;
              token.refreshToken = refreshToken;
              token.customCookiesSet = false; // Flag to track if we've set cookies

              console.log(`[Google OAuth jwt] ✅ Session created: ${sessionId.substring(0, 8)}... for ${dbUser.email}`);
              console.log("[Google OAuth jwt] ========== SUCCESS ==========");
            } else {
              console.error("[Google OAuth jwt] ❌ User not found in database");
            }
          } catch (error) {
            console.error("[Google OAuth jwt] ========== ERROR ==========");
            console.error("[Google OAuth jwt] Error creating session:", error);
          }
        }
      }

      // For Google OAuth, refresh user data
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
          console.error("[JWT Callback] Error fetching user:", error);
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
        (session.user as any).customCookiesSet = token.customCookiesSet as boolean;
        session.user.name = token.name as string;
        session.user.image = token.picture as string || "/profile.svg";
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log('[Redirect Callback] ========== START ==========');
      console.log('[Redirect Callback] url:', url);
      console.log('[Redirect Callback] baseUrl:', baseUrl);

      // CRITICAL FIX: Use BASE_URL constant instead of parameter
      const CORRECT_BASE_URL = BASE_URL;

      // Handle error redirects - always use correct base URL
      if (url.includes("error=")) {
        console.log('[Redirect] Detected error in URL');
        
        // If URL is already absolute with correct domain, use it
        if (url.startsWith(CORRECT_BASE_URL)) {
          console.log('[Redirect] Using error URL as-is:', url);
          return url;
        }
        
        // Extract error parameter and rebuild URL
        try {
          const urlObj = new URL(url.startsWith('http') ? url : `${CORRECT_BASE_URL}${url}`);
          const errorParam = urlObj.searchParams.get('error');
          const errorUrl = `${CORRECT_BASE_URL}/login?error=${errorParam}`;
          console.log('[Redirect] Redirecting to error page:', errorUrl);
          return errorUrl;
        } catch (e) {
          console.error('[Redirect] Error parsing URL:', e);
          return `${CORRECT_BASE_URL}/login?error=CALLBACK_ERROR`;
        }
      }

      // CRITICAL FIX: For Google OAuth, redirect to custom callback page
      // This page will handle setting cookies properly
      if (url.includes('/api/auth/callback/google') || url === `${CORRECT_BASE_URL}/api/auth/signin/google`) {
        const callbackUrl = `${CORRECT_BASE_URL}/auth/google-callback`;
        console.log('[Redirect] Google OAuth - redirecting to custom callback:', callbackUrl);
        return callbackUrl;
      }

      // If URL is absolute and starts with correct base URL, allow it
      if (url.startsWith(CORRECT_BASE_URL)) {
        console.log('[Redirect] URL starts with correct base, allowing:', url);
        return url;
      }

      // If URL is relative, resolve against correct base URL
      if (url.startsWith("/")) {
        const resolvedUrl = `${CORRECT_BASE_URL}${url}`;
        console.log('[Redirect] Resolving relative URL:', resolvedUrl);
        return resolvedUrl;
      }

      // Default: redirect to home
      console.log('[Redirect] Defaulting to home:', CORRECT_BASE_URL);
      return CORRECT_BASE_URL;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors to login page
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
        // CRITICAL: secure must be true in production
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, ...message) {
      // Filter out deprecation warnings
      const codeStr = String(code);
      if (codeStr.includes("DEP0169")) {
        return; // Suppress deprecation warning
      }
      
      // Log OAuth errors with better context
      if (codeStr === "OAUTH_CALLBACK_HANDLER_ERROR" || codeStr === "SIGNIN_OAUTH_ERROR") {
        console.error("[NextAuth Error]", code, ...message);
      } else {
        console.error("[NextAuth Error]", code, ...message);
      }
    },
    warn(code, ...message) {
      const codeStr = String(code);
      // Filter out session warnings and deprecation warnings
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