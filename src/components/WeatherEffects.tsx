/**
 * Animated weather background effects layered inside the hero card.
 * Each condition gets its own visual treatment:
 *   calm   → day: slow-spinning sun rays + glow  / night: stars + moon
 *   mild   → day: white drifting clouds           / night: dark cloud blobs
 *   rain   → diagonal rain streaks
 *   snow   → falling snowflake characters
 *   storm  → heavy rain + lightning flashes
 *   extreme→ intense storm or dense snow depending on mood
 */

export function WeatherEffects({
  severity,
  mood,
  isDay = true,
}: {
  severity?: string;
  mood?: string;
  isDay?: boolean;
}) {
  if (!severity) return null;
  if (severity === "calm") return isDay ? <SunRays /> : <StarryNight />;
  if (severity === "mild") return isDay ? <DriftingClouds /> : <DriftingClouds night />;
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

// ─── Starry Night ─────────────────────────────────────────────────────────────

function StarryNight() {
  const stars = Array.from({ length: 42 }, (_, i) => ({
    x: (i * 43 + 17) % 93,
    y: (i * 31 + 11) % 82,
    size: 1 + (i % 3) * 0.65,
    opacity: 0.3 + (i % 6) * 0.1,
    twinkle: i % 3 === 0,
    dur: 1.8 + (i % 5) * 0.55,
    delay: (i * 0.28) % 2.5,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {/* Moon glow */}
      <div
        className="absolute top-5 right-7 h-14 w-14 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,248,210,0.95) 28%, rgba(255,240,170,0.45) 58%, transparent 78%)",
          boxShadow: "0 0 24px 10px rgba(255,238,150,0.18)",
          animation: "pulseSoft 6s ease-in-out infinite",
        }}
      />
      {/* Crescent shadow to make it look like a crescent moon */}
      <div
        className="absolute top-4 right-5 h-12 w-12 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 60% 38%, rgba(18,20,50,0.75) 42%, transparent 58%)",
        }}
      />
      {/* Stars */}
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animation: s.twinkle
              ? `pulseSoft ${s.dur}s ease-in-out ${s.delay}s infinite`
              : "none",
          }}
        />
      ))}
      {/* Occasional shooting star */}
      <div
        className="absolute"
        style={{
          top: "12%",
          left: "20%",
          width: "60px",
          height: "1px",
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.8), transparent)",
          transform: "rotate(-25deg)",
          animation: "shootingStar 8s ease-in-out 3s infinite",
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

function DriftingClouds({ night = false }: { night?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: c.top,
            opacity: night ? c.opacity * 1.6 : c.opacity,
            animationName: "cloudDrift",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          <CloudBlob scale={c.scale} night={night} />
        </div>
      ))}
    </div>
  );
}

function CloudBlob({ scale = 1, night = false }: { scale?: number; night?: boolean }) {
  const s = (n: number) => n * scale;
  const color = night ? "rgba(70,85,130,0.85)" : "white";
  return (
    <div style={{ position: "relative", width: s(130), height: s(54) }}>
      <div style={{ position:"absolute", background:color, borderRadius:"50%", width:s(78), height:s(50), bottom:0, left:0 }} />
      <div style={{ position:"absolute", background:color, borderRadius:"50%", width:s(62), height:s(46), bottom:0, right:0 }} />
      <div style={{ position:"absolute", background:color, borderRadius:"50%", width:s(56), height:s(56), bottom:s(8), left:s(22) }} />
      <div style={{ position:"absolute", background:color, borderRadius:"50%", width:s(48), height:s(48), bottom:s(4), left:s(50) }} />
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
