import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/TripLog";
import User from "@/app/models/User";
import { generateInviteCode } from "@/lib/codeGenerator";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();
    if (!body.userId) {
      return NextResponse.json(
        { error: "UserId is missing in request body" },
        { status: 400 }
      );
    }
    if (!body.basicInfo) {
      return NextResponse.json(
        { error: "BasicInfo is missing in request body" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ success: true, tripId: trip._id.toString(), inviteCode });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const ids = req.nextUrl.searchParams.get("ids");
    if (!ids) {
      return NextResponse.json({ success: true, trips: [] });
    }

    const idArray = ids.split(",");

    const trips = await Trip.find({
      _id: { $in: idArray }
    }).lean();

    return NextResponse.json({ success: true, trips });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}