import { NextRequest, NextResponse } from "next/server";

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

function parseCoordinate(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json(
      { error: "Inserisci un indirizzo più completo da geocodificare." },
      { status: 400 }
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("countrycodes", "it");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "3rate-vendor/1.0 (store-location; local-dev)",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Servizio di geocodifica non disponibile. Riprova tra poco." },
        { status: 502 }
      );
    }

    const results = (await response.json()) as NominatimResult[];
    const first = results[0];
    const latitude = parseCoordinate(first?.lat);
    const longitude = parseCoordinate(first?.lon);

    if (latitude === null || longitude === null) {
      return NextResponse.json(
        {
          error:
            "Indirizzo non trovato. Controlla i dati oppure inserisci le coordinate manualmente.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      latitude,
      longitude,
      label: first?.display_name ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Impossibile contattare il servizio di geocodifica." },
      { status: 502 }
    );
  }
}
