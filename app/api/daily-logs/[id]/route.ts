import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { DailyLog } from "@/app/models/DailyLog";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const serializedLog = {
      ...log,
      _id: (log as any)._id.toString(),
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
    return NextResponse.json(
      { error: "Failed to delete log", details: (error as any).message },
      { status: 500 },
    );
  }
}
