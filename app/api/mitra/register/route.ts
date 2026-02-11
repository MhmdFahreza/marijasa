// app/api/mitra/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

// ✅ Helper: Convert File to base64 data URL (simpan di database, bukan filesystem)
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64String = buffer.toString("base64");
  return `data:${file.type};base64,${base64String}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const namaMitra = formData.get("namaMitra") as string;
    const email = formData.get("email") as string;
    const telepon = formData.get("telepon") as string;
    const alamat = formData.get("alamat") as string;
    const password = formData.get("password") as string;
    const kategoriJasa = formData.get("kategoriJasa") as string;
    const jasaDitawarkan = JSON.parse(
      (formData.get("jasaDitawarkan") as string) || "[]"
    );
    const deskripsi = formData.get("deskripsi") as string;
    const lokasi = JSON.parse((formData.get("lokasi") as string) || "[]");
    const tipeMitra = formData.get("tipeMitra") as string;

    // Validate required fields
    if (
      !namaMitra ||
      !email ||
      !telepon ||
      !password ||
      !kategoriJasa ||
      !deskripsi
    ) {
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

    // ✅ FIXED: Convert profile photo to base64 (disimpan di database)
    let avatarUrl = "https://i.pravatar.cc/120";
    const fotoProfil = formData.get("fotoProfil") as File | null;
    if (fotoProfil && fotoProfil.size > 0) {
      console.log(
        "[Mitra Register] Converting avatar to base64, size:",
        fotoProfil.size
      );
      avatarUrl = await fileToBase64(fotoProfil);
      console.log(
        "[Mitra Register] Avatar base64 length:",
        avatarUrl.length
      );
    }

    // Create vendor
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
        partner_type: tipeMitra === "perusahaan" ? "PERUSAHAAN" : "INDIVIDU",
        avatar: avatarUrl, // ✅ base64 string disimpan langsung di DB
        status: "PENDING",
        verified: false,
        specialties: jasaDitawarkan,
        rating: 0,
        review_count: 0,
        is_online: false,
      },
    });

    console.log("[Mitra Register] Vendor created:", vendor.vendor_id);

    // ✅ FIXED: Save work images (hasil pekerjaan) as base64 in vendor_gallery
    const galleryPromises: Promise<any>[] = [];
    let galleryIndex = 0;
    while (formData.has(`hasilPekerjaan_${galleryIndex}`)) {
      const file = formData.get(`hasilPekerjaan_${galleryIndex}`) as File;
      if (file && file.size > 0) {
        console.log(
          `[Mitra Register] Converting gallery image ${galleryIndex} to base64, size:`,
          file.size
        );
        const imageBase64 = await fileToBase64(file);
        galleryPromises.push(
          prisma.vendorGallery.create({
            data: {
              vendor_id: vendor.vendor_id,
              image_url: imageBase64, // ✅ base64 string
              caption: `Hasil Pekerjaan ${galleryIndex + 1}`,
              sort_order: galleryIndex,
            },
          })
        );
      }
      galleryIndex++;
    }
    await Promise.all(galleryPromises);
    console.log(
      "[Mitra Register] Gallery images saved:",
      galleryPromises.length
    );

    // ✅ FIXED: Save documents as base64 in vendor_documents table
    const documentTypes = [
      { key: "fotoKTP", type: "ktp" },
      { key: "fotoDenganKTP", type: "selfie_ktp" },
      { key: "skck", type: "skck" },
      { key: "siup", type: "siup" },
      { key: "cv", type: "cv" },
    ];

    const documentPromises: Promise<any>[] = [];
    for (const doc of documentTypes) {
      const file = formData.get(doc.key) as File | null;
      if (file && file.size > 0) {
        console.log(
          `[Mitra Register] Converting document ${doc.type} to base64, size:`,
          file.size
        );
        const fileBase64 = await fileToBase64(file);
        documentPromises.push(
          prisma.vendorDocument.create({
            data: {
              vendor_id: vendor.vendor_id,
              document_type: doc.type,
              file_url: fileBase64, // ✅ base64 string disimpan di DB
              file_name: file.name,
              file_type: file.type,
            },
          })
        );
      }
    }
    await Promise.all(documentPromises);
    console.log(
      "[Mitra Register] Documents saved:",
      documentPromises.length
    );

    // Create default services based on tags
    const servicePromises = jasaDitawarkan.map((serviceName: string) =>
      prisma.service.create({
        data: {
          vendor_id: vendor.vendor_id,
          name: serviceName,
          description: `Layanan ${serviceName} oleh ${namaMitra}`,
          price: 0,
          price_type: "FIXED",
          is_active: true,
        },
      })
    );
    await Promise.all(servicePromises);
    console.log(
      "[Mitra Register] Default services created:",
      servicePromises.length
    );

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