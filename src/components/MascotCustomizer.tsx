import { useEffect, useState } from "react";
import { FUR_PRESETS, type FurColor } from "@/components/Mascot";
import { Sparkles } from "lucide-react";

const STORAGE_KEY = "mochi-customization-v1";

export interface MascotCustomization {
  fur: FurColor;
}

const DEFAULT: MascotCustomization = { fur: "classic" };

export function useMascotCustomization() {
  const [state, setState] = useState<MascotCustomization>(DEFAULT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  return [state, setState] as const;
}

interface Props {
  value: MascotCustomization;
  onChange: (v: MascotCustomization) => void;
}

export function MascotCustomizer({ value, onChange }: Props) {
  return (
    <div className="bg-gradient-card rounded-3xl p-5 shadow-soft border border-white/60 animate-fade-up">
      <h3 className="font-bold text-base mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" /> Customize Mochi
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Pick a fur color. Mochi still changes mood with the weather.
      </p>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Fur color
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FUR_PRESETS) as FurColor[]).map((id) => {
            const p = FUR_PRESETS[id];
            const active = value.fur === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ ...value, fur: id })}
                className={`group flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-medium border transition-all ${
                  active ? "border-primary bg-primary/10 shadow-soft" : "border-transparent bg-secondary/50 hover:bg-secondary"
                }`}
                aria-pressed={active}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full ring-2 ring-white shadow"
                  style={{ background: p.swatch }}
                />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
