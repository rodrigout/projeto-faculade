import { Link } from "@tanstack/react-router";
import { ArrowRight, Radar, Truck, ArrowDownToLine, AlertTriangle } from "lucide-react";
import { type Box, boxFill, boxKg, fmt } from "@/data/mock";
import { materialById } from "@/data/materials";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

export function fillTone(pct: number) {
  return pct > 90 ? "destructive" : pct >= 75 ? "warning" : "success";
}

export function BoxCard({ box }: { box: Box }) {
  const pct = boxFill(box);
  const tone = fillTone(pct);
  const mat = box.material_id ? materialById(box.material_id) : null;
  const lidarColor = box.lidar_status === "erro" ? "text-destructive" : box.lidar_status === "offline" ? "text-warning" : "text-success";

  return (
    <Link
      to="/box/$boxId"
      params={{ boxId: box.id }}
      className={cn(
        "panel group relative flex flex-col gap-3.5 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:panel-glow",
        box.divergence_flag && "border-destructive/40 shadow-destructive/5"
      )}
    >
      {mat && <span className="absolute inset-x-0 top-0 h-0.5 rounded-t-lg" style={{ background: mat.color }} />}

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-2xl font-bold tracking-wide">{box.name}</div>
          <div className={cn("eyebrow flex items-center gap-1", lidarColor)}>
            <Radar className="size-3" /> LiDAR {box.lidar_status}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={box.status} />
          {box.operational_status === "RECEBIMENTO" ? (
            <span className="inline-flex items-center gap-1 rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
              <ArrowDownToLine className="size-2.5" /> RECEBIMENTO
            </span>
          ) : box.operational_status === "EXPEDICAO" ? (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
              <Truck className="size-2.5" /> EXPEDIÇÃO
            </span>
          ) : box.operational_status === "ARMAZENADO" ? (
            <span className="inline-flex items-center gap-1 rounded bg-slate-500/15 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-500/30">
              ARMAZENADO
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
              DISPONÍVEL
            </span>
          )}
        </div>
      </div>

      {box.divergence_flag && (
        <div className="flex items-center gap-1.5 rounded-md bg-destructive/15 px-2 py-1 text-[11px] font-bold text-destructive border border-destructive/30 animate-pulse">
          <AlertTriangle className="size-3 shrink-0" />
          <span>DIVERGÊNCIA IDENTIFICADA</span>
        </div>
      )}

      {box.active_operation_desc && (
        <div className="rounded bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground truncate border border-border/40">
          <span className="font-semibold text-foreground/80">{box.active_operation_desc}</span>
          {box.shift_operator && <span className="block text-[10px] opacity-75">{box.shift_operator}</span>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="size-3 rounded-sm" style={{ background: mat?.color ?? "var(--color-muted)" }} />
        <span className="font-semibold">{mat ? mat.code : "— sem material —"}</span>
        {mat && <span className="truncate text-xs text-muted-foreground">{mat.name}</span>}
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="eyebrow">Ocupação</span>
          <span className={cn("metric text-lg font-semibold",
            tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-success")}>
            {fmt(pct, 1)} %
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-sm bg-muted">
          <div className={cn("h-full rounded-sm transition-all",
            tone === "destructive" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-success")}
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-background/60 p-2">
          <div className="eyebrow">Volume (LiDAR)</div>
          <div className="metric text-base font-semibold">{fmt(box.volume_cm3)} <span className="text-xs text-muted-foreground">cm³</span></div>
        </div>
        <div className="rounded-md bg-background/60 p-2">
          <div className="eyebrow">Peso (LiDAR)</div>
          <div className="metric text-base font-semibold">{fmt(boxKg(box), 2)} <span className="text-xs text-muted-foreground">kg</span></div>
        </div>
        <div className="col-span-2 rounded-md bg-background/60 p-2 border border-blue-500/20">
          <div className="eyebrow text-blue-400">Peso de Entrada (Balança)</div>
          <div className="metric text-base font-semibold text-blue-400">{fmt(box.input_weight_g, 2)} <span className="text-xs opacity-70">kg</span></div>
        </div>
      </div>

      {mat ? (
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 font-display text-sm font-semibold uppercase tracking-wider text-primary">
          Ver detalhes do box
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </div>
      ) : (
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 font-display text-sm font-semibold uppercase tracking-wider text-blue-500 hover:text-blue-400">
          + Alocar Lote
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </div>
      )}
    </Link>
  );
}
