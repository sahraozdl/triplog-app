import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/Trip";
import { getUserDB } from "@/lib/getUserDB";
import { put } from "@vercel/blob";

// Type definitions for route parameters
interface RouteParams {
  params: Promise<{ tripId: string }>;
}

// Valid image MIME types
const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// Valid image file extensions
const VALID_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
];

function isValidImageType(mimeType: string, filename: string): boolean {
  const normalizedMime = mimeType.toLowerCase();
  const normalizedFilename = filename.toLowerCase();

  const hasValidMime = VALID_IMAGE_TYPES.some((type) =>
    normalizedMime.startsWith(type),
  );
  const hasValidExtension = VALID_IMAGE_EXTENSIONS.some((ext) =>
    normalizedFilename.endsWith(ext),
  );

  return hasValidMime || hasValidExtension;
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    await connectToDB();

    const { tripId } = await params;

    if (!tripId || typeof tripId !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid trip ID" },
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

    // Get trip and verify permissions (use lean for read-only check)
    const trip = await Trip.findById(tripId).lean();
    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 },
      );
    }

    // Check permissions: only creator or moderator can upload
    const isCreator = trip.creatorId === user.userId;
    const isModerator =
      Array.isArray(trip.attendants) &&
      trip.attendants.some(
        (a: any) => a?.userId === user.userId && a?.role === "moderator",
      );

    if (!isCreator && !isModerator) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only creator or moderator can upload files",
        },
        { status: 403 },
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const base64Data = formData.get("base64") as string | null;
    const filename = formData.get("filename") as string | null;

    let fileBuffer: Buffer;
    let mimeType: string;
    let originalFilename: string;
    let fileSize: number;

    if (file) {
      // Handle multipart/form-data file upload
      mimeType = file.type;
      originalFilename = file.name;
      fileSize = file.size;

      // Validate file type
      if (!isValidImageType(mimeType, originalFilename)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid file type. Only images are allowed.",
          },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else if (base64Data && filename) {
      // Handle base64 image upload (from Auto Calculate Map)
      const base64Match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (!base64Match) {
        return NextResponse.json(
          { success: false, error: "Invalid base64 format" },
          { status: 400 },
        );
      }

      mimeType = base64Match[1];
      const base64Content = base64Match[2];

      // Validate file type
      if (!isValidImageType(mimeType, filename)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid file type. Only images are allowed.",
          },
          { status: 400 },
        );
      }

      fileBuffer = Buffer.from(base64Content, "base64");
      originalFilename = filename;
      fileSize = fileBuffer.length;
    } else {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    // Generate unique filename to prevent duplicates
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const fileExtension = originalFilename.split(".").pop() || "png";
    const uniqueFilename = `trip-${tripId}-${timestamp}-${randomSuffix}.${fileExtension}`;

    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, fileBuffer, {
      access: "public",
      contentType: mimeType,
    });

    // Prepare file metadata
    const fileMetadata = {
      name: originalFilename,
      url: blob.url,
      type: mimeType,
      size: fileSize,
      uploadedAt: new Date().toISOString(),
    };

    // Atomically update trip with new file
    // Use findOneAndUpdate for atomic operation
    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: tripId },
      {
        $push: { additionalFiles: fileMetadata },
        $set: { updatedAt: new Date().toISOString() },
      },
      { new: true, lean: true },
    );

    if (!updatedTrip) {
      return NextResponse.json(
        { success: false, error: "Trip not found or update failed" },
        { status: 404 },
      );
    }

    // Debug: Log to verify the field was saved
    console.log(
      "Updated trip additionalFiles count:",
      updatedTrip.additionalFiles?.length || 0,
    );
    if (updatedTrip.additionalFiles && updatedTrip.additionalFiles.length > 0) {
      console.log(
        "Latest file:",
        updatedTrip.additionalFiles[updatedTrip.additionalFiles.length - 1],
      );
    }

    return NextResponse.json({
      success: true,
      file: fileMetadata,
    });
  } catch (error) {
    console.error("POST /api/trips/[tripId]/upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
