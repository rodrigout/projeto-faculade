# Modalidade Cabine e nova paleta

## O que será entregue
- Trocar o visual escuro atual por uma paleta clara industrial inspirada na referência: branco, cinza frio, azul operacional e verde/amarelo/vermelho para estados.
- Adicionar uma entrada visível para a **Modalidade Cabine** e uma tela simplificada para celular/tablet, com alto contraste e comandos grandes.
- Permitir seleção rápida do box, mostrar a carga rodoviária atual, saldo restante em toneladas e estimativa de caçambas.
- Mostrar o ponto ideal de retirada na pilha com indicação visual de direção e segurança do talude.
- Incluir dimensões e tipo de cada box na visão detalhada, usando 13.333 cm³ para Tipo A e 8.762 cm³ para Tipo B nos cálculos de ocupação e espaço livre.

## Experiência da cabine
- Cabeçalho compacto com estado do LiDAR, box ativo e acesso ao painel da sala de comando.
- Bloco principal com placa/ordem, meta, peso já carregado e saldo restante em números grandes.
- Controle operacional para registrar uma caçamba simulada e atualizar imediatamente o saldo.
- Mapa simplificado da pilha com marcador do ponto de retirada recomendado e alerta de estabilidade.
- Layout adaptado para toque, com leitura clara em tablet horizontal e celular vertical.

## Detalhes técnicos
- Criar rota própria `/cabine`, com metadados exclusivos.
- Atualizar o modelo simulado com geometria Tipo A/B e capacidade volumétrica real por box.
- Reutilizar os dados de expedição existentes para definir a ordem rodoviária ativa.
- Centralizar a nova paleta nos tokens globais para manter consistência em todas as telas.
- Validar navegação, filtros, tela detalhada, modo cabine e tamanhos desktop/mobile.
