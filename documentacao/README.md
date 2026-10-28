# Cargo Vision

Aqui está um prompt completo e estruturado pronto para você copiar e enviar para a sua IA (como Cursor, v0.dev, Lovable, ChatGPT ou Claude) para criar o design ou o código desse sistema:

Crie um dashboard industrial Web completo para o sistema "LiDAR-Scan Porto", focado no monitoramento volumétrico em tempo real e gestão de estoque dos 10 boxes/baias do terminal de fertilizantes da COPI (Porto do Itaqui).

### 1. ARQUITETURA DA INTERFACE (UI/UX)

O sistema deve possuir 2 níveis principais de navegação:

---

#### NÍVEL 1: PAINEL GERAL DE CONTROLE (OVERVIEW - 10 BOXES)
* **Header Superior**:
  - Logo do Sistema ("LiDAR-Scan COPI") + Relógio Industrial em Tempo Real.
  - Indicadores Globais: Capacidade Total Utilizada (em % e Toneladas), Status do Sensor LiDAR Principal (Online/Offline), e Total de Caminhões em Atendimento (Expedição Rodoviária e Ferroviária).
  - Filtro por Material ou por Status (Vazio, Carregando, Descarregando, Bloqueado).

* **Grid Principal (Card para cada um dos 10 Boxes)**:
  - Exibir 10 Cards interativos (Box 01 a Box 10).
  - Cada Card deve conter:
    - **Identificação**: Nome do Box (ex: "BOX 03").
    - **Status Atual (Badge)**: [Vazio], [Recebendo do Navio], [Expedindo Rodoviário], [Expedindo Ferroviário], [Aguardando Limpeza] ou [Bloqueado/Manutenção].
    - **Material Atual**: Nome do produto (ex: KCl Granulado) + Cor temática do produto.
    - **Nível de Ocupação**: Barra de progresso visual (%) com alerta de cor (Verde <75%, Amarelo 75-90%, Vermelho >90%).
    - **Métricas Rápidas**: Volume em cm³ e Peso em Toneladas (t).
    - **Ação**: Botão "Ver Detalhes do Box".

---

#### NÍVEL 2: VISÃO DETALHADA DO BOX (MODAL OU TELA DEDICADA)
Ao clicar em um Box, abrir a visão aprofundada contendo 4 abas/seções principais:

##### 1. MÉTROLOGIA E COMANDO EM TEMPO REAL
- **Representação Visual 3D/2D**: Gráfico de perfil visual da pilha de fertilizante (Nuvem de Pontos / Superfície 3D simplificada gerada pelo LiDAR).
- **Métricas Principais**:
  - Volume Geométrico Escaneado (cm³).
  - Peso Calculado (Toneladas).
  - Densidade Aplicada no Lote (g/ccm³).
  - Capacidade Restante (cm³ e Toneladas).
- **Painel de Ações e Controle**:
  - Botão de Destaque: **[ 🚀 INICIAR ESCANEAMENTO LIDAR ]** (Aciona leitura manual).
  - Seletor / Dropdown de Material Atual (Com ajuste fino manual de Densidade Aparente).
  - Botão de Trava de Contaminação Cruzada: **[ Confirmar Higienização do Box ]**.

##### 2. RASTREABILIDADE: PASSADO, PRESENTE E FUTURO
- **PRESENTE (Lote Atual)**:
  - Navio de Origem (Bill of Lading / BL).
  - Data de Chegada / Entrada.
  - Certificado de Qualidade / Análise de Umidade.
- **PASSADO (Histórico de Ocupação)**:
  - Tabela com registros anteriores: [Data Entrada/Saída] | [Material Anterior] | [Volume Total] | [Clientes Atendidos] | [Relatório em PDF].
- **FUTURO (Agendamento & Projeções)**:
  - Próximo material agendado para o box.
  - Estimativa de esgotamento total com base na taxa de expedição (t/h).

##### 3. EXPEDIÇÃO E CLIENTES (RODOVIÁRIO E FERROVIÁRIO)
- Tabela de saída do produto deste box em tempo real:
  - [Horário] | [Tipo: Rodoviário / Ferroviário] | [Placa / ID Vagão] | [Cliente Destino] | [Peso Programado] | [Peso Real Balança] | [Status: OK / Pingue-Pongue].

##### 4. RECONCILIAÇÃO E ALERTAS
- **Comparativo Físico vs. Contábil**: Volume do LiDAR vs. Saldo do WMS (exibindo desvio em % e em Toneladas).
- **Log de Alertas**: Avisos de altura crítica de talude, poeira excessiva no sensor ou descalibração de balança.

---

### 2. BANCO DE DADOS DE MATERIAIS E DENSIDADES
Considere a tabela padrão de densidades aparentes para conversão dinâmica de Volume (cm³) para Peso (t):

1. UREIA: 0,75 g/ccm³
2. Carvão Mineral: 0,85 g/ccm³
3. SAM-STD (Sulfato de Amônia Standard): 0,95 g/ccm³
4. SAM-GR (Sulfato de Amônia Granulado): 1,00 g/ccm³
5. MAP (Mono Amônio Fosfato): 1,00 g/ccm³
6. NPK: 1,05 g/ccm³
7. NP: 1,05 g/ccm³
8. YARAMILA: 1,05 g/ccm³
9. KCL-GR (Cloreto de Potássio Granulado): 1,08 g/ccm³
10. TSP-GR (Superfosfato Triplo): 1,10 g/ccm³
11. SSP-GR (Superfosfato Simples): 1,10 g/ccm³
12. CAN-AXAN: 1,15 g/ccm³
13. POLISSULFATO DE POTÁSSIO: 1,20 g/ccm³
14. Calcário: 1,40 g/ccm³
15. ROCHA FOSFÁTICA: 1,50 g/ccm³

---

### 3. ESTILO E DESIGN INDUSTRIAL
- **Tema**: Dark Mode Industrial (fundo preto/grafite escuro `#121212`, cards `#1E1E1E`, texto alto contraste, sotaques em Azul Tecnológico `#00E5FF` e Amarelo/Laranja Industrial).
- **Linguagem Visual**: Dashboard de alto desempenho estilo SCADA/IoT, limpo, responsivo e com componentes visuais modernos (cards, badges de status, gráficos de barras e tabelas limpas).
- **Simulação de Dados**: Inclua dados simulados (mock data) para os 10 boxes funcionando, mostrando variação de materiais, históricos e alertas para testes operacionais.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lidar-box-monitor.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/004a910a-e00d-4a15-a7c9-9886d627d1cd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Developmeng

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
