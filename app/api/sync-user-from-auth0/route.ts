import { NextResponse, NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/app/models/User";
import { generateUserId } from "@/lib/getUserDB";

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    console.log("sync-user endpoint called");

    await connectToDB();
    console.log("connected to MongoDB");

    const existingUser = await User.findOne({ auth0Id: body.auth0Id });
    if (!existingUser) {
      await User.create({
        auth0Id: body.auth0Id,
        userId: generateUserId(),
        email: body.email,
        name: body.name,
        picture: body.picture,
        roles: body.roles,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activeTrips: [],
        pastTrips: [],
        pendingInvites: [],
        organizationId: null,
      });
      return NextResponse.json(
        { message: "User created", created: true },
        { status: 200 },
      );
    }
    return NextResponse.json(
      { message: "User already exists", created: false },
      { status: 200 },
    );
  } catch (error) {
    // Hata tipini kontrol et ve güvenli mesajı al
    const errorMessage = isError(error) ? error.message : "Unknown error";
    console.error("Error in /api/sync-user-from-auth0:", error);
    // Hata durumunda bile Action'ın JSON ayrıştırması yapabilmesi için JSON döndürmeye devam et
    return NextResponse.json(
      {
        message: "Internal server error during sync",
        created: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
