import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/Trip";
import { getUserDB } from "@/lib/getUserDB";
import { TripAttendant } from "@/app/types/Trip";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const user = await getUserDB();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectToDB();

    const { tripId } = await params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 },
      );
    }

    const isCreator = trip.creatorId === user.userId;
    const isModerator =
      Array.isArray(trip.attendants) &&
      trip.attendants.some(
        (a: TripAttendant) =>
          a?.userId === user.userId && a?.role === "moderator",
      );

    if (!isCreator && !isModerator) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only creator or moderator can end trip",
        },
        { status: 403 },
      );
    }

    const now = new Date().toISOString();

    trip.status = "ended";
    trip.basicInfo.endDate = now;

    trip.updatedAt = now;

    await trip.save();

    return NextResponse.json({
      success: true,
      message: "Trip ended successfully",
      trip,
    });
  } catch (err) {
    console.error("Failed to end trip:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
