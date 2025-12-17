import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { DailyLog } from "@/app/models/DailyLog";
import mongoose, { FilterQuery } from "mongoose";
import { TravelLog } from "@/app/models/DailyLog";
import { WorkTimeLog } from "@/app/models/DailyLog";
import { AccommodationLog } from "@/app/models/DailyLog";
import { AdditionalLog } from "@/app/models/DailyLog";
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
      filter.$or = [{ userId: userId }, { appliedTo: userId }];
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

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    await connectToDB();
    const body = await req.json();
    const logsToUpdate = body.logs;

    if (
      !logsToUpdate ||
      !Array.isArray(logsToUpdate) ||
      logsToUpdate.length === 0
    ) {
      return NextResponse.json(
        { error: "Logs array missing or empty" },
        { status: 400 },
      );
    }

    const updatePromises = logsToUpdate.map(async (log) => {
      if (!log._id || !mongoose.Types.ObjectId.isValid(log._id)) {
        return null;
      }

      const { _id, data, itemType, ...flatFields } = log;

      const updateData = {
        itemType,
        ...flatFields,
        ...(data || {}),
        updatedAt: new Date().toISOString(),
      };

      let TargetModel = DailyLog;

      if (itemType === "travel") TargetModel = TravelLog;
      else if (itemType === "worktime") TargetModel = WorkTimeLog;
      else if (itemType === "accommodation") TargetModel = AccommodationLog;
      else if (itemType === "additional") TargetModel = AdditionalLog;

      return await TargetModel.findByIdAndUpdate(
        _id,
        { $set: updateData },
        { new: true, runValidators: true },
      );
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: "Logs updated successfully",
    });
  } catch (error) {
    console.error("PUT DailyLog Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update logs", details: errorMessage },
      { status: 500 },
    );
  }
}
