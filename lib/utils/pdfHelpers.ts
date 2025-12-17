import { IUser } from "@/app/types/user";

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
  try {
    const res = await fetch("/api/users/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds, detailed: true }),
    });
    const data = await res.json();
    return data.users || {};
  } catch (e) {
    console.error("Failed to fetch user details", e);
    return {};
  }
}
