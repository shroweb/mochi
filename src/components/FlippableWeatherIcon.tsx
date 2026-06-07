import { useState } from "react";
import { WeatherIcon } from "@/components/WeatherIcon";
import { getMoonPhase } from "@/lib/weather";

const moonPhase = getMoonPhase(); // computed once per page load

export function FlippableWeatherIcon({
  code,
  size = 96,
  isDay = true,
}: {
  code: number;
  size?: number;
  isDay?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      aria-label={flipped ? "Show weather icon" : "Show moon phase"}
      onClick={() => setFlipped(f => !f)}
      className="cursor-pointer select-none focus:outline-none"
      style={{ width: size, height: size, perspective: "800px" }}
    >
      {/* 3-D flip container */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── Front: weather icon ──────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
            /* explicit 0deg needed for backface-visibility to engage */
            WebkitTransform: "rotateY(0deg)",
            transform: "rotateY(0deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WeatherIcon code={code} size={size} isDay={isDay} />
        </div>

        {/* ── Back: moon phase ──────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
            WebkitTransform: "rotateY(180deg)",
            transform: "rotateY(180deg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: size * 0.68, lineHeight: 1 }}>
            {moonPhase.emoji}
          </span>
          <span
            className="font-semibold text-current"
            style={{ fontSize: Math.max(10, size * 0.135), opacity: 0.9, lineHeight: 1 }}
          >
            {moonPhase.name}
          </span>
          <span
            className="text-current"
            style={{ fontSize: Math.max(9, size * 0.115), opacity: 0.65 }}
          >
            {moonPhase.illumination}% lit
          </span>
        </div>
      </div>
    </button>
  );
}
