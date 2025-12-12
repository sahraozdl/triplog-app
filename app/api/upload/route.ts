import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const originalFilename = searchParams.get("filename") || "file";

    // Get the file from the request body
    // The body can be a ReadableStream, Blob, or File
    const body = await request.blob().catch(async () => {
      // If blob() fails, try to get it as arrayBuffer and convert
      const arrayBuffer = await request.arrayBuffer();
      return new Blob([arrayBuffer]);
    });

    if (!body || body.size === 0) {
      return NextResponse.json(
        { error: "No file provided or file is empty" },
        { status: 400 },
      );
    }

    // Generate unique filename to prevent conflicts
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const fileExtension = originalFilename.split(".").pop() || "";
    const baseName = originalFilename.replace(/\.[^/.]+$/, "") || "file";
    const uniqueFilename = fileExtension
      ? `${baseName}-${timestamp}-${randomSuffix}.${fileExtension}`
      : `${baseName}-${timestamp}-${randomSuffix}`;

    // Upload to Vercel Blob with unique filename
    const blob = await put(uniqueFilename, body, {
      access: "public",
      contentType: body.type || "application/octet-stream",
      addRandomSuffix: false, // We're already adding our own suffix
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
