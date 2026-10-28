import type { Box } from "./mock";

export type OperationalStatus = "RECEBIMENTO" | "EXPEDICAO" | "ARMAZENADO" | "DISPONIVEL";

export interface BoxOperationInfo {
  in_operation: boolean;
  operational_status: OperationalStatus;
  shift_operator?: string | null;
  active_operation_desc?: string | null;
  divergence_flag: boolean;
  divergence_type?: "INPUT_UNDER_READING" | "DIGITAL_EMPTY_PHYSICAL_EXISTS" | "DIGITAL_EXISTS_PHYSICAL_EMPTY" | "DISPATCH_MISMATCH" | "NONE";
  divergence_id?: string;
}

export type DivergenciaSeveridade = "ALERTA_AMARELO" | "CRITICO_VERMELHO" | "CONFORME_VERDE";

export interface DivergenciaAuditoria {
  id: string;
  box_id: string;
  box_name: string;
  categoria: "DIVERGENCIA_ENTRADA_PAINEL" | "DIGITAL_VAZIO_FISICO_EXISTE" | "DIGITAL_EXISTE_FISICO_VAZIO" | "DIVERGENCIA_EXPEDICAO_ESTOQUE";
  titulo: string;
  descricao: string;
  dados_confronto: {
    origem_declarada: string; // Ex: "Painel de Controle / Esteira", "WMS Fiscal", "ERP Comercial", "Balança Rodoviária"
    sistema_declarado: number;
    lidar_medido: number;
    delta_quantidade: number;
    delta_percentual: number;
    volume_m3?: number;
    densidade_referencia?: number;
    unidade: string;
  };
  severidade: DivergenciaSeveridade;
  status_auditoria: "EM_ANALISE" | "BLOQUEIO_OPERACIONAL" | "FURO_DE_ESTOQUE" | "DIVERGENCIA_EXPEDICAO" | "CONFORME";
  risco_operacional?: string;
  causa_provavel: string;
  acao_recomendada: string;
}

export const BOX_OPERATIONS_MAP: Record<string, BoxOperationInfo> = {
  "01": {
    in_operation: true,
    operational_status: "RECEBIMENTO",
    shift_operator: "Carlos Mendes (Turno A)",
    active_operation_desc: "Descarga Navio MV Atlantic (Esteira/Tripper)",
    divergence_flag: true,
    divergence_type: "INPUT_UNDER_READING",
    divergence_id: "DIV-2026-001"
  },
  "02": {
    in_operation: true,
    operational_status: "EXPEDICAO",
    shift_operator: "Marcos Silva (Turno A)",
    active_operation_desc: "Expedição Ferroviária - Lote 04",
    divergence_flag: true,
    divergence_type: "DISPATCH_MISMATCH",
    divergence_id: "DIV-2026-004"
  },
  "03": {
    in_operation: false,
    operational_status: "ARMAZENADO",
    shift_operator: null,
    active_operation_desc: "Estoque Estático - Lote 03",
    divergence_flag: false,
    divergence_type: "NONE"
  },
  "04": {
    in_operation: false,
    operational_status: "DISPONIVEL",
    shift_operator: null,
    active_operation_desc: "Box Declarado Limpo no WMS",
    divergence_flag: true,
    divergence_type: "DIGITAL_EMPTY_PHYSICAL_EXISTS",
    divergence_id: "DIV-2026-002"
  },
  "05": {
    in_operation: true,
    operational_status: "EXPEDICAO",
    shift_operator: "João Antunes (Turno A)",
    active_operation_desc: "Expedição Rodoviária - Lote 88",
    divergence_flag: true,
    divergence_type: "DIGITAL_EXISTS_PHYSICAL_EMPTY",
    divergence_id: "DIV-2026-003"
  },
  "06": {
    in_operation: false,
    operational_status: "DISPONIVEL",
    shift_operator: null,
    active_operation_desc: "Box Limpo / Disponível",
    divergence_flag: false,
    divergence_type: "NONE"
  },
  "07": {
    in_operation: false,
    operational_status: "ARMAZENADO",
    shift_operator: null,
    active_operation_desc: "Estoque Estático - Lote 07",
    divergence_flag: false,
    divergence_type: "NONE"
  },
  "08": {
    in_operation: true,
    operational_status: "EXPEDICAO",
    shift_operator: "Renato Diniz (Turno B)",
    active_operation_desc: "Carregamento Rodoviário",
    divergence_flag: false,
    divergence_type: "NONE"
  },
  "09": {
    in_operation: false,
    operational_status: "ARMAZENADO",
    shift_operator: null,
    active_operation_desc: "Estoque Estático - Lote 09",
    divergence_flag: false,
    divergence_type: "NONE"
  },
  "10": {
    in_operation: false,
    operational_status: "DISPONIVEL",
    shift_operator: null,
    active_operation_desc: "Box Limpo / Disponível",
    divergence_flag: false,
    divergence_type: "NONE"
  },
};

