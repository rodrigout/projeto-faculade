import { materialById } from "./materials";

export type BoxStatus = "vazio" | "ocupado";

export type BoxGeometry = {
  type: "A" | "B";
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  grossVolumeCm3: number;
  usefulCapacityG: number;
};

export const STATUS_LABEL: Record<BoxStatus, string> = {
  vazio: "Vazio",
  ocupado: "Ocupado",
};

export type BoxBatch = {
  id: number;
  box_id: string;
  ship_name: string;
  material_id: string;
  expected_weight_g: number | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
};

export type BoxReading = {
  id: number;
  box_id: string;
  timestamp: string;
  volume: number;
  weight: number;
  material_id: string | null;
  lidar_status: string;
  batch_id: number | null;
};

export type BoxDailyHistory = {
  id: number;
  box_id: string;
  date: string;
  initial_volume: number;
  initial_weight: number;
  final_volume: number;
  final_weight: number;
  material_id: string | null;
  batch_id: number | null;
};

export type Box = {
  id: string;
  name: string;
  status: BoxStatus;
  material_id: string | null;
  capacity_cm3: number;
  volume_cm3: number;
  input_weight_g: number;
  lidar_status: "online" | "offline" | "erro" | "scanning";
  geometry_length_cm: number;
  geometry_width_cm: number;
  geometry_height_cm: number;
  current_batch_id?: number | null;
  current_batch?: BoxBatch | null;
  in_operation?: boolean | undefined;
  operational_status?: "RECEBIMENTO" | "EXPEDICAO" | "ARMAZENADO" | "DISPONIVEL" | undefined;
  shift_operator?: string | null | undefined;
  active_operation_desc?: string | null | undefined;
  divergence_flag?: boolean | undefined;
  divergence_type?: string | undefined;
};

export const boxDensity = (b: Box) =>
  b.material_id ? materialById(b.material_id).density : 0;
// No protótipo (escala até 50 kg): Volume em cm³ dividido por 1.000 (litros) * densidade (kg/L) = kg
export const boxKg = (b: Box) => (b.volume_cm3 / 1000) * boxDensity(b);
export const boxGrams = boxKg; // Mantém compatibilidade com código existente
export const boxFill = (b: Box) => (b.volume_cm3 / b.capacity_cm3) * 100;

export const fmt = (n: number, d = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0);
export const BOXES: Box[] = [];

