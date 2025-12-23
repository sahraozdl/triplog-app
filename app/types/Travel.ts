import mongoose from "mongoose";
import { UploadedFile } from "./DailyLog";

export interface Travel {
  _id: string | mongoose.Types.ObjectId;
  tripId: string;
  userId: string;
  dateTime: string;

  appliedTo: string[];
  isGroupSource: boolean;

  travelReason: string;
  vehicleType: string;
  departureLocation: string;
  destination: string;
  distance: number | null;
  isRoundTrip: boolean;
  startTime: string;
  endTime: string;

  files: UploadedFile[];

  sealed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TravelFormState = Omit<
  Travel,
  | "_id"
  | "userId"
  | "tripId"
  | "createdAt"
  | "updatedAt"
  | "sealed"
  | "isGroupSource"
  | "appliedTo"
  | "dateTime"
> & {
  files?: UploadedFile[];
};
