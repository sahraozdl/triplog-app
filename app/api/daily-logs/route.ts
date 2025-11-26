import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import DailyLog from "@/app/models/DailyLog";
import mongoose, { FilterQuery } from "mongoose";
import { DailyLogFormState } from "@/app/types/DailyLog";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();

    const log = await DailyLog.create({
      _id: new mongoose.Types.ObjectId(),
      date: body.date,
      tripId: body.tripId,
      userId: body.userId,

      isGroupSource: body.isGroupSource || false,
      appliedTo: body.appliedTo || [],

      sharedFields: {
        travel: body.sharedFields.travel,
        workTime: body.sharedFields.workTime,
        accommodationMeals: body.sharedFields.accommodationMeals,
        additional: body.sharedFields.additional,
      },
      personalFields: body.personalFields || {},
      files: body.files || [],
      sealed: false,
    });
    console.log("log", log);
    console.log("BODY RECEIVED >>>", JSON.stringify(body, null, 2));
    console.log("SHARED FIELDS >>>", body.sharedFields);
    return NextResponse.json({ success: true, log });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  await connectToDB();

  const tripId = req.nextUrl.searchParams.get("tripId");
  const userId = req.nextUrl.searchParams.get("userId");

  const filter: FilterQuery<DailyLogFormState> = {};

  if (tripId) filter.tripId = tripId;
  if (userId) {
    filter.$or = [
      { loggedInUserId: userId },
      { appliedTo: userId }, // group log’ları göster
    ];
  }

  const logs = await DailyLog.find(filter).lean();

  return NextResponse.json({ success: true, logs });
}
