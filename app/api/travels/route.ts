import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { Travel } from "@/app/models/Travel";
import mongoose, { FilterQuery } from "mongoose";
import { requireAuth } from "@/lib/auth-utils";

interface TravelFilterContext {
  tripId: string;
  userId?: string;
  date?: string;
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    await connectToDB();
    const body = await req.json();

    // Debug logging
    console.log("Received body.files type:", typeof body.files);
    console.log("Received body.files isArray:", Array.isArray(body.files));
    if (typeof body.files === "string") {
      console.log(
        "Files is a string, first 200 chars:",
        body.files.substring(0, 200),
      );
    }

    if (!body.tripId) {
      return NextResponse.json({ error: "tripId required" }, { status: 400 });
    }

    // Ensure files is always an array of objects
    let files: Array<{
      url: string;
      name: string;
      type: string;
      size: number;
    }> = [];

    if (body.files !== undefined && body.files !== null) {
      // Handle different input types
      let filesToProcess: unknown = body.files;

      // If it's a string, try to parse it first
      if (typeof body.files === "string") {
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(body.files);
          filesToProcess = parsed;
          console.log(
            "Successfully parsed files string, isArray:",
            Array.isArray(parsed),
          );
        } catch (parseError) {
          console.error("Failed to parse files string:", parseError);
          // If JSON.parse fails, try to handle it as a string representation
          // Sometimes the string might be a stringified array representation
          try {
            // Try eval as last resort (only in this specific case)
            // Actually, let's not use eval - instead, try to manually parse
            filesToProcess = [];
          } catch {
            filesToProcess = [];
          }
        }
      }

      // Now process as array
      if (Array.isArray(filesToProcess)) {
        files = filesToProcess
          .filter((file: unknown) => {
            const isValid =
              typeof file === "object" &&
              file !== null &&
              "url" in file &&
              "name" in file &&
              "type" in file &&
              "size" in file;
            if (!isValid) {
              console.log("Filtered out invalid file:", file);
            }
            return isValid;
          })
          .map(
            (file: {
              url: unknown;
              name: unknown;
              type: unknown;
              size: unknown;
            }) => ({
              url: String(file.url || ""),
              name: String(file.name || ""),
              type: String(file.type || ""),
              size: Number(file.size || 0),
            }),
          );
        console.log("Processed files array length:", files.length);
      } else {
        console.log(
          "filesToProcess is not an array, type:",
          typeof filesToProcess,
        );
      }
    } else {
      console.log("body.files is undefined or null");
    }

    // Validate and prepare the travel data
    // Ensure files is definitely an array before creating
    if (!Array.isArray(files)) {
      console.error(
        "Files is not an array after processing, type:",
        typeof files,
        "value:",
        files,
      );
      files = [];
    }

    const travelData = {
      tripId: String(body.tripId),
      userId: String(body.userId),
      dateTime: String(body.dateTime),
      appliedTo: Array.isArray(body.appliedTo)
        ? body.appliedTo.map(String)
        : [],
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
      files: files, // This must be an array of objects
      sealed: false,
    };

    // Final validation before creating
    console.log(
      "About to create travel with files type:",
      typeof travelData.files,
      "isArray:",
      Array.isArray(travelData.files),
      "length:",
      Array.isArray(travelData.files) ? travelData.files.length : "N/A",
    );

    const travel = await Travel.create(travelData);

    return NextResponse.json({ success: true, travel });
  } catch (error) {
    console.error("POST Travel Error:", error);
    return NextResponse.json(
      { error: "Failed to create travel" },
      { status: 500 },
    );
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

    const filter: FilterQuery<TravelFilterContext> = {};

    if (tripId) filter.tripId = tripId;

    if (date) {
      filter.dateTime = { $regex: new RegExp(`^${date}`) };
    }

    if (userId) {
      filter.userId = userId;
    }

    const travels = await Travel.find(filter).sort({ dateTime: -1 }).lean();

    return NextResponse.json({ success: true, travels });
  } catch (error) {
    console.error("GET Travel Error:", error);
    return NextResponse.json(
      { success: false, travels: [], error: "Failed to fetch travels" },
      { status: 500 },
    );
  }
}
