"use client";
import { create } from "zustand";
import { Trip } from "@/app/types/Trip";

interface TripStore {
  trips: Record<string, Trip>;
  initialized: boolean;

  setTrips: (tripArray: Trip[]) => void;
  updateTrip: (trip: Trip) => void;
  removeTrip: (id: string) => void;
  getTrip: (id: string) => Trip | undefined;
  invalidate: () => void;
}

export const useTripStore = create<TripStore>((set, get) => ({
  trips: {},
  initialized: false,

  setTrips: (tripArray) =>
    set(() => ({
      trips: Object.fromEntries(tripArray.map((t) => [t._id, t])),
      initialized: true,
    })),

  updateTrip: (trip) =>
    set((state) => ({
      trips: { ...state.trips, [trip._id]: trip },
    })),

  removeTrip: (id) =>
    set((state) => {
      const copy = { ...state.trips };
      delete copy[id];
      return { trips: copy };
    }),

  getTrip: (id) => get().trips[id],

  invalidate: () => set({ initialized: false }),
}));
