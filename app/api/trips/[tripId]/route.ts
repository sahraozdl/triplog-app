import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/TripLog";
export async function GET(
  req: NextRequest,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
) {
  try {
    await connectToDB();

    const { tripId } = context.params as { tripId: string };

    const trip = await Trip.findById(tripId).lean();

    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
