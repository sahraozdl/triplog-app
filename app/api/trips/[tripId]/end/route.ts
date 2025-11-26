import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/TripLog";

export async function POST(
  req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    await connectToDB();

    const { tripId } = params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    trip.status = "ended";
    trip.basicInfo.endDate = now;

    trip.updatedAt = new Date();

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
      { status: 500 }
    );
  }
}
