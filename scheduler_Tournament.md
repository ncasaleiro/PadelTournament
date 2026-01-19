# Tournament Scheduler - Requisitos Técnicos

## 1. Visão Geral

O **Tournament Scheduler** é um módulo independente que serve **exclusivamente** para criar e agendar jogos de torneios de forma automática. Uma vez criados, os jogos funcionam normalmente como qualquer jogo criado manualmente.

### Princípios Fundamentais

- **Independência**: O módulo não interfere com referee, match ou scoring modules
- **Acesso Universal**: A base de dados de jogos deve ser **visível por todos** os utilizadores (admin, referee, viewer)
- **IDs Únicos**: Todos os jogos devem ter IDs únicos e imutáveis
- **Identificação de Torneio**: Cada jogo deve conter informação sobre o torneio a que pertence

---

## 2. Estrutura de Dados

### 2.1. Torneio (Tournament)

Um torneio é uma entidade que agrupa múltiplas categorias e define configurações globais.

```
tournament = {
  tournament_id: INTEGER (PK, AUTO_INCREMENT, ÚNICO),
  name: TEXT (NOT NULL, ex: "Torneio de Padel 2025"),
  start_date: DATE (NOT NULL),
  end_date: DATE (NOT NULL),
  courts: INTEGER (NOT NULL, ex: 4),
  start_time: TIME (NOT NULL, ex: "08:00"),
  end_time: TIME (NOT NULL, ex: "23:00"),
  match_duration_minutes: INTEGER (NOT NULL, ex: 90),
  created_at: DATETIME,
  updated_at: DATETIME,
  status: TEXT CHECK(status IN ('draft', 'active', 'completed', 'cancelled'))
}
```

### 2.2. Jogo (Match) - Estrutura Atualizada

**IMPORTANTE**: Todos os jogos devem incluir informação do torneio.

```
match = {
  match_id: INTEGER (PK, AUTO_INCREMENT, ÚNICO GLOBALMENTE),
  tournament_id: INTEGER (FK → tournaments, NULL se não aplicável),
  tournament_name: TEXT (NULL ou "N/A" se não aplicável),
  team1_id: INTEGER (FK → teams, NOT NULL),
  team2_id: INTEGER (FK → teams, NOT NULL),
  category_id: INTEGER (FK → categories, NOT NULL),
  phase: TEXT CHECK(phase IN ('Group', 'Quarter-final', 'Semi-final', 'Third-Fourth', 'Final')),
  group_name: TEXT (NULL ou 'A', 'B', 'C', 'D', etc.),
  scheduled_date: DATE (NULL),
  scheduled_time: TIME (NULL),
  court: TEXT (NULL, ex: "Court 1"),
  status: TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'playing', 'finished', 'cancelled')),
  
  -- Score data (JSON format)
  sets_data: TEXT, -- JSON: [{gamesA: 6, gamesB: 4, tiebreak: null}, ...]
  current_set_index: INTEGER DEFAULT 0,
  current_set_data: TEXT, -- JSON: {gamesA: 0, gamesB: 0, tiebreak: null}
  current_game_data: TEXT, -- JSON: {pointsA: 0, pointsB: 0, deuceState: null}
  winner_team_id: INTEGER (FK → teams, NULL),
  
  -- Additional fields
  referee_notes: TEXT (NULL),
  events_data: TEXT, -- JSON: []
  score_history: TEXT, -- JSON: []
  use_super_tiebreak: BOOLEAN DEFAULT false,
  
  created_at: DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP
}
```

### 2.3. Regras de Validação

1. **match_id**: Deve ser sempre único globalmente, mesmo entre diferentes torneios
2. **tournament_id**: 
   - Se fornecido, deve existir na tabela `tournaments`
   - Se NULL, `tournament_name` deve ser "N/A"
   - Se fornecido, `tournament_name` deve corresponder ao nome do torneio
3. **IDs Únicos**: O sistema deve garantir que nunca existem dois jogos com o mesmo `match_id`

---

## 3. Funcionalidades do Scheduler

### 3.1. Criação de Torneio

**Endpoint**: `POST /api/tournaments`

**Permissões**: Apenas Admin

**Campos Obrigatórios**:
- `name`: Nome do torneio
- `start_date`: Data de início
- `end_date`: Data de fim
- `courts`: Número de courts disponíveis
- `start_time`: Hora de início diária (ex: "08:00")
- `end_time`: Hora de fim diária (ex: "23:00")
- `match_duration_minutes`: Duração estimada de cada jogo

**Validações**:
- `start_date` deve ser anterior a `end_date`
- `start_time` deve ser anterior a `end_time`
- `courts` deve ser >= 1
- `match_duration_minutes` deve ser > 0

### 3.2. Configuração de Torneio

**Endpoint**: `PUT /api/tournaments/:id`

**Permissões**: Apenas Admin

Permite atualizar configurações do torneio antes de gerar jogos.

### 3.3. Geração de Jogos - Fase de Grupos

**Endpoint**: `POST /api/tournaments/:tournament_id/generate-group-stage`

**Permissões**: Apenas Admin

