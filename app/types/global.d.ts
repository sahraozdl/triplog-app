import mongoose from "mongoose";

declare global {
  var mongooseCache:
    | {
        conn: mongoose.Connection | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

export {};
