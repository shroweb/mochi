import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useWeatherAudio } from "@/hooks/use-weather-audio";
import { useQuery } from "@tanstack/react-query";
import {
  geocode,
  reverseGeocode,
  getWeather,
  getEarthquakes,
  getAllRecentQuakes,
  describeCode,
  mochiSays,
  pickMood,
  getAirQuality,
  getMarine,
  getSpaceWeather,
  getVolcanoes,
  describeAqi,
  describeUv,
  type GeoResult,
  type WeatherData,
} from "@/lib/weather";
import { Mascot } from "@/components/Mascot";
import { WeatherIcon } from "@/components/WeatherIcon";
import { MascotCustomizer, useMascotCustomization } from "@/components/MascotCustomizer";
import { SavedPlaces } from "@/components/SavedPlaces";
import { HourlyForecastChart } from "@/components/HourlyForecastChart";
import { useSavedPlaces } from "@/hooks/use-saved-places";
import {
  AirQualityPanel,
  MarinePanel,
  SpaceWeatherPanel,
  StormsPanel,
  TidesPanel,
  VolcanoPanel,
} from "@/components/EnvironmentalPanels";
import sunnyImg from "@/assets/mascot-sunny.png";
import rainyImg from "@/assets/mascot-cat.png";
import stormImg from "@/assets/mascot-storm.png";
import snowImg from "@/assets/mascot-snow.png";
import hotImg from "@/assets/mascot-hot.png";