**Parâmetros**:
- `category_id`: ID da categoria
- `teams_per_group`: Número de equipas por grupo (padrão: 4)
- `top_team_ids`: Array de IDs de equipas "top" (opcional)
- `auto_schedule`: Boolean - se deve agendar automaticamente (padrão: false)

**Comportamento**:
1. Divide equipas em grupos (normalmente 4 equipas por grupo)
2. Distribui "top teams" primeiro (máximo 2 por grupo)
3. Distribui restantes equipas aleatoriamente
4. Gera jogos round-robin para cada grupo
5. Se `auto_schedule = true`, agenda automaticamente respeitando:
   - Datas do torneio
   - Time frame (start_time a end_time)
   - Número de courts
   - Duração dos jogos
   - Prioridade de categorias (F5, M5, F4, M4, MX, M3)

**Prioridade de Categorias** (ordem de agendamento):
1. F5 (mais cedo)
2. M5
3. F4
4. M4
5. MX (Mixed)
6. M3 (mais tarde)

**Cada jogo gerado deve incluir**:
- `tournament_id`: ID do torneio
- `tournament_name`: Nome do torneio
- `match_id`: ID único global
- `group_name`: Nome do grupo (A, B, C, D, etc.)
- `phase`: "Group"

### 3.4. Geração de Jogos - Fase Eliminatória

**Endpoint**: `POST /api/tournaments/:tournament_id/generate-knockout-stage`

**Permissões**: Apenas Admin

**Parâmetros**:
- `category_id`: ID da categoria
- `phase`: "Quarter-final", "Semi-final", "Final", "Third-Fourth"
- `auto_schedule`: Boolean - se deve agendar automaticamente

**Comportamento**:
1. Determina equipas qualificadas baseado em standings
2. Gera emparelhamentos conforme fase
3. Se `auto_schedule = true`, agenda automaticamente

**Cada jogo gerado deve incluir**:
- `tournament_id`: ID do torneio
- `tournament_name`: Nome do torneio
- `match_id`: ID único global
- `phase`: Fase eliminatória

### 3.5. Geração de Todos os Jogos

**Endpoint**: `POST /api/tournaments/:tournament_id/generate-all`

**Permissões**: Apenas Admin

**Comportamento**:
1. Gera fase de grupos para todas as categorias
2. Agenda automaticamente respeitando prioridades
3. Retorna resumo de jogos criados

### 3.6. Agendamento Automático

**Algoritmo de Agendamento**:

1. **Ordenar jogos por prioridade**:
   - Categoria (F5 → M3)
   - Fase (Group → Final)
   - Grupo (A → Z)

2. **Para cada jogo**:
   - Começar na `start_date` do torneio
   - Encontrar primeiro slot disponível que respeite:
     - Time frame (start_time a end_time)
     - Duração do jogo
     - Court disponível
   - Atribuir `scheduled_date`, `scheduled_time`, `court`

3. **Distribuição de Courts**:
   - Distribuir uniformemente entre courts disponíveis
   - Evitar conflitos de horário no mesmo court

4. **Validações**:
   - Não agendar fora do período do torneio
   - Não agendar fora do time frame diário
   - Não sobrepor jogos no mesmo court

---

## 4. Visualização de Jogos

### 4.1. Acesso Universal

**IMPORTANTE**: Todos os utilizadores (admin, referee, viewer) devem poder:
- Ver todos os jogos da base de dados
- Filtrar por torneio, categoria, fase, grupo, status
- Ver detalhes completos de cada jogo

### 4.2. Endpoints de Consulta

**GET /api/matches**
- Retorna todos os jogos
- Filtros opcionais: `tournament_id`, `category_id`, `phase`, `group_name`, `status`
- **Acesso**: Todos os utilizadores autenticados

**GET /api/matches/:id**
- Retorna detalhes de um jogo específico
- **Acesso**: Todos os utilizadores autenticados

**GET /api/tournaments/:id/matches**
- Retorna todos os jogos de um torneio específico
- **Acesso**: Todos os utilizadores autenticados

### 4.3. Informação de Torneio nos Jogos

Todos os endpoints que retornam jogos devem incluir:
- `tournament_id`: ID do torneio (ou null)
- `tournament_name`: Nome do torneio (ou "N/A")

---

## 5. Regras de Negócio

### 5.1. Fase de Grupos

- **Grupos**: Normalmente 4 equipas por grupo (configurável)
- **Top Teams**: Máximo 2 top teams por grupo
- **Máximo de Top Teams**: 2 × número de grupos
- **Jogos por Grupo**: 
  - 4 equipas = 6 jogos (round-robin completo)
  - 3 equipas = 3 jogos

### 5.2. Pontuação

- **Vitória**: 3 pontos
- **Derrota**: 1 ponto (regra atualizada)

### 5.3. Critérios de Desempate (Grupos)

1. Total de pontos
2. Confronto direto (head-to-head)
3. Diferença de sets
4. Diferença de jogos
5. Total de jogos ganhos
6. Sorteio (último recurso)

### 5.4. Qualificação para Eliminatórias

