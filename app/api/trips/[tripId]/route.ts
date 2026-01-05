import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/Trip";
import { getUserDB } from "@/lib/getUserDB";
import { requireAuth } from "@/lib/auth-utils";
import {
  TripBasicInfo,
  TripAttendant,
  TripInvite,
  Trip as TripType,
} from "@/app/types/Trip";
import {
  createErrorResponse,
  createSuccessResponse,
  validateJsonBody,
  validateRequiredParam,
  ApiError,
} from "@/lib/utils/apiErrorHandler";
import type { ApiResponse } from "@/lib/utils/apiErrorHandler";

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

interface UpdateTripRequestBody {
  basicInfo?: Partial<TripBasicInfo>;
  attendants?: TripAttendant[];
  invites?: TripInvite[];
  status?: "active" | "ended";
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse>> {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return createErrorResponse(
      new ApiError("Unauthorized", 401, "UNAUTHORIZED"),
    );
  }

  try {
    await connectToDB();

    const { tripId } = await params;
    validateRequiredParam(tripId, "tripId");

    const trip = await Trip.findById(tripId).lean();

    if (!trip) {
      return createErrorResponse(
        new ApiError("Trip not found", 404, "TRIP_NOT_FOUND"),
      );
    }

    const tripData = trip as unknown as TripType;
    const tripWithFiles: TripType = {
      ...tripData,
      additionalFiles: tripData.additionalFiles || [],
    };

    return createSuccessResponse(undefined, 200, { trip: tripWithFiles });
  } catch (error) {
    return createErrorResponse(error, "Internal server error", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse>> {
  try {
    await connectToDB();

    const { tripId } = await params;
    validateRequiredParam(tripId, "tripId");

    const body = await validateJsonBody<
      UpdateTripRequestBody & {
        [key: string]: unknown;
      }
    >(req);

    const user = await getUserDB();
    if (!user) {
      return createErrorResponse(
        new ApiError("Unauthorized", 401, "UNAUTHORIZED"),
      );
    }

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return createErrorResponse(
        new ApiError("Trip not found", 404, "TRIP_NOT_FOUND"),
      );
    }

    const isCreator = trip.creatorId === user.userId;
    const isModerator =
      Array.isArray(trip.attendants) &&
      trip.attendants.some(
        (a: unknown): a is TripAttendant =>
          a !== null &&
          typeof a === "object" &&
          "userId" in a &&
          "role" in a &&
          typeof (a as { userId: unknown }).userId === "string" &&
          typeof (a as { role: unknown }).role === "string" &&
          (a as TripAttendant).userId === user.userId &&
          (a as TripAttendant).role === "moderator",
      );

    if (!isCreator && !isModerator) {
      return createErrorResponse(
        new ApiError(
          "Forbidden: Only creator or moderator can update trip",
          403,
          "FORBIDDEN",
        ),
      );
    }

    if (body.basicInfo && typeof body.basicInfo === "object") {
      trip.basicInfo = {
        ...trip.basicInfo,
        ...body.basicInfo,
      };
    }

    if (body.attendants !== undefined) {
      if (Array.isArray(body.attendants)) {
        trip.attendants = body.attendants;
      }
    }

    if (body.invites !== undefined) {
      if (Array.isArray(body.invites)) {
        trip.invites = body.invites;
      }
    }

    if (body.status && (body.status === "active" || body.status === "ended")) {
      trip.status = body.status;
    }

    trip.updatedAt = new Date().toISOString();

    await trip.save();

    const tripData = trip.toObject ? trip.toObject() : trip;

    return createSuccessResponse(undefined, 200, { trip: tripData });
  } catch (error) {
    return createErrorResponse(error, "Internal server error", 500);
  }
}
