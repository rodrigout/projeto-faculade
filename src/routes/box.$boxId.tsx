import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Rocket, Radar, Ruler, Database, Plus, AlertTriangle, ShieldAlert } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { AppHeader } from "@/components/scada/Header";
import { StatusBadge } from "@/components/scada/StatusBadge";
import { PileSurface3D } from "@/components/scada/PileSurface3D";
import { fillTone } from "@/components/scada/BoxCard";
import { fmt, type Box, type BoxReading, type BoxDailyHistory, type BoxBatch } from "@/data/mock";
import { MATERIALS, materialById } from "@/data/materials";
import { MOCK_DIVERGENCIAS } from "@/data/divergencias";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/config/api";

export const Route = createFileRoute("/box/$boxId")({
  loader: async ({ params }) => {
    const res = await fetch(`${API_BASE_URL}/api/boxes/${params.boxId}`);
    if (!res.ok) throw notFound();
    const box = await res.json() as Box;
    return { box };
  },
  component: BoxDetail,
});

const Metric = ({ label, value, unit, tone }: { label: string; value: string; unit: string; tone?: string }) => (
  <div className="panel p-4">
    <div className="eyebrow">{label}</div>
    <div className={cn("metric mt-1 text-3xl font-semibold", tone)}>
      {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
    </div>
  </div>
);

function BoxDetail() {
  const { box: initial } = Route.useLoaderData();
  const [box, setBox] = useState<Box>(initial);
  const queryClient = useQueryClient();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(initial.current_batch_id ? String(initial.current_batch_id) : "all");
  const [filterType, setFilterType] = useState("hourly");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBatch, setNewBatch] = useState({ ship_name: "", material_id: "", expected_weight_g: "" });

  const [simulatedVol, setSimulatedVol] = useState<number>(initial.volume_cm3);
  useEffect(() => { 
    if (box) {
      setSimulatedVol(box.volume_cm3); 
    }
  }, [box?.volume_cm3]);

  useEffect(() => {
    let interval: any;
    if (box.lidar_status === "scanning") {
      interval = setInterval(() => {
        fetch(`${API_BASE_URL}/api/boxes/${box.id}`)
          .then(res => res.json())
          .then(newBox => {
             setBox(newBox);
             // When the API syncs that it's online, the button will re-enable!
          });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [box.id, box.lidar_status]);

  const { data: batches = [] } = useQuery<BoxBatch[]>({
    queryKey: ["boxBatches", box.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/boxes/${box.id}/batches`);
      return res.json();
    }
  });

  const { data: historyData = [], isLoading: loadingHistory } = useQuery<any[]>({
    queryKey: ["boxHistory", box.id, selectedBatchId, filterType],
    queryFn: async () => {
      const endpoint = filterType === "hourly" ? "readings" : `daily-history`;
      const params = new URLSearchParams();
      if (selectedBatchId !== "all") params.append("batch_id", selectedBatchId);
      
      const d = new Date();
      if (filterType === "daily") d.setDate(d.getDate() - 30);
      else if (filterType === "weekly") d.setDate(d.getDate() - 84);
      else if (filterType === "monthly") d.setDate(d.getDate() - 365);
      
      if (filterType !== "yearly" && filterType !== "hourly") {
        params.append("start_date", d.toISOString().split("T")[0] || "");
      }

      const res = await fetch(`${API_BASE_URL}/api/boxes/${box.id}/${endpoint}?${params.toString()}`);
      return res.json();
    }
  });

  const { data: pointsData } = useQuery<any>({
    queryKey: ["boxPoints", box.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/boxes/${box.id}/points`);
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: box.lidar_status === "scanning" ? 3000 : 15000,
  });

  const createBatchMutation = useMutation({
    mutationFn: async (batchData: any) => {
      const res = await fetch(`${API_BASE_URL}/api/boxes/${box.id}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchData),
      });
      if (!res.ok) throw new Error("Erro ao criar lote");
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setNewBatch({ ship_name: "", material_id: "", expected_weight_g: "" });
      queryClient.invalidateQueries({ queryKey: ["boxBatches", box.id] });
      queryClient.invalidateQueries({ queryKey: ["boxHistory", box.id] });
      fetch(`${API_BASE_URL}/api/boxes/${box.id}`).then(r => r.json()).then((newBox) => {
         setBox(newBox);
         setSimulatedVol(newBox.volume_cm3);
      });
    }
  });

  const finishBatchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/boxes/${box.id}/batches/current/finish`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erro ao finalizar lote");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boxBatches", box.id] });
      queryClient.invalidateQueries({ queryKey: ["boxHistory", box.id] });
      fetch(`${API_BASE_URL}/api/boxes/${box.id}`).then(r => r.json()).then((newBox) => {
         setBox(newBox);
         setSimulatedVol(newBox.volume_cm3);
      });
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      // Pega config do simulador
      const saved = localStorage.getItem('lidarSimConfig');
      const config = saved ? JSON.parse(saved) : {};
      const boxConfig = config[box.id] || { readVolume: simulatedVol, withdrawnGrams: 0 };
      
      const selectedMat = box.material_id ? materialById(box.material_id) : null;
      const density = selectedMat ? selectedMat.density : 1.0;

      // Se tiver retirada configurada, envia como valor negativo para a balança primeiro
      if (boxConfig.withdrawnGrams > 0) {
        await fetch(`${API_BASE_URL}/api/boxes/${box.id}/add-balanca-weight`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ added_weight: -boxConfig.withdrawnGrams }),
        });
      }

      // Envia a leitura simulada
      const weight = selectedMat ? boxConfig.readVolume * density : 0;
      const res = await fetch(`${API_BASE_URL}/api/boxes/${box.id}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume: boxConfig.readVolume, weight: weight, density: density }),
      });
      if (!res.ok) throw new Error("Erro ao registrar scan simulado");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boxHistory", box.id] });
      fetch(`${API_BASE_URL}/api/boxes/${box.id}`).then(r => r.json()).then((newBox) => {
         setBox(newBox);
         setSimulatedVol(newBox.volume_cm3);
      });
    }
  });

  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [addWeightInput, setAddWeightInput] = useState("");

  const handleVolumeChange = (kgDelta: number) => {
      const selectedMat = box.material_id ? materialById(box.material_id) : null;
      if (!selectedMat) return;
      const volumeDelta = (kgDelta / selectedMat.density) * 1000.0;
      setSimulatedVol(v => Math.max(0, v + volumeDelta));
  };

  const addWeightMutation = useMutation({
    mutationFn: async (kgDelta: number) => {
      const res = await fetch(`${API_BASE_URL}/api/boxes/${box.id}/add-balanca-weight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ added_weight: kgDelta }),
      });
      if (!res.ok) throw new Error("Erro ao registrar peso da balança");
      return res.json();
    },
    onSuccess: (_, kgDelta) => {
      // Atualiza o batch local e re-busca
      queryClient.invalidateQueries({ queryKey: ["boxBatches", box.id] });
      // Atualiza tbm o volume simulado pra já refletir na visualização antes de escanear
      handleVolumeChange(kgDelta);
      setAddMaterialOpen(false);
      setAddWeightInput("");
    }
  });

  const handleAddMaterialSubmit = () => {
      const kgVal = parseFloat(addWeightInput);
      if (!isNaN(kgVal) && kgVal > 0) {
        addWeightMutation.mutate(kgVal);
      }
  };

  const mat = box.material_id ? materialById(box.material_id) : null;
  const pct = (box.capacity_cm3 > 0) ? (box.volume_cm3 / box.capacity_cm3) * 100 : 0;
  const kg = (box.volume_cm3 / 1000.0) * (mat?.density ?? 0);
  const remainM3 = Math.max(0, box.capacity_cm3 - box.volume_cm3);
  const tone = fillTone(pct);
  const toneText = tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-success";
  const lidarColor = box.lidar_status === "erro" ? "text-destructive" : box.lidar_status === "offline" ? "text-warning" : "text-success";
  const activeBatch = batches.find(b => b.id === box.current_batch_id);
  const canFinishBatch = pct < 1;

  const selectedNewMat = MATERIALS.find(m => m.id === newBatch.material_id);
  const typedWeight = parseFloat(newBatch.expected_weight_g) || 0;
  const typedVol = selectedNewMat && typedWeight > 0 ? (typedWeight / selectedNewMat.density) * 1000.0 : 0;
  const isOverflow = typedVol > box.capacity_cm3;
  const isFormValid = newBatch.ship_name.trim() !== "" && newBatch.material_id !== "" && typedWeight > 0 && !isOverflow;

  const handleCreateBatch = () => {
    if (!isFormValid) return;
    createBatchMutation.mutate({
      ...newBatch,
      expected_weight_g: typedWeight || null,
      expected_volume: typedVol || null
    });
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Painel geral
        </Link>

        <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid size-16 place-items-center rounded-md border border-border bg-card font-display text-3xl font-bold" style={{ borderTopColor: mat?.color, borderTopWidth: 3 }}>
              {box.id}
            </div>
            <div className="min-w-0">
              <div className="eyebrow text-primary">Nível 2 · Visão detalhada</div>
              <h1 className="text-3xl font-bold">{box.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge status={box.status} />
                <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", lidarColor)}>
                  <Radar className="size-3.5" /> LiDAR {box.lidar_status}
                </span>
                {mat && (
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span className="size-2.5 rounded-sm" style={{ background: mat.color }} />
                    {mat.code} · {mat.name}
                  </span>
                )}
                {activeBatch && (
                  <span className="inline-flex items-center gap-1 text-sm bg-accent text-accent-foreground px-2 py-0.5 rounded-sm ml-2">
                    Lote Atual: {activeBatch.ship_name || `#${box.current_batch_id}`}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Ruler className="size-3.5 text-primary" /> Dimensões: {box.geometry_length_cm.toFixed(2)} × {box.geometry_width_cm.toFixed(2)} × {box.geometry_height_cm.toFixed(2)} m</span>
                <span className="metric">{fmt(box.capacity_cm3, 2)} cm³ · ~{fmt(box.capacity_cm3 * (mat?.density ?? 1), 2)} g úteis</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeBatch ? (
              <div className="flex flex-col items-end">
                <Button 
                  variant={canFinishBatch ? "default" : "secondary"}
                  className={cn(canFinishBatch ? "bg-primary text-primary-foreground hover:bg-primary/90" : "")}
                  onClick={() => finishBatchMutation.mutate()}
                  disabled={!canFinishBatch || finishBatchMutation.isPending}
                >
                  Finalizar Lote Atual
                </Button>
                {!canFinishBatch && (
                  <span className="text-[10px] text-muted-foreground mt-1 text-right max-w-[200px]">
                    O box deve estar abaixo de 1% de capacidade para finalizar (Atual: {pct.toFixed(2)}%)
                  </span>
                )}
              </div>
            ) : box.status === "ocupado" || pct >= 1 ? (
              <div className="flex flex-col items-end">
                <Button variant="secondary" disabled>Box Ocupado</Button>
                <span className="text-[10px] text-muted-foreground mt-1 text-right max-w-[200px]">
                  O box precisa estar vazio para receber um novo lote.
                </span>
              </div>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="size-4 mr-2" /> Novo Lote (Navio)
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Lote / Navio</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ship_name">Nome do Navio / Lote</Label>
                      <Input id="ship_name" value={newBatch.ship_name} onChange={e => setNewBatch({...newBatch, ship_name: e.target.value})} placeholder="Ex: Affinity Diva" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="material">Produto / Material</Label>
                      <Select value={newBatch.material_id} onValueChange={v => setNewBatch({...newBatch, material_id: v})}>
                        <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                        <SelectContent>
                          {MATERIALS.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              <span className="mr-2 inline-block size-2 rounded-sm" style={{ background: m.color }} />
                              {m.name} ({m.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="weight">Peso Esperado (kg)</Label>
                      <Input id="weight" type="number" step="0.1" value={newBatch.expected_weight_g} onChange={e => setNewBatch({...newBatch, expected_weight_g: e.target.value})} placeholder="Ex: 25.0" />
                      {selectedNewMat && (
                        <div className="text-xs mt-1 space-y-1">
                          <p className="text-muted-foreground">
                            Capacidade máxima p/ este produto: <strong className="text-foreground">{fmt((box.capacity_cm3 / 1000) * selectedNewMat.density, 2)} kg</strong> <span className="opacity-70">({fmt(box.capacity_cm3, 1)} cm³)</span>
                          </p>
                          {typedWeight > 0 && (
                            <p className={cn(isOverflow ? "text-destructive font-semibold" : "text-muted-foreground")}>
                              Volume estimado: {fmt(typedVol, 1)} cm³ {isOverflow && " - Capacidade física excedida!"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateBatch} disabled={createBatchMutation.isPending || !isFormValid}>Salvar Lote</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {(() => {
          const boxDivergencia = MOCK_DIVERGENCIAS.find(d => d.box_id === box.id);
          if (!boxDivergencia) return null;
          const isCritico = boxDivergencia.severidade === "CRITICO_VERMELHO";

          return (
            <div className={cn(
              "mb-4 rounded-lg border p-4 backdrop-blur",
              isCritico ? "border-destructive/40 bg-destructive/10" : "border-warning/40 bg-warning/10"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={cn("grid size-9 shrink-0 place-items-center rounded-md border",
                    isCritico ? "border-destructive/40 bg-destructive/20 text-destructive" : "border-warning/40 bg-warning/20 text-warning")}>
                    <AlertTriangle className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded",
                        isCritico ? "bg-destructive text-white" : "bg-warning text-black")}>
                        {boxDivergencia.status_auditoria.replace(/_/g, " ")}
                      </span>
                      <span className="font-bold text-sm text-foreground">{boxDivergencia.titulo}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{boxDivergencia.descricao}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={cn("metric text-xl font-bold",
                    isCritico ? "text-destructive" : "text-warning")}>
                    {boxDivergencia.dados_confronto.delta_quantidade > 0 ? "+" : ""}{fmt(boxDivergencia.dados_confronto.delta_quantidade, 1)} {boxDivergencia.dados_confronto.unidade}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ({boxDivergencia.dados_confronto.delta_percentual > 0 ? "+" : ""}{boxDivergencia.dados_confronto.delta_percentual.toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
          <Metric label="Volume geométrico" value={fmt(box.volume_cm3, 1)} unit="cm³" tone="text-primary" />
          <Metric label="Densidade do Material" value={(mat?.density ?? 0).toFixed(2)} unit="kg/L" />
          <Metric label="Volume livre" value={fmt(remainM3, 1)} unit="cm³" tone={toneText} />
          <Metric label="Status Físico" value={pct.toFixed(1)} unit="% Ocupado" tone={toneText} />
        </div>

        {activeBatch && (
          <div className="grid gap-3 sm:grid-cols-3 mb-6 p-1 rounded-lg bg-muted/30 border border-border/50">
            <Metric label="Peso Acumulado (Balança)" value={fmt(activeBatch.expected_weight_g || 0, 2)} unit="kg" />
            <Metric label="Peso Medido (Scanner LiDAR)" value={fmt(kg, 2)} unit="kg" tone="text-primary" />
            <Metric 
              label="Divergência (Auditoria)" 
              value={fmt(kg - (activeBatch.expected_weight_g || 0), 2)} 
              unit="kg" 
              tone={Math.abs(kg - (activeBatch.expected_weight_g || 0)) > 2 ? "text-destructive" : "text-success"} 
            />
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          {/* Main Area: Histórico e Conciliação */}
          <div className="flex flex-col gap-6">
            <section className="panel p-4 flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2"><Database className="size-4 text-primary" /><span className="eyebrow text-primary">Auditoria e Conciliação</span></div>
                  <h2 className="text-xl font-semibold">Histórico de Leituras do Lote</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="eyebrow">Visualização:</span>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-40 bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">A cada 1 hora</SelectItem>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="eyebrow">Lote Específico:</span>
                    <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                      <SelectTrigger className="w-56 bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {batches.map(b => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.ship_name} ({new Date(b.start_date).toLocaleDateString()})
                          </SelectItem>
                        ))}
                        <SelectItem value="all">Todos os Lotes (Mix)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-muted-foreground">Carregando histórico...</div>
              ) : historyData.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">Nenhum registro encontrado para este filtro.</div>
              ) : (
                <>
                  <div className="h-72 w-full rounded-md border border-border bg-background p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="colorVolume" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis 
                          dataKey={(d) => filterType === "hourly" ? (d.timestamp ? d.timestamp.substring(11, 16) : "") : d.date} 
                          stroke="var(--color-muted-foreground)" 
                          fontSize={12} 
                          tick={false} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="var(--color-muted-foreground)" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(v) => `${v}`}
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                          labelStyle={{ color: 'var(--color-foreground)', fontWeight: 'bold', marginBottom: '4px' }}
                          formatter={(value: number) => [`${fmt(value)} cm³`, filterType === "hourly" ? "Volume" : "Volume Final"]}
                        />
                        <Area type="monotone" dataKey={filterType === "hourly" ? "volume" : "final_volume"} stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6">
                    <h3 className="mb-3 text-lg font-semibold">
                      Tabela do Lote ({
                        filterType === "hourly" ? "A cada 1 hora" :
                        filterType === "daily" ? "Diário" :
                        filterType === "weekly" ? "Semanal" :
                        filterType === "monthly" ? "Mensal" : "Histórico Completo"
                      })
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>{filterType === "hourly" ? "Data / Hora" : "Data"}</TableHead>
                          <TableHead>Lote / Navio</TableHead>
                          <TableHead>Produto</TableHead>
                          {filterType === "hourly" ? (
                            <>
                              <TableHead className="text-right">Volume</TableHead>
                              <TableHead className="text-right">Peso</TableHead>
                            </>
                          ) : (
                            <>
                              <TableHead className="text-right">Vol. Inicial</TableHead>
                              <TableHead className="text-right">Vol. Final</TableHead>
                              <TableHead className="text-right">Peso Inicial</TableHead>
                              <TableHead className="text-right">Peso Final</TableHead>
                            </>
                          )}
                          {filterType !== "hourly" && <TableHead>Turno</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyData.map((h: any) => {
                          const m = h.material_id ? materialById(h.material_id) : null;
                          const batch = batches.find(b => b.id === h.batch_id);
                          return (
                            <TableRow key={h.id}>
                              <TableCell className="metric font-medium">
                                {filterType === "hourly" 
                                  ? (h.timestamp ? `${h.timestamp.substring(0, 10)} às ${h.timestamp.substring(11, 16)}` : "") 
                                  : h.date}
                              </TableCell>
                              <TableCell className="font-semibold text-primary">
                                {batch ? batch.ship_name : "—"}
                              </TableCell>
                              <TableCell>
                                {m ? (
                                  <><span className="mr-2 inline-block size-2 rounded-sm align-middle" style={{ background: m.color }} />{m.code}</>
                                ) : "—"}
                              </TableCell>
                              {filterType === "hourly" ? (
                                <>
                                  <TableCell className="metric text-right text-primary font-semibold">{fmt(h.volume, 1)} cm³</TableCell>
                                  <TableCell className="metric text-right font-semibold">{fmt(h.weight, 2)} kg</TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell className="metric text-right">{fmt(h.initial_volume, 1)} cm³</TableCell>
                                  <TableCell className="metric text-right text-primary font-semibold">{fmt(h.final_volume, 1)} cm³</TableCell>
                                  <TableCell className="metric text-right">{fmt(h.initial_weight, 2)} kg</TableCell>
                                  <TableCell className="metric text-right font-semibold">{fmt(h.final_weight, 2)} kg</TableCell>
                                </>
                              )}
                              {filterType !== "hourly" && <TableCell className="capitalize">Diurno</TableCell>}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Right Column: Comandos e 3D */}
          <aside className="flex flex-col gap-6">
            <div className="panel p-4">
              <div className="eyebrow text-primary">Painel de ações e controle</div>
              <h2 className="text-xl font-semibold mb-5">Comando Operacional</h2>

              <div className="flex flex-col gap-4">
                {activeBatch && (
                  <Button size="lg" disabled={box.lidar_status !== "online" || scanMutation.isPending} onClick={() => scanMutation.mutate()}
                    className="h-14 w-full bg-primary font-display text-sm font-bold uppercase tracking-wider text-primary-foreground panel-glow hover:bg-primary/90">
                    <Rocket className={cn("size-4 mr-2", box.lidar_status === "scanning" && "animate-pulse")} /> 
                    {box.lidar_status === "scanning" ? "Varredura em andamento..." : "Disparar Varredura Real"}
                  </Button>
                )}
                
                {activeBatch && (
                  <div className="flex flex-col mt-2 pt-4 border-t border-border">
                    <Dialog open={addMaterialOpen} onOpenChange={setAddMaterialOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full h-12 border-primary/30 text-primary hover:bg-primary/10">
                          + Lançar Entrada
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Inserir Material no Box</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <Label>Peso da entrada (kg)</Label>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="Ex: 5.0" 
                            className="mt-2"
                            value={addWeightInput}
                            onChange={(e) => setAddWeightInput(e.target.value)}
                          />
                          {mat && (
                            <div className="text-xs mt-3 space-y-1">
                              <p className="text-muted-foreground">Material atual do lote: <strong>{mat.code}</strong></p>
                              {parseFloat(addWeightInput) > 0 && (
                                (() => {
                                  const addedWeight = parseFloat(addWeightInput) || 0;
                                  const addedVol = (addedWeight / mat.density) * 1000.0;
                                  const projVol = simulatedVol + addedVol;
                                  const isOverflow = projVol > box.capacity_cm3;
                                  return (
                                    <p className={cn("mt-1", isOverflow ? "text-destructive font-semibold" : "text-muted-foreground")}>
                                      Volume projetado: {fmt(projVol, 1)} cm³ / {fmt(box.capacity_cm3, 1)} cm³
                                      {isOverflow && " - Capacidade física excedida!"}
                                    </p>
                                  );
                                })()
                              )}
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddMaterialOpen(false)}>Cancelar</Button>
                          <Button 
                            onClick={handleAddMaterialSubmit}
                            disabled={
                              !parseFloat(addWeightInput) || 
                              parseFloat(addWeightInput) <= 0 || 
                              Boolean(mat && (simulatedVol + ((parseFloat(addWeightInput) / mat.density) * 1000.0)) > box.capacity_cm3)
                            }
                          >
                            Confirmar Acréscimo
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
              {box.id !== "01" && simulatedVol !== box.volume_cm3 && (
                <p className="text-xs text-orange-600 font-semibold animate-in fade-in mt-3">
                  * Escaneamento pendente: Ao clicar em disparar, o LiDAR registrará {fmt(simulatedVol * (mat?.density ?? 0), 2)} g
                </p>
              )}
            </div>

            <div className="panel p-4">
              <PileSurface3D 
                compact 
                fill={pct / 100} 
                seed={Number(box.id) * 1.37} 
                scanning={false} 
                lengthCm={box.geometry_length_cm} 
                widthCm={box.geometry_width_cm} 
                heightCm={box.geometry_height_cm} 
                pointsData={pointsData?.pile_points || []}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
