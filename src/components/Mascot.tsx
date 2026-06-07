import { useState } from "react";
import rainy from "@/assets/mascot-cat.png";
import sunny from "@/assets/mascot-sunny.png";
import storm from "@/assets/mascot-storm.png";
import snow from "@/assets/mascot-snow.png";
import hot from "@/assets/mascot-hot.png";

export type MascotMood = "calm" | "sunny" | "rain" | "storm" | "snow" | "hot";
export type FurColor = "classic" | "ginger" | "calico" | "midnight" | "mint" | "lavender" | "rose";

const MAP: Record<MascotMood, string> = {
  calm: sunny,
  sunny: sunny,
  rain: rainy,
  storm: storm,
  snow: snow,
  hot: hot,
};

export const FUR_PRESETS: Record<FurColor, { label: string; swatch: string; filter: string }> = {
  classic:   { label: "Classic",   swatch: "#e8d3b0", filter: "none" },
  ginger:    { label: "Ginger",    swatch: "#e8853a", filter: "hue-rotate(-15deg) saturate(1.6) brightness(1.02)" },
  calico:    { label: "Calico",    swatch: "#c97a4a", filter: "hue-rotate(10deg) saturate(1.3) contrast(1.05)" },
  midnight:  { label: "Midnight",  swatch: "#2c2a3a", filter: "hue-rotate(200deg) saturate(0.6) brightness(0.55) contrast(1.1)" },
  mint:      { label: "Mint",      swatch: "#7fd6b6", filter: "hue-rotate(110deg) saturate(0.9) brightness(1.05)" },
  lavender:  { label: "Lavender",  swatch: "#c4a7e7", filter: "hue-rotate(230deg) saturate(0.8) brightness(1.08)" },
  rose:      { label: "Rose",      swatch: "#f0a8b8", filter: "hue-rotate(310deg) saturate(1.1) brightness(1.05)" },
};

interface MascotProps {
  message: string;
  mood?: MascotMood;
  size?: "sm" | "md" | "lg";
  fur?: FurColor;
}

const MOOD_ANIM: Record<MascotMood, string> = {
  calm:  "mascot-calm",
  sunny: "mascot-sunny",
  rain:  "mascot-wave",
  storm: "mascot-bounce",
  snow:  "mascot-shiver",
  hot:   "mascot-pant",
};

const MOOD_AURA: Record<MascotMood, string> = {
  calm: "", sunny: "sunny", rain: "rain", storm: "storm", snow: "snow", hot: "hot",
};

function playMeow() {
  if (typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "triangle";

    // Bandpass filter shapes the vowel character
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 880;
    filt.Q.value = 2.8;

    // Amplitude envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.42, now + 0.03);
    gain.gain.setValueAtTime(0.38, now + 0.13);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

    // "mee-ow" pitch contour: rise then fall
    osc.frequency.setValueAtTime(430, now);
    osc.frequency.linearRampToValueAtTime(670, now + 0.055);
    osc.frequency.setValueAtTime(650, now + 0.11);
    osc.frequency.exponentialRampToValueAtTime(195, now + 0.37);

    // Slight vibrato
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 11;
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);

    osc.connect(filt);
    filt.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now); lfo.start(now);
    osc.stop(now + 0.44); lfo.stop(now + 0.44);

    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch { /* ignore — audio not available */ }
}

export function Mascot({
  message,
  mood = "calm",
  size = "md",
  fur = "classic",
}: MascotProps) {
  const [meowing, setMeowing] = useState(false);
  const dim = size === "lg" ? 180 : size === "sm" ? 72 : 120;
  const src = MAP[mood];
  const filter = FUR_PRESETS[fur].filter;
  const animClass = meowing ? "" : MOOD_ANIM[mood];
  const auraClass = MOOD_AURA[mood];

  function handleClick() {
    if (meowing) return;
    setMeowing(true);
    playMeow();
    setTimeout(() => setMeowing(false), 480);
  }

  return (
    <div className="flex items-end gap-4">
      <div
        className="relative shrink-0 cursor-pointer select-none"
        style={{ width: dim, height: dim }}
        onClick={handleClick}
        title="Tap Mochi!"
      >
        {auraClass && <div key={`aura-${mood}`} className={`mascot-aura on ${auraClass}`} />}
        {mood === "snow" && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="absolute text-white/80 animate-rain text-xs"
                style={{ left: `${10 + i * 14}%`, top: "-6px", animationDelay: `${i * 0.25}s`, animationDuration: `${1.8 + (i % 3) * 0.4}s` }}>❄</span>
            ))}
          </div>
        )}
        <img
          key={`mascot-${mood}`}
          src={src}
          alt={`Mochi the weather cat, mood: ${mood}`}
          width={dim}
          height={dim}
          className={`drop-shadow-xl ${meowing ? "[animation:meow_0.45s_ease-in-out]" : animClass}`}
          style={{ width: dim, height: dim, filter }}
        />
      </div>
      <div className="relative glass rounded-3xl px-5 py-3 shadow-soft max-w-xs mb-2">
        <div className="absolute -left-2 bottom-4 h-4 w-4 rotate-45 glass border-r-0 border-t-0" />
        <p className="text-sm font-medium leading-snug text-foreground">
          <span className="text-primary font-bold">Mochi:</span> {message}
        </p>
      </div>
    </div>
  );
}
