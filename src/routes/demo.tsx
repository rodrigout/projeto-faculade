import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/scada/Header";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type Box, boxFill } from "@/data/mock";
import { materialById } from "@/data/materials";
import { PileSurface3D } from "@/components/scada/PileSurface3D";
import { API_BASE_URL } from "@/config/api";

export const Route = createFileRoute("/demo")({
  component: DemoMode,
});

function DemoMode() {
  const queryClient = useQueryClient();
  const [demoState, setDemoState] = useState<"IDLE" | "RUNNING" | "PAUSED">("IDLE");
  const [cycleCount, setCycleCount] = useState(0);
  const [countdown, setCountdown] = useState(0);

  // Consider Box 01 for the demo (since it represents the physical bench scanner)
  const boxId = "01";

  const { data: box } = useQuery<Box>({
    queryKey: ["box", boxId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/boxes/${boxId}`);
      if (!res.ok) throw new Error("Erro ao carregar");
      return res.json();
    },
    // Poll frequently while demo is active or while scanning to detect when 360 rotation finishes
    refetchInterval: (query) =>
      demoState === "RUNNING" || query.state.data?.lidar_status === "scanning" ? 1000 : 5000,
  });

  const isScanning = box?.lidar_status === "scanning";

  const { data: pointsData } = useQuery<any>({
    queryKey: ["boxPoints", boxId],
    queryFn: async () => {
      // First try /api/scanner/points
      try {
        const res = await fetch(`${API_BASE_URL}/api/scanner/points`);
        if (res.ok) return res.json();
      } catch {
        // Fallback
      }
      const res2 = await fetch(`${API_BASE_URL}/api/boxes/${boxId}/points`);
      if (!res2.ok) return null;
      return res2.json();
    },
    refetchInterval: () => (demoState === "RUNNING" || isScanning ? 2000 : 15000),
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      if (!box) return;
      const selectedMat = box.material_id ? materialById(box.material_id) : null;
      const density = selectedMat ? selectedMat.density : 1.0;
      const simVol = box.volume_cm3;

      const res = await fetch(`${API_BASE_URL}/api/boxes/${box.id}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume: simVol, weight: (simVol / 1000.0) * density, density }),
      });
      if (!res.ok) throw new Error("Erro ao registrar scan");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["box", boxId] });
      if (data?.status === "scanning") {
        toast.info("Giro de 360° iniciado no LiDAR da bancada.");
      }
    },
    onError: (err: any) => {
      toast.error(`Falha ao disparar varredura: ${err?.message || "Erro de conexão"}`);
    },
  });

  const computeVolumeMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch("http://pc-optiplex-3000.tail78ad2d.ts.net:8007/api/volume/compute", {
          method: "POST",
        });
        if (res.ok) return res.json();
      } catch {
        // Fallback to backend proxy
      }
      const proxyRes = await fetch(`${API_BASE_URL}/api/volume/compute`, { method: "POST" });
      if (!proxyRes.ok) throw new Error("Erro ao computar volume");
      return proxyRes.json();
    },
    onSuccess: (data) => {
      if (data && data.ok) {
        queryClient.setQueryData(["boxPoints", boxId], data);
      }
      queryClient.invalidateQueries({ queryKey: ["boxPoints", boxId] });
      queryClient.invalidateQueries({ queryKey: ["box", boxId] });
    },
  });

  // Track transitions from 'scanning' -> 'online' so the rotation completes fully
  const prevLidarStatusRef = useRef<string | undefined>(box?.lidar_status);

  // Computa automaticamente o volume ao carregar a página
  useEffect(() => {
    computeVolumeMutation.mutate();
  }, []);

  useEffect(() => {
    const prev = prevLidarStatusRef.current;
    const current = box?.lidar_status;
    prevLidarStatusRef.current = current;

    if (prev === "scanning" && current === "online") {
      // Hardware just finished the full 360 degree rotation!
      // Dispara automaticamente o POST em /api/volume/compute para atualizar os valores atuais
      computeVolumeMutation.mutate();
      queryClient.invalidateQueries({ queryKey: ["boxHistory", boxId] });
      queryClient.invalidateQueries({ queryKey: ["boxBatches", boxId] });
      setCycleCount((c) => c + 1);
      toast.success("Volta completa de 360° concluída e volume recalculado!");

      if (demoState === "RUNNING") {
        // Wait 8 seconds before triggering the next cycle
        setCountdown(8);
      }
    }
  }, [box?.lidar_status, demoState, queryClient]);

  // Demo Countdown Logic: Only counts down when resting between scans, NEVER interrupts active scanning
  useEffect(() => {
    if (demoState !== "RUNNING") {
      setCountdown(0);
      return;
    }

    if (isScanning || scanMutation.isPending) {
      setCountdown(0);
      return;
    }

    if (countdown <= 0) return;

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          scanMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [demoState, isScanning, scanMutation.isPending, countdown]);

  const startDemo = () => {
    if (!box) {
      toast.error("O box 01 precisa estar carregado e ativo.");
      return;
    }
    setDemoState("RUNNING");
    toast.success("Modo Demonstração Iniciado");

    // If not already in the middle of scanning, initiate scan immediately
    if (box.lidar_status !== "scanning" && !scanMutation.isPending) {
      scanMutation.mutate();
    }
  };

  const pauseDemo = () => {
    setDemoState("PAUSED");
    setCountdown(0);
    toast("Modo Demonstração Pausado");
  };

  const stopDemo = () => {
    setDemoState("IDLE");
    setCountdown(0);
    setCycleCount(0);
    toast("Modo Demonstração Encerrado");
  };

  // Values from api/scanner/points with requested default references
  const volumeM3 = pointsData?.volume_m3 != null ? Number(pointsData.volume_m3) : 0.001800;
  const volumeLiters = pointsData?.volume_liters != null ? Number(pointsData.volume_liters) : 1.800;
  const massKg = pointsData?.estimated_mass_kg != null ? Number(pointsData.estimated_mass_kg) : 1.800;
  const nominalMassKg = pointsData?.nominal_mass_kg != null ? Number(pointsData.nominal_mass_kg) : 1.600;
  const accuracyPct = pointsData?.accuracy_pct != null ? Number(pointsData.accuracy_pct) : 87.5;
  const errorPct = pointsData?.error_pct != null ? Number(pointsData.error_pct) : 12.5;
  const maxHeight = pointsData?.max_height_cm != null ? pointsData.max_height_cm : 7;
  const widthX = pointsData?.dimensions?.width_x_cm != null ? pointsData.dimensions.width_x_cm : 20.5;
  const depthY = pointsData?.dimensions?.depth_y_cm != null ? pointsData.dimensions.depth_y_cm : 33.2;
  const area = pointsData?.dimensions?.area_cm2 != null ? pointsData.dimensions.area_cm2 : 846;
  const numPilePoints = pointsData?.num_pile_points != null ? pointsData.num_pile_points : 2599;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Top Compact Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border/80 rounded-xl p-4 sm:px-6 shadow-sm">
          {/* Title & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Activity className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">Modo Demonstração</h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Hackathon
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Varredura 360° contínua na bancada com cálculo de cubagem em tempo real
              </p>
            </div>
          </div>

          {/* Status & Controls */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Status Badge */}
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
                isScanning
                  ? "bg-primary/20 text-primary border-primary/40 animate-pulse"
                  : demoState === "RUNNING"
                  ? "bg-success/20 text-success border-success/30"
                  : demoState === "PAUSED"
                  ? "bg-warning/20 text-warning border-warning/30"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="size-3 animate-spin" />
                  <span>VARRENDO 360°</span>
                </>
              ) : demoState === "RUNNING" ? (
                <>
                  <span className="size-2 rounded-full bg-success animate-pulse" />
                  <span>EXECUTANDO</span>
                </>
              ) : demoState === "PAUSED" ? (
                <span>PAUSADO</span>
              ) : (
                <span>INATIVO</span>
              )}
            </div>

            {demoState !== "IDLE" && (
              <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                Ciclo #{cycleCount}
              </div>
            )}

            {/* Countdown / Scanning indicator */}
            {isScanning ? (
              <div className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20 flex items-center gap-1.5">
                <span>Giro 360° em andamento...</span>
              </div>
            ) : demoState === "RUNNING" && countdown > 0 ? (
              <div className="text-xs font-medium text-foreground bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10 flex items-center gap-1.5 font-mono">
                <RefreshCw className="size-3 text-primary animate-spin" />
                <span>Próxima em {countdown}s</span>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {demoState !== "RUNNING" ? (
                <Button
                  onClick={startDemo}
                  size="sm"
                  className="h-8 px-3.5 text-xs font-bold bg-success hover:bg-success/90 text-white"
                >
                  <Play className="size-3.5 mr-1.5" /> Iniciar Demo
                </Button>
              ) : (
                <Button
                  onClick={pauseDemo}
                  size="sm"
                  variant="outline"
                  className="h-8 px-3.5 text-xs font-bold border-warning text-warning hover:bg-warning/10"
                >
                  <Pause className="size-3.5 mr-1.5" /> Pausar
                </Button>
              )}

              <Button
                onClick={stopDemo}
                disabled={demoState === "IDLE"}
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs font-bold border-destructive text-destructive hover:bg-destructive/10"
              >
                <Square className="size-3.5 mr-1" /> Parar
              </Button>
            </div>
          </div>
        </div>

        {/* Side-by-Side Main Section: Left = Cubage & Status, Right = 3D Digital Twin */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch flex-1">
          {/* Left Column: Resultado da Cubagem + Box Status (md:col-span-6) */}
          <div className="md:col-span-6 flex flex-col gap-4">
            {/* Resultado da Cubagem (Argila Esmectita) */}
            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60 mb-4">
                  <div>
                    <div className="eyebrow text-primary mb-0.5 text-xs">Métricas de Medição</div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                      Resultado da Cubagem (Argila Esmectita)
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => computeVolumeMutation.mutate()}
                      disabled={computeVolumeMutation.isPending}
                      className="h-7 text-xs font-mono px-2.5"
                    >
                      <RefreshCw
                        className={cn("size-3 mr-1.5", computeVolumeMutation.isPending && "animate-spin")}
                      />
                      {computeVolumeMutation.isPending ? "Computando..." : "Recalcular Volume"}
                    </Button>
                  </div>
                </div>

                {/* 2x2 Grid of Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* Volume em Metros Cúbicos */}
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-3.5">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block mb-1">
                      Volume em Metros Cúbicos:
                    </span>
                    <div className="text-xl sm:text-2xl font-bold text-foreground font-mono">
                      {volumeM3.toFixed(6)} m³
                    </div>
                  </div>

                  {/* Volume em Litros */}
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-3.5">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block mb-1">
                      Volume em Litros:
                    </span>
                    <div className="text-xl sm:text-2xl font-bold text-foreground font-mono">
                      {volumeLiters.toFixed(3)} L
                    </div>
                  </div>

                  {/* Massa Calculada */}
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-3.5">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block mb-1">
                      Massa Calculada:
                    </span>
                    <div className="text-xl sm:text-2xl font-bold text-primary font-mono">
                      {massKg.toFixed(3)} kg
                    </div>
                  </div>

                  {/* Acurácia vs Nominal */}
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-3.5">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block mb-1">
                      Acurácia vs {nominalMassKg.toFixed(3)} kg:
                    </span>
                    <div className="text-xl sm:text-2xl font-bold text-success font-mono">
                      {accuracyPct.toFixed(1)}%{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (Erro {errorPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linha de dimensões e pontos do monte */}
              <div className="bg-muted/20 border border-border/40 rounded-lg px-3.5 py-2.5 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2 font-mono mt-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>
                    <strong className="text-foreground">Altura Máx:</strong> {maxHeight} cm
                  </span>
                  <span className="text-border">|</span>
                  <span>
                    <strong className="text-foreground">Base:</strong> {widthX}×{depthY} cm ({area} cm²)
                  </span>
                  <span className="text-border">|</span>
                  <span>
                    <strong className="text-foreground">Pontos do Monte:</strong>{" "}
                    <span className="text-foreground font-semibold">{numPilePoints}</span>
                  </span>
                </div>
                {pointsData?.diff_kg != null && (
                  <div className="text-[11px] text-muted-foreground">
                    Diferença: {pointsData.diff_kg > 0 ? `+${pointsData.diff_kg.toFixed(3)}` : pointsData.diff_kg.toFixed(3)} kg
                  </div>
                )}
              </div>
            </div>

            {/* Box & Sensor Status Cards */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-card p-3.5 rounded-xl border border-border/80 shadow-sm">
                <div className="eyebrow mb-1 text-xs">Box Alvo</div>
                <div className="font-semibold text-base">{box?.name || "BOX 01"}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Status: {box?.status || "—"}</div>
              </div>
              <div className="bg-card p-3.5 rounded-xl border border-border/80 shadow-sm">
                <div className="eyebrow mb-1 text-xs">Status do Sensor</div>
                <div
                  className={cn(
                    "font-semibold text-base",
                    box?.lidar_status === "online"
                      ? "text-success"
                      : box?.lidar_status === "scanning"
                      ? "text-primary animate-pulse"
                      : "text-muted-foreground"
                  )}
                >
                  {box?.lidar_status === "online"
                    ? "Online / Pronto"
                    : box?.lidar_status === "scanning"
                    ? "Varrendo 360°..."
                    : "Offline"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">LiDAR de bancada conectado</div>
              </div>
            </div>
          </div>

          {/* Right Column: Gêmeo Digital 3D (Ao Vivo) (md:col-span-6) */}
          <div className="md:col-span-6 flex flex-col">
            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                <div>
                  <div className="eyebrow text-primary mb-0.5 text-xs">Visualização Espacial</div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    Gêmeo Digital 3D (Ao Vivo)
                  </h2>
                </div>
                <div className="text-xs px-2.5 py-1 rounded bg-primary/10 text-primary font-mono border border-primary/20">
                  {numPilePoints} pontos
                </div>
              </div>

              <div className="flex-1 min-h-[380px] md:min-h-[440px] flex flex-col">
                {box ? (
                  <PileSurface3D
                    fill={boxFill(box) / 100}
                    seed={Number(box.id) * 1.37}
                    scanning={demoState === "RUNNING" || isScanning}
                    lengthCm={box.geometry_length_cm}
                    widthCm={box.geometry_width_cm}
                    heightCm={box.geometry_height_cm}
                    pointsData={pointsData?.pile_points || []}
                    compact={true}
                    className="flex-1 w-full"
                  />
                ) : (
                  <div className="grid flex-1 place-items-center text-muted-foreground text-sm">
                    Carregando modelo 3D...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
