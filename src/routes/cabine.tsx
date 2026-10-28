import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Gauge, Loader2, Play, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { type Box, fmt } from "@/data/mock";
import { materialById } from "@/data/materials";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/config/api";

export const Route = createFileRoute("/cabine")({
  head: () => ({
    meta: [
      { title: "Registro de Carregamento — VoluScan" },
    ],
  }),
  component: CabinMode,
});

function CabinMode() {
  const { data: boxes = [], isLoading, refetch } = useQuery<Box[]>({
    queryKey: ["boxes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/boxes`);
      return res.json();
    }
  });

  const [boxId, setBoxId] = useState("01");
  const [clientName, setClientName] = useState("");
  const [targetGramsInput, setTargetGramsInput] = useState("");
  const [targetGrams, setTargetGrams] = useState(0);
  
  const [initialStockGrams, setInitialStockTons] = useState(0);
  const [currentStockGrams, setCurrentStockTons] = useState(0);

  const [scanning, setScanning] = useState(false);
  const [loadingStarted, setLoadingStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [startedAtDate, setStartedAtDate] = useState<Date | null>(null);

  if (isLoading) {
    return <div className="p-8 text-center">Carregando boxes...</div>;
  }

  const fullBoxes = boxes.filter((b) => b.status === "ocupado" || b.volume_cm3 > 0);
  const box = fullBoxes.find((item) => item.id === boxId) ?? fullBoxes[0];
  const mat = box?.material_id ? materialById(box.material_id) : null;
  const currentTotalStock = ((box?.volume_cm3 || 0) / 1000.0) * (mat?.density ?? 0);

  const selectBox = (id: string) => {
    setBoxId(id);
    setLoadingStarted(false);
    setStartedAt(null);
  };

  const startLoading = () => {
    if (scanning || loadingStarted) return;
    const target = parseFloat(targetGramsInput);
    if (!clientName.trim() || isNaN(target) || target <= 0) {
      toast.error("Preencha o nome do cliente e a quantidade corretamente.");
      return;
    }
    
    setScanning(true);
    window.setTimeout(() => {
      const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
      
      setInitialStockTons(currentTotalStock);
      setCurrentStockTons(currentTotalStock);
      setTargetGrams(target);
      setStartedAt(time);
      setStartedAtDate(new Date());
      setLoadingStarted(true);
      setScanning(false);
      toast.success("Carregamento iniciado para " + clientName);
    }, 900);
  };

  const finishLoading = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/boxes/${boxId}/truck-loadings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName,
          target_tons: targetGrams,
          loaded_tons: loadedGrams,
          start_time: startedAtDate?.toISOString(),
          end_time: new Date().toISOString()
        })
      });
      toast.success("Registro de carregamento salvo com sucesso no banco de dados!");
      setLoadingStarted(false);
      setClientName("");
      setTargetGramsInput("");
      setTargetGrams(0);
      setStartedAt(null);
      setStartedAtDate(null);
    } catch (error) {
      toast.error("Erro ao salvar carregamento no banco de dados.");
    }
  };

  const scanLidar = async () => {
    if (scanning || !loadingStarted) return;
    setScanning(true);
    
    try {
      const res = await refetch();
      const updatedBoxes = res.data || [];
      const updatedBox = updatedBoxes.find((item) => item.id === boxId);
      
      if (updatedBox) {
        const matUpdated = updatedBox.material_id ? materialById(updatedBox.material_id) : null;
        const newStock = (updatedBox.volume_cm3 || 0) * (matUpdated?.density || 0);
        setCurrentStockTons(newStock);
        toast.success("Leitura LiDAR atualizada");
      }
    } catch (error) {
      toast.error("Erro ao ler LiDAR");
    } finally {
      setScanning(false);
    }
  };

  // The loaded amount is the difference between initial stock and current stock.
  // Because as trucks get loaded, the box mass decreases.
  const loadedGrams = loadingStarted ? Math.max(0, initialStockGrams - currentStockGrams) : 0;
  const remainingGrams = loadingStarted ? Math.max(0, targetGrams - loadedGrams) : 0;
  const progress = loadingStarted ? Math.min(100, (loadedGrams / targetGrams) * 100) : 0;

  if (!box) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card shadow-sm">
          <div className="mx-auto grid max-w-[1280px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">

            <div className="min-w-0">
              <div className="eyebrow text-primary">Modalidade cabine</div>
              <h1 className="truncate text-xl font-bold sm:text-2xl">Registro de Carregamento</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl p-4 sm:p-6 mt-8">
          <div className="panel p-10 sm:p-14 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-muted text-muted-foreground mb-4">
              <ScanLine className="size-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Nenhum box com produto</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Todos os boxes estão atualmente vazios. É necessário registrar um novo lote (Navio) em algum box para liberar a expedição e carregamento.
            </p>

          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto grid max-w-[1280px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">

          <div className="min-w-0">
            <div className="eyebrow text-primary">Modalidade cabine</div>
            <h1 className="truncate text-xl font-bold sm:text-2xl">Registro de Carregamento</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="panel p-4 sm:p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <div className="min-w-0">
                <label className="eyebrow mb-2 block" htmlFor="box-cabine">Box de operação</label>
                <Select value={boxId} onValueChange={selectBox} disabled={loadingStarted}>
                  <SelectTrigger id="box-cabine" className="h-14 bg-card text-lg font-semibold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {fullBoxes.length > 0 ? (
                      fullBoxes.map((item) => {
                        const m = item.material_id ? materialById(item.material_id) : null;
                        const kg = ((item.volume_cm3 || 0) / 1000.0) * (m?.density || 0);
                        const lote = item.current_batch?.ship_name || "Sem Lote";
                        return (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} — Navio: {lote} · {m?.code ?? "Desconhecido"} · {fmt(kg, 1)} kg
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="none" disabled>Nenhum box com produto disponível</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden text-right sm:block">
                <div className="eyebrow">Material</div>
                <div className="mt-1 font-semibold">{mat?.code ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="p-5 sm:p-7">
              {!loadingStarted ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="clientName" className="eyebrow mb-2 block">Nome do Cliente / Caminhão</label>
                    <Input 
                      id="clientName" 
                      value={clientName} 
                      onChange={(e) => setClientName(e.target.value)} 
                      placeholder="Ex: Rumo Logística - Placa ABC-1234" 
                      className="h-14 text-lg" 
                    />
                  </div>
                  <div>
                    <label htmlFor="targetGrams" className="eyebrow mb-2 block">Quantidade Alvo (kg)</label>
                    <Input 
                      id="targetGrams" 
                      type="number" 
                      step="0.1"
                      value={targetGramsInput} 
                      onChange={(e) => setTargetGramsInput(e.target.value)} 
                      placeholder="Ex: 15.0" 
                      className="h-14 text-lg" 
                    />
                  </div>

                  <Button onClick={startLoading} disabled={scanning} className="mt-6 h-16 w-full text-base font-bold sm:h-20 sm:text-xl">
                    {scanning ? <Loader2 className="animate-spin" /> : <Play />}
                    {scanning ? "Iniciando…" : "Iniciar carregamento"}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-border bg-surface p-4">
                      <div className="eyebrow">Cliente</div>
                      <div className="mt-2 text-lg font-bold truncate" title={clientName}>{clientName}</div>
                    </div>
                    <div className="rounded-md border border-border bg-surface p-4">
                      <div className="eyebrow">Carga programada</div>
                      <div className="metric mt-2 text-2xl font-bold">{fmt(targetGrams, 1)} kg</div>
                    </div>
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                      <div className="eyebrow text-primary">Falta carregar</div>
                      <div className="metric mt-2 text-2xl font-bold text-primary">{fmt(remainingGrams, 1)} kg</div>
                    </div>
                  </div>

                  <div className="mt-6 eyebrow text-primary">Status do carregamento</div>
                  {remainingGrams > 0 ? (
                    <>
                      <div className="metric mt-2 text-5xl font-bold text-primary sm:text-7xl">{fmt(remainingGrams, 1)} <span className="text-2xl sm:text-3xl">kg</span></div>
                    </>
                  ) : (
                    <div className="mt-3 flex items-center gap-3 text-success"><CheckCircle2 className="size-10" /><span className="text-3xl font-bold">Carga concluída</span></div>
                  )}

                  <div className="mt-6">
                    <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
                      <span className="min-w-0 truncate">Carregado <strong className="metric">{fmt(loadedGrams, 1)} kg</strong></span>
                      <span className="shrink-0">Meta <strong className="metric">{fmt(targetGrams, 1)} kg</strong></span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-md bg-muted">
                      <div className={cn("h-full transition-all duration-500", progress >= 100 ? "bg-success" : "bg-primary")} style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Button onClick={scanLidar} disabled={scanning || remainingGrams <= 0} className="h-16 w-full text-base font-bold sm:h-20 sm:text-xl">
                      {scanning ? <Loader2 className="animate-spin" /> : <ScanLine />}
                      {scanning ? "Lendo LiDAR…" : "Escannear e Atualizar"}
                    </Button>
                    <Button onClick={finishLoading} disabled={scanning} className="h-16 w-full bg-green-600 hover:bg-green-700 text-white text-base font-bold sm:h-20 sm:text-xl">
                      <CheckCircle2 /> Finalizar Carregamento
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}