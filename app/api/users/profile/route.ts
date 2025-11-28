import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/app/models/User";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, employeeDetail } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID missing" }, { status: 400 });
    }

    await connectToDB();

    const updatedUser = await User.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          employeeDetail: employeeDetail,
          updatedAt: new Date().toISOString(),
        },
      },
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
