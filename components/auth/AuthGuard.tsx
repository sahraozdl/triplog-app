"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      const currentPath = window.location.pathname + window.location.search;
      const loginRoute = process.env.NEXT_PUBLIC_LOGIN_ROUTE || "/login";
      window.location.href = `${loginRoute}?returnTo=${encodeURIComponent(currentPath)}`;
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      )
    );
  }

  if (!user) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="text-muted-foreground">Redirecting to login...</div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
