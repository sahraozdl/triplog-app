"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { IUser } from "@/app/types/user";

interface UserContextValue {
  user: IUser | null;
  isLoading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  isLoading: true,
  error: null,
});

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: IUser | null;
  children: ReactNode;
}) {
  const [user] = useState<IUser | null>(initialUser);
  const [isLoading] = useState<boolean>(initialUser ? false : true);
  const [error] = useState<string | null>(null);

  return (
    <UserContext.Provider value={{ user, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
