import { createFileRoute } from '@tanstack/react-router';
import { AppHeader } from "@/components/scada/Header";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from '@tanstack/react-query';
import { type Box } from '@/data/mock';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

export const Route = createFileRoute('/simulador')({
  component: SimuladorComponent,
});

function SimuladorComponent() {
  const { data: boxes = [] } = useQuery<Box[]>({
    queryKey: ["boxes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/boxes`);
      return res.json();
    }
  });

  const [simConfig, setSimConfig] = useState<Record<string, { readVolume: number; withdrawnGrams: number }>>(() => {
    const saved = localStorage.getItem('lidarSimConfig');
    return saved ? JSON.parse(saved) : {};
  });

  const saveConfig = (boxId: string, readVolume: number, withdrawnGrams: number) => {
    const newConfig = { ...simConfig, [boxId]: { readVolume, withdrawnGrams } };
    setSimConfig(newConfig);
    localStorage.setItem('lidarSimConfig', JSON.stringify(newConfig));
    toast.success("Configuração salva para o box " + boxId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="panel p-6 bg-card">
          <h1 className="text-2xl font-bold mb-2">Simulador de Leituras do LiDAR</h1>
          <p className="text-muted-foreground mb-6">
            Configure os valores que o sistema usará para simular o próximo escaneamento de cada box. 
            Opcionalmente, informe um valor de retirada (saída de material em kg) que ocorreu ANTES da leitura.
          </p>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {boxes.map(box => {
              const currentConfig = simConfig[box.id] || { readVolume: box.volume_cm3, withdrawnGrams: 0 };
              return <BoxConfigCard key={box.id} box={box} initialConfig={currentConfig} onSave={(vol: number, grams: number) => saveConfig(box.id, vol, grams)} />
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function BoxConfigCard({ box, initialConfig, onSave }: any) {
  const [vol, setVol] = useState(initialConfig.readVolume);
  const [grams, setGrams] = useState(initialConfig.withdrawnGrams);

  return (
    <div className="p-4 border border-border rounded-lg flex flex-col gap-4 shadow-sm bg-background">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary">Box {box.id}</h2>
        <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">Atual: {box.volume_cm3} cm³</span>
      </div>
      <div className="grid gap-4">
        <div>
          <Label>Volume Lido pelo LiDAR (cm³)</Label>
          <Input type="number" step="any" className="mt-1" value={vol} onChange={e => setVol(Number(e.target.value))} />
        </div>
        <div>
          <Label>Retirada em kg (antes de rodar)</Label>
          <Input type="number" step="any" className="mt-1" value={grams} onChange={e => setGrams(Number(e.target.value))} />
        </div>
      </div>
      <Button className="mt-2 w-full" onClick={() => onSave(vol, grams)}>
        Salvar Simulação Box {box.id}
      </Button>
    </div>
  );
}
