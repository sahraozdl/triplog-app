import { Document, Types } from "mongoose";
export interface IUser {
  userId: string;              // Auth0 ID
  email?: string;
  name?: string;
  picture?: string;
  roles: string[];
  createdAt?: string | Date;
  activeTrips: string[];
  pastTrips: string[];
  pendingInvites: string[];
  organizationId?: string | null;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId; // mongoose id
}
