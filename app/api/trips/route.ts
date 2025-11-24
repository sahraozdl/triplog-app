import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/TripLog";
import User from "@/app/models/User";
import { generateInviteCode } from "@/lib/codeGenerator";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();

    const creatorId = body.userId;
    const inviteCode = generateInviteCode();

    const trip = await Trip.create({
      creatorId,
      attendants: [
        {
          userId: creatorId,
          joinedAt: new Date().toISOString(),
          role: "employer",
          status: "active",
        }
      ],
      invites: [
        {
          code: inviteCode,
          createdBy: creatorId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ],
      basicInfo: body.basicInfo,
      dailyLogs: [],
    });

    // Add trip to creator's activeTrips
    await User.updateOne(
      { userId: creatorId },
      { $push: { activeTrips: trip._id.toString() } }
    );

    return NextResponse.json({ success: true, tripId: trip._id, inviteCode });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}