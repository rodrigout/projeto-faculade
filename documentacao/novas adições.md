Com base nas especificações técnicas levantadas na documentação do projeto (

PROPOSTA_RECONCILIACAO_FISICA_VS_SISTEMICA_COPI.md
, 

jornada_do_usuario.md
 e 

server.py
), preparei os dados, as regras de negócio e os mocks completos prontos para uso no seu novo front-end.

1. Parâmetros e Regras de Negócio Oficiais (COPI / Itaqui)
Armazém Modelo: 10 Boxes fixos (BOX-01 a BOX-10), cada um com capacidade máxima de $8.000\text{ m}^3$ e aprox. $9.200\text{ t}$.
Operações Ativas do Armazém:
RECEBIMENTO: Descarga de navio/moega via esteira e tripper car alimentando o box.
EXPEDICAO: Retirada de material com pá carregadeira para carregamento rodoviário/ferroviário.
ARMAZENADO: Carga estática/estocada aguardando ordem de saída.
DISPONIVEL: Box limpo/vazio pronto para novo lote.
Classificação de Alertas de Reconciliação (COPI):
🟢 CONFORME: $|\Delta| \le 1,0%$ (tolerância metrológica de balança/acomodação).
🟡 ATENÇÃO: $1,0% < |\Delta| \le 2,0%$ (requer conferência de densidade ou umidade).
🔴 DIVERGÊNCIA CRÍTICA: $|\Delta| > 2,0%$ ou furo de estoque/inconsistência de zero.
2. Mock JSON: Boxes com Status de Operação
Cada box possui os campos in_operation (booleano) e operational_status (RECEBIMENTO, EXPEDICAO, ARMAZENADO, DISPONIVEL).

json
[
  {
    "id": "BOX-01",
    "name": "Box 01",
    "in_operation": true,
    "operational_status": "RECEBIMENTO",
    "product_name": "Ureia Agrícola Granulada",
    "product_code": "UREIA",
    "density_t_m3": 0.78,
    "current_stock_tons": 6900.0,
    "current_volume_m3": 8846.1,
    "max_capacity_tons": 9200.0,
    "occupancy_pct": 75.0,
    "shift_operator": "Carlos Mendes (Turno A)",
    "active_batch": "NAVIO-MV-ATLANTIC-2026",
    "divergence_flag": true,
    "divergence_type": "INPUT_UNDER_READING"
  },
  {
    "id": "BOX-02",
    "name": "Box 02",
    "in_operation": true,
    "operational_status": "EXPEDICAO",
    "product_name": "KCL Granulado Vermelho",
    "product_code": "KCL",
    "density_t_m3": 1.08,
    "current_stock_tons": 4200.0,
    "current_volume_m3": 3888.8,
    "max_capacity_tons": 9200.0,
    "occupancy_pct": 45.6,
    "shift_operator": "Marcos Silva (Turno A)",
    "active_batch": "EXP-FERROVIA-LOTE-04",
    "divergence_flag": false,
    "divergence_type": "NONE"
  },
  {
    "id": "BOX-03",
    "name": "Box 03",
    "in_operation": false,
    "operational_status": "ARMAZENADO",
    "product_name": "MAP (Fosfato Monoamônico)",
    "product_code": "MAP",
    "density_t_m3": 0.98,
    "current_stock_tons": 8100.0,
    "current_volume_m3": 8265.3,
    "max_capacity_tons": 9200.0,
    "occupancy_pct": 88.0,
    "shift_operator": null,
    "active_batch": "LOTE-ESTATICO-03",
    "divergence_flag": false,
    "divergence_type": "NONE"
  },
  {
    "id": "BOX-04",
    "name": "Box 04",
    "in_operation": false,
    "operational_status": "DISPONIVEL",
    "product_name": "— Vazio / Disponível —",
    "product_code": null,
    "density_t_m3": 1.0,
    "current_stock_tons": 0.0,
    "current_volume_m3": 0.0,
    "max_capacity_tons": 9200.0,
    "occupancy_pct": 0.0,
    "shift_operator": null,
    "active_batch": null,
    "divergence_flag": true,
    "divergence_type": "DIGITAL_EMPTY_PHYSICAL_EXISTS"
  },
  {
    "id": "BOX-05",
    "name": "Box 05",
    "in_operation": true,
    "operational_status": "EXPEDICAO",
    "product_name": "Sulfato de Amônio",
    "product_code": "SULFATO",
    "density_t_m3": 0.95,
    "current_stock_tons": 0.0,
    "current_volume_m3": 0.0,
    "max_capacity_tons": 9200.0,
    "occupancy_pct": 0.0,
    "shift_operator": "João Antunes (Turno A)",
    "active_batch": "EXP-RODOV-LOTE-88",
    "divergence_flag": true,
    "divergence_type": "DIGITAL_EXISTS_PHYSICAL_EMPTY"
  },
  {
    "id": "BOX-06",
    "name": "Box 06",
    "in_operation": false,
    "operational_status": "DISPONIVEL",
    "product_name": "— Vazio / Disponível —",
    "product_code": null,
    "density_t_m3": 1.0,
    "current_stock_tons": 0.0,
    "current_volume_m3": 0.0,
    "max_capacity_tons": 9200.0,
    "occupancy_pct": 0.0,
    "shift_operator": null,
    "active_batch": null,
    "divergence_flag": false,
    "divergence_type": "NONE"
  }
]
3. Mock Completo: Casos Reais de Divergência
Aqui estão os 3 cenários requisitados estruturados para exibição em cards de alerta, modais ou tabelas de auditoria:

