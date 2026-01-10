// app/api/admin/mitra/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Get all pending vendors
    const pendingVendors = await prisma.vendor.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        documents: true,
        gallery: {
          orderBy: { sort_order: 'asc' },
          take: 6,
        },
        services: {
          where: { is_active: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Format response
    const formattedVendors = pendingVendors.map(vendor => ({
      id: vendor.vendor_id,
      name: vendor.name,
      owner: vendor.name, // Same as name for individual
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address || '',
      type: getCategoryName(vendor.category || ''),
      category: vendor.category,
      partnerType: vendor.partner_type,
      description: vendor.description,
      avatar: vendor.avatar,
      serviceAreas: vendor.service_areas,
      tags: vendor.tags,
      submitDate: vendor.created_at.toISOString(),
      documents: vendor.documents.map(doc => ({
        id: doc.document_id,
        type: doc.document_type,
        name: getDocumentDisplayName(doc.document_type),
        url: doc.file_url,
        fileName: doc.file_name,
        fileType: doc.file_type,
      })),
      gallery: vendor.gallery.map(img => ({
        id: img.gallery_id,
        url: img.image_url,
        caption: img.caption,
      })),
      services: vendor.services.map(svc => ({
        id: svc.service_id,
        name: svc.name,
      })),
    }));

    // Get counts
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [approvedToday, rejectedToday] = await Promise.all([
      prisma.vendor.count({
        where: {
          status: 'ACTIVE',
          updated_at: { gte: todayStart },
        },
      }),
      prisma.vendor.count({
        where: {
          status: 'REJECTED',
          updated_at: { gte: todayStart },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      vendors: formattedVendors,
      stats: {
        pending: formattedVendors.length,
        approvedToday,
        rejectedToday,
      },
    });
  } catch (error: any) {
    console.error("[Admin Pending Mitra] Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    'ac': 'Tukang AC',
    'electrical': 'Tukang Listrik',
    'cleaning': 'Pembersihan Rumah',
    'plumbing': 'Tukang Ledeng',
    'sedot-wc': 'Sedot WC',
    'garden': 'Tukang Kebun',
    'furniture': 'Tukang Mebel',
  };
  return names[category] || category || 'Lainnya';
}

function getDocumentDisplayName(type: string): string {
  const names: Record<string, string> = {
    'ktp': 'KTP',
    'selfie_ktp': 'Foto dengan KTP',
    'skck': 'SKCK',
    'siup': 'SIUP',
    'cv': 'CV',
  };
  return names[type] || type;
}