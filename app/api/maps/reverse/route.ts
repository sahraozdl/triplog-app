import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Lat/Lng required" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results.length > 0) {
      const address = data.results[0];

      return NextResponse.json({
        success: true,
        formattedAddress: address.formatted_address,
        components: address.address_components,
      });
    }

    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  } catch (error) {
    console.error("Reverse Geocoding Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
