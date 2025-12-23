import mongoose, { Schema, Model } from "mongoose";

// Use a different model name to avoid conflicts with old travel schema
// The old schema might have expected files as a string, so we use "TravelEntry" instead
const travelEntrySchema = new Schema(
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
        url: String,
        name: String,
        type: String,
        size: Number,
      },
    ],

    sealed: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: "travels", // Explicitly set collection name
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

travelEntrySchema.pre("save", function (next) {
  this.updatedAt = new Date().toISOString();
  next();
});

// Delete old Travel model if it exists to avoid conflicts with old schema
if (mongoose.models.Travel) {
  delete mongoose.models.Travel;
}

// Use "TravelEntry" as the model name to avoid conflicts with old travel schema
// The old schema might have expected files as a string, so we use a new model name
let Travel: Model<any>;

if (mongoose.models.TravelEntry) {
  Travel = mongoose.models.TravelEntry;
} else {
  Travel = mongoose.model("TravelEntry", travelEntrySchema);
}

export { Travel };
