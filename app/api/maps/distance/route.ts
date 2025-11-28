import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Origin and Destination required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      console.error("Google API Error:", data.status);
      return NextResponse.json(
        { error: `Route not found: ${data.status}` },
        { status: 400 },
      );
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    const distanceInKm = (leg.distance.value / 1000).toFixed(1);

    return NextResponse.json({
      distance: parseFloat(distanceInKm),
      duration: leg.duration.text,
      polyline: route.overview_polyline.points,
    });
  } catch (error) {
    console.error("Directions API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
