import {
  DailyLogFormState,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
} from "@/app/types/DailyLog";
import {
  WorkTimeFormState,
  AccommodationFormState,
  AdditionalFormState,
} from "@/app/types/FormStates";
import { LogCreationPayload } from "@/app/types/LogCreation";

export interface LogEditData {
  logIds: {
    worktime?: string;
    accommodation?: string;
    additional?: string;
  };
  workTime: WorkTimeFormState;
  accommodationMeals: AccommodationFormState;
  additional: AdditionalFormState;
  workTimeOverrides: Record<
    string,
    import("@/components/workTime/WorkTimeForm").WorkTimeOverride
  >;
  selectedDate: string;
  appliedTo: string[];
  ownerUserId: string;
  tripId: string;
  originalLogs: DailyLogFormState[];
  usersWithExistingLogs: Set<string>;
}

export interface LoadLogsResult {
  success: boolean;
  data?: LogEditData;
  error?: string;
}

export interface FormData {
  type: "worktime" | "accommodation" | "additional";
  data: WorkTimeFormState | AccommodationFormState | AdditionalFormState;
  id?: string;
}

export interface LogUpdatePlan {
  logsToUpdate: DailyLogFormState[];
  logsToCreate: LogCreationPayload[];
  logsToDelete: string[];
}

export interface CreatedLogInfo {
  id: string;
  _id: string;
  userId: string;
  itemType: string;
  tripId: string;
  dateTime: string;
  isGroupSource: boolean;
  appliedTo: string[];
}
