import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
