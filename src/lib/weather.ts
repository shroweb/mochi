// Free public APIs — no keys needed
// Open-Meteo for weather, USGS for earthquakes, NOAA for tides/tsunami

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`Request failed: ${r.status}`);
  }
  return r.json();
}

export interface GeoResult {
  name: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

export async function geocode(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const data = await fetchJson<{ results?: GeoResult[] }>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`,
  );
  return data.results ?? [];
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoResult> {
  try {
    const data = await fetchJson<{
      city?: string; locality?: string; principalSubdivision?: string;
      countryName?: string; countryCode?: string;
    }>(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    return {
      name: data.city || data.locality || "My Location",
      country: data.countryName || "",
      country_code: data.countryCode || "",
      admin1: data.principalSubdivision,
      latitude: lat,
      longitude: lon,
    };
  } catch {
    return { name: "My Location", country: "", country_code: "", latitude: lat, longitude: lon };
  }
}

export interface WeatherData {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    precipitation: number;
    relative_humidity_2m: number;
    is_day: number;
    uv_index: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,uv_index` +
    `&hourly=temperature_2m,precipitation_probability,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,uv_index_max` +
    `&forecast_days=7&timezone=auto`;
  return fetchJson<WeatherData>(url);
}

export interface Earthquake {
  id: string;
  mag: number;
  place: string;
  time: number;
  url: string;
  tsunami: number;
  coords: [number, number];
}

interface UsgsEarthquakeFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    tsunami: number;
  };
  geometry: {
    coordinates: [number, number, number?];
  };
}

interface UsgsEarthquakeFeed {
  features?: UsgsEarthquakeFeature[];
}

export async function getEarthquakes(): Promise<Earthquake[]> {
  const data = await fetchJson<UsgsEarthquakeFeed>(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson",
  );
  return (data.features ?? []).map((f) => ({
    id: f.id,
    mag: f.properties.mag,
    place: f.properties.place,
    time: f.properties.time,
    url: f.properties.url,
    tsunami: f.properties.tsunami,
    coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
  }));
}

export async function getAllRecentQuakes(): Promise<Earthquake[]> {
  const data = await fetchJson<UsgsEarthquakeFeed>(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson",
  );
  return (data.features ?? []).map((f) => ({
    id: f.id,
    mag: f.properties.mag,
    place: f.properties.place,
    time: f.properties.time,
    url: f.properties.url,
    tsunami: f.properties.tsunami,
    coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
  }));
}

