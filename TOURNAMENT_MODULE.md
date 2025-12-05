# Tournament Module - v0.02

## Overview

O módulo de **Torneio** é uma funcionalidade **independente** que serve **apenas para criar jogos de forma automática**.

## Independência

Este módulo é completamente independente de:
- **Referee Module**: O módulo de árbitro funciona independentemente
- **Match Module**: O módulo de jogos funciona independentemente
- **Scoring Module**: O módulo de pontuação funciona independentemente

## Funcionalidade Principal

O módulo de torneio serve **exclusivamente** para:
1. **Gerar jogos automaticamente** para fases de grupos e eliminatórias
2. **Agendar jogos** automaticamente com base na configuração do torneio
3. **Distribuir equipas** em grupos (com suporte para "top teams")
4. **Criar calendário** de jogos respeitando:
   - Datas de início e fim do torneio
   - Horários permitidos (time frame)
   - Número de courts disponíveis
   - Duração dos jogos
   - Prioridade das categorias

## Arquitetura

```
Tournament Module (v0.02)
├── Frontend (app.js - tournament functions)
│   ├── Configuração do torneio
│   ├── Seleção de top teams
│   ├── Geração de jogos
│   └── Visualização de calendário
│
├── Backend (server.js - tournament endpoints)
│   ├── POST /api/tournament/config
│   ├── GET /api/tournament/config
│   ├── POST /api/tournament/generate
│   └── POST /api/tournament/generate-all
│
└── Utils (tournamentGenerator.js)
    ├── generateGroupStage()
    ├── generateKnockoutStage()
    └── scheduleMatches()
```

## Fluxo de Trabalho

1. **Admin configura o torneio**:
   - Define datas (início e fim)
   - Define número de courts
   - Define time frame (horários permitidos)
   - Define duração dos jogos

2. **Admin seleciona top teams** (opcional):
   - Seleciona até 2 top teams por grupo
   - Máximo: 2 × número de grupos

3. **Sistema gera jogos automaticamente**:
   - Cria jogos da fase de grupos (round-robin)
   - Distribui equipas em grupos
   - Agenda jogos respeitando configurações
   - Aplica prioridade de categorias

4. **Jogos criados**:
   - Jogos são criados como `Match` objects normais
   - Status: `scheduled`
   - Podem ser geridos normalmente (referee, scoring, etc.)

## Integração

O módulo de torneio **não interfere** com:
- Sistema de pontuação (ScoreEngine)
- Sistema de árbitro (referee.js)
- Sistema de visualização de jogos (match.js)
- Sistema de estatísticas

Apenas **cria** os jogos. Depois disso, os jogos funcionam normalmente como qualquer outro jogo criado manualmente.

## Versionamento

- **Versão**: v0.02
- **Data**: 2025
- **Status**: Independente e funcional

## Notas Técnicas

- Os jogos gerados são idênticos aos jogos criados manualmente
- O módulo não modifica o comportamento dos jogos após criação
- O módulo não interfere com o scoring ou referee tools
- Apenas cria e agenda jogos automaticamente




