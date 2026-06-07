import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { describeCode, type WeatherData } from "@/lib/weather";

const chartConfig = {
  temp: { label: "Temperature", color: "var(--primary)" },
  rain: { label: "Rain chance", color: "var(--rain)" },
} satisfies ChartConfig;

export function HourlyForecastChart({ weather }: { weather: WeatherData }) {
  const data = weather.hourly.time.slice(0, 24).map((time, index) => ({
    time: new Date(time).toLocaleTimeString("en", { hour: "numeric" }),
    temp: Math.round(weather.hourly.temperature_2m[index]),
    rain: weather.hourly.precipitation_probability[index] ?? 0,
    label: describeCode(weather.hourly.weather_code[index]).label,
  }));

  return (
    <div className="space-y-3">
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={18} />
          <YAxis yAxisId="temp" tickLine={false} axisLine={false} width={28} />
          <YAxis
            yAxisId="rain"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={28}
            domain={[0, 100]}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            yAxisId="rain"
            dataKey="rain"
            type="monotone"
            fill="var(--rain)"
            fillOpacity={0.16}
            stroke="var(--rain)"
            strokeWidth={2}
          />
          <Line
            yAxisId="temp"
            dataKey="temp"
            type="monotone"
            stroke="var(--primary)"
            strokeWidth={3}
            dot={false}
          />
        </AreaChart>
      </ChartContainer>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
          Temperature °C
        </span>
        <span className="rounded-full bg-rain/10 px-2 py-1 font-medium text-rain">
          Rain chance %
        </span>
      </div>
    </div>
  );
}
