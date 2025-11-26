import mongoose from "mongoose";

const TripSchema = new mongoose.Schema({
  creatorId: { type: String, required: true }, // auth0Id of creator

  attendants: [
    {
      userId: String,
      joinedAt: String,
      role: { type: String, enum: ["employee", "employer", "moderator"] },
      status: { type: String, enum: ["active", "removed"], default: "active" },
    },
  ],

  invites: [
    {
      code: String,
      createdBy: String,
      expiresAt: String,
    },
  ],

  basicInfo: {
    _id: false,
    title: String,
    description: String,
    startDate: String,
    endDate: String,
    country: String,
    resort: String,
    origin: String,
    primaryDestination: String,
  },

  status: { type: String, enum: ["active", "ended"], default: "active" },

  dailyLogs: [String], // log id

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Trip || mongoose.model("Trip", TripSchema);
