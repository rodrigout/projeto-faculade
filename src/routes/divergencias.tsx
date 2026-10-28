import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { 
  ArrowLeft, 
  ShieldAlert, 
  AlertTriangle, 
  Scale, 
  ArrowRight, 
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  Building2,
  TableProperties
} from "lucide-react";
import { AppHeader } from "@/components/scada/Header";
import { Button } from "@/components/ui/button";
import { MOCK_DIVERGENCIAS, type DivergenciaAuditoria } from "@/data/divergencias";
import { fmt } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/divergencias")({
  head: () => ({
    meta: [
      { title: "Central de Divergências & Auditoria — VoluScan" },
      { name: "description", content: "Reconciliação em tempo real entre dados declarados no WMS/Balança e medição volumétrica física LiDAR 3D." },
    ],
  }),
  component: DivergenciasPage,
});

function DivergenciasPage() {
  const [filtroSeveridade, setFiltroSeveridade] = useState<string>("TODOS");
  const [expandedId, setExpandedId] = useState<string | null>("DIV-2026-001");

  const totalCriticos = MOCK_DIVERGENCIAS.filter(d => d.severidade === "CRITICO_VERMELHO").length;
  const totalAtencao = MOCK_DIVERGENCIAS.filter(d => d.severidade === "ALERTA_AMARELO").length;

  const divergencias = MOCK_DIVERGENCIAS.filter(d => {
    if (filtroSeveridade === "CRITICO") return d.severidade === "CRITICO_VERMELHO";
    if (filtroSeveridade === "AMARELO") return d.severidade === "ALERTA_AMARELO";
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {/* Topo com Navegação de Retorno */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="size-4" />
              <span>Voltar ao Painel Geral</span>
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
              <ShieldAlert className="size-3.5" />
              Módulo de Reconciliação Contínua
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Validação Oficial com Mentoria COPI
            </span>
          </div>
        </div>

        {/* Título & Descrição do Módulo */}
        <div className="mb-8">
          <div className="eyebrow text-warning font-semibold tracking-wider">
            Auditoria Física vs. Sistêmica · Porto do Itaqui
          </div>
          <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">
            Central de Divergências & Reconciliação
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-3xl">
            Confronto contínuo entre dados alimentados por operadores (WMS, notas fiscais, tickets de balança) 
            e a verdade física apurada pelos sensores LiDAR 3D nos 10 boxes.
          </p>
        </div>

        {/* Quadro de Indicadores Globais de Auditoria */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel p-4 border border-border">
            <div className="eyebrow text-muted-foreground">Total de Casos Auditados</div>
            <div className="metric text-3xl font-bold text-foreground mt-1">
              {MOCK_DIVERGENCIAS.length}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Boxes monitorados continuamente</div>
          </div>

          <div className="panel p-4 border border-destructive/30 bg-destructive/5">
            <div className="eyebrow text-destructive">Críticos / Bloqueio Operacional</div>
            <div className="metric text-3xl font-bold text-destructive mt-1">
              {totalCriticos}
            </div>
            <div className="mt-1 text-xs text-destructive/80">Furos de estoque ou risco de contaminação</div>
          </div>

          <div className="panel p-4 border border-warning/30 bg-warning/5">
            <div className="eyebrow text-warning">Em Análise / Calibração</div>
            <div className="metric text-3xl font-bold text-warning mt-1">
              {totalAtencao}
            </div>
            <div className="mt-1 text-xs text-warning/80">Retenção de esteira ou balança de fluxo</div>
          </div>

          <div className="panel p-4 border border-border">
            <div className="eyebrow text-muted-foreground">Tolerância Padrão COPI</div>
            <div className="metric text-3xl font-bold text-primary mt-1">
              ± 1,0 %
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Margem de acomodação de densidade</div>
          </div>
        </div>

        {/* Barra de Filtros de Severidade */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltroSeveridade("TODOS")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border",
                filtroSeveridade === "TODOS"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
              )}
            >
              Todos ({MOCK_DIVERGENCIAS.length})
            </button>
            <button
              onClick={() => setFiltroSeveridade("CRITICO")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border",
                filtroSeveridade === "CRITICO"
                  ? "bg-destructive text-white border-destructive shadow-sm"
                  : "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
              )}
            >
              Críticos / Bloqueio ({totalCriticos})
            </button>
            <button
              onClick={() => setFiltroSeveridade("AMARELO")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border",
                filtroSeveridade === "AMARELO"
                  ? "bg-warning text-black border-warning font-bold shadow-sm"
                  : "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20"
              )}
            >
              Em Análise ({totalAtencao})
            </button>
          </div>

          <span className="text-xs text-muted-foreground">
            Exibindo <strong>{divergencias.length}</strong> de {MOCK_DIVERGENCIAS.length} divergências
          </span>
        </div>

        {/* Lista de Divergências */}
        <div className="space-y-4 mb-10">
          {divergencias.map((item) => {
            const isExpanded = expandedId === item.id;
            const isCritico = item.severidade === "CRITICO_VERMELHO";

            return (
              <div 
                key={item.id}
                className={cn(
                  "rounded-xl border transition-all duration-200 overflow-hidden shadow-sm",
                  isCritico ? "border-destructive/40 bg-card/95 hover:border-destructive/60" : "border-warning/40 bg-card/95 hover:border-warning/60"
                )}
              >
                {/* Header do Card */}
                <div 
                  className="flex cursor-pointer items-start justify-between gap-4 p-4 sm:p-5 sm:items-center"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold shrink-0",
                      isCritico ? "bg-destructive/20 text-destructive border border-destructive/30" : "bg-warning/20 text-warning border border-warning/30"
                    )}>
                      {isCritico ? <AlertTriangle className="size-3.5" /> : <Scale className="size-3.5" />}
                      {item.status_auditoria.replace(/_/g, " ")}
                    </span>

                    <div>
                      <div className="font-bold text-base sm:text-lg text-foreground">
                        {item.box_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.titulo}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className={cn("metric text-lg sm:text-xl font-bold", isCritico ? "text-destructive" : "text-warning")}>
                        {item.dados_confronto.delta_quantidade > 0 ? "+" : ""}{fmt(item.dados_confronto.delta_quantidade, 1)} {item.dados_confronto.unidade}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        ({item.dados_confronto.delta_percentual > 0 ? "+" : ""}{item.dados_confronto.delta_percentual.toFixed(2)}%)
                      </div>
                    </div>

                    <Button variant="outline" size="icon" className="size-9 rounded-md border-border">
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                  </div>
                </div>

                {/* Detalhes Expansíveis */}
                {isExpanded && (
                  <div className="border-t border-border/60 bg-muted/20 p-5 space-y-5">
                    <p className="text-sm text-foreground/90 font-medium">
                      {item.descricao}
                    </p>

                    {/* Quadro Comparativo Metrológico */}
                    <div>
                      <div className="eyebrow text-xs text-muted-foreground mb-2">Confronto Direto de Dados:</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg bg-card p-3 border border-border">
                          <div className="eyebrow text-xs text-muted-foreground">{item.dados_confronto.origem_declarada}</div>
                          <div className="metric text-lg font-bold text-foreground mt-1">
                            {fmt(item.dados_confronto.sistema_declarado, 1)} <span className="text-xs font-normal text-muted-foreground">{item.dados_confronto.unidade}</span>
                          </div>
                        </div>

                        <div className="rounded-lg bg-card p-3 border border-border">
                          <div className="eyebrow text-xs text-primary">Medição Física (LiDAR 3D)</div>
                          <div className="metric text-lg font-bold text-primary mt-1">
                            {fmt(item.dados_confronto.lidar_medido, 1)} <span className="text-xs font-normal text-muted-foreground">{item.dados_confronto.unidade}</span>
                          </div>
                        </div>

                        <div className={cn("rounded-lg p-3 border", isCritico ? "border-destructive/40 bg-destructive/10" : "border-warning/40 bg-warning/10")}>
                          <div className="eyebrow text-xs">Delta / Divergência</div>
                          <div className={cn("metric text-lg font-bold mt-1", isCritico ? "text-destructive" : "text-warning")}>
                            {item.dados_confronto.delta_quantidade > 0 ? "+" : ""}{fmt(item.dados_confronto.delta_quantidade, 1)} {item.dados_confronto.unidade}
                          </div>
                        </div>

                        <div className="rounded-lg bg-card p-3 border border-border">
                          <div className="eyebrow text-xs text-muted-foreground">Desvio Relativo</div>
                          <div className={cn("metric text-lg font-bold mt-1", isCritico ? "text-destructive" : "text-warning")}>
                            {item.dados_confronto.delta_percentual > 0 ? "+" : ""}{item.dados_confronto.delta_percentual.toFixed(2)} %
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ação Recomendada & Risco */}
                    <div className="rounded-lg bg-card p-4 border border-border text-xs">
                      <div className="font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <span>{item.risco_operacional ? "Risco Operacional & Ação:" : "Ação Recomendada:"}</span>
                      </div>
                      <div className="text-foreground/90 text-sm leading-relaxed">
                        {item.risco_operacional && (
                          <span className="text-destructive font-bold block mb-1">
                            {item.risco_operacional}
                          </span>
                        )}
                        {item.acao_recomendada}
                      </div>
                    </div>

                    {/* Rodapé do Card com Ação Direta */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button asChild size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link to="/box/$boxId" params={{ boxId: item.box_id }}>
                          <span>Abrir Gêmeo 3D do {item.box_name.split("—")[0]?.trim() ?? item.box_name}</span>
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tabela de Rastreabilidade & Auditoria (Aba 2 / Especificação COPI) */}
        <section className="panel p-6 border border-border mt-8">
          <div className="mb-4 flex items-center gap-2">
            <TableProperties className="size-5 text-primary" />
            <h2 className="text-xl font-bold">Tabela Estruturada de Rastreabilidade & Auditoria</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Espelho contábil e pericial das leituras volumétricas cruzadas contra o sistema de gestão portuária.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border uppercase">
                <tr>
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Lote / Origem</th>
                  <th className="p-3">Produto</th>
                  <th className="p-3 text-right">Sistêmico (WMS)</th>
                  <th className="p-3 text-right">Físico (LiDAR 3D)</th>
                  <th className="p-3 text-right">Divergência (Delta)</th>
                  <th className="p-3 text-center">Status Auditoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_DIVERGENCIAS.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">27/09 às 13:00</td>
                    <td className="p-3 font-semibold text-primary">{d.box_name}</td>
                    <td className="p-3 text-muted-foreground">{d.titulo.split(":")[0]}</td>
                    <td className="p-3 text-right font-semibold">{fmt(d.dados_confronto.sistema_declarado, 1)} {d.dados_confronto.unidade}</td>
                    <td className="p-3 text-right font-semibold text-primary">{fmt(d.dados_confronto.lidar_medido, 1)} {d.dados_confronto.unidade}</td>
                    <td className={cn("p-3 text-right font-bold", d.severidade === "CRITICO_VERMELHO" ? "text-destructive" : "text-warning")}>
                      {d.dados_confronto.delta_percentual > 0 ? "+" : ""}{d.dados_confronto.delta_percentual.toFixed(2)}% ({fmt(d.dados_confronto.delta_quantidade, 1)} {d.dados_confronto.unidade})
                    </td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        "inline-block rounded px-2 py-0.5 text-[10px] font-bold",
                        d.severidade === "CRITICO_VERMELHO" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                      )}>
                        {d.status_auditoria.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
