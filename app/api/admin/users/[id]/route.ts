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
        bookings: {
          take: 5,
          orderBy: { created_at: "desc" },
          include: {
            vendor: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        reviews: {
          take: 5,
          orderBy: { created_at: "desc" },
        },
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

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
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

    return NextResponse.json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
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
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Delete user (will cascade delete bookings, reviews, etc.)
    await prisma.user.delete({
      where: { user_id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}