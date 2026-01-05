import mongoose, { Schema, Model } from "mongoose";

const dailyLogBaseSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    relatedLogs: { type: [String], default: [], required: true },

    tripId: { type: String, required: true },
    userId: { type: String, required: true },
    dateTime: { type: String, required: true },

    appliedTo: { type: [String], default: [] },
    isGroupSource: { type: Boolean, default: false },

    personalFields: {
      personalCost: { type: Object, default: {} },
      notes: String,
    },

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
    discriminatorKey: "itemType",
    collection: "dailylogs",
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

dailyLogBaseSchema.pre("save", function (next) {
  this.updatedAt = new Date().toISOString();
  next();
});

const workTimeSchema = new Schema({
  startTime: String,
  endTime: String,
  description: String,
});

const accommodationSchema = new Schema({
  accommodationType: String,
  accommodationCoveredBy: String,
  overnightStay: String,
  meals: {
    breakfast: { eaten: Boolean, coveredBy: String },
    lunch: { eaten: Boolean, coveredBy: String },
    dinner: { eaten: Boolean, coveredBy: String },
  },
});

const additionalSchema = new Schema({
  notes: String,
  uploadedFiles: Array,
});

let DailyLog: Model<any>;
let isNewModel = false;

if (mongoose.models && mongoose.models.DailyLog) {
  DailyLog = mongoose.models.DailyLog;
} else {
  DailyLog = mongoose.model("DailyLog", dailyLogBaseSchema);
  isNewModel = true;
}

if (isNewModel) {
  try {
    if (
      DailyLog.discriminator &&
      typeof DailyLog.discriminator === "function"
    ) {
      DailyLog.discriminator("worktime", workTimeSchema);
      DailyLog.discriminator("accommodation", accommodationSchema);
      DailyLog.discriminator("additional", additionalSchema);
    }
  } catch (error) {
    console.warn("Discriminator setup warning:", error);
  }
}

export { DailyLog };
export const WorkTimeLog =
  (mongoose.models && mongoose.models.WorkTime) ||
  DailyLog.discriminators?.worktime;
export const AccommodationLog =
  (mongoose.models && mongoose.models.Accommodation) ||
  DailyLog.discriminators?.accommodation;
export const AdditionalLog =
  (mongoose.models && mongoose.models.Additional) ||
  DailyLog.discriminators?.additional;
