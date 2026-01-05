import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { DailyLog } from "@/app/models/DailyLog";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth-utils";
import { WorkTimeLog } from "@/app/models/DailyLog";
import { AccommodationLog } from "@/app/models/DailyLog";
import { AdditionalLog } from "@/app/models/DailyLog";
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredParam,
  ApiError,
} from "@/lib/utils/apiErrorHandler";

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
      return createErrorResponse(
        new ApiError("Invalid Log ID", 400, "INVALID_LOG_ID"),
      );
    }

    await connectToDB();

    const log = await DailyLog.findById(id).lean();

    if (!log) {
      return createErrorResponse(
        new ApiError("Log not found", 404, "LOG_NOT_FOUND"),
      );
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
    return createErrorResponse(error, "Failed to fetch single log", 500);
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
      return createErrorResponse(
        new ApiError("Invalid Log ID", 400, "INVALID_LOG_ID"),
      );
    }

    await connectToDB();

    const result = await DailyLog.findByIdAndDelete(id);

    if (!result) {
      return createErrorResponse(
        new ApiError("Log not found", 404, "LOG_NOT_FOUND"),
      );
    }

    return createSuccessResponse(undefined, 200, {
      message: "Log deleted successfully",
    });
  } catch (error) {
    return createErrorResponse(error, "Failed to delete log", 500);
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
      return createErrorResponse(
        new ApiError("Invalid Log ID", 400, "INVALID_LOG_ID"),
      );
    }

    await connectToDB();
    const body = await validateJsonBody(req);

    const existingLog = await DailyLog.findById(id);
    if (!existingLog) {
      return createErrorResponse(
        new ApiError("Log not found", 404, "LOG_NOT_FOUND"),
      );
    }

    const { _id, data, itemType, ...flatFields } = body;

    if (_id && _id.toString() !== id) {
      return createErrorResponse(
        new ApiError("Log ID mismatch", 400, "LOG_ID_MISMATCH"),
      );
    }

    const updateData = {
      itemType: itemType || existingLog.itemType,
      ...flatFields,
      ...(data || {}),
      updatedAt: new Date().toISOString(),
    };

    let TargetModel = DailyLog;
    const logItemType = itemType || existingLog.itemType;

    if (logItemType === "worktime") TargetModel = WorkTimeLog;
    else if (logItemType === "accommodation") TargetModel = AccommodationLog;
    else if (logItemType === "additional") TargetModel = AdditionalLog;

    const updatedLog = await TargetModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedLog) {
      return createErrorResponse(
        new ApiError("Log not found", 404, "LOG_NOT_FOUND"),
      );
    }

    return createSuccessResponse(undefined, 200, {
      log: updatedLog,
      message: "Log updated successfully",
    });
  } catch (error) {
    return createErrorResponse(error, "Failed to update log", 500);
  }
}
