export type GeocodeResult = {
  latitude: number;
  longitude: number;
  label?: string | null;
};

export function formatCoordinate(value: number | null | undefined, digits = 6) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return value.toFixed(digits);
}

export function parseCoordinateInput(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isValidLatitude(value: number) {
  return value >= -90 && value <= 90;
}

export function isValidLongitude(value: number) {
  return value >= -180 && value <= 180;
}

export function buildAddressQuery(parts: {
  fullAddress?: string;
  cap?: string;
  city?: string;
  province?: string;
  region?: string;
}) {
  return [
    parts.fullAddress?.trim(),
    parts.cap?.trim(),
    parts.city?.trim(),
    parts.province?.trim(),
    parts.region?.trim(),
    "Italia",
  ]
    .filter(Boolean)
    .join(", ");
}

export function openStreetMapUrl(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
}

export async function geocodeAddressQuery(query: string): Promise<GeocodeResult> {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = (await response.json().catch(() => ({}))) as {
    latitude?: number;
    longitude?: number;
    label?: string | null;
    error?: string;
  };

  if (!response.ok || typeof data.latitude !== "number" || typeof data.longitude !== "number") {
    throw new Error(data.error || "Geocodifica non riuscita.");
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    label: data.label ?? null,
  };
}

export function readBrowserCoordinates(): Promise<GeocodeResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocalizzazione non supportata da questo browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Permesso di geolocalizzazione negato."));
          return;
        }
        reject(new Error("Impossibile rilevare la posizione attuale."));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}
