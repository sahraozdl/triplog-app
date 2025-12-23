import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { Travel } from "@/app/models/Travel";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Travel ID" }, { status: 400 });
    }

    await connectToDB();

    const travel = await Travel.findById(id).lean();

    if (!travel) {
      return NextResponse.json({ error: "Travel not found" }, { status: 404 });
    }

    const travelWithId = travel as {
      _id: mongoose.Types.ObjectId;
      [key: string]: unknown;
    };

    const serializedTravel = {
      ...travelWithId,
      _id: travelWithId._id.toString(),
    };

    return NextResponse.json(serializedTravel);
  } catch (error) {
    console.error("Single Travel GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch single travel" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Travel ID" }, { status: 400 });
    }

    await connectToDB();

    const travel = await Travel.findByIdAndDelete(id);

    if (!travel) {
      return NextResponse.json({ error: "Travel not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Travel Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete travel";
    return NextResponse.json(
      { error: "Failed to delete travel", details: errorMessage },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Travel ID" }, { status: 400 });
    }

    await connectToDB();
    const body = await req.json();

    // Verify the travel exists
    const existingTravel = await Travel.findById(id);
    if (!existingTravel) {
      return NextResponse.json({ error: "Travel not found" }, { status: 404 });
    }

    // Ensure files is always an array of objects
    let files: Array<{
      url: string;
      name: string;
      type: string;
      size: number;
    }> = existingTravel.files || [];

    if (body.files !== undefined && body.files !== null) {
      if (Array.isArray(body.files)) {
        // Validate each file object
        files = body.files.filter((file: unknown) => {
          return (
            typeof file === "object" &&
            file !== null &&
            "url" in file &&
            "name" in file &&
            "type" in file &&
            "size" in file
          );
        }) as Array<{ url: string; name: string; type: string; size: number }>;
      } else if (typeof body.files === "string") {
        // If it's a string, try to parse it
        try {
          const parsed = JSON.parse(body.files);
          if (Array.isArray(parsed)) {
            files = parsed.filter((file: unknown) => {
              return (
                typeof file === "object" &&
                file !== null &&
                "url" in file &&
                "name" in file &&
                "type" in file &&
                "size" in file
              );
            }) as Array<{
              url: string;
              name: string;
              type: string;
              size: number;
            }>;
          }
        } catch (parseError) {
          console.error("Failed to parse files string:", parseError);
          files = existingTravel.files || [];
        }
      }
    }

    // Extract update data, ensuring we don't allow changing the _id
    const { _id, files: _files, ...updateFields } = body;

    // Ensure the ID in the body matches the URL parameter (strict scoping)
    if (_id && _id.toString() !== id) {
      return NextResponse.json(
        { error: "Travel ID mismatch" },
        { status: 400 },
      );
    }

    const updateData = {
      ...updateFields,
      files: files,
      updatedAt: new Date().toISOString(),
    };

    // Update the travel
    const updatedTravel = await Travel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedTravel) {
      return NextResponse.json({ error: "Travel not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      travel: updatedTravel,
    });
  } catch (error) {
    console.error("PUT Travel Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update travel";
    return NextResponse.json(
      { error: "Failed to update travel", details: errorMessage },
      { status: 500 },
    );
  }
}
