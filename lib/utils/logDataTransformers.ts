import { DailyLogFormState } from "@/app/types/DailyLog";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  TravelFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "@/app/types/FormStates";
// take a look if this missing fields are the reason for not overriding the other forms for different user log update
import { WorkTimeOverride } from "@/components/forms/WorkTimeForm";

export function transformLogToFormState(
  log: DailyLogFormState,
): Record<string, unknown> {
  const logDataCopy = { ...log };
  const formPayload = {
    ...logDataCopy,
  } as Record<string, unknown>;

  delete formPayload.__v;
  delete formPayload._id;
  delete formPayload.itemType;
  delete formPayload.userId;
  delete formPayload.tripId;
  delete formPayload.dateTime;
  delete formPayload.appliedTo;
  delete formPayload.isGroupSource;
  delete formPayload.createdAt;
  delete formPayload.updatedAt;
  delete formPayload.sealed;

  return formPayload;
}

export function extractWorkTimeOverride(
  log: DailyLogFormState & { itemType: "worktime" },
): WorkTimeOverride {
  return {
    startTime: log.startTime || "",
    endTime: log.endTime || "",
    description: log.description || "",
  };
}
