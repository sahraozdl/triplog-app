import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { DailyLog } from "@/app/models/DailyLog";

export async function DELETE(req: NextRequest) {
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

    // The date parameter comes as "YYYY-MM-DD" from the UI
    // But database stores full ISO datetime strings like "2025-11-29T13:15:00.000Z"
    // We need to match the date part using regex to find all logs for that date
    // Extract date part in case it's already a full ISO string (defensive)
    const datePart = date.split("T")[0];

    // Escape special regex characters in the date string and match from start
    // This will match "2025-01-01T..." but not "2025-01-10T..." or "2025-01-11T..."
    const escapedDate = datePart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const dateRegex = new RegExp(`^${escapedDate}`);

    // Delete logs matching: tripId, date (matching date part), and userId (createdBy)
    // Note: The schema uses 'userId' field, not 'createdBy'
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
