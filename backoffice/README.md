# 🎾 Padel Tournament Backoffice

Sistema de gestão de torneios de Padel com backoffice completo.

## 📋 Funcionalidades

- **Gestão de Categorias** (M3, M4, M5, F4, F5, MX)
- **Gestão de Equipas e Jogadores**
- **Fase de Grupos** (Round-robin com 2 grupos)
- **Fase Eliminatória** (Semi-finais, Final)
- **Sistema de Pontuação** (Ténis/Padel: 0, 15, 30, 40, Deuce, Advantage)
- **Classificações Automáticas**
- **API REST Completa**

## 🚀 Instalação

```bash
cd backoffice
npm install
npm run init-db  # Inicializa a base de dados
npm start        # Inicia o servidor
```

O servidor estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
backoffice/
├── src/
│   ├── server.js              # Servidor Express e rotas API
│   ├── database/
│   │   ├── db.js              # Conexão SQLite
│   │   ├── schema.sql         # Schema da base de dados
│   │   └── models/            # Modelos de dados
│   │       ├── Category.js
│   │       ├── Team.js
│   │       ├── Player.js
│   │       ├── Match.js
│   │       └── Standing.js
│   └── scoring/
│       └── scoreEngine.js     # Motor de pontuação
├── public/                     # Frontend (a criar)
├── data/                       # Base de dados SQLite
└── package.json
```

## 🗄️ Base de Dados

A base de dados SQLite é criada automaticamente na primeira execução em `data/tournament.db`.

### Tabelas:
- **categories**: Categorias do torneio
- **teams**: Equipas
- **players**: Jogadores
- **matches**: Jogos/Partidas
- **standings**: Classificações
- **users**: Utilizadores (para autenticação futura)

## 🔌 API Endpoints

### Categories
- `GET /api/categories` - Lista todas as categorias
- `GET /api/categories/:id` - Obtém uma categoria
- `POST /api/categories` - Cria uma categoria
- `PUT /api/categories/:id` - Atualiza uma categoria
- `DELETE /api/categories/:id` - Elimina uma categoria

### Teams
- `GET /api/teams?category_id=X&group=A` - Lista equipas
- `GET /api/teams/:id` - Obtém uma equipa
- `POST /api/teams` - Cria uma equipa
- `PUT /api/teams/:id` - Atualiza uma equipa
- `DELETE /api/teams/:id` - Elimina uma equipa

### Players
- `GET /api/players?team_id=X` - Lista jogadores
- `GET /api/players/:id` - Obtém um jogador
- `POST /api/players` - Cria um jogador
- `PUT /api/players/:id` - Atualiza um jogador
- `DELETE /api/players/:id` - Elimina um jogador

### Matches
- `GET /api/matches?category_id=X&status=playing` - Lista jogos
- `GET /api/matches/:id` - Obtém um jogo
- `POST /api/matches` - Cria um jogo
- `PUT /api/matches/:id` - Atualiza um jogo
- `DELETE /api/matches/:id` - Elimina um jogo

### Scoring
- `POST /api/matches/:id/score/increment` - Incrementa ponto
- `POST /api/matches/:id/score/decrement` - Decrementa ponto (undo)
- `POST /api/matches/:id/start` - Inicia um jogo
- `POST /api/matches/:id/finish` - Finaliza um jogo

### Standings
- `GET /api/standings?category_id=X&group=A` - Lista classificações
- `POST /api/standings/recalculate/:categoryId/:group` - Recalcula classificações

## 📊 Sistema de Pontuação

O sistema segue as regras do Padel/Ténis:
- **Pontos**: 0 → 15 → 30 → 40 → Game
- **Deuce**: 40-40 → precisa de 2 pontos consecutivos para ganhar
- **Set**: Primeiro a 6 jogos com diferença de 2
- **Tie-break**: Em 6-6, primeiro a 7 pontos com diferença de 2
- **Match**: Best of 3 sets (primeiro a 2 sets)

## 🔐 Próximos Passos

- [ ] Frontend do backoffice
- [ ] Import/Export CSV
- [ ] Autenticação e roles (Admin, Referee, Viewer)
- [ ] Geração automática de jogos (round-robin)
- [ ] Dashboard com estatísticas

