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

    const logId = uuidv4();
    const relatedLogs: string[] = [];

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
      ...(body.data || {}),
    };

    logData.id = logId;
    logData.relatedLogs = relatedLogs;

    const log = await DailyLog.create(logData);
    await log.save();

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
    }

    const savedLog = await DailyLog.findById(log._id).lean();
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
    const includeRelated =
      req.nextUrl.searchParams.get("includeRelated") === "true";

    const filter: FilterQuery<DailyLogFilterContext> = {};

    if (tripId) filter.tripId = tripId;

    if (date) {
      filter.dateTime = { $regex: new RegExp(`^${date}`) };
    }

    if (userId) {
      filter.userId = userId;
    }

    if (includeRelated) {
      const allLogs = await DailyLog.find(filter).sort({ dateTime: -1 }).lean();
      return createSuccessResponse(undefined, 200, { logs: allLogs });
    }

    const mainLogFilter = { ...filter, isGroupSource: true };
    const mainLogs = await DailyLog.find(mainLogFilter).lean();

    const excludedLogIds = new Set<string>();
    mainLogs.forEach((log) => {
      const relatedLogs = (log as any).relatedLogs || [];
      if (Array.isArray(relatedLogs)) {
        relatedLogs.forEach((relatedLogId: string) => {
          if (relatedLogId) {
            excludedLogIds.add(relatedLogId);
          }
        });
      }
    });

    const allLogs = await DailyLog.find(filter).sort({ dateTime: -1 }).lean();

    const filteredLogs = allLogs.filter((log) => {
      const logId = (log as any).id;
      if ((log as any).isGroupSource === true) {
        return true;
      }
      return !excludedLogIds.has(logId);
    });

    return createSuccessResponse(undefined, 200, { logs: filteredLogs });
  } catch (error) {
    return createErrorResponse(error, "Failed to fetch logs", 500);
  }
}
