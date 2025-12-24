import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { Travel } from "@/app/models/Travel";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  console.log("🟡 POST /api/travels called");

  const authResult = await requireAuth();
  console.log("🟡 Auth result:", authResult);

  if (!authResult.success) {
    console.error("🔴 Auth failed");
    return authResult.response;
  }

  try {
    console.log("🟡 Connecting to DB...");
    await connectToDB();
    console.log("🟢 DB connected");

    console.log("🟡 Reading request body...");
    const body = await req.json();
    console.log("🟢 Raw body received:", body);

    if (!body.tripId) {
      console.error("🔴 Validation failed: tripId missing", body);
      return NextResponse.json(
        { error: "tripId required", receivedBody: body },
        { status: 400 },
      );
    }

    console.log("🟡 Normalizing travel data...");

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

    console.log("🟢 travelData prepared:", travelData);

    console.log("🟡 Creating Travel document...");
    const travel = await Travel.create(travelData);

    console.log("🟢 Travel created successfully:", travel);

    return NextResponse.json({ success: true, travel });
  } catch (error: any) {
    console.error("🔴 POST Travel Error CAUGHT");

    // 🔥 Mongoose validation error detayları
    if (error?.name === "ValidationError") {
      console.error("❌ Mongoose ValidationError");
      console.error(
        Object.values(error.errors).map((e: any) => ({
          path: e.path,
          message: e.message,
          value: e.value,
        })),
      );

      return NextResponse.json(
        {
          error: "ValidationError",
          details: Object.values(error.errors).map((e: any) => ({
            path: e.path,
            message: e.message,
            value: e.value,
          })),
        },
        { status: 400 },
      );
    }

    // 🔥 Cast error (files vs schema mismatch gibi)
    if (error?.name === "CastError") {
      console.error("❌ Mongoose CastError:", {
        path: error.path,
        value: error.value,
        kind: error.kind,
      });

      return NextResponse.json(
        {
          error: "CastError",
          path: error.path,
          value: error.value,
        },
        { status: 400 },
      );
    }

    // 🔥 Genel hata
    console.error("❌ Unknown error:", error);

    return NextResponse.json(
      {
        error: "Failed to create travel",
        rawError: error?.message,
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  console.log("🟡 GET /api/travels called");

  const authResult = await requireAuth();
  console.log("🟡 Auth result:", authResult);
  if (!authResult.success) {
    console.error("🔴 Auth failed");
    return authResult.response;
  }
  const { searchParams } = new URL(req.url);
  const tripId = searchParams.get("tripId");

  if (!tripId) {
    return NextResponse.json({ error: "tripId is required" }, { status: 400 });
  }

  const travels = await Travel.find({ tripId });
  return NextResponse.json({ success: true, travels });
}
