import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/Trip";
import User from "@/app/models/User";
import { generateInviteCode } from "@/lib/codeGenerator";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();
    if (!body.userId || !body.basicInfo) {
      return NextResponse.json(
        { error: "Missing required fields (userId or basicInfo)" },
        { status: 400 },
      );
    }

    const creatorId = body.userId;
    const inviteCode = generateInviteCode();

    const trip = await Trip.create({
      creatorId,
      attendants: [
        {
          userId: creatorId,
          role: "employer",
        },
      ],
      invites: [
        {
          code: inviteCode,
          createdBy: creatorId,
        },
      ],
      basicInfo: body.basicInfo,
    });

    await User.updateOne(
      { userId: creatorId },
      { $push: { activeTrips: trip._id.toString() } },
    );

    return NextResponse.json({
      success: true,
      tripId: trip._id.toString(),
      inviteCode,
    });
  } catch (err) {
    console.error("ERROR /api/trips POST:", err);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const ids = req.nextUrl.searchParams.get("ids");

    if (!ids) {
      return NextResponse.json({ success: true, trips: [] });
    }

    const idArray: mongoose.Types.ObjectId[] = [];
    ids.split(",").forEach((id) => {
      if (mongoose.Types.ObjectId.isValid(id)) {
        idArray.push(new mongoose.Types.ObjectId(id));
      }
    });

    if (idArray.length === 0) {
      return NextResponse.json({ success: true, trips: [] });
    }

    const trips = await Trip.find({ _id: { $in: idArray } }).lean();

    return NextResponse.json({ success: true, trips });
  } catch (error) {
    console.error("ERROR /api/trips GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
