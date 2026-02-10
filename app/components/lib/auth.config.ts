// app/components/lib/auth.config.ts - FIXED GOOGLE OAUTH CALLBACK ERROR
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
    console.log("[Auth Config] ✅ Using NEXTAUTH_URL:", url);
    return url;
  }
  
  // Priority 2: NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "").trim();
    console.log("[Auth Config] ⚠️ Using NEXT_PUBLIC_APP_URL:", url);
    return url;
  }
  
  // Priority 3: VERCEL_URL
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    console.log("[Auth Config] ⚠️ Using VERCEL_URL:", url);
    return url;
  }
  
  // Fallback
  console.log("[Auth Config] ⚠️ Using localhost fallback");
  return "http://localhost:3000";
}

const BASE_URL = getBaseUrl();

// ============================================
// Timeout helper to prevent serverless timeout
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
          console.log("[Google signIn] Profile:", JSON.stringify(profile, null, 2));

          const userEmail = user.email?.toLowerCase();
          if (!userEmail) {
            console.error("[Google signIn] ❌ No email from Google");
            return `${BASE_URL}/login?error=NO_EMAIL`;
          }

          // Find user in database
          console.log("[Google signIn] 🔍 Finding user in DB:", userEmail);
          
          const existingUser = await withTimeout(
            prisma.user.findUnique({ 
              where: { email: userEmail },
              select: {
                user_id: true,
                email: true,
                name: true,
                is_active: true,
                email_verified: true,
                avatar: true,
              }
            }),
            7000, // 7 second timeout
            null,
            "Prisma findUser"
          );

          if (!existingUser) {
            console.error("[Google signIn] ❌ User not found in DB:", userEmail);
            return `${BASE_URL}/login?error=USER_NOT_REGISTERED`;
          }

          console.log("[Google signIn] ✅ User found:", existingUser.email);

          if (!existingUser.is_active) {
            console.error("[Google signIn] ❌ User inactive:", userEmail);
            return `${BASE_URL}/login?error=ACCOUNT_INACTIVE`;
          }

          // Update email_verified and avatar if needed
          const updateData: Record<string, any> = {};
          if (!existingUser.email_verified) {
            updateData.email_verified = true;
            console.log("[Google signIn] 📝 Will verify email");
          }
          if (!existingUser.avatar && user.image) {
            updateData.avatar = user.image;
            console.log("[Google signIn] 📝 Will update avatar");
          }

          if (Object.keys(updateData).length > 0) {
            console.log("[Google signIn] 💾 Updating user data...");
            withTimeout(
              prisma.user.update({ 
                where: { email: userEmail }, 
                data: updateData 
              }),
              5000,
              null,
              "Prisma updateUser"
            ).catch((err) => {
              console.error("[Google signIn] ⚠️ Update failed:", err);
              // Don't block login if update fails
            });
          }

          console.log("[Google signIn] ✅ Validation complete for:", userEmail);
          return true;
        }

        return true;
      } catch (error) {
        console.error("[Google signIn] ❌ Unexpected error:", error);
        const msg = error instanceof Error ? error.message : "SIGNIN_ERROR";
        return `${BASE_URL}/login?error=${encodeURIComponent(msg)}`;
      }
    },

    // ============================================
    // jwt: Create session & tokens for Google OAuth
    // ============================================
    async jwt({ token, user, account, trigger }) {
      try {
        // ===== INITIAL SIGN-IN =====
        if (user && account) {
          console.log("[JWT] 🔐 Initial sign-in, provider:", account.provider);

          if (account.provider === "google" && user.email) {
            console.log("[JWT] 🔐 Processing Google OAuth for:", user.email);

            const email = user.email.toLowerCase();

            // Fetch user from DB
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
              7000,
              null,
              "JWT findUser"
            );

            if (!dbUser) {
              console.error("[JWT] ❌ User not found in DB:", email);
              // Set minimal token data
              token.id = user.id;
              token.email = email;
              token.name = user.name;
              token.picture = user.image || "/profile.svg";
              return token;
            }

            console.log("[JWT] ✅ DB user found:", dbUser.email);

            // Set token fields
            token.id = dbUser.user_id;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.role = dbUser.role;
            token.phone = dbUser.phone;
            token.picture = dbUser.avatar || user.image || "/profile.svg";

            // ✅ CREATE SESSION AND TOKENS
            try {
              const sessionId = createSessionId();
              console.log("[JWT] 💾 Creating session:", sessionId.substring(0, 8) + "...");

              // Store session in Redis
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
                console.error("[JWT] ❌ Failed to store session");
                // Continue without session - user can still use NextAuth session
                return token;
              }

              console.log("[JWT] ✅ Session stored in Redis");

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
              await withTimeout(
                storeTokens(sessionId, accessToken, refreshToken),
                5000,
                { success: false },
                "JWT storeTokens"
              );

              // Add to JWT token
              token.sessionId = sessionId;
              token.accessToken = accessToken;
              token.refreshToken = refreshToken;

              console.log("[JWT] ✅ Session & tokens created for:", dbUser.email);
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
        console.error("[JWT] ❌ Unexpected error:", error);
        // Return token as-is to avoid breaking the flow
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
        console.log("[Redirect] 🔄 url:", url, "| baseUrl:", baseUrl, "| BASE_URL:", BASE_URL);

        // Handle errors
        if (url.includes("error=")) {
          console.log("[Redirect] ⚠️ Error detected in URL");
          
          if (url.startsWith(BASE_URL)) {
            console.log("[Redirect] ✅ Error URL matches BASE_URL");
            return url;
          }

          try {
            const urlObj = new URL(url.startsWith("http") ? url : `${BASE_URL}${url}`);
            const errorParam = urlObj.searchParams.get("error");
            const errorUrl = `${BASE_URL}/login?error=${errorParam || "CALLBACK_ERROR"}`;
            console.log("[Redirect] ⚠️ Redirecting to error page:", errorUrl);
            return errorUrl;
          } catch {
            console.log("[Redirect] ❌ Failed to parse error URL");
            return `${BASE_URL}/login?error=CALLBACK_ERROR`;
          }
        }

        // Google callback - redirect to home
        if (url.includes("/api/auth/callback/google")) {
          console.log("[Redirect] ✅ Google callback, redirecting to home");
          return BASE_URL;
        }

        // URL starts with BASE_URL
        if (url.startsWith(BASE_URL)) {
          console.log("[Redirect] ✅ URL matches BASE_URL");
          return url;
        }

        // Relative URL
        if (url.startsWith("/")) {
          const fullUrl = `${BASE_URL}${url}`;
          console.log("[Redirect] ✅ Relative URL, full URL:", fullUrl);
          return fullUrl;
        }

        // Default
        console.log("[Redirect] ✅ Default redirect to BASE_URL");
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
  debug: process.env.NODE_ENV === "development", // Enable debug in dev
  logger: {
    error(code, ...message) {
      const codeStr = String(code);
      // Ignore deprecation warnings
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
    debug(...message) {
      if (process.env.NODE_ENV === "development") {
        console.log("[NextAuth Debug]", ...message);
      }
    },
  },
  events: {
    async signIn({ user, account, profile }) {
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