import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/Trip";

export async function getTripDescription(
  tripId?: string,
  tripDescription?: string,
): Promise<string> {
  if (tripDescription) {
    return tripDescription;
  }

  if (tripId) {
    try {
      await connectToDB();
      const trip = await Trip.findById(tripId);
      if (trip?.basicInfo?.description) {
        return trip.basicInfo.description;
      }
    } catch (error) {
      console.error("Error fetching trip description:", error);
    }
  }

  return "";
}
