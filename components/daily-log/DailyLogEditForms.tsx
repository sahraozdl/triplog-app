import {
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "@/app/types/FormStates";
import { TripAttendant } from "@/app/types/Trip";
import WorkTimeForm, {
  WorkTimeOverride,
} from "@/components/workTime/WorkTimeForm";
import AccommodationMealsForm from "@/components/accommodationMeal/AccommodationMealsForm";
import AdditionalForm from "@/components/additional/AdditionalForm";
import { createSharedFieldToggleHandler } from "@/lib/utils/sharedFieldHelpers";

interface DailyLogEditFormsProps {
  workTime: WorkTimeFormState;
  onWorkTimeChange: (value: WorkTimeFormState) => void;
  accommodationMeals: AccommodationFormState;
  onAccommodationMealsChange: (value: AccommodationFormState) => void;
  additional: AdditionalFormState;
  onAdditionalChange: (value: AdditionalFormState) => void;
  appliedTo: string[];
  attendants: TripAttendant[];
  workTimeOverrides: Record<string, WorkTimeOverride>;
  onWorkTimeOverridesChange: (
    overrides: Record<string, WorkTimeOverride>,
  ) => void;
  sharedFields: Set<string>;
  onSharedFieldsChange: React.Dispatch<React.SetStateAction<Set<string>>>;
  tripId: string;
}

export function DailyLogEditForms({
  workTime,
  onWorkTimeChange,
  accommodationMeals,
  onAccommodationMealsChange,
  additional,
  onAdditionalChange,
  appliedTo,
  attendants,
  workTimeOverrides,
  onWorkTimeOverridesChange,
  sharedFields,
  onSharedFieldsChange,
  tripId,
}: DailyLogEditFormsProps) {
  const handleWorkTimeShareToggle = createSharedFieldToggleHandler(
    "worktime",
    onSharedFieldsChange,
  );
  const handleAccommodationShareToggle = createSharedFieldToggleHandler(
    "accommodation",
    onSharedFieldsChange,
  );
  const handleAdditionalShareToggle = createSharedFieldToggleHandler(
    "additional",
    onSharedFieldsChange,
  );

  return (
    <>
      <WorkTimeForm
        value={workTime}
        onChange={onWorkTimeChange}
        appliedTo={appliedTo}
        attendants={attendants}
        onOverridesChange={onWorkTimeOverridesChange}
        overrides={workTimeOverrides}
        shareEnabled={sharedFields.has("worktime")}
        onShareChange={handleWorkTimeShareToggle}
        tripId={tripId}
      />

      <AccommodationMealsForm
        value={accommodationMeals}
        onChange={onAccommodationMealsChange}
        shareEnabled={sharedFields.has("accommodation")}
        onShareChange={handleAccommodationShareToggle}
        appliedTo={appliedTo}
      />

      <AdditionalForm
        value={additional}
        onChange={onAdditionalChange}
        shareEnabled={sharedFields.has("additional")}
        onShareChange={handleAdditionalShareToggle}
        appliedTo={appliedTo}
      />
    </>
  );
}
