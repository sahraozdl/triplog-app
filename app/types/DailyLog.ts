import mongoose from "mongoose";

export interface UploadedFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface BaseLog {
  _id: string | mongoose.Types.ObjectId;
  tripId: string;
  userId: string;

  dateTime: string;

  appliedTo: string[];
  isGroupSource: boolean;

  files: UploadedFile[];
  sealed: boolean;

  createdAt: string;
  updatedAt: string;

  itemType: "worktime" | "accommodation" | "additional";
}
export interface WorkTimeLog extends BaseLog {
  itemType: "worktime";
  startTime: string;
  endTime: string;
  description: string;
}
export type MealCoveredBy =
  | "company"
  | "employee"
  | "partner"
  | "included in accommodation"
  | "";

export interface AccommodationLog extends BaseLog {
  itemType: "accommodation";

  accommodationType: string;
  accommodationCoveredBy: string;
  overnightStay: "yes" | "no" | "";

  meals: {
    breakfast: MealFields;
    lunch: MealFields;
    dinner: MealFields;
  };
}

export interface MealFields {
  eaten: boolean;
  coveredBy: MealCoveredBy;
}
export interface AdditionalLog extends BaseLog {
  itemType: "additional";
  notes: string;
  uploadedFiles: UploadedFile[];
}
export type DailyLogFormState = WorkTimeLog | AccommodationLog | AdditionalLog;
