// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        _count: {
          select: {
            bookings: true,
            reviews: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch user",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { name, email, phone, role, is_active, password } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      phone: phone || null,
      role,
      is_active,
    };

    // Hash password if provided
    if (password && password.trim() !== "") {
      const bcrypt = require("bcryptjs");
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { user_id: userId },
      data: updateData,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = params.id;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        name: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
            favorites: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Delete related data first (manual deletion for better control)
    // Delete reviews
    await prisma.review.deleteMany({
      where: { user_id: userId },
    });

    // Delete favorites
    await prisma.userFavorite.deleteMany({
      where: { user_id: userId },
    });

    // Delete booking items through bookings
    const userBookings = await prisma.booking.findMany({
      where: { user_id: userId },
      select: { booking_id: true },
    });

    if (userBookings.length > 0) {
      const bookingIds = userBookings.map(b => b.booking_id);
      
      // Delete booking items
      await prisma.bookingItem.deleteMany({
        where: {
          booking_id: {
            in: bookingIds,
          },
        },
      });

      // Delete bookings
      await prisma.booking.deleteMany({
        where: {
          booking_id: {
            in: bookingIds,
          },
        },
      });
    }

    // Finally delete the user
    await prisma.user.delete({
      where: { user_id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      data: {
        deletedUser: existingUser.name,
        deletedRelations: {
          bookings: existingUser._count.bookings,
          reviews: existingUser._count.reviews,
          favorites: existingUser._count.favorites,
        },
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}