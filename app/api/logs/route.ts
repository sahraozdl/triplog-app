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

    // Find logs to delete and get their UUIDs and relatedLogs before deleting
    const logsToDelete = await DailyLog.find({
      tripId: tripId,
      dateTime: { $regex: dateRegex },
      userId: userId,
    }).lean();

    // Extract UUIDs (id fields) from logs to be deleted
    const deletedLogIds = logsToDelete
      .map((log) => (log as any).id)
      .filter((id) => id) as string[];

    // Collect all relatedLogs from all logs being deleted
    const allRelatedLogIds = new Set<string>();
    logsToDelete.forEach((log) => {
      const relatedLogs = ((log as any).relatedLogs || []) as string[];
      relatedLogs.forEach((relatedId) => {
        if (relatedId) {
          allRelatedLogIds.add(relatedId);
        }
      });
    });

    // Delete all logs referenced in relatedLogs arrays (by their UUID id field)
    if (allRelatedLogIds.size > 0) {
      try {
        await DailyLog.deleteMany({
          id: { $in: Array.from(allRelatedLogIds) },
        });
      } catch (relatedDeleteError) {
        // Log the error but continue with main deletion
        console.error("Error deleting related logs:", relatedDeleteError);
      }
    }

    // Delete the main logs
    const deleteResult = await DailyLog.deleteMany({
      tripId: tripId,
      dateTime: { $regex: dateRegex },
      userId: userId,
    });

    // Remove deleted log IDs from all relatedLogs arrays
    if (deletedLogIds.length > 0) {
      try {
        // Remove all deleted log IDs from relatedLogs arrays using $pullAll
        await DailyLog.updateMany(
          { relatedLogs: { $in: deletedLogIds } },
          { $pullAll: { relatedLogs: deletedLogIds } },
        );
      } catch (cleanupError) {
        // Log the error but don't fail the deletion
        console.error(
          "Error cleaning up relatedLogs references:",
          cleanupError,
        );
      }
    }

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
