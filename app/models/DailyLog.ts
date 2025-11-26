import mongoose from "mongoose";

const DailyLogSchema = new mongoose.Schema({
  tripId: { type: String, required: true }, // Trip document _id
  userId: { type: String, required: true }, // Auth0 user_id
  isGroupSource: { type: Boolean, default: false },

  appliedTo: [{ type: String }], // list of userIds this log applies to

  date: { type: String, required: true }, // "2025-11-24"

  sharedFields: {
    travel: { type: Object, default: {} },
    workTime: { type: Object, default: {} },
    accommodationMeals: { type: Object, default: {} },
    additional: { type: Object, default: {} },
  },

  personalFields: {
    // things that each applied user will have separately
    personalCost: { type: Object, default: {} },
    notes: String,
  },

  files: [
    {
      url: String, // Vercel Blob URL
      name: String,
      type: String,
      size: Number,
    },
  ],

  sealed: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.DailyLog ||
  mongoose.model("DailyLog", DailyLogSchema);
