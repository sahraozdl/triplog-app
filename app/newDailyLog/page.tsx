"use client";
import TravelForm from "@/components/forms/TravelForm";
import WorkTimeForm from "@/components/forms/WorkTimeForm";
import AccommodationMealsForm from "@/components/forms/AccommodationMealsForm";
import AdditionalForm from "@/components/forms/AdditionalForm";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import InviteColleaguesDialog from "@/components/form-elements/InviteColleaguesDialog";
import {
  TravelFields,
  AccommodationMealsFields,
  AdditionalFields,
  WorkTimeFields,
} from "@/app/types/DailyLog";

export default function DailyLogPage() {
  const router = useRouter();
  const user = useUser();
  const userId = user?.userId;
  const { tripId } = useParams();

  const [travel, setTravel] = useState<TravelFields>({
    travelReason: "",
    vehicleType: "",
    departureLocation: "",
    destination: "",
    distance: null,
    isRoundTrip: false,
    dateTime: { date: "", time: "" },
  });
  const [workTime, setWorkTime] = useState<WorkTimeFields>({
    startTime: "",
    endTime: "",
    description: "",
  });
  const [accommodationMeals, setAccommodationMeals] =
    useState<AccommodationMealsFields>({
      accommodationType: "",
      accommodationCoveredBy: "",
      overnightStay: "",
      meals: {
        breakfast: {
          eaten: false,
          coveredBy: "",
        },
        lunch: {
          eaten: false,
          coveredBy: "",
        },
        dinner: {
          eaten: false,
          coveredBy: "",
        },
      },
    });
  const [additional, setAdditional] = useState<AdditionalFields>({
    notes: "",
    uploadedFiles: [],
  });

  const [appliedTo, setAppliedTo] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);

  const attendants = ["user1", "user2", "user3"];

  const cancel = () => {
    router.push(`/tripDetail/${tripId}`);
  };
  const saveDailyLog = async () => {
    const body = {
      tripId,
      userId,
      sharedFields: { travel, workTime, accommodationMeals, additional },
      personalFields: {},
      appliedTo,
      isGroupSource: appliedTo.length > 1,
    };

    const response = await fetch("/api/daily-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (data.success) {
      router.push(`/daily-logs/${data.log._id}`); // TODO: change to tripDetail page
    }
  };
  return (
    <div className="flex flex-col justify-between items-center px-12 py-4 w-full">
        <div className="flex flex-row justify-between items-center gap-4 py-6 w-3/4">
          <h1 className="text-4xl font-black leading-tight text-gray-900 dark:text-white">
            Daily Log Entry
          </h1>
          <div className="flex flex-row gap-4">
          {attendants.length > 1 && (
            <Button variant="outline" type="button" className="cursor-pointer" onClick={() => setInviteOpen(true)}>
              Invite Colleagues
            </Button>
          )}
          <Button variant="outline" type="button" className=" cursor-pointer" onClick={cancel}>
            Cancel
          </Button>
          <Button variant="outline" type="submit" className=" cursor-pointer">
            Save
          </Button></div>
        </div>
        <form className="flex flex-col gap-4 w-full" onSubmit={saveDailyLog}>
          <TravelForm value={travel} onChange={setTravel} />
          <WorkTimeForm value={workTime} onChange={setWorkTime} />
          <AccommodationMealsForm
            value={accommodationMeals}
            onChange={setAccommodationMeals}
          />
          <AdditionalForm value={additional} onChange={setAdditional} />
        </form>
      <InviteColleaguesDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        attendants={attendants}
        selected={appliedTo}
        onSelect={setAppliedTo}
      />
    </div>
  );
}
