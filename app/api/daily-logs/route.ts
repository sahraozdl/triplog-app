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

    const log = await DailyLog.create({
      itemType: body.itemType,
      tripId: body.tripId,
      userId: body.userId,
      dateTime: body.dateTime,
      appliedTo: body.appliedTo || [],
      isGroupSource: body.isGroupSource || false,
      ...(body.data || {}),
      files: body.files || [],
      sealed: false,
    });

    return createSuccessResponse(undefined, 200, { log });
  } catch (error) {
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
