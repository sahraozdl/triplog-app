"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function NewTripPage() {
  const router = useRouter();
  const user = useUser();
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
    origin: "",
    primaryDestination: "",
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
              type="date"
              value={basicInfo.startDate}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, startDate: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={basicInfo.endDate}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, endDate: e.target.value })
              }
            />
          </div>
        </div>

        {/* Locations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <Label htmlFor="origin">Departure Location</Label>
            <Input
              id="origin"
              placeholder="e.g. Stockholm Office"
              value={basicInfo.origin}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, origin: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="primaryDestination">Arrival Location</Label>
            <Input
              id="primaryDestination"
              placeholder="e.g. Oslo HQ"
              value={basicInfo.primaryDestination}
              onChange={(e) =>
                setBasicInfo({
                  ...basicInfo,
                  primaryDestination: e.target.value,
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
