import {
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "./FormStates";

export type AnyFormState =
  | WorkTimeFormState
  | AccommodationFormState
  | AdditionalFormState;

export interface LogCreationPayload {
  itemType: "worktime" | "accommodation" | "additional";
  tripId: string;
  userId: string;
  dateTime: string;
  appliedTo: string[];
  isGroupSource: boolean;
  data: AnyFormState;
  files: unknown[];
}