const CAT_IMG: Record<string, string> = {
  sunny: sunnyImg,
  rain: rainyImg,
  storm: stormImg,
  snow: snowImg,
  hot: hotImg,
};
function CatThumb({ mood }: { mood: string }) {
  return (
    <img
      src={CAT_IMG[mood]}
      alt={`${mood} mochi`}
      width={72}
      height={72}
      loading="lazy"
      className="mx-auto h-16 w-16 object-contain drop-shadow"
    />
  );
}
import { WeatherEffects } from "@/components/WeatherEffects";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  Waves,
  Activity,
  MapPin,
  Sun,
  Sunrise,
  Sunset,
  Mountain,
  CalendarDays,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [place, setPlace] = useState<GeoResult | null>(null);
  const [showSugg, setShowSugg] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mobileSection, setMobileSection] = useState<'now' | 'forecast' | 'alerts' | 'mochi'>('now');
  const [customization, setCustomization] = useMascotCustomization();
  const savedPlaces = useSavedPlaces(null);
  const selectPlace = (nextPlace: GeoResult) => {
    setPlace(nextPlace);
    setQuery("");
    setShowSugg(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        selectPlace(result);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    if (navigator.geolocation) useMyLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (query.length >= 2) {
        try {
          setSuggestions(await geocode(query));
          setSearchError(false);
        } catch {
          setSuggestions([]);
          setSearchError(true);
        }
        setShowSugg(true);
      } else setSuggestions([]);
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  const weatherQ = useQuery({
    queryKey: ["weather", place?.latitude, place?.longitude],
    queryFn: () => getWeather(place!.latitude, place!.longitude),
    enabled: !!place,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const quakesQ = useQuery({
    queryKey: ["quakes-sig"],
    queryFn: getEarthquakes,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
  const quakesAllQ = useQuery({
    queryKey: ["quakes-all"],
    queryFn: getAllRecentQuakes,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const airQ = useQuery({
    queryKey: ["air-quality", place?.latitude, place?.longitude],
    queryFn: () => getAirQuality(place!.latitude, place!.longitude),
    enabled: !!place,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
  const marineQ = useQuery({
    queryKey: ["marine", place?.latitude, place?.longitude],
    queryFn: () => getMarine(place!.latitude, place!.longitude),
    enabled: !!place,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
  const spaceQ = useQuery({
    queryKey: ["space-weather"],
    queryFn: getSpaceWeather,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
  const volcanoQ = useQuery({
    queryKey: ["volcanoes"],
    queryFn: getVolcanoes,
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });

  const tsunamiAlerts = useMemo(
    () => (quakesQ.data ?? []).filter((q) => q.tsunami === 1),
    [quakesQ.data],
  );
  const adviceItems = useMemo(
    () => getAdviceItems(weatherQ.data ?? null, airQ.data?.us_aqi ?? null, tsunamiAlerts.length),
    [weatherQ.data, airQ.data?.us_aqi, tsunamiAlerts.length],
  );

  const mascotMsg = useMemo(() => mochiSays(weatherQ.data ?? null), [weatherQ.data]);
  const mood = useMemo(() => pickMood(weatherQ.data ?? null), [weatherQ.data]);

  useEffect(() => {
    document.body.setAttribute("data-weather-mood", mood);
    return () => document.body.removeAttribute("data-weather-mood");
  }, [mood]);
  const current = weatherQ.data?.current;
  const codeInfo = current ? describeCode(current.weather_code) : null;
  const isDay = current ? current.is_day === 1 : true;

  useEffect(() => {
    document.body.setAttribute("data-time", isDay ? "day" : "night");
    return () => document.body.removeAttribute("data-time");
  }, [isDay]);

  const heroGradient = !codeInfo
    ? "bg-gradient-sky"
    : !isDay
      // ── Night gradients ──────────────────────────────────────────────
      ? codeInfo.severity === "storm" || codeInfo.severity === "extreme"
        ? "bg-gradient-night-storm text-white"
        : codeInfo.severity === "rain"
          ? "bg-gradient-night-rain text-white"
          : codeInfo.severity === "snow"
            ? "bg-gradient-night-snow text-white"
            : "bg-gradient-night text-white"          // calm or mild at night
      // ── Day gradients ────────────────────────────────────────────────
      : codeInfo.severity === "storm" || codeInfo.severity === "extreme"
        ? "bg-gradient-storm text-white"
        : codeInfo.severity === "snow"
          ? "bg-gradient-to-br from-snow to-rain/30"
          : codeInfo.severity === "rain"
            ? "bg-gradient-to-br from-rain/40 to-storm/30 text-white"
            : "bg-gradient-sun";

  const { on: soundOn, toggle: toggleSound } = useWeatherAudio(codeInfo?.severity, isDay);

  const ms = (s: typeof mobileSection) => s === mobileSection ? '' : 'hidden md:block';

  return (
    <>
    <main className="min-h-screen px-4 sm:px-8 py-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Top bar */}
      <header className="relative z-[100] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 animate-fade-up">
        <div className="flex items-center gap-3">
          <img
            src="/icon.svg"
            alt="Mochi"
            className="h-12 w-12 rounded-2xl shadow-soft shrink-0 object-cover"
          />
          <div>
            <h1 className={`text-2xl font-semibold font-brand leading-none tracking-wide ${!isDay ? 'text-white' : ''}`}>Mochi Weather</h1>
            <p className={`text-xs flex items-center gap-1.5 mt-0.5 ${!isDay ? 'text-white/60' : 'text-muted-foreground'}`}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live data · Open-Meteo · USGS · NOAA
            </p>
          </div>
        </div>
        <div className="relative z-[200] w-full sm:max-w-sm sm:ml-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search any city or country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length && setShowSugg(true)}
            onBlur={() => setTimeout(() => setShowSugg(false), 180)}
            className="pl-9 pr-10 rounded-2xl glass border-white/60"
          />
          <button
            type="button"
            onClick={useMyLocation}
            title="Use my location"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
          >
            {geoLoading
              ? <span className="h-4 w-4 block rounded-full border-2 border-primary border-t-transparent animate-spin" />
              : <MapPin className="h-4 w-4" />}
          </button>
          {searchError && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive shadow-soft">
              Search is unavailable right now.
            </div>
          )}
          {showSugg && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-pop overflow-hidden z-[300]">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.latitude}-${s.longitude}-${i}`}
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    selectPlace(s);
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectPlace(s);
                  }}
                  onClick={() => selectPlace(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-primary/10 flex items-center gap-2 text-sm transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {s.admin1 ? `${s.admin1}, ` : ""}
                    {s.country}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <SavedPlaces
        places={savedPlaces.places}
        currentPlace={place}
        onSelect={setPlace}
        onSave={savedPlaces.savePlace}
        onRemove={savedPlaces.removePlace}
        isCurrentSaved={savedPlaces.isSaved(place)}
      />

      {/* ── NOW ─────────────────────────────── */}
      <div className={ms('now')}>
      {/* Hero current weather */}
      <section
        className={`relative mt-4 overflow-hidden rounded-[2rem] p-6 sm:p-10 ${heroGradient} shadow-pop animate-fade-up`}
      >
        <WeatherEffects severity={codeInfo?.severity} mood={mood} isDay={isDay} />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium opacity-90">
              <MapPin className="h-4 w-4" />
              {place ? `${place.name}, ${place.country}` : "Detecting location…"}
            </div>
            {weatherQ.isError && (
              <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-destructive shadow-soft">
                Weather data could not be loaded for this place.
              </div>
            )}
            <div className="mt-3 flex items-end gap-6">
              <div>
                <div className="text-7xl sm:text-8xl font-bold tracking-tighter">
                  {current ? Math.round(current.temperature_2m) : "—"}°
                </div>
                <p className="text-lg font-medium mt-1 opacity-95">
                  {codeInfo?.label ?? "Loading…"}
                </p>
                <p className="text-sm opacity-80">
                  Feels like {current ? Math.round(current.apparent_temperature) : "—"}°
                </p>
              </div>
              {current && <WeatherIcon code={current.weather_code} size={96} isDay={isDay} />}
            </div>

            {current && (
              <div className="mt-6 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Stat
                    icon={<Wind className="h-4 w-4" />}
                    label="Wind"
                    value={`${Math.round(current.wind_speed_10m)} km/h`}
                  />
                  <Stat
                    icon={<Droplets className="h-4 w-4" />}
                    label="Humidity"
                    value={`${current.relative_humidity_2m}%`}
                  />
                  <Stat
                    icon={<Thermometer className="h-4 w-4" />}
                    label="Gusts"
                    value={`${Math.round(current.wind_gusts_10m)}`}
                  />
                  <Stat
                    icon={<Sun className="h-4 w-4" />}
                    label="UV Index"
                    value={`${current.uv_index} · ${describeUv(current.uv_index).label}`}
                    valueClass={describeUv(current.uv_index).color}
                  />
                </div>
                {weatherQ.data?.daily.sunrise[0] && (
                  <div className="grid grid-cols-2 gap-2">
                    <Stat
                      icon={<Sunrise className="h-4 w-4" />}
                      label="Sunrise"
                      value={new Date(weatherQ.data.daily.sunrise[0]).toLocaleTimeString("en", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    />
                    <Stat
                      icon={<Sunset className="h-4 w-4" />}
                      label="Sunset"
                      value={new Date(weatherQ.data.daily.sunset[0]).toLocaleTimeString("en", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden md:block">
            <Mascot message={mascotMsg} size="lg" mood={mood} fur={customization.fur} />
          </div>
        </div>

        {/* Sound toggle — bottom-right of hero card */}
        <button
          onClick={toggleSound}
          title={soundOn ? "Mute ambient sounds" : "Play ambient sounds"}
          className="absolute bottom-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full glass opacity-70 hover:opacity-100 transition-opacity"
        >
          {soundOn
            ? <Volume2 className="h-4 w-4" />
            : <VolumeX className="h-4 w-4" />}
        </button>
      </section>

      <div className="md:hidden mt-4">
        <Mascot message={mascotMsg} mood={mood} fur={customization.fur} />
      </div>

      <AdviceStrip items={adviceItems} updatedAt={weatherQ.dataUpdatedAt} />
      </div>{/* end NOW */}

      {/* ── FORECAST ─────────────────────────── */}
      <div className={ms('forecast')}>

        {/* Mobile: sub-tabs so 7-day and 24h each fill the screen without scrolling */}
        <div className="md:hidden mt-4">
          <Tabs defaultValue="week">
            <TabsList className="w-full rounded-2xl glass p-1 h-auto">
              <TabsTrigger value="week" className="flex-1 rounded-xl gap-1.5">
                <CalendarDays className="h-4 w-4" /> 7 days
              </TabsTrigger>
              <TabsTrigger value="today" className="flex-1 rounded-xl gap-1.5">
                ⏰ 24 hours
              </TabsTrigger>
            </TabsList>

            <TabsContent value="week" className="mt-3">
              <Card title="7-day forecast" icon="📅">
                {weatherQ.isLoading && <p className="text-sm text-muted-foreground">Loading forecast...</p>}
                {weatherQ.isError && <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">Forecast could not be loaded.</p>}
                {weatherQ.data && (
                  <div className="divide-y divide-border -mx-5 px-5">
                    {weatherQ.data.daily.time.map((d, i) => {
                      const info = describeCode(weatherQ.data!.daily.weather_code[i]);
                      return (
                        <div key={d} className="flex items-center gap-3 py-3">
                          <div className="w-9 text-sm font-semibold text-muted-foreground">
                            {new Date(d).toLocaleDateString("en", { weekday: "short" })}
                          </div>
                          <div className="text-2xl w-8">{info.emoji}</div>
                          <div className="flex-1 text-sm">
                            <span className="font-bold">{Math.round(weatherQ.data!.daily.temperature_2m_max[i])}°</span>
                            <span className="text-muted-foreground"> / {Math.round(weatherQ.data!.daily.temperature_2m_min[i])}°</span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[100px]">{info.label}</div>
                          <div className="text-xs text-rain font-medium ml-2">💧{weatherQ.data!.daily.precipitation_probability_max[i] ?? 0}%</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="today" className="mt-3">
              <Card title="Next 24 hours" icon="⏰">
                {weatherQ.isLoading && <p className="text-sm text-muted-foreground">Loading hourly forecast...</p>}
                {weatherQ.isError && <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">Hourly forecast could not be loaded.</p>}
                {weatherQ.data && (
                  <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-2 scrollbar-none">
                    {weatherQ.data.hourly.time.slice(0, 24).map((t, i) => {
                      const info = describeCode(weatherQ.data!.hourly.weather_code[i]);
                      const rain = weatherQ.data!.hourly.precipitation_probability[i] ?? 0;
                      return (
                        <div key={t} className={`shrink-0 w-16 text-center rounded-2xl py-3 px-1 ${rain >= 50 ? 'bg-rain/15' : 'bg-secondary/50'}`}>
                          <div className="text-[10px] text-muted-foreground font-medium">
                            {new Date(t).toLocaleTimeString("en", { hour: "numeric" })}
                          </div>
                          <div className="text-xl my-1">{info.emoji}</div>
                          <div className="text-sm font-bold">{Math.round(weatherQ.data!.hourly.temperature_2m[i])}°</div>
                          <div className="text-[10px] text-rain font-medium">{rain}%</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: both cards side by side */}
        <section className="hidden md:grid lg:grid-cols-2 gap-6 mt-6">
          <Card title="7-day forecast" icon="📅">
            {weatherQ.isLoading && <p className="text-sm text-muted-foreground">Loading forecast...</p>}
            {weatherQ.isError && <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">Forecast could not be loaded.</p>}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {weatherQ.data?.daily.time.map((d, i) => {
                const info = describeCode(weatherQ.data!.daily.weather_code[i]);
                return (
                  <div key={d} className="shrink-0 w-[4.5rem] text-center rounded-2xl p-2 hover:bg-secondary/60 transition-colors">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                      {new Date(d).toLocaleDateString("en", { weekday: "short" })}
                    </div>
                    <div className="text-2xl my-1">{info.emoji}</div>
                    <div className="text-sm font-bold">{Math.round(weatherQ.data!.daily.temperature_2m_max[i])}°</div>
                    <div className="text-xs text-muted-foreground">{Math.round(weatherQ.data!.daily.temperature_2m_min[i])}°</div>
                    <div className="text-[10px] mt-1 text-rain font-medium">💧{weatherQ.data!.daily.precipitation_probability_max[i] ?? 0}%</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Next 24 hours" icon="⏰">
            {weatherQ.isLoading && <p className="text-sm text-muted-foreground">Loading hourly forecast...</p>}
            {weatherQ.isError && <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">Hourly forecast could not be loaded.</p>}
            {weatherQ.data && <HourlyForecastChart weather={weatherQ.data} />}
          </Card>
        </section>

      </div>{/* end FORECAST */}

      {/* ── ALERTS ───────────────────────────── */}
      <div className={ms('alerts')}>
      {/* Extreme weather tabs */}
      <section className="mt-6 animate-fade-up">
        <Tabs defaultValue="quakes" className="w-full">
          <TabsList className="rounded-2xl glass p-1 h-auto overflow-x-auto flex-nowrap w-full justify-start">
            <TabsTrigger value="quakes" className="rounded-xl gap-2">
              <Activity className="h-4 w-4" /> Earthquakes
            </TabsTrigger>
            <TabsTrigger value="tsunami" className="rounded-xl gap-2">
              <AlertTriangle className="h-4 w-4" /> Tsunami
            </TabsTrigger>
            <TabsTrigger value="storms" className="rounded-xl gap-2">
              ⛈️ Storms & Hurricanes
            </TabsTrigger>
            <TabsTrigger value="tides" className="rounded-xl gap-2">
              <Waves className="h-4 w-4" /> Tides
            </TabsTrigger>
            <TabsTrigger value="air" className="rounded-xl gap-2">
              <Wind className="h-4 w-4" /> Air Quality
            </TabsTrigger>
            <TabsTrigger value="marine" className="rounded-xl gap-2">
              🌊 Marine
            </TabsTrigger>
            <TabsTrigger value="space" className="rounded-xl gap-2">
              ✨ Space Weather
            </TabsTrigger>
            <TabsTrigger value="volcano" className="rounded-xl gap-2">
              <Mountain className="h-4 w-4" /> Volcanoes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quakes" className="mt-4">
            <Card title="Recent significant earthquakes (worldwide)" icon="🌍">
              <div className="grid sm:grid-cols-2 gap-3">
                {(quakesAllQ.data ?? quakesQ.data ?? []).slice(0, 12).map((q) => (
                  <a
                    key={q.id}
                    href={q.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-2xl p-3 bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div
                      className={`h-12 w-12 shrink-0 rounded-2xl grid place-items-center font-bold text-white shadow-soft ${
                        q.mag >= 6
                          ? "bg-destructive animate-pulse-soft"
                          : q.mag >= 5
                            ? "bg-quake"
                            : "bg-primary"
                      }`}
                    >
                      {q.mag.toFixed(1)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{q.place}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(q.time).toLocaleString()} {q.tsunami ? "· ⚠️ tsunami alert" : ""}
                      </div>
                    </div>
                  </a>
                ))}
                {!quakesQ.isLoading && (quakesAllQ.data?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">No recent significant quakes. 🐾</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tsunami" className="mt-4">
            <Card title="Tsunami advisories" icon="🌊">
              {tsunamiAlerts.length === 0 ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50">
                  <span className="text-3xl">✅</span>
                  <div>
                    <p className="font-semibold">No active tsunami threats</p>
                    <p className="text-sm text-muted-foreground">
                      Mochi checked the oceans. All clear, nya!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {tsunamiAlerts.map((q) => (
                    <a
                      key={q.id}
                      href={q.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl p-4 bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 transition-colors"
                    >
                      <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
                      <div>
                        <div className="font-semibold">
                          {q.place} — M{q.mag.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(q.time).toLocaleString()}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Tsunami signals derived from USGS earthquake-tsunami flag. For official warnings see
                NOAA/PTWC.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="storms" className="mt-4">
            <StormsPanel />
          </TabsContent>

          <TabsContent value="tides" className="mt-4">
            <TidesPanel />
          </TabsContent>

          <TabsContent value="air" className="mt-4">
            <AirQualityPanel
              data={airQ.data ?? null}
              isLoading={airQ.isLoading}
              isError={airQ.isError}
            />
          </TabsContent>

          <TabsContent value="marine" className="mt-4">
            <MarinePanel
              data={marineQ.data ?? null}
              isLoading={marineQ.isLoading}
              isError={marineQ.isError}
              place={place?.name ?? "—"}
            />
          </TabsContent>

          <TabsContent value="space" className="mt-4">
            <SpaceWeatherPanel
              entries={spaceQ.data ?? []}
              isLoading={spaceQ.isLoading}
              isError={spaceQ.isError}
            />
          </TabsContent>

          <TabsContent value="volcano" className="mt-4">
            <VolcanoPanel
              notices={volcanoQ.data ?? []}
              isLoading={volcanoQ.isLoading}
              isError={volcanoQ.isError}
            />
          </TabsContent>
        </Tabs>
      </section>
      </div>{/* end ALERTS */}

      {/* ── MOCHI ────────────────────────────── */}
      <div className={ms('mochi')}>
      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="bg-gradient-card rounded-3xl p-6 shadow-soft border border-white/60">
          <h3 className="font-bold text-base mb-1 flex items-center gap-2">
            <span className="text-xl">🐾</span> Meet the Mochi crew
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            A different cat shows up depending on the weather.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { m: "sunny" as const, label: "Sunny", desc: "Clear & breezy" },
              { m: "rain" as const, label: "Rainy", desc: "Showers & drizzle" },
              { m: "storm" as const, label: "Stormy", desc: "Thunder & severe" },
              { m: "snow" as const, label: "Snowy", desc: "Snow & freezing" },
              { m: "hot" as const, label: "Heatwave", desc: "30°C and up" },
            ].map((c) => {
              const active = mood === c.m;
              return (
                <div
                  key={c.m}
                  className={`rounded-2xl p-3 text-center transition-all ${
                    active
                      ? "bg-gradient-sun scale-105 shadow-pop"
                      : "bg-secondary/40 hover:bg-secondary/70"
                  }`}
                >
                  <CatThumb mood={c.m} />
                  <div className="text-sm font-bold mt-1">{c.label}</div>
                  <div className="text-[11px] text-muted-foreground">{c.desc}</div>
                  {active && (
                    <div className="text-[10px] mt-1 font-bold text-primary">ON DUTY ✨</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <MascotCustomizer value={customization} onChange={setCustomization} />
      </section>

      <footer className="text-center text-xs text-muted-foreground mt-10 pb-6">
        Live data:{" "}
        <a className="underline" href="https://open-meteo.com" target="_blank" rel="noreferrer">
          Open-Meteo
        </a>{" "}
        ·{" "}
        <a
          className="underline"
          href="https://earthquake.usgs.gov"
          target="_blank"
          rel="noreferrer"
        >
          USGS
        </a>{" "}
        ·{" "}
        <a className="underline" href="https://www.nhc.noaa.gov" target="_blank" rel="noreferrer">
          NOAA NHC
        </a>{" "}
        ·{" "}
        <a
          className="underline"
          href="https://tidesandcurrents.noaa.gov"
          target="_blank"
          rel="noreferrer"
        >
          NOAA Tides
        </a>
        . Auto-refreshes every couple of minutes. Made with 🐾 by Mochi.
      </footer>
      </div>{/* end MOCHI */}

    </main>

    {/* ── Mobile bottom nav ─────────────────── */}
    <nav className="fixed bottom-0 left-0 right-0 z-[150] md:hidden bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-stretch h-16">
        {([
          { s: 'now',      icon: <Sun className="h-5 w-5" />,           label: 'Now' },
          { s: 'forecast', icon: <CalendarDays className="h-5 w-5" />,  label: 'Forecast' },
          { s: 'alerts',   icon: <AlertTriangle className="h-5 w-5" />, label: 'Alerts' },
          { s: 'mochi',    icon: <Sparkles className="h-5 w-5" />,      label: 'Mochi' },
        ] as const).map(({ s, icon, label }) => (
          <button
            key={s}
            onClick={() => setMobileSection(s)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              mobileSection === s ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {icon}
            {label}
            {mobileSection === s && <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
    </nav>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="glass rounded-2xl px-3 py-2.5 text-foreground">
      <div className="flex items-center gap-1.5 text-[11px] uppercase font-semibold opacity-70">
        {icon} {label}
      </div>
      <div className={`text-sm font-bold mt-0.5 ${valueClass ?? ""}`}>{value}</div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-card rounded-3xl p-5 shadow-soft border border-white/60 animate-fade-up overflow-hidden">
      <h3 className="font-bold text-base mb-3 flex items-center gap-2">
        <span className="text-xl">{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

interface AdviceItem {
  label: string;
  value: string;
  tone: "good" | "watch" | "risk";
}

function AdviceStrip({ items, updatedAt }: { items: AdviceItem[]; updatedAt: number }) {
  return (
    <section className="mt-4 rounded-3xl bg-gradient-card p-4 shadow-soft border border-white/60 animate-fade-up">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Today's advice</h2>
        <span className="text-xs text-muted-foreground">Updated {formatUpdated(updatedAt)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className={`rounded-2xl px-3 py-2 ${adviceToneClass(item.tone)}`}>
            <div className="text-[10px] font-bold uppercase opacity-70">{item.label}</div>
            <div className="text-sm font-bold">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function getAdviceItems(
  weather: WeatherData | null,
  aqi: number | null,
  tsunamiCount: number,
): AdviceItem[] {
  const current = weather?.current;
  const rainChance = weather?.daily.precipitation_probability_max[0] ?? 0;
  const uv = current?.uv_index ?? 0;
  const wind = current?.wind_gusts_10m ?? 0;
  const code = current ? describeCode(current.weather_code) : null;

  return [
    {
      label: "Umbrella",
      value: rainChance >= 50 || code?.severity === "rain" ? "Take one" : "Probably no",
      tone: rainChance >= 70 ? "risk" : rainChance >= 35 ? "watch" : "good",
    },
    {
      label: "UV",
      value: current ? describeUv(uv).label : "Loading",
      tone: uv >= 8 ? "risk" : uv >= 5 ? "watch" : "good",
    },
    {
      label: "Wind",
      value: wind >= 60 ? "Gusty" : wind >= 35 ? "Breezy" : "Calm",
      tone: wind >= 60 ? "risk" : wind >= 35 ? "watch" : "good",
    },
    {
      label: "Air",
      value: aqi == null ? "Checking" : describeAqi(aqi).label,
      tone: aqi == null || aqi <= 50 ? "good" : aqi <= 100 ? "watch" : "risk",
    },
    {
      label: "Alerts",
      value:
        tsunamiCount > 0
          ? `${tsunamiCount} tsunami flag${tsunamiCount === 1 ? "" : "s"}`
          : "None flagged",
      tone: tsunamiCount > 0 ? "risk" : "good",
    },
  ];
}

function adviceToneClass(tone: AdviceItem["tone"]) {
  if (tone === "risk") return "bg-destructive/10 text-destructive";
  if (tone === "watch") return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

function formatUpdated(value: number) {
  if (!value) return "when data loads";
  return new Date(value).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}
