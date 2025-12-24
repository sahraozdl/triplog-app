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

interface RouteParams {
  params: Promise<{ tripId: string }>;
}

interface UpdateTripRequestBody {
  basicInfo?: Partial<TripBasicInfo>;
  attendants?: TripAttendant[];
  invites?: TripInvite[];
  status?: "active" | "ended";
}

interface SuccessResponse<T = unknown> {
  success: true;
  trip?: T;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse>> {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return NextResponse.json<ErrorResponse>(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectToDB();

    const { tripId } = await params;

    if (!tripId || typeof tripId !== "string") {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "Invalid trip ID" },
        { status: 400 },
      );
    }

    const trip = await Trip.findById(tripId).lean();

    if (!trip) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "Trip not found" },
        { status: 404 },
      );
    }

    const tripData = trip as unknown as TripType;
    const tripWithFiles: TripType = {
      ...tripData,
      additionalFiles: tripData.additionalFiles || [],
    };

    return NextResponse.json<SuccessResponse>({
      success: true,
      trip: tripWithFiles,
    });
  } catch (error) {
    console.error("GET /api/trips/[tripId] error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse>> {
  try {
    await connectToDB();

    const { tripId } = await params;

    if (!tripId || typeof tripId !== "string") {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "Invalid trip ID" },
        { status: 400 },
      );
    }

    let body: UpdateTripRequestBody;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const user = await getUserDB();
    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "Trip not found" },
        { status: 404 },
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
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: "Forbidden: Only creator or moderator can update trip",
        },
        { status: 403 },
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

    return NextResponse.json<SuccessResponse>({
      success: true,
      trip: tripData,
    });
  } catch (error) {
    console.error("PUT /api/trips/[tripId] error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