// ── Moon phase ──────────────────────────────────────────────────────────────
// Calculates the current lunar phase from a known reference new moon.
// No API needed — purely date math.
export function getMoonPhase(date = new Date()): {
  emoji: string;
  name: string;
  illumination: number; // 0-100 %
} {
  // Known new moon: 3 Sep 2024 01:55 UTC
  const REF_NEW_MOON_MS = 1725328500000;
  const CYCLE_MS = 29.530588853 * 86_400_000;

  const phase =
    (((date.getTime() - REF_NEW_MOON_MS) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS / CYCLE_MS;

  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100);

  let emoji: string;
  let name: string;
  if      (phase < 0.025) { emoji = "🌑"; name = "New Moon"; }
  else if (phase < 0.250) { emoji = "🌒"; name = "Waxing Crescent"; }
  else if (phase < 0.275) { emoji = "🌓"; name = "First Quarter"; }
  else if (phase < 0.500) { emoji = "🌔"; name = "Waxing Gibbous"; }
  else if (phase < 0.525) { emoji = "🌕"; name = "Full Moon"; }
  else if (phase < 0.750) { emoji = "🌖"; name = "Waning Gibbous"; }
  else if (phase < 0.775) { emoji = "🌗"; name = "Last Quarter"; }
  else                    { emoji = "🌘"; name = "Waning Crescent"; }

  return { emoji, name, illumination };
}

type WeatherSeverity = "calm" | "mild" | "rain" | "storm" | "snow" | "extreme";

// WMO weather code mapping
export function describeCode(code: number): {
  label: string;
  emoji: string;
  severity: WeatherSeverity;
} {
  const map: Record<number, { label: string; emoji: string; severity: WeatherSeverity }> = {
    0: { label: "Clear sky", emoji: "☀️", severity: "calm" },
    1: { label: "Mostly clear", emoji: "🌤️", severity: "calm" },
    2: { label: "Partly cloudy", emoji: "⛅", severity: "mild" },
    3: { label: "Overcast", emoji: "☁️", severity: "mild" },
    45: { label: "Foggy", emoji: "🌫️", severity: "mild" },
    48: { label: "Rime fog", emoji: "🌫️", severity: "mild" },
    51: { label: "Light drizzle", emoji: "🌦️", severity: "rain" },
    53: { label: "Drizzle", emoji: "🌦️", severity: "rain" },
    55: { label: "Heavy drizzle", emoji: "🌧️", severity: "rain" },
    61: { label: "Light rain", emoji: "🌦️", severity: "rain" },
    63: { label: "Rain", emoji: "🌧️", severity: "rain" },
    65: { label: "Heavy rain", emoji: "🌧️", severity: "extreme" },
    71: { label: "Light snow", emoji: "🌨️", severity: "snow" },
    73: { label: "Snow", emoji: "❄️", severity: "snow" },
    75: { label: "Heavy snow", emoji: "❄️", severity: "extreme" },
    77: { label: "Snow grains", emoji: "🌨️", severity: "snow" },
    80: { label: "Rain showers", emoji: "🌧️", severity: "rain" },
    81: { label: "Heavy showers", emoji: "🌧️", severity: "rain" },
    82: { label: "Violent showers", emoji: "⛈️", severity: "extreme" },
    85: { label: "Snow showers", emoji: "🌨️", severity: "snow" },
    86: { label: "Heavy snow showers", emoji: "❄️", severity: "extreme" },
    95: { label: "Thunderstorm", emoji: "⛈️", severity: "storm" },
    96: { label: "Storm + hail", emoji: "⛈️", severity: "extreme" },
    99: { label: "Severe storm + hail", emoji: "🌩️", severity: "extreme" },
  };
  return map[code] ?? { label: "Unknown", emoji: "🌡️", severity: "mild" };
}

export function mochiSays(w: WeatherData | null): string {
  if (!w) return "Pick a place and I'll tell you the weather, nya!";
  const c = describeCode(w.current.weather_code);
  const t = Math.round(w.current.temperature_2m);
  const gust = Math.round(w.current.wind_gusts_10m);
  if (c.severity === "extreme") return `Yikes! ${c.label} right now. Stay safe inside! 🐾`;
  if (c.severity === "storm") return `Thunder is rumbling! ${c.label}, ${t}°. Cuddle up! ⚡`;
  if (c.severity === "snow") return `Snowy paws! ${c.label} at ${t}°. Bundle up! ❄️`;
  if (c.severity === "rain") return `Bring an umbrella! ${c.label}, ${t}°. ☔`;
  if (gust > 60) return `Windy day! Gusts up to ${gust} km/h. Hold onto your hat!`;
  if (t >= 32) return `Hot hot hot at ${t}°! Sip some water, nya~`;
  if (t <= 0) return `Freezing at ${t}°. Wear your fluffiest scarf!`;
  return `${c.label} and ${t}°. Lovely day for a walk! 🐱`;
}

export type MascotMood = "calm" | "sunny" | "rain" | "storm" | "snow" | "hot";

export function pickMood(w: WeatherData | null): MascotMood {
  if (!w) return "calm";
  const c = describeCode(w.current.weather_code);
  const t = w.current.temperature_2m;
  if (c.severity === "extreme" || c.severity === "storm") return "storm";
  if (c.severity === "snow" || t <= 0) return "snow";
  if (c.severity === "rain") return "rain";
  if (t >= 30) return "hot";
  if (c.severity === "calm") return "sunny";
  return "calm";
}

// Tsunami warnings via NOAA NTWC (CAP feed → we use a simple proxy via JSON)
// USGS earthquake feed includes tsunami flag — we surface that as our tsunami signal.

// Tide info — NOAA CO-OPS (US stations). For global, we just show major coastal stations.
export interface TideStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export const TIDE_STATIONS: TideStation[] = [
  { id: "9410230", name: "La Jolla, CA", lat: 32.87, lon: -117.26 },
  { id: "8518750", name: "The Battery, NY", lat: 40.7, lon: -74.01 },
  { id: "9447130", name: "Seattle, WA", lat: 47.6, lon: -122.34 },
  { id: "8723214", name: "Virginia Key, FL", lat: 25.73, lon: -80.16 },
  { id: "1612340", name: "Honolulu, HI", lat: 21.31, lon: -157.87 },
];

export interface TidePrediction {
  t: string;
  v: string;
  type: "H" | "L";
}

export async function getTides(stationId: string): Promise<TidePrediction[]> {
  const today = new Date();
  const begin = today.toISOString().slice(0, 10).replace(/-/g, "");
  const end = new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
  const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=mochi_weather&begin_date=${begin}&end_date=${end}&datum=MLLW&station=${stationId}&time_zone=lst_ldt&units=metric&interval=hilo&format=json`;
  const data = await fetchJson<{ predictions?: TidePrediction[] }>(url);
  return data.predictions ?? [];
}

// ── Air Quality ──────────────────────────────────────────────────────────────
export interface AirQualityData {
  pm2_5: number | null;
  pm10: number | null;
  ozone: number | null;
  us_aqi: number | null;
  european_aqi: number | null;
  alder_pollen: number | null;
  birch_pollen: number | null;
  grass_pollen: number | null;
  mugwort_pollen: number | null;
  olive_pollen: number | null;
  ragweed_pollen: number | null;
}

export async function getAirQuality(lat: number, lon: number): Promise<AirQualityData | null> {
  try {
    const r = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
        `&current=pm2_5,pm10,ozone,us_aqi,european_aqi,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen`,
    );
    if (!r.ok) return null;
    const d = await r.json();
    return d.current ?? null;
  } catch {
    return null;
  }
}

export function describeAqi(aqi: number): { label: string; color: string; bg: string } {
  if (aqi <= 50) return { label: "Good", color: "text-green-600", bg: "bg-green-100" };
  if (aqi <= 100) return { label: "Moderate", color: "text-yellow-600", bg: "bg-yellow-100" };
  if (aqi <= 150)
    return { label: "Unhealthy (sensitive)", color: "text-orange-600", bg: "bg-orange-100" };
  if (aqi <= 200) return { label: "Unhealthy", color: "text-red-600", bg: "bg-red-100" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-600", bg: "bg-purple-100" };
  return { label: "Hazardous", color: "text-rose-900", bg: "bg-rose-100" };
}

export function describeUv(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: "Low", color: "text-green-600" };
  if (uv <= 5) return { label: "Moderate", color: "text-yellow-600" };
  if (uv <= 7) return { label: "High", color: "text-orange-500" };
  if (uv <= 10) return { label: "Very High", color: "text-red-600" };
  return { label: "Extreme", color: "text-purple-700" };
}

// ── Marine ───────────────────────────────────────────────────────────────────
export interface MarineData {
  wave_height: number | null;
  wave_direction: number | null;
  wave_period: number | null;
  swell_wave_height: number | null;
  swell_wave_direction: number | null;
  swell_wave_period: number | null;
}

export async function getMarine(lat: number, lon: number): Promise<MarineData | null> {
  try {
    const r = await fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
        `&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period`,
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (d.error || d.reason) return null;
    return d.current ?? null;
  } catch {
    return null;
  }
}

export function compassDir(deg: number): string {
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8];
}

// ── Space Weather ─────────────────────────────────────────────────────────────
export interface KpEntry {
  time_tag: string;
  kp: number;
}

export async function getSpaceWeather(): Promise<KpEntry[]> {
  try {
    const rows = await fetchJson<Array<[string, string]>>(
      "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
    );
    return rows
      .slice(1)
      .slice(-8)
      .map((row) => ({
        time_tag: String(row[0]),
        kp: parseFloat(row[1]) || 0,
      }));
  } catch {
    return [];
  }
}

export function describeKp(kp: number): {
  label: string;
  storm: string;
  aurora: string;
  color: string;
} {
  if (kp >= 9)
    return { label: "G5", storm: "Extreme", aurora: "Visible to ~40°N", color: "text-destructive" };
  if (kp >= 8)
    return { label: "G4", storm: "Severe", aurora: "Visible to ~45°N", color: "text-destructive" };
  if (kp >= 7)
    return { label: "G3", storm: "Strong", aurora: "Visible to ~50°N", color: "text-orange-500" };
  if (kp >= 6)
    return { label: "G2", storm: "Moderate", aurora: "Visible to ~55°N", color: "text-orange-400" };
  if (kp >= 5)
    return { label: "G1", storm: "Minor", aurora: "Visible to ~60°N", color: "text-yellow-500" };
  if (kp >= 4)
    return { label: "—", storm: "Active", aurora: "Possible near poles", color: "text-yellow-400" };
  return { label: "—", storm: "Quiet", aurora: "Polar regions only", color: "text-green-500" };
}

// ── Volcanoes ─────────────────────────────────────────────────────────────────
export interface VolcanoNotice {
  vonaid?: number;
  volcanoName?: string;
  volcano_name?: string;
  aviationColorCode?: string;
  aviation_color_code?: string;
  color?: string;
  issued?: string;
  issue_time?: string;
  synopsis?: string;
}

export async function getVolcanoes(): Promise<VolcanoNotice[]> {
  try {
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const r = await fetch(`https://volcanoes.usgs.gov/vsc/api/volcanoApi/vons?starttime=${since}`);
    if (!r.ok) return [];
    const data = await r.json();
    return (Array.isArray(data) ? data : []).slice(0, 20);
  } catch {
    return [];
  }
}

export function volcanoColorClass(code: string | undefined): string {
  const c = (code ?? "").toUpperCase();
  if (c === "RED") return "bg-destructive text-white";
  if (c === "ORANGE") return "bg-orange-500 text-white";
  if (c === "YELLOW") return "bg-yellow-400 text-yellow-900";
  return "bg-green-500 text-white";
}
