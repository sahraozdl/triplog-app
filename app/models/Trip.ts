import mongoose from "mongoose";

const TripSchema = new mongoose.Schema(
  {
    creatorId: { type: String, required: true },

    attendants: [
      {
        userId: String,
        joinedAt: { type: String },
        role: { type: String, enum: ["employee", "employer", "moderator"] },
        status: { type: String, enum: ["active", "ended"], default: "active" },
      },
    ],

    invites: [
      {
        code: String,
        createdBy: String,
        expiresAt: {
          type: String,
          default: () =>
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    ],

    basicInfo: {
      title: { type: String, required: true },
      description: { type: String, default: "" },

      startDate: {
        type: String,
        default: () => new Date().toISOString() as string,
      },
      endDate: { type: String },

      country: String,
      resort: String,

      departureLocation: String,
      arrivalLocation: String,
    },

    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },

    createdAt: {
      type: String,
      default: () => new Date().toISOString() as string,
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString() as string,
    },
  },
  { timestamps: false },
);

export default mongoose.models.Trip || mongoose.model("Trip", TripSchema);
