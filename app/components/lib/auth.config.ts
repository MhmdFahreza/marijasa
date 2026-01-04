// app/components/lib/auth.config.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/app/components/lib/prisma";
import bcrypt from "bcryptjs";

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

        const identifier = credentials.identifier.trim().toLowerCase();
        const isEmail = identifier.includes('@');

        let user = null;

        if (isEmail) {
          // Cari berdasarkan email
          user = await prisma.user.findUnique({
            where: { email: identifier }
          });
        } else {
          // Cari berdasarkan nomor telepon
          // Normalisasi nomor telepon
          let phone = identifier.replace(/[\s-]/g, '');
          if (phone.startsWith('08')) {
            phone = '+62' + phone.substring(1);
          } else if (phone.startsWith('62')) {
            phone = '+' + phone;
          }
          
          user = await prisma.user.findFirst({
            where: { phone: phone }
          });
        }

        if (!user) {
          throw new Error("Email/Nomor telepon tidak terdaftar. Silakan daftar terlebih dahulu.");
        }

        if (!user.password) {
          throw new Error("Akun ini terdaftar melalui Google. Silakan login dengan Google.");
        }

        if (!user.email_verified) {
          throw new Error("Email belum diverifikasi. Silakan verifikasi email Anda.");
        }

        if (!user.is_active) {
          throw new Error("Akun Anda tidak aktif. Silakan hubungi admin.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Password salah");
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
          // Cek apakah user sudah terdaftar
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // User belum terdaftar - tolak login Google
            return "/login?error=USER_NOT_REGISTERED";
          }

          // User sudah terdaftar - update email_verified jika belum
          if (!existingUser.email_verified) {
            await prisma.user.update({
              where: { email: user.email! },
              data: { email_verified: true }
            });
          }

          // Cek apakah account sudah ter-link
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
          }

          return true;
        } catch (error) {
          console.error("Error during Google sign in:", error);
          return false;
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
          where: { email: token.email }
        });
        if (dbUser) {
          token.id = dbUser.user_id;
          token.role = dbUser.role;
          token.phone = dbUser.phone;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session.user as any).phone = token.phone as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Jika URL mengandung error parameter, redirect ke login dengan error
      if (url.includes("error=USER_NOT_REGISTERED")) {
        return `${baseUrl}/login?error=USER_NOT_REGISTERED`;
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
