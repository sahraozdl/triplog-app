import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  email: String,
  name: String,
  picture: String,
  roles: [String],
  createdAt: Date,
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
