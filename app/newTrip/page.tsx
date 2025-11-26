"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

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
    <div className="w-full max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Create New Trip</h1>

      <form className="flex flex-col gap-4" onSubmit={createTrip}>
        <Input id="createdBy" type="hidden" value={userId} />
        <Label htmlFor="title">Trip Title</Label>
        <Input
          id="title"
          className="input"
          placeholder="e.g. Stockholm to Oslo"
          value={basicInfo.title}
          onChange={(e) =>
            setBasicInfo({ ...basicInfo, title: e.target.value })
          }
        />
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          className="input"
          placeholder="e.g. Business trip to Oslo"
          value={basicInfo.description}
          onChange={(e) =>
            setBasicInfo({ ...basicInfo, description: e.target.value })
          }
        />
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          className="input"
          value={basicInfo.startDate}
          onChange={(e) =>
            setBasicInfo({ ...basicInfo, startDate: e.target.value })
          }
        />

        <Label htmlFor="origin">Departure Location</Label>
        <Input
          id="origin"
          type="text"
          className="input"
          placeholder="Departure Location"
          value={basicInfo.origin}
          onChange={(e) =>
            setBasicInfo({ ...basicInfo, origin: e.target.value })
          }
        />

        <Label htmlFor="primaryDestination">Arrival Location</Label>
        <Input
          id="primaryDestination"
          type="text"
          className="input"
          placeholder="Arrival Location"
          value={basicInfo.primaryDestination}
          onChange={(e) =>
            setBasicInfo({ ...basicInfo, primaryDestination: e.target.value })
          }
        />

        <Button type="submit">Create Trip</Button>
      </form>
    </div>
  );
}