- **2 equipas por grupo** qualificam normalmente
- Se apenas 2 grupos: vencedores vão direto às semi-finais
- Restantes posições preenchidas pelos melhores 2º lugares

### 5.5. Fases Eliminatórias

- **Quartas-de-final**: 8 equipas
- **Semi-finais**: 4 equipas
- **Final**: 2 equipas
- **3º/4º lugar**: Opcional

---

## 6. Interface do Utilizador

### 6.1. Página de Torneios (Admin)

- Lista de torneios criados
- Botão "Novo Torneio"
- Para cada torneio:
  - Ver detalhes
  - Editar configuração
  - Gerar jogos (grupos, eliminatórias, todos)
  - Ver calendário
  - Ver jogos gerados

### 6.2. Seleção de Top Teams

- Interface para selecionar top teams por categoria
- Máximo: 2 × número de grupos
- Visualização clara de grupos e distribuição

### 6.3. Calendário de Jogos

- Visualização por dia (apenas dias do torneio)
- Visualização por hora (time frame configurado)
- Visualização por court
- Possibilidade de reagendar jogos (admin)

### 6.4. Lista de Jogos

- Filtros: torneio, categoria, fase, grupo, status
- Exibição de informação do torneio em cada jogo
- Possibilidade de editar agendamento (admin)

---

## 7. Migração de Dados Existentes

### 7.1. Jogos Existentes

Jogos criados antes da implementação do scheduler devem:
- `tournament_id`: NULL
- `tournament_name`: "N/A"

### 7.2. Compatibilidade

O sistema deve funcionar com:
- Jogos sem torneio (tournament_id = NULL)
- Jogos com torneio (tournament_id != NULL)
- Mistura de ambos

---

## 8. Testes

### 8.1. Testes de Unidade

- Criação de torneio
- Geração de grupos
- Distribuição de top teams
- Agendamento automático
- Validação de IDs únicos

### 8.2. Testes de Integração

- Geração completa de torneio
- Agendamento respeitando constraints
- Visualização de jogos por diferentes roles
- Filtros e pesquisas

### 8.3. Testes de API (Robot Framework)

- Endpoints de torneio
- Endpoints de geração
- Endpoints de consulta
- Validação de permissões

---

## 9. Segurança e Permissões

### 9.1. Criação e Edição

- **Admin**: Pode criar, editar, gerar jogos, agendar
- **Referee**: Não pode criar/editar torneios ou gerar jogos
- **Viewer**: Apenas visualização

### 9.2. Visualização

- **Todos**: Podem ver todos os jogos (com filtros)
- **Todos**: Podem ver informação do torneio em cada jogo

---

## 10. Notas Técnicas

### 10.1. IDs Únicos

- O sistema deve garantir IDs únicos mesmo quando:
  - Múltiplos torneios são criados
  - Jogos são criados manualmente e automaticamente
  - Jogos são criados em diferentes momentos

### 10.2. Performance

- Geração de jogos deve ser eficiente mesmo com muitos torneios
- Consultas devem ser otimizadas com índices apropriados

### 10.3. Consistência

- Se um torneio for eliminado, os jogos devem manter `tournament_id` e `tournament_name` para histórico
- Ou: marcar torneio como "deleted" em vez de eliminar fisicamente

---

## 11. Estrutura de Base de Dados

### 11.1. Nova Tabela: tournaments

```sql
CREATE TABLE IF NOT EXISTS tournaments (
    tournament_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    courts INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    match_duration_minutes INTEGER NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 11.2. Alteração na Tabela: matches

```sql
ALTER TABLE matches ADD COLUMN tournament_id INTEGER REFERENCES tournaments(tournament_id);
ALTER TABLE matches ADD COLUMN tournament_name TEXT DEFAULT 'N/A';
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
```

---

## 12. Exemplo de Uso

### 12.1. Fluxo Completo

1. **Admin cria torneio**:
   ```
   POST /api/tournaments
   {
     "name": "Torneio de Padel 2025",
     "start_date": "2025-06-01",
     "end_date": "2025-06-15",
     "courts": 4,
     "start_time": "08:00",
     "end_time": "23:00",
     "match_duration_minutes": 90
   }
   ```

2. **Admin seleciona top teams** (opcional)

3. **Admin gera jogos da fase de grupos**:
   ```
   POST /api/tournaments/1/generate-group-stage
   {
     "category_id": 1,
     "teams_per_group": 4,
     "top_team_ids": [1, 2, 3, 4],
     "auto_schedule": true
   }
   ```

4. **Sistema cria jogos com**:
   - `match_id`: IDs únicos (1, 2, 3, ...)
   - `tournament_id`: 1
   - `tournament_name`: "Torneio de Padel 2025"
   - `group_name`: "A", "B", etc.
   - `scheduled_date`, `scheduled_time`, `court`: Preenchidos automaticamente

5. **Todos os utilizadores podem ver os jogos**:
   ```
   GET /api/matches?tournament_id=1
   ```

---

## 13. Referências

- `tournament_organization.md`: Regras de organização do torneio
- Estrutura atual de matches em `backoffice/src/database/models/Match.js`
- Schema atual em `backoffice/src/database/schema.sql`
