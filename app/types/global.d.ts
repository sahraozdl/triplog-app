import mongoose from "mongoose";

declare global {
  const mongooseCache:
    | {
        conn: mongoose.Connection | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

export {};
