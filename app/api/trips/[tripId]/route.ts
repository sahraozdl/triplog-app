import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/TripLog";

export async function GET(
  req: NextRequest,
  context: { params: { tripId: string } }
) {
  try {
    await connectToDB();

    const { tripId } = context.params;

    const trip = await Trip.findById(tripId).lean();

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, trip });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch trip" },
      { status: 500 }
    );
  }
}
