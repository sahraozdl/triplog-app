export interface TravelFields {
  travelReason: string;
  vehicleType: string;
  departureLocation: string;
  destination: string;
  distance: number | null;
  isRoundTrip: boolean;
  dateTime: {
    date: string;
    time: string;
  };
}

export type MealCoveredBy = "company" | "employee" | "";

export interface MealField {
  eaten: boolean;
  coveredBy: MealCoveredBy;
}

export interface MealsFields {
  breakfast: MealField;
  lunch: MealField;
  dinner: MealField;
}

export interface AccommodationMealsFields {
  accommodationType: string;
  accommodationCoveredBy: string;
  overnightStay: "yes" | "no" | "";
  meals: MealsFields;
}

export interface WorkTimeFields {
  startTime: string;
  endTime: string;
  description: string;
}

export interface UploadedFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface AdditionalFields {
  notes: string;
  uploadedFiles: UploadedFile[];
}

export interface DailyLogFormState {
  travel: TravelFields;
  workTime: WorkTimeFields;
  accommodationMeals: AccommodationMealsFields;
  additional: AdditionalFields;
}
