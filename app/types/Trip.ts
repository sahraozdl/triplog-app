export interface TripAttendant {
  userId: string;
  joinedAt: string; // ISO datetime
  role: "employee" | "employer" | "moderator";
  status: "active" | "ended";
}

export interface TripInvite {
  code: string;
  createdBy: string;
  expiresAt: string; // ISO datetime
}

export interface TripBasicInfo {
  title: string;
  description: string;

  startDate: string; // ISO datetime
  endDate?: string; // ISO datetime

  country: string;
  resort?: string;

  departureLocation: string;
  arrivalLocation: string;
}

export interface Trip {
  _id: string;
  creatorId: string;

  attendants: TripAttendant[];
  invites: TripInvite[];

  basicInfo: TripBasicInfo;

  status: "active" | "ended";

  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}
