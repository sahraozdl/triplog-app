"use client";
import { createContext, useContext } from "react";
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
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider
      value={{ user: initialUser, isLoading: initialUser ? false : true, error: !initialUser ? "User not found" : null }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext).user;
}