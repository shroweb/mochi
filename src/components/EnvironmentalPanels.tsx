import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  compassDir,
  describeAqi,
  describeKp,
  getTides,
  TIDE_STATIONS,
  volcanoColorClass,
  type AirQualityData,
  type KpEntry,
  type MarineData,
  type VolcanoNotice,
} from "@/lib/weather";
import { Button } from "@/components/ui/button";

interface NhcStorm {
  id: string;
  classification?: string;
  basin?: string;
  name?: string;
  intensity?: number | string;
  pressure?: number | string;
  latitudeNumeric?: number;
  longitudeNumeric?: number;
}

interface NhcStormFeed {
  activeStorms?: NhcStorm[];
}

export function StormsPanel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["nhc"],
    queryFn: async () => {
      try {
        const r = await fetch("https://www.nhc.noaa.gov/CurrentStorms.json");
        if (!r.ok) return { activeStorms: [] } as NhcStormFeed;
        return (await r.json()) as NhcStormFeed;
      } catch {
        return { activeStorms: [] } as NhcStormFeed;
      }
    },
    staleTime: 15 * 60 * 1000,
  });
  const storms = data?.activeStorms ?? [];
  return (
    <PanelCard title="Active hurricanes, cyclones & tropical storms" icon="🌀">
      {isLoading && <p className="text-sm text-muted-foreground">Mochi is sniffing the wind...</p>}
      {isError && <ErrorNote label="Storm data could not be loaded." />}
      {!isLoading && !isError && storms.length === 0 && (
        <CalmState
          icon="🌀"
          title="No active tropical systems"
          body="Skies are calm in the tropics right now."
        />
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {storms.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl p-4 bg-gradient-storm text-white shadow-soft relative overflow-hidden"
          >
            <span className="absolute -right-4 -top-4 text-8xl opacity-20 animate-spin-slow">
              🌀
            </span>
            <div className="text-xs uppercase opacity-80">
              {s.classification} · {s.basin}
            </div>
            <div className="text-xl font-bold">{s.name}</div>
            <div className="text-sm mt-1">
              {s.intensity} kt winds · {s.pressure} mb
            </div>
            <div className="text-xs opacity-80 mt-1">
              {s.latitudeNumeric?.toFixed(1)}°, {s.longitudeNumeric?.toFixed(1)}°
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        For tornado watches/warnings in the US see NWS SPC. Severe local storms appear in your
        forecast above when detected.
      </p>
    </PanelCard>
  );
}

export function TidesPanel() {
  const [station, setStation] = useState(TIDE_STATIONS[0]);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tides", station.id],
    queryFn: () => getTides(station.id),
    staleTime: 30 * 60 * 1000,
  });
  return (
    <PanelCard title={`Tides - ${station.name}`} icon="🌊">
      <div className="flex flex-wrap gap-2 mb-4">
        {TIDE_STATIONS.map((s) => (
          <Button
            key={s.id}
            size="sm"
            variant={s.id === station.id ? "default" : "secondary"}
            className="rounded-full"
            onClick={() => setStation(s)}
          >
            {s.name}
          </Button>
        ))}
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading tide predictions...</p>}
      {isError && <ErrorNote label="Tide predictions could not be loaded." />}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2">
        {(data ?? []).slice(0, 8).map((t, i) => (
          <div
            key={i}
            className={`rounded-2xl p-3 ${t.type === "H" ? "bg-rain/15" : "bg-snow/40"}`}
          >
            <div className="text-[10px] uppercase font-bold text-muted-foreground">
              {t.type === "H" ? "High tide" : "Low tide"}
            </div>
            <div className="font-bold text-lg">{parseFloat(t.v).toFixed(2)} m</div>
            <div className="text-xs text-muted-foreground">{new Date(t.t).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

export function AirQualityPanel({
  data,
  isLoading,
  isError,
}: {
  data: AirQualityData | null;
  isLoading: boolean;
  isError?: boolean;
}) {
  const aqi = data?.us_aqi ?? null;
  const aqiInfo = aqi != null ? describeAqi(aqi) : null;
  const pollens = [
    { key: "alder_pollen", label: "Alder", val: data?.alder_pollen },
    { key: "birch_pollen", label: "Birch", val: data?.birch_pollen },
    { key: "grass_pollen", label: "Grass", val: data?.grass_pollen },
    { key: "mugwort_pollen", label: "Mugwort", val: data?.mugwort_pollen },
    { key: "olive_pollen", label: "Olive", val: data?.olive_pollen },
    { key: "ragweed_pollen", label: "Ragweed", val: data?.ragweed_pollen },
  ].filter((p) => p.val != null && p.val > 0);

  return (
    <PanelCard title="Air quality & pollen" icon="💨">
      {isLoading && <p className="text-sm text-muted-foreground">Mochi is sniffing the air...</p>}
      {isError && <ErrorNote label="Air quality data could not be loaded." />}
      {!isLoading && !isError && !data && (
        <p className="text-sm text-muted-foreground">No air quality data for this location.</p>
      )}
      {data && (
        <div className="space-y-4">
          {aqi != null && aqiInfo && (
            <div className={`flex items-center gap-4 p-4 rounded-2xl ${aqiInfo.bg}`}>
              <div className={`text-4xl font-bold ${aqiInfo.color}`}>{aqi}</div>
              <div>
                <div className={`font-bold ${aqiInfo.color}`}>US AQI - {aqiInfo.label}</div>
                {data.european_aqi != null && (
                  <div className="text-sm text-muted-foreground">EU AQI: {data.european_aqi}</div>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Metric
              label="PM2.5"
              value={data.pm2_5 != null ? `${data.pm2_5.toFixed(1)} ug/m3` : null}
            />
            <Metric
              label="PM10"
              value={data.pm10 != null ? `${data.pm10.toFixed(1)} ug/m3` : null}
            />
            <Metric
              label="Ozone"
              value={data.ozone != null ? `${data.ozone.toFixed(0)} ug/m3` : null}
            />
          </div>
          {pollens.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold mb-2">Active pollen</h4>
              <div className="flex flex-wrap gap-2">
                {pollens.map((p) => (
                  <div
                    key={p.key}
                    className="rounded-full px-3 py-1 bg-green-100 text-green-800 text-xs font-medium"
                  >
                    {p.label}: {(p.val as number).toFixed(0)} gr/m3
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No significant pollen detected.</p>
          )}
        </div>
      )}
    </PanelCard>
  );
}

export function MarinePanel({
  data,
  isLoading,
  isError,
  place,
}: {
  data: MarineData | null;
  isLoading: boolean;
  isError?: boolean;
  place: string;
}) {
  return (
    <PanelCard title={`Marine conditions - ${place}`} icon="🌊">
      {isLoading && <p className="text-sm text-muted-foreground">Checking the seas...</p>}
      {isError && <ErrorNote label="Marine data could not be loaded." />}
      {!isLoading && !isError && !data && (
        <CalmState
          icon="-"
          title="No marine data"
          body="This location may be landlocked or too far from open ocean."
        />
      )}
      {data && data.wave_height == null && data.swell_wave_height == null && (
        <CalmState
          icon="🏔️"
          title="No wave data"
          body="This location is sheltered or inland — no open-ocean wave data available."
        />
      )}
      {data && (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.wave_height != null && (
            <div className="rounded-2xl p-4 bg-rain/10">
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                Wave height
              </div>
              <div className="text-2xl font-bold">{data.wave_height.toFixed(1)} m</div>
              {data.wave_period != null && (
                <div className="text-sm text-muted-foreground">
                  {data.wave_period.toFixed(0)}s period
                </div>
              )}
              {data.wave_direction != null && (
                <div className="text-sm text-muted-foreground">
                  From {compassDir(data.wave_direction)} ({data.wave_direction.toFixed(0)} deg)
                </div>
              )}
            </div>
          )}
          {data.swell_wave_height != null && (
            <div className="rounded-2xl p-4 bg-sky-100/60">
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                Swell
              </div>
              <div className="text-2xl font-bold">{data.swell_wave_height.toFixed(1)} m</div>
              {data.swell_wave_period != null && (
                <div className="text-sm text-muted-foreground">
                  {data.swell_wave_period.toFixed(0)}s period
                </div>
              )}
              {data.swell_wave_direction != null && (
                <div className="text-sm text-muted-foreground">
                  From {compassDir(data.swell_wave_direction)} (
                  {data.swell_wave_direction.toFixed(0)} deg)
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-4">Marine data from Open-Meteo Marine API.</p>
    </PanelCard>
  );
}

export function SpaceWeatherPanel({
  entries,
  isLoading,
  isError,
}: {
  entries: KpEntry[];
  isLoading: boolean;
  isError?: boolean;
}) {
  const latest = entries[entries.length - 1];
  const kp = latest?.kp ?? 0;
  const info = describeKp(kp);

  return (
    <PanelCard title="Space weather & aurora forecast" icon="🌌">
      {isLoading && <p className="text-sm text-muted-foreground">Scanning the magnetosphere...</p>}
      {isError && <ErrorNote label="Space weather data could not be loaded." />}
      {!isLoading && !isError && entries.length === 0 && (
        <p className="text-sm text-muted-foreground">No space weather data available.</p>
      )}
      {entries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="text-center">
              <div className={`text-5xl font-bold ${info.color}`}>{kp.toFixed(1)}</div>
              <div className="text-xs uppercase font-bold text-muted-foreground mt-0.5">
                Kp index
              </div>
            </div>
            <div>
              <div className={`font-bold text-lg ${info.color}`}>
                {info.label !== "-" ? `${info.label} - ` : ""}
                {info.storm}
              </div>
              <div className="text-sm text-muted-foreground">Aurora: {info.aurora}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(latest.time_tag).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-16">
            {entries.map((e, i) => {
              const pct = Math.min((e.kp / 9) * 100, 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-t-sm ${e.kp >= 5 ? "bg-yellow-400" : e.kp >= 4 ? "bg-yellow-300" : "bg-primary/40"}`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <div className="text-[8px] text-muted-foreground truncate w-full text-center">
                    {e.kp.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Data: NOAA Space Weather Prediction Center.
          </p>
        </div>
      )}
    </PanelCard>
  );
}

export function VolcanoPanel({
  notices,
  isLoading,
  isError,
}: {
  notices: VolcanoNotice[];
  isLoading: boolean;
  isError?: boolean;
}) {
  const getName = (n: VolcanoNotice) => n.volcanoName ?? n.volcano_name ?? "Unknown volcano";
  const getCode = (n: VolcanoNotice) =>
    n.aviationColorCode ?? n.aviation_color_code ?? n.color ?? "GREEN";
  const getTime = (n: VolcanoNotice) => n.issued ?? n.issue_time;
  const sorted = [
    ...notices.filter((n) => ["RED", "ORANGE"].includes(getCode(n).toUpperCase())),
    ...notices.filter((n) => !["RED", "ORANGE"].includes(getCode(n).toUpperCase())),
  ];

  return (
    <PanelCard title="Volcano observatory notices (USGS)" icon="🌋">
      {isLoading && (
        <p className="text-sm text-muted-foreground">Mochi is watching the volcanoes...</p>
      )}
      {isError && <ErrorNote label="Volcano notices could not be loaded." />}
      {!isLoading && !isError && notices.length === 0 && (
        <CalmState
          icon="OK"
          title="No recent volcano notices"
          body="All US volcanoes at background levels. Mochi approves."
        />
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {sorted.map((n, i) => {
          const code = getCode(n);
          return (
            <div key={i} className="flex items-center gap-3 rounded-2xl p-3 bg-secondary/50">
              <div
                className={`h-12 w-12 shrink-0 rounded-2xl grid place-items-center font-bold text-xs shadow-soft ${volcanoColorClass(code)}`}
              >
                {code}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{getName(n)}</div>
                {getTime(n) && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(getTime(n)!).toLocaleString()}
                  </div>
                )}
                {n.synopsis && (
                  <div className="text-xs text-muted-foreground truncate">{n.synopsis}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Aviation color codes: RED = eruption imminent/ash · ORANGE = elevated unrest · YELLOW =
        above background · GREEN = normal.
      </p>
    </PanelCard>
  );
}

function PanelCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-card rounded-3xl p-5 shadow-soft border border-white/60 animate-fade-up">
      <h3 className="font-bold text-base mb-3 flex items-center gap-2">
        <span className="text-xl">{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function CalmState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-background text-sm font-bold text-primary shadow-soft">
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function ErrorNote({ label }: { label: string }) {
  return (
    <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
      {label}
    </p>
  );
}

function Metric({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl p-3 bg-secondary/50">
      <div className="text-[10px] uppercase font-bold text-muted-foreground">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
