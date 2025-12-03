# ✅ Implementação do Backoffice - Resumo

## 🎯 O que foi implementado

### 1. ✅ Estrutura do Projeto
- **Node.js + Express** servidor backend
- Estrutura modular e organizada
- Configuração de dependências (sem SQLite nativo devido a incompatibilidade com Node v25)

### 2. ✅ Base de Dados
- **Sistema de armazenamento JSON** (`data/database.json`)
- Schema completo com todas as tabelas:
  - `categories` - Categorias do torneio
  - `teams` - Equipas
  - `players` - Jogadores
  - `matches` - Jogos/Partidas
  - `standings` - Classificações
  - `users` - Utilizadores (preparado para autenticação)

### 3. ✅ Modelos de Dados
Todos os modelos implementados com CRUD completo:
- **Category.js** - Gestão de categorias
- **Team.js** - Gestão de equipas (com filtros por categoria e grupo)
- **Player.js** - Gestão de jogadores (com relação a equipas)
- **Match.js** - Gestão de jogos (com dados de pontuação em JSON)
- **Standing.js** - Gestão de classificações (com recálculo automático)

### 4. ✅ API REST Completa

#### Categories
- `GET /api/categories` - Lista todas
- `GET /api/categories/:id` - Obtém uma
- `POST /api/categories` - Cria
- `PUT /api/categories/:id` - Atualiza
- `DELETE /api/categories/:id` - Elimina

#### Teams
- `GET /api/teams?category_id=X&group=A` - Lista (com filtros)
- `GET /api/teams/:id` - Obtém uma
- `POST /api/teams` - Cria
- `PUT /api/teams/:id` - Atualiza
- `DELETE /api/teams/:id` - Elimina

#### Players
- `GET /api/players?team_id=X` - Lista (com filtro)
- `GET /api/players/:id` - Obtém um
- `POST /api/players` - Cria
- `PUT /api/players/:id` - Atualiza
- `DELETE /api/players/:id` - Elimina

#### Matches
- `GET /api/matches?category_id=X&status=playing` - Lista (com filtros)
- `GET /api/matches/:id` - Obtém um
- `POST /api/matches` - Cria
- `PUT /api/matches/:id` - Atualiza
- `DELETE /api/matches/:id` - Elimina

#### Scoring
- `POST /api/matches/:id/score/increment` - Incrementa ponto (team: 'A' ou 'B')
- `POST /api/matches/:id/score/decrement` - Decrementa ponto (undo)
- `POST /api/matches/:id/start` - Inicia jogo
- `POST /api/matches/:id/finish` - Finaliza jogo

#### Standings
- `GET /api/standings?category_id=X&group=A` - Lista classificações
- `POST /api/standings/recalculate/:categoryId/:group` - Recalcula rankings

### 5. ✅ Sistema de Pontuação
- **ScoreEngine** (`src/scoring/scoreEngine.js`)
- Implementa regras completas do Padel/Ténis:
  - Pontos: 0 → 15 → 30 → 40 → Game
  - Deuce: 40-40 → precisa de 2 pontos consecutivos
  - Set: Primeiro a 6 jogos com diferença de 2
  - Tie-break: Em 6-6, primeiro a 7 pontos com diferença de 2
  - Match: Best of 3 sets (primeiro a 2 sets)

## 📁 Estrutura de Ficheiros

```
backoffice/
├── src/
│   ├── server.js                    # Servidor Express + rotas API
│   ├── database/
│   │   ├── db.js                    # Interface JSON database
│   │   ├── schema.sql               # Schema SQL (referência)
│   │   └── models/                  # Modelos de dados
│   │       ├── Category.js
│   │       ├── Team.js
│   │       ├── Player.js
│   │       ├── Match.js
│   │       └── Standing.js
│   └── scoring/
│       └── scoreEngine.js           # Motor de pontuação
├── data/
│   └── database.json                # Base de dados JSON
├── package.json
├── README.md
└── IMPLEMENTATION.md
```

## 🚀 Como usar

```bash
cd backoffice
npm install
npm start
```

Servidor disponível em: `http://localhost:3000`

## 📝 Próximos Passos

- [ ] Frontend do backoffice (Dashboard, gestão de equipas, agendamento)
- [ ] Import/Export CSV
- [ ] Autenticação e roles (Admin, Referee, Viewer)
- [ ] Geração automática de jogos (round-robin)
- [ ] Dashboard com estatísticas

## 🔧 Notas Técnicas

- **Base de dados**: JSON file (simples, sem dependências nativas)
- **Futuro**: Pode migrar para SQLite quando necessário
- **API**: RESTful, JSON responses
- **Scoring**: Lógica completa implementada e testável via API

