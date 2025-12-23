import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { DailyLog } from "@/app/models/DailyLog";
import mongoose, { FilterQuery } from "mongoose";
import { requireAuth } from "@/lib/auth-utils";

interface DailyLogFilterContext {
  tripId: string;
  userId: string;
  appliedTo: string[];
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    await connectToDB();
    const body = await req.json();

    if (!body.itemType)
      return NextResponse.json({ error: "itemType required" }, { status: 400 });

    const log = await DailyLog.create({
      itemType: body.itemType,
      tripId: body.tripId,
      userId: body.userId,
      dateTime: body.dateTime,
      appliedTo: body.appliedTo || [],
      isGroupSource: body.isGroupSource || false,
      ...body.data,
      files: body.files || [],
      sealed: false,
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("POST DailyLog Error:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    await connectToDB();

    const tripId = req.nextUrl.searchParams.get("tripId");
    const userId = req.nextUrl.searchParams.get("userId");
    const date = req.nextUrl.searchParams.get("date");

    const filter: FilterQuery<DailyLogFilterContext> = {};

    if (tripId) filter.tripId = tripId;

    if (date) {
      filter.dateTime = { $regex: new RegExp(`^${date}`) };
    }

    if (userId) {
      filter.userId = userId;
    }

    const logs = await DailyLog.find(filter).sort({ dateTime: -1 }).lean();

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("GET DailyLog Error:", error);
    return NextResponse.json(
      { success: false, logs: [], error: "Failed to fetch logs" },
      { status: 500 },
    );
  }
}