json
{
  "divergencias_auditoria": [
    {
      "id": "DIV-2026-001",
      "box_id": "BOX-01",
      "box_name": "Box 01 — Ureia Agrícola",
      "categoria": "DIVERGENCIA_ENTRADA_PAINEL",
      "titulo": "Divergência de Entrada: Painel vs. Leitura LiDAR 3D",
      "descricao": "Operador de painel informou entrada de 7.000 ton via esteira transportadora, porém o escaneamento LiDAR apurou 6.900 ton no box.",
      "dados_confronto": {
        "sistema_declarado_tons": 7000.0,
        "lidar_medido_tons": 6900.0,
        "delta_tons": -100.0,
        "delta_percentual": -1.43,
        "volume_medido_m3": 8846.15,
        "densidade_referencia": 0.78
      },
      "severidade": "ALERTA_AMARELO",
      "status_auditoria": "EM_ANALISE",
      "causa_provavel": "Retenção de pó/granel ao longo dos 380m de correia transportadora ou desvio de calibração na balança de fluxo da moega.",
      "acao_recomendada": "Inspecionar transportador de correia e solicitar calibração do integrador de pesagem antes do encerramento do navio."
    },
    {
      "id": "DIV-2026-002",
      "box_id": "BOX-04",
      "box_name": "Box 04 — MAP",
      "categoria": "DIGITAL_VAZIO_FISICO_EXISTE",
      "titulo": "Inconsistência: WMS Zerado com Presença de Volume Físico",
      "descricao": "O sistema WMS marca 0,00 ton (box encerrado no fiscal), mas o sensor LiDAR detectou resíduo de talude/ponta de pilha no fundo do box.",
      "dados_confronto": {
        "sistema_declarado_tons": 0.0,
        "lidar_medido_tons": 320.5,
        "delta_tons": 320.5,
        "delta_percentual": 100.0,
        "volume_medido_m3": 327.04,
        "densidade_referencia": 0.98
      },
      "severidade": "CRITICO_VERMELHO",
      "status_auditoria": "BLOQUEIO_OPERACIONAL",
      "risco_operacional": "Risco de CONTAMINAÇÃO CRUZADA caso outro fertilizante (ex: Ureia) seja descarregado sobre o MAP residual.",
      "acao_recomendada": "Bloquear liberação do Box 04 para novo navio até raspagem completa com pá carregadeira e novo scan de validação."
    },
    {
      "id": "DIV-2026-003",
      "box_id": "BOX-05",
      "box_name": "Box 05 — Sulfato de Amônio",
      "categoria": "DIGITAL_EXISTE_FISICO_VAZIO",
      "titulo": "Furo de Estoque: Saldo Sistêmico Sem Material Físico",
      "descricao": "O sistema ERP/WMS aponta saldo de 450 ton aguardando expedição, porém a varredura LiDAR detectou o piso do galpão limpo (0 ton).",
      "dados_confronto": {
        "sistema_declarado_tons": 450.0,
        "lidar_medido_tons": 0.0,
        "delta_tons": -450.0,
        "delta_percentual": -100.0,
        "volume_medido_m3": 0.0,
        "densidade_referencia": 0.95
      },
      "severidade": "CRITICO_VERMELHO",
      "status_auditoria": "FURO_DE_ESTOQUE",
      "risco_operacional": "Carretas agendadas para carregamento na expedição sofrerão fila e pingue-pongue por falta de produto físico.",
      "acao_recomendada": "Suspender agendamento de carretas para este lote, emitir boletim de quebra operacional e estornar o saldo no ERP."
    }
  ]
}
4. Implementação de Filtros no Front-End (JavaScript / TypeScript)
Exemplo de utilitário pronto com os filtros exigidos:

