import {
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "@/app/types/FormStates";

export function getInitialFormState<T extends {}>(itemType: string): T {
  switch (itemType) {
    case "worktime":
      return {
        startTime: "",
        endTime: "",
        description: "",
      } as unknown as T;
    case "accommodation":
      return {
        accommodationType: "",
        accommodationCoveredBy: "",
        overnightStay: "",
        meals: {
          breakfast: { eaten: false, coveredBy: "" },
          lunch: { eaten: false, coveredBy: "" },
          dinner: { eaten: false, coveredBy: "" },
        },
      } as unknown as T;
    case "additional":
      return {
        notes: "",
        uploadedFiles: [],
      } as unknown as T;
    default:
      return {} as T;
  }
}

export const getWorkTimeInitialState = (): WorkTimeFormState =>
  getInitialFormState<WorkTimeFormState>("worktime");

export const getAccommodationInitialState = (): AccommodationFormState =>
  getInitialFormState<AccommodationFormState>("accommodation");

export const getAdditionalInitialState = (): AdditionalFormState =>
  getInitialFormState<AdditionalFormState>("additional");
