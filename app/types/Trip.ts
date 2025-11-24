export interface TripAttendant {
  userId: string;
  joinedAt: string;
  role: "employee" | "employer" | "moderator";
  status: "active" | "removed";
}

export interface TripInvite {
  code: string;
  createdBy: string;
  expiresAt: string;
  usedBy?: string;
}

export interface TripBasicInfo {
  _id: string;
  title: string;               // e.g. “Ski Resort Assignment”
  description: string;

  startDate: string;           // YYYY-MM-DD
  endDate?: string;            // Filled when trip ends

  country: string;             // Sweden, Norway, etc.
  resort?: string;             // Optional

  origin: string;              // "Stockholm HQ"
  primaryDestination: string;  // "Ski Resort"
}

export interface Trip {
  creatorId: string;
  attendants: TripAttendant[];
  invites: TripInvite[];

  basicInfo: TripBasicInfo;

  status: "active" | "ended";

  dailyLogs: string[];

  createdAt: string;
  updatedAt: string;
}