javascript
// Filtro reativo para boxes
function filtrarBoxes(boxes, filtro) {
  switch (filtro) {
    case 'EM_OPERACAO':
      return boxes.filter(b => b.in_operation === true);
    
    case 'RECEBIMENTO':
      return boxes.filter(b => b.operational_status === 'RECEBIMENTO');
      
    case 'EXPEDICAO':
      return boxes.filter(b => b.operational_status === 'EXPEDICAO');
      
    case 'COM_DIVERGENCIA':
      return boxes.filter(b => b.divergence_flag === true);
      
    case 'DISPONIVEL':
      return boxes.filter(b => b.operational_status === 'DISPONIVEL');
      
    case 'TODOS':
    default:
      return boxes;
  }
}
// Cálculo rápido de KPIs para os cards de topo
function calcularKPIsArmazem(boxes, divergencias) {
  return {
    total_boxes: boxes.length,
    boxes_em_operacao: boxes.filter(b => b.in_operation).length,
    boxes_em_recebimento: boxes.filter(b => b.operational_status === 'RECEBIMENTO').length,
    boxes_em_expedicao: boxes.filter(b => b.operational_status === 'EXPEDICAO').length,
    boxes_com_divergencia: boxes.filter(b => b.divergence_flag).length,
    total_divergencias_criticas: divergencias.filter(d => d.severidade === 'CRITICO_VERMELHO').length
  };
}
5. Sugestão de UI (Barra de Filtros e Badges)
Para encaixar perfeitamente no padrão visual do projeto:

html
<!-- Barra de Filtros Segmentados -->
<div class="filters-container">
  <button class="filter-btn active" onclick="setFiltro('TODOS')">Todos (10)</button>
  <button class="filter-btn" onclick="setFiltro('EM_OPERACAO')">⚡ Em Operação (3)</button>
  <button class="filter-btn" onclick="setFiltro('RECEBIMENTO')">📥 Recebimento (1)</button>
  <button class="filter-btn" onclick="setFiltro('EXPEDICAO')">📤 Expedição (2)</button>
  <button class="filter-btn warning" onclick="setFiltro('COM_DIVERGENCIA')">⚠️ Com Divergência (3)</button>
</div>
<!-- Badge de Status do Box -->
<span class="badge badge-receiving">RECEBIMENTO ATIVO</span>
<span class="badge badge-dispatching">EXPEDIÇÃO RODOVIÁRIA</span>
<span class="badge badge-divergence">🔴 DIVERGÊNCIA IDENTIFICADA</span>
