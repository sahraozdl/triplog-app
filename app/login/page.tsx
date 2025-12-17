import { auth0 } from "@/lib/auth0";
import LoginButton from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";
import Profile from "@/components/Profile";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  // If user is already logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-md p-8 flex flex-col items-center text-center gap-6">
        {/* Title */}
        <h1 className="text-3xl font-bold">Welcome to TripLog</h1>

        {/* Content */}
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-muted-foreground text-sm">
            Please log in to access your account.
          </p>

          <LoginButton />
        </div>
      </div>
    </div>
  );
}
