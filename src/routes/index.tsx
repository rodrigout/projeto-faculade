import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldAlert, 
  ArrowDownToLine, 
  Truck, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Layers 
} from "lucide-react";
import { AppHeader } from "@/components/scada/Header";
import { BoxCard } from "@/components/scada/BoxCard";
import { STATUS_LABEL, type BoxStatus, type Box } from "@/data/mock";
import { MATERIALS } from "@/data/materials";
import { enrichBoxWithOperation } from "@/data/divergencias";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoluScan — Painel Geral dos 10 Boxes" },
      { name: "description", content: "Monitoramento volumétrico em tempo real dos 10 boxes do terminal de fertilizantes da COPI, Porto do Itaqui." },
      { property: "og:title", content: "VoluScan — Painel Geral dos 10 Boxes" },
      { property: "og:description", content: "Ocupação, material, volume e peso de cada box do terminal, medidos por LiDAR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

const STATUSES = Object.keys(STATUS_LABEL) as BoxStatus[];

type OperationFilter = "TODOS" | "EM_OPERACAO" | "RECEBIMENTO" | "EXPEDICAO" | "ARMAZENADO" | "DISPONIVEL" | "COM_DIVERGENCIA";

function Overview() {
  const [material, setMaterial] = useState("all");
  const [status, setStatus] = useState("all");
  const [opFilter, setOpFilter] = useState<OperationFilter>("TODOS");

  const { data: boxesData = [], isLoading } = useQuery<Box[]>({
    queryKey: ["boxes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/boxes`);
      return res.json();
    }
  });

  // Enriquecer boxes com o status operacional e divergências
  const enrichedBoxes = useMemo(() => {
    return boxesData.map(b => enrichBoxWithOperation(b));
  }, [boxesData]);

  // Contadores operacionais
  const opCounts = useMemo(() => {
    return {
      todos: enrichedBoxes.length,
      em_operacao: enrichedBoxes.filter(b => b.in_operation).length,
      recebimento: enrichedBoxes.filter(b => b.operational_status === "RECEBIMENTO").length,
      expedicao: enrichedBoxes.filter(b => b.operational_status === "EXPEDICAO").length,
      armazenado: enrichedBoxes.filter(b => b.operational_status === "ARMAZENADO").length,
      disponivel: enrichedBoxes.filter(b => b.operational_status === "DISPONIVEL").length,
      com_divergencia: enrichedBoxes.filter(b => b.divergence_flag).length,
    };
  }, [enrichedBoxes]);

  // Filtragem multi-critério
  const filteredBoxes = useMemo(() => {
    return enrichedBoxes.filter((b) => {
      const matchMaterial = material === "all" || b.material_id === material;
      const matchStatus = status === "all" || b.status === status;

      let matchOp = true;
      if (opFilter === "EM_OPERACAO") matchOp = b.in_operation === true;
      else if (opFilter === "RECEBIMENTO") matchOp = b.operational_status === "RECEBIMENTO";
      else if (opFilter === "EXPEDICAO") matchOp = b.operational_status === "EXPEDICAO";
      else if (opFilter === "ARMAZENADO") matchOp = b.operational_status === "ARMAZENADO";
      else if (opFilter === "DISPONIVEL") matchOp = b.operational_status === "DISPONIVEL";
      else if (opFilter === "COM_DIVERGENCIA") matchOp = b.divergence_flag === true;

      return matchMaterial && matchStatus && matchOp;
    });
  }, [enrichedBoxes, material, status, opFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Carregando boxes e sensores do armazém...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        {/* Top Header & Controles Globais */}
        <div className="mb-6 grid grid-cols-1 items-end gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className="eyebrow text-primary">Nível 1 · Painel Geral de Controle & Auditoria Metrológica</div>
            <h1 className="text-3xl font-bold tracking-tight">Armazém COPI · 10 Boxes Fixos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitoramento volumétrico LiDAR 3D e confronto contínuo contra estoques fiscais WMS / balança.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger className="w-full bg-card sm:w-48"><SelectValue placeholder="Material" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os materiais</SelectItem>
                {MATERIALS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="mr-2 inline-block size-2 rounded-sm align-middle" style={{ background: m.color }} />
                    {m.code} — {m.density.toFixed(2)} kg/L
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full bg-card sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Barra de Filtros Segmentados de Operação (adaptada para tablets e desktop) */}
        <div className="mb-6 flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto no-scrollbar flex-nowrap md:flex-wrap py-1">
          <span className="eyebrow text-xs text-muted-foreground mr-1 hidden sm:inline shrink-0">Filtrar Operação:</span>

          <button
            onClick={() => setOpFilter("TODOS")}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border",
              opFilter === "TODOS"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Layers className="size-3.5" />
            <span>Todos</span>
            <span className="rounded-full bg-background/30 px-1 text-[11px] font-bold">{opCounts.todos}</span>
          </button>

          <button
            onClick={() => setOpFilter("EM_OPERACAO")}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border",
              opFilter === "EM_OPERACAO"
                ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                : "bg-card text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
            )}
          >
            <Activity className="size-3.5" />
            <span>Em Operação</span>
            <span className="rounded-full bg-blue-500/20 px-1 text-[11px] font-bold">{opCounts.em_operacao}</span>
          </button>

          <button
            onClick={() => setOpFilter("RECEBIMENTO")}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border",
              opFilter === "RECEBIMENTO"
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <ArrowDownToLine className="size-3.5" />
            <span>Recebimento</span>
            <span className="rounded-full bg-muted px-1 text-[11px] font-bold">{opCounts.recebimento}</span>
          </button>

          <button
            onClick={() => setOpFilter("EXPEDICAO")}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border",
              opFilter === "EXPEDICAO"
                ? "bg-amber-600 text-white border-amber-500"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Truck className="size-3.5" />
            <span>Expedição</span>
            <span className="rounded-full bg-muted px-1 text-[11px] font-bold">{opCounts.expedicao}</span>
          </button>

          <button
            onClick={() => setOpFilter("ARMAZENADO")}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border",
              opFilter === "ARMAZENADO"
                ? "bg-slate-700 text-white border-slate-600"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Package className="size-3.5" />
            <span>Armazenado</span>
            <span className="rounded-full bg-muted px-1 text-[11px] font-bold">{opCounts.armazenado}</span>
          </button>

          <button
            onClick={() => setOpFilter("DISPONIVEL")}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border",
              opFilter === "DISPONIVEL"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <CheckCircle2 className="size-3.5" />
            <span>Disponível</span>
            <span className="rounded-full bg-muted px-1 text-[11px] font-bold">{opCounts.disponivel}</span>
          </button>

          <button
            onClick={() => setOpFilter("COM_DIVERGENCIA")}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border md:ml-auto",
              opFilter === "COM_DIVERGENCIA"
                ? "bg-destructive text-destructive-foreground border-destructive"
                : "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
            )}
          >
            <AlertTriangle className="size-3.5" />
            <span>Com Divergência</span>
            <span className="rounded-full bg-destructive/20 px-1 text-[11px] font-bold">{opCounts.com_divergencia}</span>
          </button>
        </div>

        {/* Grid de Boxes */}
        {filteredBoxes.length === 0 ? (
          <div className="panel p-12 text-center text-muted-foreground">
            Nenhum box corresponde aos filtros selecionados.
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filteredBoxes.map((b) => <BoxCard key={b.id} box={b} />)}
          </div>
        )}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Alertas de ocupação: <span className="text-success">Verde &lt; 75 %</span> · <span className="text-warning">Amarelo 75–90 %</span> · <span className="text-destructive">Vermelho &gt; 90 %</span></span>
          <span className="metric">Auditoria Contínua COPI · Tolerância Padrão ±1,0%</span>
        </footer>
      </main>
    </div>
  );
}
