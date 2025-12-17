import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { DailyLog } from "@/app/models/DailyLog";
import { requireAuth } from "@/lib/auth-utils";

export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    await connectToDB();

    const tripId = req.nextUrl.searchParams.get("tripId");
    const date = req.nextUrl.searchParams.get("date");
    const userId = req.nextUrl.searchParams.get("userId");

    if (!tripId || !date || !userId) {
      return NextResponse.json(
        { error: "tripId, date, and userId are required" },
        { status: 400 },
      );
    }
    const datePart = date.split("T")[0];

    const escapedDate = datePart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const dateRegex = new RegExp(`^${escapedDate}`);

    const deleteResult = await DailyLog.deleteMany({
      tripId: tripId,
      dateTime: { $regex: dateRegex },
      userId: userId,
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("DELETE Logs Error:", error);
    return NextResponse.json(
      { error: "Failed to delete logs", details: (error as any).message },
      { status: 500 },
    );
  }
}
