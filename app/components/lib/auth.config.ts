// app/components/lib/auth.config.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
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
  adapter: PrismaAdapter(prisma) as any,
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
          // Cari berdasarkan email
          user = await prisma.user.findUnique({
            where: { email: identifier.toLowerCase() }
          });

          if (!user) {
            throw new Error("Email belum terdaftar. Silakan daftar terlebih dahulu.");
          }
        } else {
          // Normalisasi nomor telepon
          const normalizedPhone = normalizePhone(identifier);
          
          user = await prisma.user.findFirst({
            where: { phone: normalizedPhone }
          });

          if (!user) {
            throw new Error("Nomor telepon belum terdaftar. Silakan daftar terlebih dahulu.");
          }
        }

        // Cek apakah user memiliki password (bukan pure OAuth user)
        if (!user.password) {
          throw new Error("Akun ini terdaftar melalui Google. Silakan login dengan Google.");
        }

        // Cek apakah email sudah diverifikasi
        if (!user.email_verified) {
          throw new Error("Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.");
        }

        // Cek apakah akun aktif
        if (!user.is_active) {
          throw new Error("Akun Anda tidak aktif. Silakan hubungi admin.");
        }

        // Verifikasi password
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
      if (account?.provider === "google") {
        try {
          const userEmail = user.email?.toLowerCase();
          
          if (!userEmail) {
            console.error("Google sign in: No email provided");
            return "/login?error=NO_EMAIL";
          }

          // Cek apakah user sudah terdaftar di database
          const existingUser = await prisma.user.findUnique({
            where: { email: userEmail }
          });

          if (!existingUser) {
            // User belum terdaftar - tolak login Google dan arahkan ke halaman daftar
            console.log(`Google sign in rejected: Email ${userEmail} not registered`);
            return "/login?error=USER_NOT_REGISTERED";
          }

          // Cek apakah akun aktif
          if (!existingUser.is_active) {
            console.log(`Google sign in rejected: Account ${userEmail} is inactive`);
            return "/login?error=ACCOUNT_INACTIVE";
          }

          // User sudah terdaftar - update email_verified jika belum
          if (!existingUser.email_verified) {
            await prisma.user.update({
              where: { email: userEmail },
              data: { email_verified: true }
            });
          }

          // Cek apakah account Google sudah ter-link
          const existingAccount = await prisma.account.findFirst({
            where: {
              user_id: existingUser.user_id,
              provider: "google"
            }
          });

          // Jika belum ada account Google yang ter-link, buat baru
          if (!existingAccount) {
            await prisma.account.create({
              data: {
                user_id: existingUser.user_id,
                type: account.type,
                provider: account.provider,
                provider_account_id: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | null
              }
            });
            console.log(`Google account linked for user: ${userEmail}`);
          }

          return true;
        } catch (error) {
          console.error("Error during Google sign in:", error);
          return "/login?error=GOOGLE_SIGNIN_ERROR";
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phone = (user as any).phone;
      }
      
      // Untuk Google OAuth, ambil data user dari database
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() }
        });
        if (dbUser) {
          token.id = dbUser.user_id;
          token.role = dbUser.role;
          token.phone = dbUser.phone;
          token.name = dbUser.name;
          token.picture = dbUser.avatar || "/profile.svg";
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
      // Handle berbagai error dari Google OAuth
      if (url.includes("error=USER_NOT_REGISTERED")) {
        return `${baseUrl}/login?error=USER_NOT_REGISTERED`;
      }
      if (url.includes("error=ACCOUNT_INACTIVE")) {
        return `${baseUrl}/login?error=ACCOUNT_INACTIVE`;
      }
      if (url.includes("error=NO_EMAIL")) {
        return `${baseUrl}/login?error=NO_EMAIL`;
      }
      if (url.includes("error=GOOGLE_SIGNIN_ERROR")) {
        return `${baseUrl}/login?error=GOOGLE_SIGNIN_ERROR`;
      }
      
      // Jika sudah di baseUrl, return baseUrl
      if (url.startsWith(baseUrl)) return url;
      
      // Jika relative URL
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
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