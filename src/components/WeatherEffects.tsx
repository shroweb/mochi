/**
 * Animated weather background effects layered inside the hero card.
 * Each condition gets its own visual treatment:
 *   calm   → slow-spinning golden sun rays + glow
 *   mild   → drifting cloud shapes
 *   rain   → diagonal rain streaks
 *   snow   → falling snowflake characters
 *   storm  → heavy rain + lightning flashes
 *   extreme→ intense storm or dense snow depending on mood
 */

export function WeatherEffects({
  severity,
  mood,
}: {
  severity?: string;
  mood?: string;
}) {
  if (!severity) return null;
  if (severity === "calm") return <SunRays />;
  if (severity === "mild") return <DriftingClouds />;
  if (severity === "rain") return <RainDrops />;
  if (severity === "snow") return <SnowFlakes />;
  if (severity === "storm") return <StormEffect />;
  if (severity === "extreme") {
    return mood === "snow" ? <SnowFlakes dense /> : <StormEffect intense />;
  }
  return null;
}

// ─── Sun Rays ─────────────────────────────────────────────────────────────────

function SunRays() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {/* Warm glow orb in the top-right */}
      <div
        className="absolute -top-12 -right-12 h-56 w-56 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,222,50,0.55) 0%, rgba(255,190,30,0.22) 42%, transparent 68%)",
          animation: "pulseSoft 4s ease-in-out infinite",
        }}
      />
      {/* Conic rays — very slow rotation from top-right focal point */}
      <div
        className="absolute inset-0"
        style={{
          background: `conic-gradient(
            from 145deg at 90% -8%,
            transparent  0deg,
            rgba(255,235,60,0.22)  5deg,
            transparent 10deg,
            transparent 20deg,
            rgba(255,235,60,0.18) 25deg,
            transparent 30deg,
            transparent 42deg,
            rgba(255,235,60,0.15) 47deg,
            transparent 52deg,
            transparent 63deg,
            rgba(255,235,60,0.12) 68deg,
            transparent 73deg,
            transparent 86deg,
            rgba(255,235,60,0.10) 91deg,
            transparent 96deg,
            transparent 360deg
          )`,
          animation: "spin 55s linear infinite",
          transformOrigin: "90% -8%",
        }}
      />
      {/* Secondary softer shimmer layer counter-rotating */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `conic-gradient(
            from 170deg at 90% -8%,
            transparent  0deg,
            rgba(255,245,100,0.12) 8deg,
            transparent 16deg,
            transparent 34deg,
            rgba(255,245,100,0.10) 42deg,
            transparent 50deg,
            transparent 360deg
          )`,
          animation: "spin 80s linear infinite reverse",
          transformOrigin: "90% -8%",
        }}
      />
    </div>
  );
}

// ─── Drifting Clouds ──────────────────────────────────────────────────────────

const CLOUDS = [
  { delay: 0,  dur: 24, top: "16%",  scale: 1.3, opacity: 0.14 },
  { delay: 9,  dur: 32, top: "44%",  scale: 0.85, opacity: 0.10 },
  { delay: 18, dur: 22, top: "66%",  scale: 1.05, opacity: 0.12 },
];

function DriftingClouds() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: c.top,
            opacity: c.opacity,
            animationName: "cloudDrift",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          <CloudBlob scale={c.scale} />
        </div>
      ))}
    </div>
  );
}

function CloudBlob({ scale = 1 }: { scale?: number }) {
  const s = (n: number) => n * scale;
  return (
    <div style={{ position: "relative", width: s(130), height: s(54) }}>
      <div style={{ position:"absolute", background:"white", borderRadius:"50%", width:s(78), height:s(50), bottom:0, left:0 }} />
      <div style={{ position:"absolute", background:"white", borderRadius:"50%", width:s(62), height:s(46), bottom:0, right:0 }} />
      <div style={{ position:"absolute", background:"white", borderRadius:"50%", width:s(56), height:s(56), bottom:s(8), left:s(22) }} />
      <div style={{ position:"absolute", background:"white", borderRadius:"50%", width:s(48), height:s(48), bottom:s(4), left:s(50) }} />
    </div>
  );
}

// ─── Rain Drops ───────────────────────────────────────────────────────────────

function RainDrops({ heavy }: { heavy?: boolean }) {
  const count = heavy ? 36 : 22;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="absolute block rounded-full"
          style={{
            left: `${(i * 97 + 11) % 102}%`,
            top: "-12px",
            width: heavy ? "2px" : "1.5px",
            height: heavy ? "18px" : "14px",
            background: "rgba(147,200,240,0.55)",
            transform: "rotate(12deg)",
            animationName: "rain",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDuration: `${heavy ? 0.55 + (i % 5) * 0.08 : 0.75 + (i % 6) * 0.12}s`,
            animationDelay: `${(i % 11) * 0.09}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Snowflakes ───────────────────────────────────────────────────────────────

const FLAKE_CHARS = ["❄", "❅", "❆", "✦", "✧"];

function SnowFlakes({ dense }: { dense?: boolean }) {
  const count = dense ? 28 : 18;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {Array.from({ length: count }).map((_, i) => {
        const size = 0.7 + (i % 5) * 0.22;
        const char = FLAKE_CHARS[i % FLAKE_CHARS.length];
        return (
          <span
            key={i}
            className="absolute"
            style={{
              left: `${(i * 6.1 + 3) % 98}%`,
              top: "-14px",
              fontSize: `${size}rem`,
              color: `rgba(255,255,255,${0.55 + (i % 4) * 0.1})`,
              animationName: "snowFall",
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationDuration: `${2.5 + (i % 5) * 0.6}s`,
              animationDelay: `${i * 0.18}s`,
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}

// ─── Storm Effect ─────────────────────────────────────────────────────────────

function StormEffect({ intense }: { intense?: boolean }) {
  return (
    <>
      <RainDrops heavy={intense} />
      <LightningFlash intense={intense} />
    </>
  );
}

function LightningFlash({ intense }: { intense?: boolean }) {
  return (
    <>
      {/* Full-card flash overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[2rem]"
        style={{
          background: "rgba(200,220,255,0.6)",
          animation: intense ? "lightning 2.2s ease-in-out infinite" : "lightning 3.5s ease-in-out infinite",
        }}
      />
      {/* Bolt shape */}
      <div
        className="pointer-events-none absolute top-4 right-8"
        style={{ animation: intense ? "lightning 2.2s ease-in-out 0.15s infinite" : "lightning 3.5s ease-in-out 0.2s infinite" }}
      >
        <svg width="28" height="48" viewBox="0 0 28 48" fill="none">
          <path
            d="M18 2L4 26h10l-4 20L24 18H14L18 2Z"
            fill="rgba(255,255,200,0.9)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
          />
        </svg>
      </div>
    </>
  );
}
