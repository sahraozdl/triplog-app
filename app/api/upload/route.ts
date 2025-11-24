import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { filename, contentType } = await request.json();

  const blob = await put(filename, request.body!, {
    access: "public",
    contentType,
  });

  return NextResponse.json({ url: blob.url });
}
