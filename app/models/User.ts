import mongoose, { Model, Schema } from "mongoose";
import { IUserDocument } from "@/app/types/user";

const UserSchema = new Schema<IUserDocument>({
  userId: { type: String, required: true, unique: true },
  email: String,
  name: String,
  picture: String,
  roles: [String],
  createdAt: { type: Date, default: Date.now },
  activeTrips: [String],
  pastTrips: [String],
  pendingInvites: [String],
  organizationId: String,
});

const User =
  (mongoose.models.User as Model<IUserDocument>) ||
  mongoose.model<IUserDocument>("User", UserSchema);

export default User;
