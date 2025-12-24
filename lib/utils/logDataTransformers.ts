import { DailyLogFormState } from "@/app/types/DailyLog";
import { WorkTimeOverride } from "@/components/workTime/WorkTimeForm";

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
