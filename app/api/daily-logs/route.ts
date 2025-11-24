import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import DailyLog from "@/app/models/DailyLog";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();

    const log = await DailyLog.create({
      tripId: body.tripId,
      userId: body.userId,
      isGroupSource: body.isGroupSource || false,
      appliedTo: body.appliedTo || [],

      date: body.date,
      sharedFields: body.sharedFields || {},
      personalFields: body.personalFields || {},
      files: body.files || [],

      sealed: false,
    });

    return NextResponse.json({ success: true, log });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}
