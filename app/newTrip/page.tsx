"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppUser } from "@/components/providers/AppUserProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function NewTripPage() {
  const router = useRouter();
  const user = useAppUser();
  const userId = user?.userId;

  useEffect(() => {
    console.log("🔍 user from context:", user, user?.userId);
    console.log("🔍 userId:", userId);
  }, [user, userId]);

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

  async function createTrip(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    }
  }
  const toLocalDatetime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center sm:text-left">
        Create New Trip
      </h1>

      <form className="flex flex-col gap-6" onSubmit={createTrip}>
        <Input id="createdBy" type="hidden" value={userId ?? ""} />

        {/* Trip Title */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="title">Trip Title</Label>
          <Input
            id="title"
            placeholder="e.g. Stockholm to Oslo"
            value={basicInfo.title}
            onChange={(e) =>
              setBasicInfo({ ...basicInfo, title: e.target.value })
            }
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="e.g. Business trip to Oslo"
            value={basicInfo.description}
            onChange={(e) =>
              setBasicInfo({ ...basicInfo, description: e.target.value })
            }
            className="h-36 resize-none"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={toLocalDatetime(basicInfo.startDate)}
              onChange={(e) => {
                const isoString = e.target.value
                  ? new Date(e.target.value).toISOString()
                  : "";
                setBasicInfo({ ...basicInfo, startDate: isoString });
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={toLocalDatetime(basicInfo.endDate)}
              onChange={(e) => {
                const isoString = e.target.value
                  ? new Date(e.target.value).toISOString()
                  : "";
                setBasicInfo({ ...basicInfo, endDate: isoString });
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="e.g. Norway"
              value={basicInfo.country}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, country: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="resort">Resort (Optional)</Label>
            <Input
              id="resort"
              placeholder="e.g. Holmenkollen Ski"
              value={basicInfo.resort}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, resort: e.target.value })
              }
            />
          </div>
        </div>

        {/* Locations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <Label htmlFor="departureLocation">Departure Location</Label>
            <Input
              id="departureLocation"
              placeholder="e.g. Stockholm Office"
              value={basicInfo.departureLocation}
              onChange={(e) =>
                setBasicInfo({
                  ...basicInfo,
                  departureLocation: e.target.value,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="arrivalLocation">Arrival Location</Label>
            <Input
              id="arrivalLocation"
              placeholder="e.g. Oslo HQ"
              value={basicInfo.arrivalLocation}
              onChange={(e) =>
                setBasicInfo({
                  ...basicInfo,
                  arrivalLocation: e.target.value,
                })
              }
            />
          </div>
        </div>

        {/* Button */}
        <Button type="submit" className="w-full sm:w-auto sm:self-end mt-4">
          Create Trip
        </Button>
      </form>
    </div>
  );
}
