import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { Travel } from "@/app/models/Travel";
import { requireAuth } from "@/lib/auth-utils";
import {
  createErrorResponse,
  createSuccessResponse,
  validateJsonBody,
  ApiError,
} from "@/lib/utils/apiErrorHandler";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();

  if (!authResult.success) {
    return authResult.response;
  }

  try {
    await connectToDB();

    const body = await validateJsonBody<{
      tripId?: string;
      userId?: string;
      dateTime?: string;
      appliedTo?: string[];
      isGroupSource?: boolean;
      travelReason?: string;
      vehicleType?: string;
      departureLocation?: string;
      destination?: string;
      distance?: number | null;
      isRoundTrip?: boolean;
      startTime?: string;
      endTime?: string;
      files?: unknown[];
      [key: string]: unknown;
    }>(req);

    if (!body.tripId) {
      return createErrorResponse(
        new ApiError("tripId required", 400, "MISSING_TRIP_ID"),
      );
    }

    const travelData = {
      tripId: String(body.tripId),
      userId: String(body.userId),
      dateTime: String(body.dateTime),

      appliedTo: Array.isArray(body.appliedTo) ? body.appliedTo : [],
      isGroupSource: Boolean(body.isGroupSource),

      travelReason: String(body.travelReason || ""),
      vehicleType: String(body.vehicleType || ""),
      departureLocation: String(body.departureLocation || ""),
      destination: String(body.destination || ""),

      distance:
        body.distance !== undefined && body.distance !== null
          ? Number(body.distance)
          : null,

      isRoundTrip: Boolean(body.isRoundTrip),
      startTime: String(body.startTime || ""),
      endTime: String(body.endTime || ""),

      files: Array.isArray(body.files) ? body.files : [],
      sealed: false,
    };

    const travel = await Travel.create(travelData);

    return createSuccessResponse(undefined, 200, { travel });
  } catch (error) {
    return createErrorResponse(error, "Failed to create travel", 500);
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return createErrorResponse(
        new ApiError("tripId is required", 400, "MISSING_TRIP_ID"),
      );
    }

    const travels = await Travel.find({ tripId });
    return createSuccessResponse(undefined, 200, { travels });
  } catch (error) {
    return createErrorResponse(error, "Failed to fetch travels", 500);
  }
}
