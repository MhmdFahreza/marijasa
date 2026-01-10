// app/api/mitra/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import bcrypt from "bcryptjs";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

// Helper function to save file
async function saveFile(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop() || 'jpg';
  const filename = `${timestamp}_${randomString}.${extension}`;

  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(uploadDir, { recursive: true });

  // Save file
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  // Return public URL
  return `/uploads/${folder}/${filename}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const namaMitra = formData.get('namaMitra') as string;
    const email = formData.get('email') as string;
    const telepon = formData.get('telepon') as string;
    const alamat = formData.get('alamat') as string;
    const password = formData.get('password') as string;
    const kategoriJasa = formData.get('kategoriJasa') as string;
    const jasaDitawarkan = JSON.parse(formData.get('jasaDitawarkan') as string || '[]');
    const deskripsi = formData.get('deskripsi') as string;
    const lokasi = JSON.parse(formData.get('lokasi') as string || '[]');
    const tipeMitra = formData.get('tipeMitra') as string;

    // Validate required fields
    if (!namaMitra || !email || !telepon || !password || !kategoriJasa || !deskripsi) {
      return NextResponse.json(
        { message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { email },
    });

    if (existingVendor) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save profile photo
    let avatarUrl = "https://i.pravatar.cc/120";
    const fotoProfil = formData.get('fotoProfil') as File | null;
    if (fotoProfil && fotoProfil.size > 0) {
      avatarUrl = await saveFile(fotoProfil, 'avatars');
    }

    // FIXED: Create vendor with all required fields
    const vendor = await prisma.vendor.create({
      data: {
        name: namaMitra,
        email,
        phone: telepon,
        address: alamat,
        password: hashedPassword,
        category: kategoriJasa,
        tags: jasaDitawarkan,
        description: deskripsi,
        service_areas: lokasi,
        partner_type: tipeMitra === 'perusahaan' ? 'PERUSAHAAN' : 'INDIVIDU',
        avatar: avatarUrl,
        status: 'PENDING',
        verified: false,
        // FIXED: Add specialties field to prevent null constraint violation
        specialties: jasaDitawarkan, // Copy from tags to specialties
        // These have defaults in schema but explicit is better
        rating: 0,
        review_count: 0,
        is_online: false,
      },
    });

    // Save work images (hasil pekerjaan)
    const galleryPromises: Promise<any>[] = [];
    let index = 0;
    while (formData.has(`hasilPekerjaan_${index}`)) {
      const file = formData.get(`hasilPekerjaan_${index}`) as File;
      if (file && file.size > 0) {
        const imageUrl = await saveFile(file, 'gallery');
        galleryPromises.push(
          prisma.vendorGallery.create({
            data: {
              vendor_id: vendor.vendor_id,
              image_url: imageUrl,
              caption: `Hasil Pekerjaan ${index + 1}`,
              sort_order: index,
            },
          })
        );
      }
      index++;
    }
    await Promise.all(galleryPromises);

    // Save documents
    const documentTypes = [
      { key: 'fotoKTP', type: 'ktp' },
      { key: 'fotoDenganKTP', type: 'selfie_ktp' },
      { key: 'skck', type: 'skck' },
      { key: 'siup', type: 'siup' },
      { key: 'cv', type: 'cv' },
    ];

    const documentPromises: Promise<any>[] = [];
    for (const doc of documentTypes) {
      const file = formData.get(doc.key) as File | null;
      if (file && file.size > 0) {
        const fileUrl = await saveFile(file, 'documents');
        documentPromises.push(
          prisma.vendorDocument.create({
            data: {
              vendor_id: vendor.vendor_id,
              document_type: doc.type,
              file_url: fileUrl,
              file_name: file.name,
              file_type: file.type,
            },
          })
        );
      }
    }
    await Promise.all(documentPromises);

    // Create default services based on tags
    const servicePromises = jasaDitawarkan.map((serviceName: string) =>
      prisma.service.create({
        data: {
          vendor_id: vendor.vendor_id,
          name: serviceName,
          description: `Layanan ${serviceName} oleh ${namaMitra}`,
          price: 0, // Price will be set later by vendor
          price_type: 'FIXED',
          is_active: true,
        },
      })
    );
    await Promise.all(servicePromises);

    return NextResponse.json(
      {
        success: true,
        message: "Pendaftaran berhasil! Menunggu persetujuan admin.",
        vendorId: vendor.vendor_id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Mitra Register] Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}