export const MOCK_DIVERGENCIAS: DivergenciaAuditoria[] = [
  {
    id: "DIV-2026-001",
    box_id: "01",
    box_name: "BOX 01 — Ureia Agrícola",
    categoria: "DIVERGENCIA_ENTRADA_PAINEL",
    titulo: "Divergência de Entrada: Painel vs. Leitura LiDAR 3D",
    descricao: "Operador de painel informou entrada de 35,0 kg via esteira transportadora, porém o escaneamento LiDAR apurou 34,5 kg no box.",
    dados_confronto: {
      origem_declarada: "Painel de Entrada / Esteira",
      sistema_declarado: 35.0,
      lidar_medido: 34.5,
      delta_quantidade: -0.5,
      delta_percentual: -1.43,
      volume_m3: 44230.0,
      densidade_referencia: 0.78,
      unidade: "kg"
    },
    severidade: "ALERTA_AMARELO",
    status_auditoria: "EM_ANALISE",
    causa_provavel: "Retenção de material ao longo dos 380m de correia transportadora ou desvio de calibração na balança de fluxo da moega.",
    acao_recomendada: "Inspecionar transportador de correia e solicitar aferição do integrador de pesagem antes do encerramento do lote."
  },
  {
    id: "DIV-2026-002",
    box_id: "04",
    box_name: "BOX 04 — MAP",
    categoria: "DIGITAL_VAZIO_FISICO_EXISTE",
    titulo: "Inconsistência: WMS Zerado com Presença de Volume Físico",
    descricao: "O sistema WMS marca 0,0 kg (box encerrado no fiscal), mas o sensor LiDAR detectou resíduo de ponta de pilha de 2,8 kg no fundo do box.",
    dados_confronto: {
      origem_declarada: "Sistema WMS (Fiscal)",
      sistema_declarado: 0.0,
      lidar_medido: 2.8,
      delta_quantidade: 2.8,
      delta_percentual: 100.0,
      volume_m3: 2857.0,
      densidade_referencia: 0.98,
      unidade: "kg"
    },
    severidade: "CRITICO_VERMELHO",
    status_auditoria: "BLOQUEIO_OPERACIONAL",
    risco_operacional: "Risco de CONTAMINAÇÃO CRUZADA caso outro fertilizante (ex: Ureia) seja descarregado sobre o MAP residual.",
    causa_provavel: "Fim de lote declarado contabilmente no sistema WMS sem inspeção física de raspagem no fundo do box.",
    acao_recomendada: "Bloquear alocação do Box 04 para novo navio até raspagem completa com pá carregadeira e novo scan de validação."
  },
  {
    id: "DIV-2026-003",
    box_id: "05",
    box_name: "BOX 05 — Sulfato de Amônio",
    categoria: "DIGITAL_EXISTE_FISICO_VAZIO",
    titulo: "Furo de Estoque: Saldo Sistêmico Sem Material Físico",
    descricao: "O sistema ERP/WMS aponta saldo de 15,0 kg aguardando expedição, porém a varredura LiDAR detectou o piso do box totalmente limpo (0,0 kg).",
    dados_confronto: {
      origem_declarada: "Saldo ERP / Contábil",
      sistema_declarado: 15.0,
      lidar_medido: 0.0,
      delta_quantidade: -15.0,
      delta_percentual: -100.0,
      volume_m3: 0.0,
      densidade_referencia: 0.95,
      unidade: "kg"
    },
    severidade: "CRITICO_VERMELHO",
    status_auditoria: "FURO_DE_ESTOQUE",
    risco_operacional: "Carretas agendadas na expedição sofrerão fila e pingue-pongue no pátio por ausência física do fertilizante.",
    causa_provavel: "Quebra operacional acumulada ao longo do ciclo ou lançamento contábil em duplicidade no ERP.",
    acao_recomendada: "Suspender chamada de carretas na guarita, emitir boletim de quebra operacional e estornar o saldo contábil no ERP."
  },
  {
    id: "DIV-2026-004",
    box_id: "02",
    box_name: "BOX 02 — KCL Granulado",
    categoria: "DIVERGENCIA_EXPEDICAO_ESTOQUE",
    titulo: "Divergência de Expedição: Balança vs. Redução de Pilha LiDAR",
    descricao: "Pesagem de expedição registrou saída de 25,0 kg, mas a cubagem 3D do LiDAR apurou uma diminuição física de apenas 21,0 kg na pilha.",
    dados_confronto: {
      origem_declarada: "Balança de Saída / Expedição",
      sistema_declarado: 25.0,
      lidar_medido: 21.0,
      delta_quantidade: -4.0,
      delta_percentual: -16.0,
      volume_m3: 19444.0,
      densidade_referencia: 1.08,
      unidade: "kg"
    },
    severidade: "CRITICO_VERMELHO",
    status_auditoria: "DIVERGENCIA_EXPEDICAO",
    risco_operacional: "Possível carregamento em box incorreto por parte da pá carregadeira ou tara errônea de caminhões na balança.",
    causa_provavel: "Pá carregadeira retirando produto de box adjacente ou descalibração na pesagem de saída.",
    acao_recomendada: "Interromper expedição do Box 02, verificar câmeras da pá carregadeira e refazer pesagem de conferência da última carreta."
  }
];

export function enrichBoxWithOperation(box: Box): Box {
  const opInfo = BOX_OPERATIONS_MAP[box.id] || {
    in_operation: false,
    operational_status: "DISPONIVEL",
    divergence_flag: false,
    divergence_type: "NONE"
  };

  return {
    ...box,
    in_operation: opInfo.in_operation,
    operational_status: opInfo.operational_status,
    shift_operator: opInfo.shift_operator,
    active_operation_desc: opInfo.active_operation_desc,
    divergence_flag: opInfo.divergence_flag,
    divergence_type: opInfo.divergence_type
  };
}
