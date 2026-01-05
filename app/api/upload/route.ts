import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import {
  createErrorResponse,
  createSuccessResponse,
  ApiError,
} from "@/lib/utils/apiErrorHandler";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const originalFilename = searchParams.get("filename") || "file";

    const body = await request.blob().catch(async () => {
      const arrayBuffer = await request.arrayBuffer();
      return new Blob([arrayBuffer]);
    });

    if (!body || body.size === 0) {
      return createErrorResponse(
        new ApiError("No file provided or file is empty", 400, "NO_FILE"),
      );
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const fileExtension = originalFilename.split(".").pop() || "";
    const baseName = originalFilename.replace(/\.[^/.]+$/, "") || "file";
    const uniqueFilename = fileExtension
      ? `${baseName}-${timestamp}-${randomSuffix}.${fileExtension}`
      : `${baseName}-${timestamp}-${randomSuffix}`;

    const blob = await put(uniqueFilename, body, {
      access: "public",
      contentType: body.type || "application/octet-stream",
      addRandomSuffix: false,
    });

    return NextResponse.json(blob);
  } catch (error) {
    return createErrorResponse(error, "Internal server error", 500);
  }
}
