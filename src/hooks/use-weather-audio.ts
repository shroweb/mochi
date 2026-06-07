/**
 * Synthesizes ambient weather sounds via the Web Audio API.
 * No audio files — everything is generated from oscillators and noise buffers.
 *
 * Condition mapping:
 *   calm (day)    → birdsong + gentle outdoor hiss
 *   calm (night)  → soft crickets / night ambience
 *   mild          → gentle breeze (LFO-modulated pink noise)
 *   rain          → bandpass-filtered white noise (rain patter)
 *   storm/extreme → heavy rain + howling wind + occasional thunder crack
 *   snow          → muffled low-frequency hush
 */

import { useCallback, useEffect, useRef, useState } from "react";

export function useWeatherAudio(severity?: string, isDay = true) {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Always stop previous sounds when conditions change
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!on || !severity) return;

    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    // Master gain — fade in over 1.5 s
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 1.5);
    master.connect(ctx.destination);

    const srcs: AudioBufferSourceNode[] = [];
    const oscs: OscillatorNode[] = [];
    const tids: ReturnType<typeof setTimeout>[] = [];

    // ── Helpers ────────────────────────────────────────────────────────
    function whiteNoise(seconds = 4) {
      const n = ctx.sampleRate * seconds;
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      srcs.push(s);
      return s;
    }

    function pinkNoise(seconds = 4) {
      const n = ctx.sampleRate * seconds;
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) / 7;
        b6 = w * 0.115926;
      }
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      srcs.push(s);
      return s;
    }

    function wind(vol: number, wobbleHz: number, wobbleAmt: number, cutoff: number) {
      const src = pinkNoise();
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = cutoff;
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = wobbleHz;
      const lfoG = ctx.createGain();
      lfoG.gain.value = wobbleAmt;
      lfo.connect(lfoG);
      lfoG.connect(filt.frequency);
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(filt);
      filt.connect(g);
      g.connect(master);
      src.start();
      lfo.start();
      oscs.push(lfo);
    }

    // ── Rain ──────────────────────────────────────────────────────────
    if (["rain", "storm", "extreme"].includes(severity)) {
      // Light rain: mid-band white noise hiss
      const rn = whiteNoise();
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1100;
      f.Q.value = 0.45;
      const g = ctx.createGain();
      g.gain.value = severity === "rain" ? 0.38 : 0.55;
      rn.connect(f); f.connect(g); g.connect(master);
      rn.start();

      // Heavy rain adds a low rumble layer
      if (severity !== "rain") {
        const rn2 = whiteNoise();
        const f2 = ctx.createBiquadFilter();
        f2.type = "bandpass"; f2.frequency.value = 380; f2.Q.value = 0.3;
        const g2 = ctx.createGain(); g2.gain.value = 0.18;
        rn2.connect(f2); f2.connect(g2); g2.connect(master);
        rn2.start();
      }
    }

    // ── Wind ──────────────────────────────────────────────────────────
    if (severity === "mild") {
      wind(0.09, 0.04, 75, 350);
    } else if (severity === "storm" || severity === "extreme") {
      wind(0.25, 0.09, 200, 460);
    }

    // ── Thunder (storm / extreme) ──────────────────────────────────────
    if (severity === "storm" || severity === "extreme") {
      function boom(delay: number) {
        const t = setTimeout(() => {
          const ns = pinkNoise(3);
          const filt = ctx.createBiquadFilter();
          filt.type = "lowpass"; filt.frequency.value = 100;
          const g = ctx.createGain();
          const now = ctx.currentTime;
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.9, now + 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
          ns.connect(filt); filt.connect(g); g.connect(master);
          ns.start();
          setTimeout(() => { try { ns.stop(); } catch { /* ignore */ } }, 3200);
          boom(9000 + Math.random() * 15000);
        }, delay);
        tids.push(t);
      }
      boom(4000 + Math.random() * 6000);
    }

    // ── Birds (calm, daytime) ─────────────────────────────────────────
    if (severity === "calm" && isDay) {
      // Soft outdoor hiss underneath
      const amb = pinkNoise();
      const af = ctx.createBiquadFilter();
      af.type = "bandpass"; af.frequency.value = 900; af.Q.value = 0.2;
      const ag = ctx.createGain(); ag.gain.value = 0.055;
      amb.connect(af); af.connect(ag); ag.connect(master);
      amb.start();

      function chirp(delay: number) {
        const t = setTimeout(() => {
          const base = 2300 + Math.random() * 900;
          function note(freq: number, start: number, vol: number) {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.setValueAtTime(freq, start);
            o.frequency.linearRampToValueAtTime(freq * 1.18, start + 0.06);
            o.frequency.linearRampToValueAtTime(freq * 0.92, start + 0.16);
            g.gain.setValueAtTime(0, start);
            g.gain.linearRampToValueAtTime(vol, start + 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
            o.connect(g); g.connect(master);
            o.start(start); o.stop(start + 0.28);
            oscs.push(o);
          }
          const now = ctx.currentTime;
          note(base, now, 0.10);
          if (Math.random() > 0.45) note(base * 1.12, now + 0.22, 0.08);
          chirp(1800 + Math.random() * 3800);
        }, delay);
        tids.push(t);
      }
      chirp(400);
      chirp(2200 + Math.random() * 600);
    }

    // ── Night crickets (calm, night) ───────────────────────────────────
    if (severity === "calm" && !isDay) {
      function cricket(delay: number) {
        const t = setTimeout(() => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = 4200 + Math.random() * 400;
          const now = ctx.currentTime;
          // Fast repeated chirp x3
          for (let i = 0; i < 3; i++) {
            const s = now + i * 0.08;
            g.gain.setValueAtTime(0, s);
            g.gain.linearRampToValueAtTime(0.06, s + 0.02);
            g.gain.linearRampToValueAtTime(0, s + 0.06);
          }
          o.connect(g); g.connect(master);
          o.start(now); o.stop(now + 0.32);
          oscs.push(o);
          cricket(600 + Math.random() * 1400);
        }, delay);
        tids.push(t);
      }
      cricket(300);
      cricket(900 + Math.random() * 400);
      cricket(1800 + Math.random() * 600);
    }

    // ── Snow: muffled hush ─────────────────────────────────────────────
    if (severity === "snow") {
      const sn = whiteNoise();
      const sf = ctx.createBiquadFilter();
      sf.type = "lowpass"; sf.frequency.value = 160;
      const sg = ctx.createGain(); sg.gain.value = 0.06;
      sn.connect(sf); sf.connect(sg); sg.connect(master);
      sn.start();
    }

    // ── Cleanup ────────────────────────────────────────────────────────
    cleanupRef.current = () => {
      tids.forEach(clearTimeout);
      try {
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
      } catch { /* ignore */ }
      setTimeout(() => {
        srcs.forEach(s => { try { s.stop(); } catch { /* ignore */ } });
        oscs.forEach(o => { try { o.stop(); } catch { /* ignore */ } });
      }, 1100);
    };

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [on, severity, isDay]);

  // Close AudioContext on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      ctxRef.current?.close().catch(() => { /* ignore */ });
    };
  }, []);

  const toggle = useCallback(() => setOn(v => !v), []);
  return { on, toggle };
}
