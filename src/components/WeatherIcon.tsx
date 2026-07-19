import { describeCode } from "@/lib/weather";
import cloudIcon from "@/assets/generated/weather-cloud.png";
import rainIcon from "@/assets/generated/weather-rain.png";
import snowIcon from "@/assets/generated/weather-snow.png";
import stormIcon from "@/assets/generated/weather-storm.png";
import sunIcon from "@/assets/generated/weather-sun.png";

const ICON_BY_CODE: Record<number, string> = {
  0: sunIcon,
  1: sunIcon,
  2: cloudIcon,
  3: cloudIcon,
  45: cloudIcon,
  48: cloudIcon,
  51: rainIcon,
  53: rainIcon,
  55: rainIcon,
  61: rainIcon,
  63: rainIcon,
  65: rainIcon,
  71: snowIcon,
  73: snowIcon,
  75: snowIcon,
  77: snowIcon,
  80: rainIcon,
  81: rainIcon,
  82: stormIcon,
  85: snowIcon,
  86: snowIcon,
  95: stormIcon,
  96: stormIcon,
  99: stormIcon,
};

export function getWeatherIconSrc(code: number) {
  return ICON_BY_CODE[code] ?? cloudIcon;
}

export function WeatherIcon({
  code,
  size = 48,
  className = "",
}: {
  code: number;
  size?: number;
  isDay?: boolean;
  className?: string;
}) {
  const { label } = describeCode(code);

  return (
    <img
      src={getWeatherIconSrc(code)}
      alt={label}
      width={size}
      height={size}
      className={`inline-block animate-float object-contain drop-shadow ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}
