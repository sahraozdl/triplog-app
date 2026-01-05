import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { DailyLog } from "@/app/models/DailyLog";
import { FilterQuery } from "mongoose";
import { requireAuth } from "@/lib/auth-utils";
import {
  createErrorResponse,
  createSuccessResponse,
  validateJsonBody,
  ApiError,
} from "@/lib/utils/apiErrorHandler";
import { v4 as uuidv4 } from "uuid";
import { linkRelatedLogsOnCreate } from "@/lib/utils/dailyLog/linkRelatedLogsOnCreate";

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
    const body = await validateJsonBody<{
      itemType?: string;
      tripId?: string;
      userId?: string;
      dateTime?: string;
      appliedTo?: string[];
      isGroupSource?: boolean;
      data?: Record<string, unknown>;
      files?: unknown[];
      [key: string]: unknown;
    }>(req);

    if (!body.itemType) {
      return createErrorResponse(
        new ApiError("itemType required", 400, "MISSING_ITEM_TYPE"),
      );
    }

    // Generate UUID and ensure relatedLogs is initialized
    const logId = uuidv4();
    const relatedLogs: string[] = [];

    // Prepare the log data, ensuring id and relatedLogs are set first
    const logData: Record<string, unknown> = {
      id: logId,
      relatedLogs: relatedLogs,
      itemType: body.itemType,
      tripId: body.tripId,
      userId: body.userId,
      dateTime: body.dateTime,
      appliedTo: body.appliedTo || [],
      isGroupSource: body.isGroupSource || false,
      files: body.files || [],
      sealed: false,
      ...(body.data || {}), // Spread data last to allow overrides of other fields
    };

    // Ensure id and relatedLogs are not overridden by body.data
    logData.id = logId;
    logData.relatedLogs = relatedLogs;

    // Log the data being sent to help debug
    console.log("Creating log with data:", {
      id: logId,
      hasRelatedLogs: Array.isArray(relatedLogs),
      relatedLogsLength: relatedLogs.length,
      itemType: body.itemType,
      logDataKeys: Object.keys(logData),
    });

    // Create the log
    const log = await DailyLog.create(logData);

    // Force save to ensure all fields are persisted
    await log.save();

    // Link related logs (works for both main and attendant logs)
    // - Main logs: finds all existing attendant logs and updates relatedLogs
    // - Attendant logs: finds the main log and adds itself to the main log's relatedLogs
    const isGroupSource = body.isGroupSource || false;
    const appliedTo = body.appliedTo || [];

    try {
      await linkRelatedLogsOnCreate(
        log._id.toString(),
        body.tripId || "",
        body.dateTime || "",
        body.itemType,
        body.userId || "",
        isGroupSource,
        appliedTo,
      );
    } catch (linkError) {
      console.error("Error linking related logs:", linkError);
      // Don't fail the request if linking fails, but log the error
    }

    // Re-fetch the log to get updated relatedLogs (especially for main logs)
    const savedLog = await DailyLog.findById(log._id).lean();
    if (
      savedLog &&
      (!(savedLog as any).id || !Array.isArray((savedLog as any).relatedLogs))
    ) {
      console.error("Warning: Log created but id or relatedLogs missing:", {
        hasId: !!(savedLog as any)?.id,
        hasRelatedLogs: Array.isArray((savedLog as any)?.relatedLogs),
        logId: logId,
        savedLogKeys: Object.keys(savedLog || {}),
      });
    }

    // Return the saved log (from database) to ensure all fields including updated relatedLogs are included
    const logToReturn = savedLog || log.toObject();
    return createSuccessResponse(undefined, 200, { log: logToReturn });
  } catch (error) {
    console.error("Error creating daily log:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return createErrorResponse(error, "Failed to create log", 500);
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

    return createSuccessResponse(undefined, 200, { logs });
  } catch (error) {
    return createErrorResponse(error, "Failed to fetch logs", 500);
  }
}
