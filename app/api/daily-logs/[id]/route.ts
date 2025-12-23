import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { DailyLog } from "@/app/models/DailyLog";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth-utils";
import { WorkTimeLog } from "@/app/models/DailyLog";
import { AccommodationLog } from "@/app/models/DailyLog";
import { AdditionalLog } from "@/app/models/DailyLog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Log ID" }, { status: 400 });
    }

    await connectToDB();

    const log = await DailyLog.findById(id).lean();

    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    const logWithId = log as {
      _id: mongoose.Types.ObjectId;
      [key: string]: unknown;
    };

    const serializedLog = {
      ...logWithId,
      _id: logWithId._id.toString(),
    };

    return NextResponse.json(serializedLog);
  } catch (error) {
    console.error("Single Log GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch single log" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Log ID" }, { status: 400 });
    }

    await connectToDB();

    const result = await DailyLog.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Log deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Log Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to delete log", details: errorMessage },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Log ID" }, { status: 400 });
    }

    await connectToDB();
    const body = await req.json();

    // Verify the log exists
    const existingLog = await DailyLog.findById(id);
    if (!existingLog) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    // Extract update data, ensuring we don't allow changing the _id
    const { _id, data, itemType, ...flatFields } = body;

    // Ensure the ID in the body matches the URL parameter (strict scoping)
    if (_id && _id.toString() !== id) {
      return NextResponse.json({ error: "Log ID mismatch" }, { status: 400 });
    }

    const updateData = {
      itemType: itemType || existingLog.itemType,
      ...flatFields,
      ...(data || {}),
      updatedAt: new Date().toISOString(),
    };

    // Use the appropriate discriminator model based on itemType
    let TargetModel = DailyLog;
    const logItemType = itemType || existingLog.itemType;

    if (logItemType === "worktime") TargetModel = WorkTimeLog;
    else if (logItemType === "accommodation") TargetModel = AccommodationLog;
    else if (logItemType === "additional") TargetModel = AdditionalLog;

    // Update the log, strictly scoped to the provided ID
    const updatedLog = await TargetModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedLog) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      log: updatedLog,
      message: "Log updated successfully",
    });
  } catch (error) {
    console.error("PUT DailyLog Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update log", details: errorMessage },
      { status: 500 },
    );
  }
}
