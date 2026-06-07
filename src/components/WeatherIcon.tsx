import { describeCode } from "@/lib/weather";

export function WeatherIcon({ code, size = 48 }: { code: number; size?: number }) {
  const { emoji } = describeCode(code);
  return (
    <span
      className="inline-block animate-float"
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
