import { Document, Types } from "mongoose";

export interface IAddress {
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
}

export interface IEmployeeDetail {
  identityNumber?: string;
  jobTitle?: string;
  department?: string;
  homeAddress?: IAddress;
  workAddress?: IAddress;
}

export interface IUser {
  auth0Id: string;
  userId: string;
  email?: string;
  name?: string;
  picture?: string;
  roles: string[];

  employeeDetail?: IEmployeeDetail;

  createdAt?: string | Date;
  updatedAt?: string | Date;
  activeTrips: string[];
  pastTrips: string[];
  pendingInvites: string[];
  organizationId?: string | null;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}
