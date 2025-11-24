import TravelForm from "@/components/forms/TravelForm";
import WorkTimeForm from "@/components/forms/WorkTimeForm";
import AccommodationMealsForm from "@/components/forms/AccommodationMealsForm";
import AdditionalForm from "@/components/forms/AdditionalForm";
import { Button } from "@/components/ui/button";
export default function DailyLogPage() {
  return (
    <div>
      <div className="flex flex-row justify-between items-center px-12 py-4 w-3/4 mx-auto">
      <h1 className="text-4xl font-black leading-tight text-gray-900 dark:text-white w-3/4">
        Daily Log Entry
      </h1>
      <div className="flex flex-row gap-4 w-1/4">
        <Button variant="outline" className="w-1/2">Cancel</Button>
        <Button variant="outline" className="w-1/2">Save</Button>
      </div>
      </div>
      <TravelForm />
      <WorkTimeForm />
      <AccommodationMealsForm />
      <AdditionalForm />
    </div>
  );
}
