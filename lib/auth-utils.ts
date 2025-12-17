import { NextResponse } from "next/server";
import { getUserDB } from "./getUserDB";
import { IUser } from "@/app/types/user";

export type AuthResult =
  | { success: true; user: IUser }
  | { success: false; response: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const user = await getUserDB();

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  return { success: true, user };
}

export async function requireAuthAndMatchUser(
  userId: string,
): Promise<AuthResult> {
  const authResult = await requireAuth();

  if (!authResult.success) {
    return authResult;
  }

  if (authResult.user.userId !== userId) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Forbidden",
          message: "You can only modify your own data",
        },
        { status: 403 },
      ),
    };
  }

  return authResult;
}
