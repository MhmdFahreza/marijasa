// app/api/mitra/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';
import bcrypt from 'bcryptjs';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  createSessionId, 
  storeSession, 
  storeTokens 
} from '@/app/components/lib/token-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('[Mitra Login API] Login attempt for:', email);

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    // Cari vendor dengan email
    const vendor = await prisma.vendor.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!vendor) {
      console.log('[Mitra Login API] Vendor not found:', email);
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    console.log('[Mitra Login API] Vendor found:', {
      id: vendor.vendor_id,
      email: vendor.email,
      hasPassword: !!vendor.password,
      passwordLength: vendor.password?.length,
      passwordFirstChars: vendor.password?.substring(0, 20)
    });

    // Verifikasi password dengan beberapa kemungkinan:
    let isPasswordValid = false;
    
    // Coba 1: Password adalah plain text (jika di database belum di-hash)
    if (password === vendor.password) {
      isPasswordValid = true;
      console.log('[Mitra Login API] Password match (plain text)');
      
      // Auto-upgrade: Hash password dan simpan ke database
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.vendor.update({
        where: { vendor_id: vendor.vendor_id },
        data: { password: hashedPassword }
      });
      console.log('[Mitra Login API] Auto-upgraded password to bcrypt hash');
      
    } 
    // Coba 2: Password adalah bcrypt hash
    else if (vendor.password.startsWith('$2a$') || vendor.password.startsWith('$2b$') || vendor.password.startsWith('$2y$')) {
      isPasswordValid = await bcrypt.compare(password, vendor.password);
      console.log('[Mitra Login API] Bcrypt comparison result:', isPasswordValid);
    }
    // Coba 3: Password adalah hash MD5 atau lainnya (jika ada migrasi dari sistem lama)
    else {
      // Jika ada format hash lain, bisa ditambahkan di sini
      console.log('[Mitra Login API] Unknown password format');
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      console.log('[Mitra Login API] Invalid password for:', email);
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Cek status vendor
    if (vendor.status !== 'ACTIVE') {
      console.log('[Mitra Login API] Inactive vendor:', email);
      return NextResponse.json(
        { error: 'Akun Anda tidak aktif. Silakan hubungi admin.' },
        { status: 403 }
      );
    }

    // Buat session ID
    const sessionId = createSessionId();
    console.log('[Mitra Login API] Created session:', sessionId);

    // Buat payload untuk token
    const tokenPayload = {
      userId: vendor.vendor_id,
      email: vendor.email,
      role: 'vendor',
      sessionId,
    };

    // Generate tokens
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    console.log('[Mitra Login API] Generated tokens for session:', sessionId);

    // Simpan session dan tokens di Redis
    const sessionData = {
      userId: vendor.vendor_id,
      email: vendor.email,
      role: 'vendor',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      userAgent: request.headers.get('user-agent') || '',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
    };

    const storeSessionResult = await storeSession(sessionId, sessionData);
    const storeTokensResult = await storeTokens(sessionId, accessToken, refreshToken);

    console.log('[Mitra Login API] Store results:', {
      session: storeSessionResult.success,
      tokens: storeTokensResult.success
    });

    // Buat response
    const response = NextResponse.json({
      vendor: {
        id: vendor.vendor_id,
        email: vendor.email,
        name: vendor.name,
        phone: vendor.phone,
        avatar: vendor.avatar,
        description: vendor.description,
        verified: vendor.verified,
        status: vendor.status,
        rating: vendor.rating ? Number(vendor.rating) : 0,
        review_count: vendor.review_count,
        service_areas: vendor.service_areas,
        specialties: vendor.specialties,
        tags: vendor.tags,
        category: vendor.category,
        join_date: vendor.join_date,
        role: 'vendor',
      },
      message: 'Login berhasil',
    });

    // Set cookies dengan prefix mitra_
    response.cookies.set('mitra_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 hari
      path: '/',
    });

    response.cookies.set('mitra_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 jam
      path: '/',
    });

    response.cookies.set('mitra_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 hari
      path: '/',
    });

    console.log('[Mitra Login API] Login successful for:', email);

    return response;
  } catch (error) {
    console.error('[Mitra Login API] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}