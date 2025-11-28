import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ users: {} });
    }

    const users = await User.find({ userId: { $in: userIds } }).select(
      "userId name email",
    );
    const userMap: Record<string, string> = {};

    users.forEach((u) => {
      userMap[u.userId] = u.name || u.email || "Unknown User";
    });

    return NextResponse.json({ users: userMap });
  } catch (error) {
    console.error("User lookup failed:", error);
    return NextResponse.json({ users: {} }, { status: 500 });
  }
}
