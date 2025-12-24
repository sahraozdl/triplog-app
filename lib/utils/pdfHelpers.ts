import { IUser } from "@/app/types/user";
import { fetchUsersData } from "./fetchers";

export interface ImageData {
  base64: string;
  width: number;
  height: number;
}

export interface AttendantDetail {
  name?: string;
  email?: string;
  employeeDetail?: IUser["employeeDetail"];
}

export async function fetchImage(url: string): Promise<ImageData | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          resolve({
            base64: reader.result as string,
            width: img.width,
            height: img.height,
          });
        };
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Image fetch error:", e);
    return null;
  }
}

export async function fetchAttendantDetails(
  userIds: string[],
): Promise<Record<string, AttendantDetail>> {
  const result = await fetchUsersData(userIds, true);
  if (result.success && result.users) {
    return result.users as Record<string, AttendantDetail>;
  }
  return {};
}
