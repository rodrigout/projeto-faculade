import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Simplified LiDAR point-cloud / surface visualization of a stockpile.
 * Deterministic pseudo-random heightmap driven by seed + fill ratio.
 */
function heightAt(x: number, y: number, seed: number, fill: number) {
  const cx = 0.5 + 0.12 * Math.sin(seed), cy = 0.5 + 0.1 * Math.cos(seed * 1.7);
  const dx = (x - cx) * 2.1, dy = (y - cy) * 3.2;
  const base = Math.exp(-(dx * dx + dy * dy) * 1.6);
  const ridge = 0.18 * Math.exp(-Math.pow((y - cy) * 4, 2)) * (1 - Math.abs(x - 0.5) * 1.4);
  const noise = 0.06 * Math.sin(x * 23 + seed) * Math.cos(y * 17 - seed);
  return Math.max(0, (base + ridge + noise) * fill);
}

function colorFor(h: number) {
  // blue → cyan → green → yellow → red (heat scale)
  const hue = 250 - h * 250;
  return `oklch(${0.55 + h * 0.3} ${0.14 + h * 0.06} ${hue})`;
}

export function PileSurface({ fill, seed, scanning, className, lengthCm = 47.62, widthCm = 17.5, heightCm = 16 }: {
  fill: number; seed: number; scanning?: boolean; className?: string; lengthCm?: number; widthCm?: number; heightCm?: number;
}) {
  const COLS = 40, ROWS = 20;
  const cells = useMemo(() => {
    const out: { x: number; y: number; h: number }[] = [];
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++)
      out.push({ x: i, y: j, h: heightAt(i / COLS, j / ROWS, seed, fill) });
    return out;
  }, [fill, seed]);

  const profile = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const h = heightAt(i / 60, 0.5, seed, fill);
      pts.push(`${(i / 60) * 100},${100 - h * 92}`);
    }
    return `0,100 ${pts.join(" ")} 100,100`;
  }, [fill, seed]);

  return (
    <div className={cn("grid gap-3 lg:grid-cols-[1fr_260px]", className)}>
      <div className={cn("relative overflow-hidden rounded-md border border-border bg-background", scanning && "scan-overlay")}>
        <svg viewBox={`0 0 ${COLS} ${ROWS}`} className="block h-auto w-full" preserveAspectRatio="none">
          <rect width={COLS} height={ROWS} fill="var(--color-surface)" />
          {cells.map((c) => (
            <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={1} height={1}
              fill={c.h < 0.03 ? "var(--color-surface-2)" : colorFor(Math.min(1, c.h))} opacity={c.h < 0.03 ? 1 : 0.92} />
          ))}
          {/* grid lines */}
          {Array.from({ length: COLS / 5 + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 5} x2={i * 5} y1={0} y2={ROWS} stroke="var(--color-border)" strokeWidth={0.05} />
          ))}
          {Array.from({ length: ROWS / 5 + 1 }).map((_, i) => (
            <line key={`h${i}`} x1={0} x2={COLS} y1={i * 5} y2={i * 5} stroke="var(--color-border)" strokeWidth={0.05} />
          ))}
        </svg>
        <div className="pointer-events-none absolute left-3 top-3 eyebrow text-primary">Vista superior · Nuvem de pontos</div>
        <div className="pointer-events-none absolute bottom-3 right-3 metric text-[10px] text-muted-foreground">{lengthCm.toFixed(2)} m × {widthCm.toFixed(2)} m · 2,1 M pts</div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative flex-1 overflow-hidden rounded-md border border-border bg-background p-2">
          <div className="eyebrow mb-1 text-primary">Perfil longitudinal</div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-28 w-full">
            <defs>
              <linearGradient id="pile" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {[25, 50, 75].map((y) => (
              <line key={y} x1={0} x2={100} y1={y} y2={y} stroke="var(--color-border)" strokeWidth={0.4} strokeDasharray="1 1.5" />
            ))}
            <polygon points={profile} fill="url(#pile)" stroke="var(--color-primary)" strokeWidth={0.8} />
          </svg>
          <div className="flex justify-between metric text-[10px] text-muted-foreground">
            <span>0 m</span><span>Altura máx. {(fill * heightCm * 0.9).toFixed(1)} m</span><span>{lengthCm.toFixed(2)} m</span>
          </div>
        </div>
        <div className="rounded-md border border-border bg-background p-2">
          <div className="eyebrow mb-1">Escala de altura</div>
          <div className="h-2 w-full rounded-sm" style={{
            background: "linear-gradient(90deg, oklch(0.55 0.14 250), oklch(0.7 0.16 200), oklch(0.75 0.18 145), oklch(0.85 0.18 95), oklch(0.7 0.2 30))",
          }} />
          <div className="mt-1 flex justify-between metric text-[10px] text-muted-foreground">
            <span>0 m</span><span>{(heightCm / 2).toFixed(0)} m</span><span>{heightCm.toFixed(0)} m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
