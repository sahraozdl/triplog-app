import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/Trip";
import { getUserDB } from "@/lib/getUserDB";
import { Trip as TripType } from "@/app/types/Trip";

// Type definitions for route parameters
interface RouteParams {
  params: Promise<{ tripId: string; index: string }>;
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    await connectToDB();

    const { tripId, index } = await params;
    const fileIndex = parseInt(index, 10);

    if (!tripId || typeof tripId !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid trip ID" },
        { status: 400 },
      );
    }

    if (isNaN(fileIndex) || fileIndex < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid file index" },
        { status: 400 },
      );
    }

    // Get current user
    const user = await getUserDB();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get trip and verify permissions
    const trip = await Trip.findById(tripId).lean();
    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 },
      );
    }

    // Type assertion needed because lean() returns a generic type
    const tripData = trip as unknown as TripType;

    // Check permissions: only creator or moderator can delete
    const isCreator = tripData.creatorId === user.userId;
    const isModerator =
      Array.isArray(tripData.attendants) &&
      tripData.attendants.some(
        (a: any) => a?.userId === user.userId && a?.role === "moderator",
      );

    if (!isCreator && !isModerator) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only creator or moderator can delete files",
        },
        { status: 403 },
      );
    }

    // Verify file exists at index
    if (
      !tripData.additionalFiles ||
      !Array.isArray(tripData.additionalFiles) ||
      fileIndex >= tripData.additionalFiles.length
    ) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 },
      );
    }

    // Get the trip document (not lean) to modify it
    const tripDoc = await Trip.findById(tripId);
    if (!tripDoc) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 },
      );
    }

    // Remove the file at the specified index
    if (
      tripDoc.additionalFiles &&
      Array.isArray(tripDoc.additionalFiles) &&
      fileIndex < tripDoc.additionalFiles.length
    ) {
      tripDoc.additionalFiles.splice(fileIndex, 1);
      tripDoc.updatedAt = new Date().toISOString();
      tripDoc.markModified("additionalFiles");
      await tripDoc.save();
    } else {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 },
      );
    }

    // Note: We're not deleting from Vercel Blob storage here to avoid breaking
    // references if the file is used elsewhere. If you want to delete from blob,
    // you would need to use the Vercel Blob SDK's delete method here.

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/trips/[tripId]/upload/[index] error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
