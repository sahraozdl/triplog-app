import { auth0 } from "@/lib/auth0";
import User from "@/app/models/User";
import { connectToDB } from "@/lib/mongodb";
import { IUser } from "@/app/types/user";
import { v4 as uuidv4 } from "uuid";

export function generateUserId() {
  return uuidv4();
}

export async function getUserDB(): Promise<IUser | null> {
  const session = await auth0.getSession();
  if (!session?.user) return null;

  const auth0User = session.user;

  await connectToDB();
  const dbUser = await User.findOne({ auth0Id: auth0User.sub }).lean<IUser>();

  return dbUser ?? null;
}
