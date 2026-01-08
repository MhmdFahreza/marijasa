// app/components/lib/auth.config.ts
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
          const userEmail = user.email?.toLowerCase();

          if (!userEmail) {
            console.error("[Google OAuth] No email provided");
            return false;
          }

          console.log(`[Google OAuth] Attempting sign in for: ${userEmail}`);

          // Check if user is registered in database
          const existingUser = await prisma.user.findUnique({
            where: { email: userEmail },
          });

          if (!existingUser) {
            console.log(`[Google OAuth] User not registered: ${userEmail}`);
            return "/login?error=USER_NOT_REGISTERED";
          }

          // Check if account is active
          if (!existingUser.is_active) {
            console.log(`[Google OAuth] Account inactive: ${userEmail}`);
            return "/login?error=ACCOUNT_INACTIVE";
          }

          // Update email_verified if not already
          if (!existingUser.email_verified) {
            await prisma.user.update({
              where: { email: userEmail },
              data: { email_verified: true },
            });
            console.log(`[Google OAuth] Email verified for: ${userEmail}`);
          }

          // Update avatar from Google if user doesn't have one
          if (!existingUser.avatar && user.image) {
            await prisma.user.update({
              where: { email: userEmail },
              data: { avatar: user.image },
            });
            console.log(`[Google OAuth] Avatar updated for: ${userEmail}`);
          }

          console.log(`[Google OAuth] Sign in successful for: ${userEmail}`);
          return true;
        } catch (error) {
          console.error("[Google OAuth] Error during sign in:", error);
          return "/login?error=GOOGLE_SIGNIN_ERROR";
        }
      }

      // For credentials provider
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

              // Add to token for cookie creation
              token.sessionId = sessionId;
              token.accessToken = accessToken;
              token.refreshToken = refreshToken;

              console.log(`[Google OAuth] Created session: ${sessionId} for ${dbUser.email}`);
            }
          } catch (error) {
            console.error("[Google OAuth] Error creating session:", error);
          }
        }
      }

      // For Google OAuth, get FRESH user data from database every time
      if (account?.provider === "google" && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email.toLowerCase() },
          });

          if (dbUser) {
            token.id = dbUser.user_id;
            token.role = dbUser.role;
            token.phone = dbUser.phone;
            token.name = dbUser.name; // Fresh from database
            token.picture = dbUser.avatar || token.picture || "/profile.svg"; // Fresh from database
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
        session.user.image = token.picture as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle error redirects
      if (url.includes("error=")) {
        return url;
      }

      // If URL starts with baseUrl, allow redirect
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // If relative URL
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // Default to baseUrl (home page)
      return baseUrl;
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
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false, // IMPORTANT: Disable debug to suppress errors
  logger: {
    // Custom logger to suppress "No session found" errors
    error(code, metadata) {
      // Suppress specific NextAuth errors that are expected
      if (code === "CLIENT_FETCH_ERROR" && typeof metadata?.message === "string" && metadata.message.includes("No session found")) {
        // This is expected when user is not logged in, don't log it
        return;
      }
      // Log other errors normally
      console.error("[NextAuth Error]", code, metadata);
    },
    warn(code) {
      // Suppress warnings too
      if (code.includes("session")) return;
      console.warn("[NextAuth Warning]", code);
    },
    debug: () => {}, // Disable debug logs
  },
};