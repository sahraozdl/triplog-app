"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { IUser } from "@/app/types/user";

const AppUserContext = createContext<IUser | null>(null);

export function AppUserProvider({
  initialUser,
  children,
}: {
  initialUser: IUser | null;
  children: ReactNode;
}) {
  const [user] = useState<IUser | null>(initialUser);

  return (
    <AppUserContext.Provider value={user}>{children}</AppUserContext.Provider>
  );
}

export function useAppUser() {
  return useContext(AppUserContext);
}
