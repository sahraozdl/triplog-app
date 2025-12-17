import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth0.getSession();
  const user = session?.user;

  // Redirect authenticated users to dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Redirect unauthenticated users to login
  redirect("/login");
}
