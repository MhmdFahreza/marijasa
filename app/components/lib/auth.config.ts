// app/components/lib/auth.config.ts - PRODUCTION FIX
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

// Get base URL - PRODUCTION SAFE
function getBaseUrl(): string {
  // Production: use NEXTAUTH_URL or VERCEL_URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.trim().replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

const BASE_URL = getBaseUrl();
const isProduction = process.env.NODE_ENV === "production";

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
          // FIX: Set redirect_uri in authorization params instead
          redirect_uri: `${BASE_URL}/api/auth/callback/google`,
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
          const normalizedPhone = identifier.replace(/[\s-]/g, "");
          user = await prisma.user.findFirst({
            where: { phone: { contains: normalizedPhone } },
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
    async signIn({ user, account, profile }) {
      // Handle Google OAuth
      if (account?.provider === "google") {
        try {
          const userEmail = user.email?.toLowerCase();
          if (!userEmail) {
            console.error("[Google OAuth] No email provided");
            return false;
          }

          console.log(`[Google OAuth] Sign in attempt for: ${userEmail}`);

          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: userEmail },
          });

          if (!existingUser) {
            console.log(`[Google OAuth] User not registered: ${userEmail}`);
            return `/login?error=USER_NOT_REGISTERED`;
          }

          if (!existingUser.is_active) {
            console.log(`[Google OAuth] Account inactive: ${userEmail}`);
            return `/login?error=ACCOUNT_INACTIVE`;
          }

          // Update email_verified if not already
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

          console.log(`[Google OAuth] ✅ Sign in successful for: ${userEmail}`);
          return true;
        } catch (error) {
          console.error("[Google OAuth] Error during sign in:", error);
          return `/login?error=GOOGLE_SIGNIN_ERROR`;
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
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email!.toLowerCase() },
            });

            if (dbUser) {
              const sessionId = createSessionId();

              await storeSession(sessionId, {
                userId: dbUser.user_id,
                email: dbUser.email,
                role: dbUser.role,
                createdAt: Date.now(),
                lastActivity: Date.now(),
              });

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

              await storeTokens(sessionId, accessToken, refreshToken);

              token.sessionId = sessionId;
              token.accessToken = accessToken;
              token.refreshToken = refreshToken;

              console.log(`[Google OAuth] ✅ Session created: ${sessionId}`);
            }
          } catch (error) {
            console.error("[Google OAuth] Error creating session:", error);
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
        session.user.name = token.name as string;
        session.user.image = token.picture as string || "/profile.svg";
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log('[Redirect Callback] url:', url, 'baseUrl:', baseUrl);

      // Handle error redirects
      if (url.includes("error=")) {
        return `${BASE_URL}${url}`;
      }

      // For Google OAuth success, redirect to home
      if (url.includes('/api/auth/callback/google')) {
        return `${BASE_URL}/`;
      }

      // Allow absolute URLs
      if (url.startsWith('http')) {
        return url;
      }

      // Resolve relative URLs
      if (url.startsWith('/')) {
        return `${BASE_URL}${url}`;
      }

      // Default to home
      return `${BASE_URL}/`;
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
        sameSite: isProduction ? "none" : "lax", // CRITICAL: "none" for production
        path: "/",
        secure: isProduction, // CRITICAL: true in production
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        secure: isProduction,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};