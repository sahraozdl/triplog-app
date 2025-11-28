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

  try {
    // Google Distance Matrix API Çağrısı
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || data.rows[0].elements[0].status !== "OK") {
      return NextResponse.json(
        { error: "Could not calculate distance" },
        { status: 400 },
      );
    }

    // Gelen veri: { distance: { text: "150 km", value: 150000 }, duration: ... }
    const element = data.rows[0].elements[0];

    // Mesafeyi km cinsinden number olarak döndür (value metre cinsindendir)
    const distanceInKm = (element.distance.value / 1000).toFixed(1);

    return NextResponse.json({
      distance: parseFloat(distanceInKm),
      duration: element.duration.text,
    });
  } catch (error) {
    console.error("Distance API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
