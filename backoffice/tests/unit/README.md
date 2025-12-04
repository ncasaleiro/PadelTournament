# Robot Framework Unit Tests

Este diretório contém testes unitários em Robot Framework para todas as APIs do sistema.

## Testes Disponíveis

### 1. `test_categories_api.robot`
Testes completos para a API de Categorias:
- GET all categories
- POST create category
- GET category by ID
- PUT update category
- DELETE category
- Validação de erros (400, 404)

### 2. `test_teams_api.robot`
Testes completos para a API de Equipas:
- GET all teams
- POST create team
- GET team by ID
- PUT update team
- DELETE team
- Filtros por categoria e grupo
- Validação de erros (400, 404)

### 3. `test_players_api.robot`
Testes completos para a API de Jogadores:
- GET all players
- POST create player
- GET player by ID
- PUT update player
- DELETE player
- Filtros por equipa
- Validação de erros (400, 404)

### 4. `test_users_api.robot`
Testes completos para a API de Utilizadores:
- GET all users
- POST create user
- GET user by ID
- PUT update user
- DELETE user
- Validação de roles
- Validação de erros (400, 404)

### 5. `test_auth_api.robot`
Testes completos para a API de Autenticação:
- Login com credenciais válidas
- Login com credenciais inválidas
- Login sem username/password
- Login com admin/referee
- Validação de estrutura JWT token
- Validação de erros (400, 401)

### 6. `test_match_api.robot`
Testes completos para a API de Jogos:
- GET all matches
- POST create match
- GET match by ID
- PUT update match
- DELETE match
- Start match
- Increment/decrement points
- Win game/set
- Tiebreak functionality
- Undo functionality
- Finish match
- Filtros por status e categoria

### 7. `test_score_engine.robot`
Testes unitários para o motor de pontuação:
- Increment points (0→15→30→40)
- Win game
- Deuce handling
- Win set
- Tiebreak functionality
- Undo functionality
- Match completion

### 8. `test_match_persistence.robot`
Testes unitários para a persistência de jogos em ficheiro separado:
- Verificar que jogos são guardados em `matches.json` e não em `database.json`
- Verificar que atualizações são persistidas corretamente
- Verificar que `score_history` é guardado quando se marca pontos
- Verificar que eliminação remove o jogo de `matches.json`
- Verificar que múltiplos jogos são guardados corretamente
- Verificar que `sets_data` é persistido quando sets são completados
- Validar estrutura JSON dos ficheiros
- Garantir separação entre `matches.json` e `database.json`

## Limpeza de Dados

**Todos os testes garantem que os dados criados são eliminados após a execução:**

- **Test Teardown**: Limpa dados criados após cada teste individual
- **Suite Teardown**: Limpa todos os dados de teste após a suite completa

Os dados são identificados por:
- Nomes que começam com "Test" (ex: TestCategory, TestTeam)
- Nomes que começam com "Updated" (ex: UpdatedCategory)
- IDs armazenados em variáveis de suite

## Executar Testes

### Pré-requisitos
1. Servidor deve estar a correr: `npm start` (na raiz do projeto)
2. Robot Framework instalado: `pip install robotframework robotframework-requests`

### Executar todos os testes
```bash
cd tests/unit
./run_all_tests.sh
```

### Executar um teste específico
```bash
cd tests/unit
robot test_categories_api.robot
```

### Executar com dry-run (validação de sintaxe)
```bash
cd tests/unit
robot --dryrun test_categories_api.robot
```

## Estrutura dos Testes

Cada ficheiro de teste segue a estrutura:
```
*** Settings ***
- Libraries necessárias
- Suite Setup/Teardown
- Test Teardown

*** Variables ***
- URLs e configurações
- IDs de teste

*** Test Cases ***
- Testes individuais com tags
- Setup/Teardown específicos

*** Keywords ***
- Funções auxiliares
- Criação de dados de teste
- Limpeza de dados
```

## Tags

Os testes estão organizados por tags:
- `category`, `team`, `player`, `user`, `auth`, `match`, `scoring`
- `create`, `get`, `update`, `delete`
- `error` (testes de validação de erros)
- `tiebreak`, `undo`, `finish` (funcionalidades específicas)

## Resultados

Os resultados são guardados em:
- `results/output.xml` - Formato XML para integração CI/CD
- `results/log.html` - Log detalhado
- `results/report.html` - Relatório HTML
