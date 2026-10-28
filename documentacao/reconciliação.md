# 📋 PROPOSTA DE APRIMORAMENTO: MÓDULO DE RECONCILIAÇÃO FÍSICA VS. SISTÊMICA
### Auditoria em Tempo Real & Confronto de Dados de Estoque (COPI / Porto do Itaqui)
**II Hackathon Inova Itaqui 2026 • Desafio 3: Gestão de Armazéns de Fertilizantes**  
**Origem da Demanda:** Validação Oficial com a Mentoria Operacional da COPI

---

## 🎯 1. Contexto & A Dor Real do Cliente (COPI)

Durante a fase de validação com a equipe técnica da **COPI**, foi identificada a dor central que nenhuma solução convencional do mercado atende hoje:

> 💬 **Declaração da Mentoria COPI:**  
> *"Nós temos um sistema que pessoas alimentam ele com informações sobre a quantidade que chega e sai, porém não temos como confrontar esses valores. Logo, monitorar a quantidade de granéis nos boxes seria ideal para saber quanto temos e confrontar os valores armazenados no nosso sistema."*

### 🔴 O Gargalo Atual:
1. **Alimentação Humana:** Os operadores digitam notas fiscais, pesagens de navios e tickets de balanças rodoviárias no sistema de gestão (WMS/ERP).
2. **Cegueira Física:** Se houver erro de digitação, retenção de material na esteira transportadora, compactação irregular ou desvio de carga, o sistema da COPI não tem como saber.
3. **Descoberta Tardia:** As divergências só são descobertas semanas depois no fechamento fiscal de balanço ou quando o armazém "zera" no sistema mas ainda tem carga física (ou vice-versa).

---

## 🚀 2. A Solução: Módulo de Confronto Contínuo

O **LiDAR-Scan Porto** atua como a **Camada de Auditoria de Verdade Física**. O sistema cruza continuamente o dado **sistêmico/teórico** digitado pelos operadores com a **nuvem de pontos 3D metrológica** apurada pelos sensores suspensos em cada box.

```
[ Sistema COPI (WMS/ERP) ]          [ LiDAR-Scan Porto (Sensor IoT 3D) ]
  (Entradas/Saídas digitadas)             (Cubagem volumétrica real)
             │                                        │
             ▼                                        ▼
      5.000,00 Toneladas                      4.850,00 Toneladas
             │                                        │
             └───────────────┬────────────────────────┘
                             ▼
              [ MOTOR DE RECONCILIAÇÃO ]
                 Delta: -3,00% (-150 t)
              ⚠️ ALERTA: DIVERGÊNCIA FÍSICA
```

---

## 📊 3. Especificação da Nova Tabela de Rastreabilidade & Auditoria

A **Aba 2 (Histórico de Ciclos / Leituras)** da plataforma CCO passará a exibir a tabela estruturada de auditoria:

### 📋 Estrutura de Colunas:

| Data / Hora | Lote / Navio | Produto | 💻 Estoque Sistêmico (WMS) | 📡 Medição Física (LiDAR 3D) | ⚖️ Delta / Divergência | 🛡️ Status de Auditoria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **26/09 às 13:00** | Lote 01 — Ureia | Ureia Agrícola | **5.000,00 t** | **4.982,50 t** | **-0,35% (-17,5 t)** | <span style="color:#22c55e; font-weight:bold;">🟢 CONFORME</span> |
| **26/09 às 12:00** | MV Atlantic Trader | MAP | **7.200,00 t** | **6.990,00 t** | **-2,92% (-210,0 t)** | <span style="color:#ef4444; font-weight:bold;">🔴 DIVERGÊNCIA CRÍTICA</span> |
| **26/09 às 11:00** | Lote Bancada Teste | Argila Esmectita | **186,00 t** | **186,30 t** | **+0,16% (+0,3 t)** | <span style="color:#22c55e; font-weight:bold;">🟢 CONFORME</span> |
| **26/09 às 10:00** | Lote 04 — KCL | KCL Granulado | **6.500,00 t** | **6.395,00 t** | **-1,62% (-105,0 t)** | <span style="color:#eab308; font-weight:bold;">🟡 ATENÇÃO / AUDITAR</span> |

---

## ⚙️ 4. Regras de Negócio e Classificação de Alertas

* **🟢 CONFORME (Delta $\le \pm 1,0\%$):** Variação dentro da margem padrão de acomodação e tolerância metrológica de balança.
* **🟡 ATENÇÃO (Delta entre $\pm 1,0\%$ e $\pm 2,0\%$):** Discrepância moderada. Notifica o supervisor de turno para verificar a calibração da densidade do fertilizante.
* **🔴 DIVERGÊNCIA CRÍTICA (Delta $> \pm 2,0\%$):** Inconsistência grave. Bloqueia o fechamento automático do lote e exige inspeção visual com recontagem pericial em 3D.

---

## 💰 5. Benefícios & Retorno para a Operação da COPI

1. **Eliminação de Furos de Estoque:** Evita perdas contábeis invisíveis que custam entre **R$ 1,5 Milhão e R$ 3,0 Milhões/ano**.
2. **Segurança no Agendamento de Navios (Berço 101):** Certeza absoluta de espaço livre nos boxes antes de atracar navios graneleiros, evitando multas de *Demurrage* (US$ 25.000/dia).
3. **Agilidade na Expedição:** Menor tempo de espera de carretas na balança rodoviária de saída e fim do "pingue-pongue" de caminhões.
4. **Laudo Pericial Oficial com 1 Clique:** Emissão de certificado pericial com carimbo de data/hora, nuvem de pontos 3D e cálculo DEM de Riemann para comprovação perante tradings, seguradoras e Receita Federal.

---

## 🎤 6. Roteiro de Demonstração para a Banca Avaliadora

> *"Senhores jurados e equipe da COPI, quando ouvimos a mentora dizer que **'não tinham como confrontar o que era digitado no sistema com a realidade do box'**, nós criamos este módulo de Reconciliação Contínua.*  
> *Aqui na tela, o gestor do CCO vê lado a lado: o que foi digitado no WMS versus o volume 3D escaneado pelo LiDAR a cada 30 segundos. Se houver uma perda na esteira ou erro de pesagem, o sistema aponta na hora a divergência em vermelho, permitindo que a COPI aja antes de faturar a carga ou liberar o navio."*
