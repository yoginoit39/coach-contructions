// Approximate project locations (lon, lat). Generic "Uganda" projects are
// spread across real districts around Kampala so the map reads honestly as
// "across central Uganda"; swap in exact plot coordinates when known.
export type Place = { name: string; lon: number; lat: number };

export const PLACES: Record<string, Place> = {
  Kampala: { name: "Kampala", lon: 32.5825, lat: 0.3476 },
  Wakiso: { name: "Wakiso", lon: 32.46, lat: 0.404 },
  Masaka: { name: "Masaka", lon: 31.734, lat: -0.335 },
  Entebbe: { name: "Entebbe", lon: 32.463, lat: 0.056 },
  Mukono: { name: "Mukono", lon: 32.755, lat: 0.353 },
  Garuga: { name: "Garuga", lon: 32.52, lat: 0.09 },
  Gayaza: { name: "Gayaza", lon: 32.61, lat: 0.49 },
  Jinja: { name: "Jinja", lon: 33.204, lat: 0.444 },
};

const GENERIC = ["Entebbe", "Mukono", "Garuga", "Gayaza", "Jinja"];

/** Resolve a project's location label to a place, cycling generic ones by index. */
export function placeFor(location: string, index: number): Place {
  if (PLACES[location]) return PLACES[location];
  return PLACES[GENERIC[index % GENERIC.length]];
}

/** 0°20′N 32°35′E */
export function dms(lat: number, lon: number): string {
  const f = (v: number, pos: string, neg: string) => {
    const a = Math.abs(v);
    const d = Math.floor(a);
    const m = Math.round((a - d) * 60);
    return `${d}°${String(m).padStart(2, "0")}′${v >= 0 ? pos : neg}`;
  };
  return `${f(lat, "N", "S")} ${f(lon, "E", "W")}`;
}

/** Map frame in lon/lat and a projection to a 100x100 viewBox. */
export const FRAME = { lon0: 31.45, lon1: 33.4, lat0: -0.62, lat1: 0.7 };
export function project(lon: number, lat: number): [number, number] {
  const x = ((lon - FRAME.lon0) / (FRAME.lon1 - FRAME.lon0)) * 100;
  const y = ((FRAME.lat1 - lat) / (FRAME.lat1 - FRAME.lat0)) * 100;
  return [x, y];
}
