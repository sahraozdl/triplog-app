import mongoose, { Schema, Model } from "mongoose";

const travelSchema = new Schema(
  {
    tripId: { type: String, required: true },
    userId: { type: String, required: true },
    dateTime: { type: String, required: true },
    appliedTo: { type: [String], default: [] },
    isGroupSource: { type: Boolean, default: false },
    travelReason: String,
    vehicleType: String,
    departureLocation: String,
    destination: String,
    distance: Number,
    isRoundTrip: Boolean,
    startTime: String,
    endTime: String,

    files: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        size: { type: Number, required: true },
      },
    ],

    sealed: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: "travels",
    timestamps: false,
  },
);

travelSchema.pre("save", function (next) {
  this.updatedAt = new Date().toISOString();
  next();
});

const Travel: Model<any> =
  mongoose.models.Travel || mongoose.model("Travel", travelSchema);

export { Travel };
