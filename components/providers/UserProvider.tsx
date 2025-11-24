"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { IUser } from "@/app/types/user";

const UserContext = createContext<IUser | null>(null);

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: IUser | null;
  children: ReactNode;
}) {
  const [user] = useState<IUser | null>(initialUser);

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
