import { cn } from "../../ui/shared.tsx";

type Props = {
  points: number[];
  className?: string;
  /** When set, drives the live pulse dot rhythm (bpm). */
  bpm?: number | null;
  showLiveBadge?: boolean;
};

/** Parse "72 bpm" → 72 */
export function parseBpmFromDisplay(hr: string): number | null {
  const m = hr.match(/(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return n > 0 && n < 250 ? n : null;
}

export function RpmEcgWave({ points, className, bpm, showLiveBadge = true }: Props) {
  if (points.length < 2) {
    return (
      <div
        className={cn(
          "rpm-ecg-track flex h-9 items-center justify-center rounded-lg text-[10px] font-semibold rpm-muted",
          className,
        )}
      >
        Awaiting signal…
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const w = 140;
  const h = 36;
  const d = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 6) - 3;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const areaD = `${d} L${w},${h} L0,${h} Z`;
  const pulseSec = bpm && bpm > 0 ? `${Math.max(0.45, 60 / bpm)}s` : "1.1s";

  return (
    <div className={cn("rpm-ecg-track relative overflow-hidden rounded-lg", className)}>
      {showLiveBadge && (
        <span className="absolute top-1 right-1.5 z-10 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 rpm-live-dot" />
          Live
        </span>
      )}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-9 text-emerald-500"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="rpmEcgFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="rpmEcgGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0} />
            <stop offset="50%" stopColor="#34d399" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[0.25, 0.5, 0.75].map((y) => (
          <line
            key={y}
            x1={0}
            y1={h * y}
            x2={w}
            y2={h * y}
            className="rpm-ecg-grid-line"
            strokeWidth={0.5}
          />
        ))}
        <path d={areaD} fill="url(#rpmEcgFill)" className="opacity-80" />
        <path d={d} fill="none" stroke="currentColor" strokeWidth={1.75} className="rpm-ecg-line" />
        <path
          d={d}
          fill="none"
          stroke="url(#rpmEcgGlow)"
          strokeWidth={2.5}
          className="rpm-ecg-sweep opacity-60"
        />
      </svg>
      {bpm != null && (
        <span
          className="absolute bottom-0.5 left-1.5 flex items-center gap-1 text-[9px] font-black text-emerald-600 rpm-dark:text-emerald-400"
          style={{ animationDuration: pulseSec }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 rpm-heartbeat" />
          {bpm} bpm
        </span>
      )}
    </div>
  );
}
