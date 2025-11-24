import { NextResponse, NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/app/models/User";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  console.log("🔵 sync-user endpoint called");

  await connectToDB();
  console.log("🟢 connected to MongoDB");
  const existingUser = await User.findOne({ auth0Id: body.auth0Id });
  if (!existingUser) {
    await User.create(
      {
        auth0Id: body.auth0Id,
        email: body.email,
        name: body.name,
        picture: body.picture,
        roles: body.roles,
        createdAt: new Date(),
      }
    );
    return NextResponse.json({ message: "User created" }, { status: 200 });
  }
  return NextResponse.json({ message: "User already exists" }, { status: 200 });
}