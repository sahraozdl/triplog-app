import { WorkTimeLog, AccommodationLog, AdditionalLog } from "./DailyLog";

type FormState<T> = Omit<
  T,
  | "_id"
  | "userId"
  | "tripId"
  | "createdAt"
  | "updatedAt"
  | "files"
  | "sealed"
  | "isGroupSource"
  | "appliedTo"
  | "dateTime"
  | "itemType"
>;

export type WorkTimeFormState = FormState<WorkTimeLog>;

export type AccommodationFormState = FormState<AccommodationLog>;

export type AdditionalFormState = FormState<AdditionalLog>;
