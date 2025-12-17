import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/app/models/User";
import { requireAuthAndMatchUser } from "@/lib/auth-utils";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, employeeDetail } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID missing" }, { status: 400 });
    }

    const authResult = await requireAuthAndMatchUser(userId);
    if (!authResult.success) {
      return authResult.response;
    }

    await connectToDB();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (employeeDetail !== undefined) {
      updateData.employeeDetail = employeeDetail;
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId: userId },
      { $set: updateData },
      { new: true },
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
