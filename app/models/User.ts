import mongoose, { Schema } from "mongoose";
import { IUserDocument } from "@/app/types/user";

const UserSchema = new Schema<IUserDocument>({
  auth0Id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, unique: true },
  email: String,
  name: String,
  picture: String,
  roles: [String],
  createdAt: { type: String, default: new Date().toISOString() },
  updatedAt: { type: String, default: new Date().toISOString() },
  activeTrips: [String],
  pastTrips: [String],
  pendingInvites: [String],
  organizationId: String,
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
