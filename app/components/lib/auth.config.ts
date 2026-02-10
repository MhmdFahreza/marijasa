// app/components/lib/auth.config.ts
// ✅ FIXED: All redirects use absolute URLs for Next.js 15 compatibility
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

// ✅ CRITICAL: Get absolute BASE_URL for all redirects
function getBaseUrl(): string {
  // Priority 1: NEXTAUTH_URL (most reliable)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/+$/, "").trim();
  }
  
  // Priority 2: NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "").trim();
  }
  
  // Priority 3: VERCEL_URL (auto-set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback: localhost
  return "http://localhost:3000";
}

const BASE_URL = getBaseUrl();

console.log("[Auth Config] BASE_URL:", BASE_URL);

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
          scope: "openid email profile",
        },
      },
      // ✅ Add allowDangerousEmailAccountLinking to prevent account linking issues
      allowDangerousEmailAccountLinking: false,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("EMAIL_PASSWORD_REQUIRED");
        }

        const identifier = credentials.identifier.trim();
        const isEmail = identifier.includes("@");
        let user = null;

        try {
          if (isEmail) {
            user = await prisma.user.findUnique({
              where: { email: identifier.toLowerCase() },
            });
            if (!user) {
              throw new Error("EMAIL_NOT_REGISTERED");
            }
          } else {
            const normalizedPhone = normalizePhone(identifier);
            user = await prisma.user.findFirst({
              where: { phone: normalizedPhone },
            });
            if (!user) {
              throw new Error("PHONE_NOT_REGISTERED");
            }
          }

          if (!user.password) {
            throw new Error("GOOGLE_ACCOUNT");
          }
          if (!user.email_verified) {
            throw new Error("EMAIL_NOT_VERIFIED");
          }
          if (!user.is_active) {
            throw new Error("ACCOUNT_INACTIVE");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isPasswordValid) {
            throw new Error("INVALID_PASSWORD");
          }

          return {
            id: user.user_id,
            email: user.email,
            name: user.name,
            image: user.avatar || "/profile.svg",
            role: user.role,
            phone: user.phone,
          };
        } catch (error) {
          console.error("[Credentials Auth] Error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    // ============================================
    // signIn: Validate user before allowing login
    // ============================================
    async signIn({ user, account, profile }) {
      // Only validate Google OAuth
      if (account?.provider !== "google") return true;

      try {
        console.log("[Google signIn] Validating:", user.email);

        const userEmail = user.email?.toLowerCase();
        if (!userEmail) {
          console.error("[Google signIn] No email from Google");
          // ✅ ABSOLUTE URL
          return `${BASE_URL}/login?error=NO_EMAIL`;
        }

        // Check if user exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: userEmail },
          select: {
            user_id: true,
            email: true,
            is_active: true,
            email_verified: true,
            avatar: true,
            name: true,
          },
        });

        if (!existingUser) {
          console.error("[Google signIn] User not registered:", userEmail);
          // ✅ ABSOLUTE URL
          return `${BASE_URL}/login?error=USER_NOT_REGISTERED`;
        }

        if (!existingUser.is_active) {
          console.error("[Google signIn] Account inactive:", userEmail);
          // ✅ ABSOLUTE URL
          return `${BASE_URL}/login?error=ACCOUNT_INACTIVE`;
        }

        // Update user info if needed
        const needsUpdate =
          !existingUser.email_verified ||
          (!existingUser.avatar && user.image) ||
          (user.name && existingUser.name !== user.name);

        if (needsUpdate) {
          try {
            const updateData: Record<string, any> = {};
            
            if (!existingUser.email_verified) {
              updateData.email_verified = true;
            }
            
            if (!existingUser.avatar && user.image) {
              updateData.avatar = user.image;
            }
            
            if (user.name && existingUser.name !== user.name) {
              updateData.name = user.name;
            }

            await prisma.user.update({
              where: { email: userEmail },
              data: updateData,
            });
            
            console.log("[Google signIn] User updated");
          } catch (err) {
            console.error("[Google signIn] Update error:", err);
            // Don't fail login if update fails
          }
        }

        console.log("[Google signIn] ✅ Validation successful");
        return true;
      } catch (error) {
        console.error("[Google signIn] Error:", error);
        // ✅ ABSOLUTE URL
        return `${BASE_URL}/login?error=SIGNIN_ERROR`;
      }
    },

    // ============================================
    // jwt: Create session & tokens
    // ============================================
    async jwt({ token, user, account, trigger }) {
      // Only process on initial sign-in
      if (!user || !account) return token;

      try {
        console.log("[JWT] Processing sign-in, provider:", account.provider);

        if (account.provider === "google" && user.email) {
          const email = user.email.toLowerCase();

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

          if (!dbUser) {
            console.error("[JWT] User not found after signIn:", email);
            // Set basic token data
            token.id = user.id;
            token.email = email;
            token.name = user.name;
            token.picture = user.image || "/profile.svg";
            return token;
          }

          // Set user data in token
          token.id = dbUser.user_id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.phone = dbUser.phone;
          token.picture = dbUser.avatar || user.image || "/profile.svg";

          // Create session and tokens in Redis
          try {
            const sessionId = createSessionId();

            // Store session
            const sessionResult = await storeSession(sessionId, {
              userId: dbUser.user_id,
              email: dbUser.email,
              role: dbUser.role,
              createdAt: Date.now(),
              lastActivity: Date.now(),
            });

            if (!sessionResult.success) {
              console.error("[JWT] Session storage failed");
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

            // Store tokens in Redis
            await storeTokens(sessionId, accessToken, refreshToken);

            // Add to token for cookie setting in middleware
            token.sessionId = sessionId;
            token.accessToken = accessToken;
            token.refreshToken = refreshToken;

            console.log("[JWT] ✅ Session created:", sessionId);
          } catch (sessionError) {
            console.error("[JWT] Session creation error:", sessionError);
          }
        } else if (account.provider === "credentials") {
          token.id = user.id;
          token.role = (user as any).role;
          token.phone = (user as any).phone;
        }

        return token;
      } catch (error) {
        console.error("[JWT] Error:", error);
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
          session.user.name = (token.name as string) || "User";
          session.user.image = (token.picture as string) || "/profile.svg";
          
          (session.user as any).phone = (token.phone as string) || null;
          (session.user as any).sessionId = (token.sessionId as string) || null;
          (session.user as any).accessToken = (token.accessToken as string) || null;
          (session.user as any).refreshToken = (token.refreshToken as string) || null;
        }
      } catch (error) {
        console.error("[Session] Error:", error);
      }
      return session;
    },

    // ============================================
    // redirect: Handle post-auth redirects
    // ✅ CRITICAL FIX: Always return ABSOLUTE URLs
    // ============================================
    async redirect({ url, baseUrl }) {
      try {
        console.log("[Redirect] url:", url, "| baseUrl:", baseUrl);

        // ✅ HANDLE ERRORS - Always absolute URL
        if (url.includes("error=")) {
          try {
            const urlObj = new URL(
              url.startsWith("http") ? url : `${BASE_URL}${url}`
            );
            const errorParam = urlObj.searchParams.get("error");

            // Map NextAuth errors to friendly codes
            const errorMap: Record<string, string> = {
              access_denied: "ACCESS_DENIED",
              AccessDenied: "ACCESS_DENIED",
              OAuthAccountNotLinked: "OAuthAccountNotLinked",
              OAuthSignin: "OAuthSignin",
              OAuthCallback: "OAuthCallback",
              Callback: "Callback",
              Configuration: "Configuration",
            };

            const mappedError = errorParam
              ? errorMap[errorParam] || errorParam
              : "UNKNOWN_ERROR";

            const errorUrl = `${BASE_URL}/login?error=${mappedError}`;
            console.log("[Redirect] ✅ Error redirect (absolute):", errorUrl);
            return errorUrl;
          } catch (parseError) {
            console.error("[Redirect] Parse error:", parseError);
            return `${BASE_URL}/login?error=CALLBACK_ERROR`;
          }
        }

        // ✅ GOOGLE CALLBACK - Redirect to home (absolute)
        if (url.includes("/api/auth/callback/google")) {
          console.log("[Redirect] ✅ Google callback → home (absolute)");
          return BASE_URL;
        }

        // ✅ ABSOLUTE URL - Return as-is if starts with http
        if (url.startsWith("http://") || url.startsWith("https://")) {
          // Ensure it's our domain
          try {
            const urlObj = new URL(url);
            const baseUrlObj = new URL(BASE_URL);
            
            if (urlObj.hostname === baseUrlObj.hostname) {
              console.log("[Redirect] ✅ Same origin, allowing:", url);
              return url;
            }
          } catch (e) {
            console.error("[Redirect] URL parse error:", e);
          }
        }

        // ✅ RELATIVE URL - Convert to absolute
        if (url.startsWith("/")) {
          const absoluteUrl = `${BASE_URL}${url}`;
          console.log("[Redirect] ✅ Relative → Absolute:", absoluteUrl);
          return absoluteUrl;
        }

        // ✅ DEFAULT - Home page (absolute)
        console.log("[Redirect] ✅ Default → home (absolute)");
        return BASE_URL;
      } catch (error) {
        console.error("[Redirect] Fatal error:", error);
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
  debug: false,
  logger: {
    error(code, ...message) {
      // Suppress DEP0169 warnings
      if (String(code).includes("DEP0169")) return;
      console.error("[NextAuth Error]", code, ...message);
    },
    warn(code, ...message) {
      if (String(code).includes("DEP0169")) return;
      if (process.env.NODE_ENV === "development") {
        console.warn("[NextAuth Warning]", code, ...message);
      }
    },
    debug() {
      // Disabled in production
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log("[NextAuth Event] Sign in:", {
        email: user.email,
        provider: account?.provider,
      });
    },
    async signOut({ token }) {
      console.log("[NextAuth Event] Sign out:", {
        email: (token as any)?.email,
      });
    },
  },
};