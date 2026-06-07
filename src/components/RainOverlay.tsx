export function RainOverlay() {
  const drops = Array.from({ length: 24 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {drops.map((_, i) => (
        <span
          key={i}
          className="absolute block w-[2px] h-4 bg-rain/60 rounded-full animate-rain"
          style={{
            left: `${(i * 4.3) % 100}%`,
            top: `-10px`,
            animationDelay: `${(i % 10) * 0.12}s`,
            animationDuration: `${0.7 + (i % 5) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
