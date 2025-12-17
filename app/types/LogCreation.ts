import {
  TravelFormState,
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "./FormStates";

export type AnyFormState =
  | TravelFormState
  | WorkTimeFormState
  | AccommodationFormState
  | AdditionalFormState;

export interface LogCreationPayload {
  itemType: "travel" | "worktime" | "accommodation" | "additional";
  tripId: string;
  userId: string;
  dateTime: string;
  appliedTo: string[];
  isGroupSource: boolean;
  data: AnyFormState;
  files: unknown[];
}
