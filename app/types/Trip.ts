export interface TripAttendant {
  userId: string;
  joinedAt: string;
  role: "employee" | "employer" | "moderator";
  status: "active" | "ended";
}

export interface TripInvite {
  code: string;
  createdBy: string;
  expiresAt: string;
}

export interface TripBasicInfo {
  title: string;
  description: string;

  startDate: string;
  endDate?: string;

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

  createdAt: string;
  updatedAt: string;
}
