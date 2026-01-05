import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { DailyLog } from "@/app/models/DailyLog";
import { FilterQuery } from "mongoose";
import { requireAuth } from "@/lib/auth-utils";
import {
  createErrorResponse,
  createSuccessResponse,
  ApiError,
} from "@/lib/utils/apiErrorHandler";

interface DailyLogFilterContext {
  tripId: string;
  userId: string;
  appliedTo: string[];
}

/**
 * GET route for fetching unfiltered daily logs.
 * Returns ALL logs including shared/attendant logs,
 * with relatedLogs and main/attendant distinctions preserved.
 * Used for report view and PDF download.
 */
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

    if (!tripId) {
      return createErrorResponse(
        new ApiError("tripId is required", 400, "MISSING_TRIP_ID"),
      );
    }

    const filter: FilterQuery<DailyLogFilterContext> = {
      tripId: tripId,
    };

    if (date) {
      filter.dateTime = { $regex: new RegExp(`^${date}`) };
    }

    if (userId) {
      filter.userId = userId;
    }

    // Fetch ALL logs unfiltered - including both main logs (isGroupSource: true)
    // and attendant/related logs (isGroupSource: false)
    // This ensures reports and PDF tables render correctly with all relevant data
    const allLogs = await DailyLog.find(filter).sort({ dateTime: -1 }).lean();

    // Return all logs with relatedLogs and main/attendant distinctions intact
    return createSuccessResponse(undefined, 200, { logs: allLogs });
  } catch (error) {
    return createErrorResponse(error, "Failed to fetch unfiltered logs", 500);
  }
}
