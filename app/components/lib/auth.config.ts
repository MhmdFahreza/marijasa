// app/components/lib/auth.config.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/app/components/lib/prisma";
import bcrypt from "bcryptjs";

// Normalisasi nomor telepon ke format +62
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('08')) {
    cleaned = '+62' + cleaned.substring(1);
  } else if (cleaned.startsWith('62')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+62')) {
    cleaned = '+62' + cleaned;
  }
  return cleaned;
}

export const authOptions: NextAuthOptions = {
  // REMOVED: PrismaAdapter - kita handle manual untuk control penuh
  // adapter: PrismaAdapter(prisma) as any,
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Email/Nomor telepon dan password harus diisi");
        }

        const identifier = credentials.identifier.trim();
        const isEmail = identifier.includes('@');

        let user = null;

        if (isEmail) {
          user = await prisma.user.findUnique({
            where: { email: identifier.toLowerCase() }
          });

          if (!user) {
            throw new Error("Email belum terdaftar. Silakan daftar terlebih dahulu.");
          }
        } else {
          const normalizedPhone = normalizePhone(identifier);
          
          user = await prisma.user.findFirst({
            where: { phone: normalizedPhone }
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
          phone: user.phone
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth
      if (account?.provider === "google") {
        try {
          const userEmail = user.email?.toLowerCase();
          
          if (!userEmail) {
            console.error("Google sign in: No email provided");
            return "/login?error=NO_EMAIL";
          }

          console.log(`[Google OAuth] Attempting sign in for: ${userEmail}`);

          // Cek apakah user sudah terdaftar di database
          const existingUser = await prisma.user.findUnique({
            where: { email: userEmail }
          });

          if (!existingUser) {
            console.log(`[Google OAuth] User not registered: ${userEmail}`);
            return "/login?error=USER_NOT_REGISTERED";
          }

          // Cek apakah akun aktif
          if (!existingUser.is_active) {
            console.log(`[Google OAuth] Account inactive: ${userEmail}`);
            return "/login?error=ACCOUNT_INACTIVE";
          }

          // Update email_verified jika belum
          if (!existingUser.email_verified) {
            await prisma.user.update({
              where: { email: userEmail },
              data: { email_verified: true }
            });
            console.log(`[Google OAuth] Email verified for: ${userEmail}`);
          }

          // Update avatar dari Google jika user belum punya avatar
          if (!existingUser.avatar && user.image) {
            await prisma.user.update({
              where: { email: userEmail },
              data: { avatar: user.image }
            });
          }

          // Cek dan link Google account jika belum ada
          const existingAccount = await prisma.account.findFirst({
            where: {
              user_id: existingUser.user_id,
              provider: "google"
            }
          });

          if (!existingAccount && account.providerAccountId) {
            // Cek apakah providerAccountId sudah dipakai user lain
            const accountWithSameProviderId = await prisma.account.findFirst({
              where: {
                provider: "google",
                provider_account_id: account.providerAccountId
              }
            });

            if (!accountWithSameProviderId) {
              await prisma.account.create({
                data: {
                  user_id: existingUser.user_id,
                  type: account.type || "oauth",
                  provider: account.provider,
                  provider_account_id: account.providerAccountId,
                  access_token: account.access_token || null,
                  refresh_token: account.refresh_token || null,
                  expires_at: account.expires_at || null,
                  token_type: account.token_type || null,
                  scope: account.scope || null,
                  id_token: account.id_token || null,
                  session_state: typeof account.session_state === 'string' ? account.session_state : null
                }
              });
              console.log(`[Google OAuth] Account linked for: ${userEmail}`);
            }
          }

          console.log(`[Google OAuth] Sign in successful for: ${userEmail}`);
          return true;

        } catch (error) {
          console.error("[Google OAuth] Error during sign in:", error);
          return "/login?error=GOOGLE_SIGNIN_ERROR";
        }
      }
      
      // Untuk credentials provider
      return true;
    },

    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phone = (user as any).phone;
      }
      
      // Untuk Google OAuth, ambil data user dari database
      if (account?.provider === "google" && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email.toLowerCase() }
          });
          
          if (dbUser) {
            token.id = dbUser.user_id;
            token.role = dbUser.role;
            token.phone = dbUser.phone;
            token.name = dbUser.name;
            token.picture = dbUser.avatar || token.picture || "/profile.svg";
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
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle error redirects
      if (url.includes("error=")) {
        // Jika URL sudah mengandung error parameter, redirect ke login dengan error
        const urlObj = new URL(url, baseUrl);
        const error = urlObj.searchParams.get("error");
        if (error) {
          return `${baseUrl}/login?error=${error}`;
        }
      }
      
      // Jika URL dimulai dengan baseUrl, allow redirect
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Jika relative URL
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Default ke baseUrl
      return baseUrl;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development"
};