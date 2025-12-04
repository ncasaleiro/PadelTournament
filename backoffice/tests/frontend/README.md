# Frontend Unit Tests - Robot Framework

Testes unitários para funcionalidades do frontend usando Robot Framework e Selenium.

## Pré-requisitos

1. Instalar dependências:
```bash
cd backoffice/tests
pip install -r requirements.txt
```

2. Instalar ChromeDriver (para Selenium):
```bash
# Ubuntu/Debian
sudo apt-get install chromium-chromedriver

# Ou usar webdriver-manager
pip install webdriver-manager
```

3. Iniciar o servidor:
```bash
cd backoffice
npm start
```

## Executar Testes

### Todos os testes frontend:
```bash
cd backoffice/tests/frontend
robot test_frontend.robot
```

### Testes específicos por tags:
```bash
# Apenas testes de admin
robot --include admin test_frontend.robot

# Apenas testes de navegação
robot --include navigation test_frontend.robot

# Apenas testes de criação
robot --include create test_frontend.robot

# Apenas testes de referee
robot --include referee test_frontend.robot
```

## Cobertura de Testes

### Autenticação e Autorização
- ✅ Login como admin
- ✅ Login como referee
- ✅ Logout
- ✅ Exibição de informações do utilizador

### Navegação e UI
- ✅ Navegação entre páginas
- ✅ Exibição de estatísticas no dashboard
- ✅ Filtros funcionais

### Permissões por Role
- ✅ Admin vê todos os itens de navegação
- ✅ Admin vê todos os botões de criar
- ✅ Referee não vê botões de criar
- ✅ Referee só vê matches e standings
- ✅ Referee não vê botões de editar/eliminar

### Funcionalidades Admin
- ✅ Criar categoria
- ✅ Criar equipa
- ✅ Criar jogo
- ✅ Editar categoria
- ✅ Eliminar categoria
- ✅ Editar equipa (nome e grupo)
- ✅ Eliminar equipa

### Testes de Edição (`test_edit_categories_teams.robot`)
Testes específicos para funcionalidades de edição via API:
- ✅ Editar nome de categoria
- ✅ Editar categoria múltiplas vezes
- ✅ Editar nome de equipa
- ✅ Editar grupo de equipa
- ✅ Editar nome e grupo de equipa em conjunto
- ✅ Editar equipa múltiplas vezes
- ✅ Verificar que edição requer autenticação de admin
- ✅ Validar persistência das alterações

### Funcionalidades Match
- ✅ Botão iniciar jogo
- ✅ Filtro por status
- ✅ Filtro por categoria

## Notas

- Os testes usam Selenium com Chrome headless
- Certifique-se de que o servidor está a correr na porta 3000
- Os testes criam dados de teste que podem precisar de limpeza manual
- Alguns testes podem falhar se não houver dados suficientes na base de dados






