import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/Trip";
import { getUserDB } from "@/lib/getUserDB";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    await connectToDB();

    const { tripId } = await params;

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    await connectToDB();

    const { tripId } = await params;
    const body = await req.json();

    // Get current user
    const user = await getUserDB();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 },
      );
    }

    // Check permissions: only creator or moderator can update
    const isCreator = trip.creatorId === user.userId;
    const isModerator =
      trip.attendants?.some(
        (a) => a.userId === user.userId && a.role === "moderator",
      ) || false;

    if (!isCreator && !isModerator) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only creator or moderator can update trip",
        },
        { status: 403 },
      );
    }

    // Update basicInfo if provided
    if (body.basicInfo) {
      trip.basicInfo = {
        ...trip.basicInfo,
        ...body.basicInfo,
      };
    }

    // Update attendants if provided
    if (body.attendants !== undefined) {
      trip.attendants = body.attendants;
    }

    // Update invites if provided
    if (body.invites !== undefined) {
      trip.invites = body.invites;
    }

    // Update status if provided
    if (body.status) {
      trip.status = body.status;
    }

    // Update updatedAt timestamp
    trip.updatedAt = new Date().toISOString();

    await trip.save();

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error("Error updating trip:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
