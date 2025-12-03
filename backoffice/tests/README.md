# 🧪 Robot Framework Tests

Test suite completo para o Backoffice do Torneio de Padel usando Robot Framework.

## 📋 Requisitos

- Python 3.8+
- Node.js (para o servidor)
- Robot Framework e bibliotecas

## 🚀 Instalação

```bash
cd tests
pip install -r requirements.txt
```

## 📁 Estrutura de Testes

```
tests/
├── api/                          # Testes de API
│   ├── test_categories.robot     # Testes de Categories
│   ├── test_teams.robot          # Testes de Teams
│   ├── test_players.robot         # Testes de Players
│   ├── test_matches.robot         # Testes de Matches
│   ├── test_scoring.robot         # Testes de Scoring
│   └── test_standings.robot       # Testes de Standings
├── resources/
│   └── common.robot              # Keywords e recursos comuns
├── results/                       # Resultados dos testes (gerado)
├── requirements.txt              # Dependências Python
├── run_tests.sh                  # Script para executar testes
└── README.md                     # Este ficheiro
```

## ▶️ Executar Testes

### Opção 1: Script Bash (Recomendado)

```bash
# Certifica-te que o servidor está a correr
cd ../backoffice
npm start

# Noutro terminal
cd tests
chmod +x run_tests.sh
./run_tests.sh
```

### Opção 2: Robot Framework Direto

```bash
# Executar todos os testes
robot --outputdir results api/

# Executar um teste específico
robot --outputdir results api/test_categories.robot

# Executar com tags
robot --include requires_match --outputdir results api/
```

## 📊 Cobertura de Testes

### Categories API
- ✅ Criar categoria
- ✅ Listar todas as categorias
- ✅ Obter categoria por ID
- ✅ Atualizar categoria
- ✅ Eliminar categoria
- ✅ Validação de campos obrigatórios
- ✅ Criar múltiplas categorias

### Teams API
- ✅ Criar equipa
- ✅ Listar todas as equipas
- ✅ Obter equipa por ID
- ✅ Filtrar por categoria
- ✅ Filtrar por grupo
- ✅ Atualizar equipa
- ✅ Eliminar equipa
- ✅ Validação de campos obrigatórios
- ✅ Criar equipas para ambos os grupos

### Players API
- ✅ Criar jogador
- ✅ Listar todos os jogadores
- ✅ Obter jogador por ID
- ✅ Filtrar por equipa
- ✅ Atualizar jogador
- ✅ Eliminar jogador
- ✅ Validação de campos obrigatórios
- ✅ Criar múltiplos jogadores para equipa

### Matches API
- ✅ Criar jogo
- ✅ Listar todos os jogos
- ✅ Obter jogo por ID
- ✅ Filtrar por categoria
- ✅ Filtrar por status
- ✅ Atualizar jogo
- ✅ Eliminar jogo
- ✅ Criar jogos para diferentes fases

### Scoring API
- ✅ Iniciar jogo
- ✅ Incrementar ponto (Team A)
- ✅ Incrementar ponto (Team B)
- ✅ Progressão de pontuação (0-15-30-40)
- ✅ Decrementar ponto (undo)
- ✅ Finalizar jogo
- ✅ Validação de status (só pode pontuar se "playing")
- ✅ Completar set (6 jogos)

### Standings API
- ✅ Listar todas as classificações
- ✅ Filtrar por categoria
- ✅ Filtrar por grupo
- ✅ Recalcular rankings
- ✅ Estrutura de dados

## 🏷️ Tags

Os testes usam tags para organização:

- `requires_category` - Requer categoria criada
- `requires_team` - Requer equipa criada
- `requires_player` - Requer jogador criado
- `requires_match` - Requer jogo criado
- `requires_started_match` - Requer jogo iniciado

## 📈 Resultados

Após executar os testes, os resultados estarão em:

- `results/log.html` - Log detalhado
- `results/report.html` - Relatório de resultados
- `results/output.xml` - XML com resultados

## 🔧 Configuração

Variáveis podem ser configuradas em `resources/common.robot`:

```robot
${BASE_URL}    http://localhost:3000
${API_BASE}    ${BASE_URL}/api
```

## 📝 Notas

- Os testes assumem que o servidor está a correr em `http://localhost:3000`
- Alguns testes criam dados de teste que são limpos automaticamente
- Testes com tags `requires_*` dependem de outros testes na mesma suite

## 🐛 Troubleshooting

**Erro: "Server is not running"**
- Certifica-te que o servidor está a correr: `cd backoffice && npm start`

**Erro: "ModuleNotFoundError: No module named 'robotframework'"**
- Instala as dependências: `pip install -r requirements.txt`

**Testes falham com 404**
- Limpa a base de dados ou reinicia o servidor
