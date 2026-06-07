import { describeCode } from "@/lib/weather";

// Remap day emojis to their nighttime equivalents for clear/calm codes
const NIGHT_EMOJI: Record<number, string> = {
  0: "🌕",  // Clear sky  → full moon
  1: "🌙",  // Mostly clear → crescent moon
  2: "☁️",  // Partly cloudy → just cloud (moon hidden)
};

export function WeatherIcon({
  code,
  size = 48,
  isDay = true,
}: {
  code: number;
  size?: number;
  isDay?: boolean;
}) {
  const { emoji } = describeCode(code);
  const icon = !isDay && NIGHT_EMOJI[code] ? NIGHT_EMOJI[code] : emoji;
  return (
    <span
      className="inline-block animate-float"
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden
    >
      {icon}
    </span>
  );
}
