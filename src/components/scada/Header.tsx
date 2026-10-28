import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Radar, Truck, TrainFront, Gauge, Tablet, ShieldAlert, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { type Box, boxKg, fmt } from "@/data/mock";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/config/api";

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now ? now.toLocaleTimeString("pt-BR", { hour12: false }) : "--:--:--";
  const date = now
    ? now.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    : "";
  return (
    <div className="text-right">
      <div className="metric text-2xl font-semibold leading-none text-primary">{time}</div>
      <div className="eyebrow mt-1 capitalize">{date} · Itaqui (UTC-3)</div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Radar; label: string; value: string; sub?: string; tone?: "primary" | "success" | "warning";
}) {
  return (
    <div className="flex items-center gap-3 border-l border-border pl-4 first:border-0 first:pl-0">
      <div className={cn("grid size-9 place-items-center rounded-md border",
        tone === "success" ? "border-success/40 bg-success/10 text-success"
        : tone === "warning" ? "border-warning/40 bg-warning/10 text-warning"
        : "border-primary/40 bg-primary/10 text-primary")}>
        <Icon className="size-4" />
      </div>
      <div>
        <div className="eyebrow">{label}</div>
        <div className="metric text-lg font-semibold leading-tight">
          {value} {sub && <span className="text-xs font-normal text-muted-foreground">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

export function AppHeader() {
  const { data: boxes = [] } = useQuery<Box[]>({
    queryKey: ["boxes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/boxes`);
      return res.json();
    }
  });

  const totalCap = boxes.reduce((a, b) => a + b.capacity_cm3, 0);
  const totalVol = boxes.reduce((a, b) => a + b.volume_cm3, 0);
  const totalKg = boxes.reduce((a, b) => a + boxKg(b), 0);
  const offline = boxes.filter((b) => b.lidar_status === "offline").length;
  const error = boxes.filter((b) => b.lidar_status === "erro").length;
  
  const lidarText = error > 0 ? `Erro em ${error} sensor(es)` : offline > 0 ? `Offline em ${offline}` : "Todos Online";
  const lidarTone = error > 0 ? "warning" : offline > 0 ? "warning" : "success";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 shadow-sm backdrop-blur">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:flex-wrap sm:justify-between sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground panel-glow">
            <Radar className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-xl font-bold leading-none tracking-wide">VoluScan</div>
            <div className="eyebrow mt-1 hidden truncate sm:block">Terminal de Fertilizantes · Porto do Itaqui</div>
          </div>
        </Link>

        {/* Navegação Rápida adaptada para Tablets e Desktop */}
        <nav aria-label="Navegação Principal" className="order-3 flex w-full flex-wrap items-center justify-start gap-2 pt-2 sm:pt-0 sm:w-auto md:order-2">
          <Link 
            to="/demo" 
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:text-primary transition-colors border border-primary/40 px-2.5 sm:px-3 py-1.5 rounded-md bg-primary/10 text-primary"
          >
            <Activity className="size-3.5 sm:size-4" />
            <span>Modo Demo</span>
          </Link>
          <Link 
            to="/divergencias" 
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:text-warning transition-colors border border-warning/30 px-2.5 sm:px-3 py-1.5 rounded-md bg-warning/10 text-warning"
          >
            <ShieldAlert className="size-3.5 sm:size-4" />
            <span>Divergências</span>
            <span className="rounded-full bg-warning/20 px-1.5 py-0.2 text-[10px] sm:text-xs font-bold text-warning border border-warning/30">4</span>
          </Link>
          <Link 
            to="/cabine" 
            className="text-xs sm:text-sm font-medium hover:text-primary transition-colors border border-border px-2.5 sm:px-3 py-1.5 rounded-md bg-secondary/20"
          >
            Cabine
          </Link>
          <Link 
            to="/simulador" 
            className="text-xs sm:text-sm font-medium hover:text-primary transition-colors border border-border px-2.5 sm:px-3 py-1.5 rounded-md bg-secondary/20"
          >
            Simulador
          </Link>
        </nav>

        {/* KPIs Globais em telas maiores */}
        <div className="hidden xl:flex items-center gap-4 md:order-3">
          <Kpi icon={Gauge} label="Capacidade utilizada" value={`${fmt((totalVol / totalCap) * 100, 1)} %`} sub={`${fmt(totalKg, 2)} kg`} />
          <Kpi icon={Radar} label="Sensores LiDAR" value={lidarText} tone={lidarTone} />
        </div>

        <div className="flex shrink-0 items-center gap-3 md:order-4">
          <div className="hidden 2xl:block"><Clock /></div>
        </div>
      </div>
    </header>
  );
}
