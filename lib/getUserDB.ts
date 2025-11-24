// lib/getCurrentUser.ts
import { auth0 } from "@/lib/auth0";
import User from "@/app/models/User";
import { connectToDB } from "@/lib/mongodb";
import { IUser } from "@/app/types/user";

export async function getUserDB(): Promise<IUser | null> {
  const session = await auth0.getSession();

  if (!session?.user) return null;

  const auth0User = session.user;

  await connectToDB();
  const dbUser = await User.findOne({ userId: auth0User.sub }).lean();

  if (!dbUser) {
    return {
      userId: auth0User.sub,
      name: auth0User.name || "",
      email: auth0User.email || "",
      picture: auth0User.picture || "",
      roles: auth0User.roles || [],
      activeTrips: [],
      pastTrips: [],
      pendingInvites: [],
      organizationId: null,
      createdAt: new Date(),
    };
  }

  return {
    userId: dbUser.userId,
    name: dbUser.name,
    email: dbUser.email,
    picture: dbUser.picture,
    roles: dbUser.roles || [],
    activeTrips: dbUser.activeTrips || [],
    pastTrips: dbUser.pastTrips || [],
    pendingInvites: dbUser.pendingInvites || [],
    organizationId: dbUser.organizationId || null,
    createdAt: dbUser.createdAt || new Date(),
  };
}
