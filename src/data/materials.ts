export type Material = {
  id: string;
  code: string;
  name: string;
  density: number; // kg/L (ou g/cm³)
  color: string; // oklch — data-driven product color
};

export const MATERIALS: Material[] = [
  { id: "ureia", code: "UREIA", name: "Ureia", density: 0.75, color: "oklch(0.92 0.06 100)" },
  { id: "carvao", code: "CARVÃO", name: "Carvão Mineral", density: 0.85, color: "oklch(0.55 0.01 260)" },
  { id: "sam-std", code: "SAM-STD", name: "Sulfato de Amônia Standard", density: 0.95, color: "oklch(0.8 0.1 85)" },
  { id: "sam-gr", code: "SAM-GR", name: "Sulfato de Amônia Granulado", density: 1.0, color: "oklch(0.78 0.13 75)" },
  { id: "map", code: "MAP", name: "Mono Amônio Fosfato", density: 1.0, color: "oklch(0.7 0.12 55)" },
  { id: "npk", code: "NPK", name: "NPK", density: 1.05, color: "oklch(0.72 0.15 30)" },
  { id: "np", code: "NP", name: "NP", density: 1.05, color: "oklch(0.68 0.14 20)" },
  { id: "yaramila", code: "YARAMILA", name: "YaraMila", density: 1.05, color: "oklch(0.75 0.17 145)" },
  { id: "kcl-gr", code: "KCL-GR", name: "Cloreto de Potássio Granulado", density: 1.08, color: "oklch(0.65 0.2 25)" },
  { id: "tsp-gr", code: "TSP-GR", name: "Superfosfato Triplo", density: 1.1, color: "oklch(0.6 0.05 60)" },
  { id: "ssp-gr", code: "SSP-GR", name: "Superfosfato Simples", density: 1.1, color: "oklch(0.7 0.04 70)" },
  { id: "can-axan", code: "CAN-AXAN", name: "CAN / Axan", density: 1.15, color: "oklch(0.8 0.12 200)" },
  { id: "polissulfato", code: "POLISSULFATO", name: "Polissulfato de Potássio", density: 1.2, color: "oklch(0.65 0.1 340)" },
  { id: "calcario", code: "CALCÁRIO", name: "Calcário", density: 1.4, color: "oklch(0.85 0.02 90)" },
  { id: "rocha", code: "ROCHA FOSF.", name: "Rocha Fosfática", density: 1.5, color: "oklch(0.55 0.06 40)" },
];

const DEFAULT_MATERIAL: Material = {
  id: "ureia",
  code: "UREIA",
  name: "Ureia",
  density: 0.75,
  color: "oklch(0.92 0.06 100)",
};

export const materialById = (id: string) => MATERIALS.find((m) => m.id === id) ?? DEFAULT_MATERIAL;
