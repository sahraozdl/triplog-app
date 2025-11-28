"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import LocationInput from "@/components/form-elements/LocationInput";

export default function NewTripPage() {
  const router = useRouter();
  const user = useAppUser();
  const userId = user?.userId;

  const [basicInfo, setBasicInfo] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    country: "",
    resort: "",
    departureLocation: "",
    arrivalLocation: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toLocalDatetime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  async function createTrip(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          basicInfo,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/tripDetail/${data.tripId}`);
      } else {
        alert("Failed to create trip: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center sm:text-left text-foreground">
        Create New Trip
      </h1>

      <form className="flex flex-col gap-6" onSubmit={createTrip}>
        <Input id="createdBy" type="hidden" value={userId ?? ""} />

        {/* Trip Title */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Trip Title</Label>
          <Input
            id="title"
            placeholder="e.g. Stockholm Business Review"
            value={basicInfo.title}
            onChange={(e) =>
              setBasicInfo({ ...basicInfo, title: e.target.value })
            }
            required
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="e.g. Quarterly review meetings with the Nordic team."
            value={basicInfo.description}
            onChange={(e) =>
              setBasicInfo({ ...basicInfo, description: e.target.value })
            }
            className="h-32 resize-none"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="datetime-local"
              onClick={(e) => e.currentTarget.showPicker()}
              value={toLocalDatetime(basicInfo.startDate)}
              onChange={(e) => {
                const val = e.target.value;
                setBasicInfo({
                  ...basicInfo,
                  startDate: val ? new Date(val).toISOString() : "",
                });
              }}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="datetime-local"
              onClick={(e) => e.currentTarget.showPicker()}
              value={toLocalDatetime(basicInfo.endDate)}
              onChange={(e) => {
                const val = e.target.value;
                setBasicInfo({
                  ...basicInfo,
                  endDate: val ? new Date(val).toISOString() : "",
                });
              }}
            />
          </div>
        </div>

        {/* Locations (GOOGLE AUTOCOMPLETE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="departureLocation">Departure Location</Label>
            <LocationInput
              id="departureLocation"
              placeholder="Search city or airport..."
              value={basicInfo.departureLocation}
              onChange={(val) =>
                setBasicInfo({ ...basicInfo, departureLocation: val })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="arrivalLocation">Arrival Location</Label>
            <LocationInput
              id="arrivalLocation"
              placeholder="Search destination..."
              value={basicInfo.arrivalLocation}
              onChange={(val) =>
                setBasicInfo({ ...basicInfo, arrivalLocation: val })
              }
            />
          </div>
        </div>

        {/* Country & Resort (GOOGLE AUTOCOMPLETE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="country">Country</Label>
            <LocationInput
              id="country"
              placeholder="e.g. Sweden"
              value={basicInfo.country}
              onChange={(val) => setBasicInfo({ ...basicInfo, country: val })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="resort">Resort / Specific Place</Label>
            <LocationInput
              id="resort"
              placeholder="e.g. Hilton Slussen"
              value={basicInfo.resort}
              onChange={(val) => setBasicInfo({ ...basicInfo, resort: val })}
            />
          </div>
        </div>

        {/* Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto sm:self-end mt-4"
        >
          {isSubmitting ? "Creating..." : "Create Trip"}
        </Button>
      </form>
    </div>
  );
}
