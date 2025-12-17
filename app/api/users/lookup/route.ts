import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/app/models/User";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    await connectToDB();
    const { userIds, detailed } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ users: {} });
    }

    const fields = detailed
      ? "userId name email employeeDetail"
      : "userId name email";

    const users = await User.find({ userId: { $in: userIds } }).select(fields);

    const userMap: Record<string, any> = {};

    users.forEach((u) => {
      if (detailed) {
        userMap[u.userId] = {
          name: u.name || u.email || "Unknown User",
          email: u.email,
          employeeDetail: u.employeeDetail,
        };
      } else {
        userMap[u.userId] = u.name || u.email || "Unknown User";
      }
    });

    return NextResponse.json({ users: userMap });
  } catch (error) {
    console.error("User lookup failed:", error);
    return NextResponse.json({ users: {} }, { status: 500 });
  }
}
