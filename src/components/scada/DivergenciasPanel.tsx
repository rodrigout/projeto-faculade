import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  Scale, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Truck,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { MOCK_DIVERGENCIAS, type DivergenciaAuditoria } from "@/data/divergencias";
import { fmt } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DivergenciasPanel({ 
  onSelectBox 
}: { 
  onSelectBox?: (boxId: string) => void 
}) {
  const [expandedId, setExpandedId] = useState<string | null>("DIV-2026-001");
  const [filtroSeveridade, setFiltroSeveridade] = useState<string>("TODOS");

  const divergencias = MOCK_DIVERGENCIAS.filter(d => {
    if (filtroSeveridade === "CRITICO") return d.severidade === "CRITICO_VERMELHO";
    if (filtroSeveridade === "AMARELO") return d.severidade === "ALERTA_AMARELO";
    return true;
  });

  const totalCriticos = MOCK_DIVERGENCIAS.filter(d => d.severidade === "CRITICO_VERMELHO").length;
  const totalAtencao = MOCK_DIVERGENCIAS.filter(d => d.severidade === "ALERTA_AMARELO").length;

  return (
    <div className="panel mb-6 border-warning/30 bg-card/60 p-4 sm:p-6 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-warning/20 text-warning">
              <ShieldAlert className="size-4" />
            </span>
            <span className="eyebrow text-warning font-semibold tracking-wider">
              Auditoria em Tempo Real · Mentoria Operacional COPI
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            Central de Reconciliação Física vs. Sistêmica
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Confronto contínuo entre dados declarados (WMS / Balança / Painel) e a cubagem 3D dos sensores LiDAR.
          </p>
        </div>

        {/* Resumo de Contadores */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive">
            <AlertTriangle className="size-3.5" />
            <span>{totalCriticos} Críticos / Bloqueio</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">
            <Scale className="size-3.5" />
            <span>{totalAtencao} Em Análise</span>
          </div>
        </div>
      </div>

      {/* Grid de Casos de Divergência */}
      <div className="mt-4 grid gap-3">
        {divergencias.map((item) => {
          const isExpanded = expandedId === item.id;
          const isCritico = item.severidade === "CRITICO_VERMELHO";

          return (
            <div 
              key={item.id}
              className={cn(
                "rounded-lg border transition-all duration-200 overflow-hidden",
                isCritico ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50" : "border-warning/30 bg-warning/5 hover:border-warning/50"
              )}
            >
              {/* Header do Card */}
              <div 
                className="flex cursor-pointer items-start justify-between gap-3 p-3.5 sm:items-center"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold shrink-0",
                    isCritico ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                  )}>
                    {isCritico ? <AlertTriangle className="size-3" /> : <Scale className="size-3" />}
                    {item.status_auditoria.replace(/_/g, " ")}
                  </span>

                  <span className="font-semibold text-sm sm:text-base text-foreground">
                    {item.box_name}
                  </span>

                  <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-[400px]">
                    · {item.titulo}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className={cn("metric text-sm sm:text-base font-bold", isCritico ? "text-destructive" : "text-warning")}>
                      {item.dados_confronto.delta_quantidade > 0 ? "+" : ""}{fmt(item.dados_confronto.delta_quantidade, 1)} {item.dados_confronto.unidade}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      ({item.dados_confronto.delta_percentual > 0 ? "+" : ""}{item.dados_confronto.delta_percentual.toFixed(2)}%)
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" className="size-8 p-0 text-muted-foreground">
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </Button>
                </div>
              </div>

              {/* Detalhes Expansíveis */}
              {isExpanded && (
                <div className="border-t border-border/50 bg-background/50 p-4 space-y-4">
                  <p className="text-sm text-foreground/90 font-medium">
                    {item.descricao}
                  </p>

                  {/* Quadro Comparativo Metrológico */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div className="rounded-md bg-card p-2.5 border border-border">
                      <div className="eyebrow text-xs text-muted-foreground">{item.dados_confronto.origem_declarada}</div>
                      <div className="metric text-base font-bold text-foreground mt-0.5">
                        {fmt(item.dados_confronto.sistema_declarado, 1)} <span className="text-xs font-normal text-muted-foreground">{item.dados_confronto.unidade}</span>
                      </div>
                    </div>

                    <div className="rounded-md bg-card p-2.5 border border-border">
                      <div className="eyebrow text-xs text-primary">Medição Física (LiDAR 3D)</div>
                      <div className="metric text-base font-bold text-primary mt-0.5">
                        {fmt(item.dados_confronto.lidar_medido, 1)} <span className="text-xs font-normal text-muted-foreground">{item.dados_confronto.unidade}</span>
                      </div>
                    </div>

                    <div className={cn("rounded-md p-2.5 border", isCritico ? "border-destructive/40 bg-destructive/10" : "border-warning/40 bg-warning/10")}>
                      <div className="eyebrow text-xs">Divergência / Desvio</div>
                      <div className={cn("metric text-base font-bold mt-0.5", isCritico ? "text-destructive" : "text-warning")}>
                        {item.dados_confronto.delta_quantidade > 0 ? "+" : ""}{fmt(item.dados_confronto.delta_quantidade, 1)} {item.dados_confronto.unidade}
                      </div>
                    </div>

                    <div className="rounded-md bg-card p-2.5 border border-border">
                      <div className="eyebrow text-xs text-muted-foreground">Desvio Percentual</div>
                      <div className={cn("metric text-base font-bold mt-0.5", isCritico ? "text-destructive" : "text-warning")}>
                        {item.dados_confronto.delta_percentual > 0 ? "+" : ""}{item.dados_confronto.delta_percentual.toFixed(2)} %
                      </div>
                    </div>
                  </div>

                  {/* Ação Recomendada & Risco */}
                  <div className="rounded-md bg-muted/40 p-3 border border-border/40 text-xs">
                    <div className="font-semibold text-muted-foreground mb-1">
                      {item.risco_operacional ? "Risco Operacional & Ação:" : "Ação Recomendada:"}
                    </div>
                    <div className="text-foreground/90 font-medium">
                      {item.risco_operacional && <span className="text-destructive font-bold block mb-0.5">{item.risco_operacional}</span>}
                      {item.acao_recomendada}
                    </div>
                  </div>

                  {/* Rodapé do Card com Ação Direta */}
                  <div className="flex items-center justify-end gap-3 pt-1">
                    <Link
                      to="/box/$boxId"
                      params={{ boxId: item.box_id }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      Abrir Gêmeo 3D e Auditoria do {item.box_name.split("—")[0]?.trim() ?? item.box_name}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
