// API Base URL
const API_BASE = '/api';

// State
let currentPage = 'dashboard';
let categories = [];
let teams = [];
let matches = [];
let standings = [];
let currentUser = null;
let users = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
    } else {
        showLogin();
    }
    
    setupNavigation();
    
    // Auto-refresh dashboard every 30 seconds
    setInterval(() => {
        if (currentPage === 'dashboard' && currentUser) {
            loadDashboard();
        }
    }, 30000);
});

function showLogin() {
    document.getElementById('login-modal').classList.add('active');
    document.querySelector('.app-container').style.display = 'none';
}

function showApp() {
    document.getElementById('login-modal').classList.remove('active');
    document.querySelector('.app-container').style.display = 'flex';
    
    // Update UI based on user role
    updateUIForRole();
    
    // Load data
    loadDashboard();
    loadCategories();
    loadTeams();
    loadMatches();
    loadStandings();
    
    // Load users if admin
    if (currentUser && currentUser.role === 'admin') {
        loadUsers();
    }
    
    // Ensure buttons are visible after data loads (with delay to ensure DOM is ready)
    setTimeout(() => {
        updateUIForRole();
    }, 500);
}

function updateUIForRole() {
    if (!currentUser) return;
    
    // Show user info
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('user-name').textContent = currentUser.username;
    document.getElementById('user-role').textContent = currentUser.role;
    document.getElementById('logout-btn').style.display = 'block';
    
    // Show/hide navigation items based on role
    if (currentUser.role === 'admin') {
        document.getElementById('nav-users').style.display = 'block';
        // Admin can see everything
    } else if (currentUser.role === 'referee') {
        // Referee can only see matches and standings
        document.querySelectorAll('.nav-item').forEach(item => {
            const page = item.dataset.page;
            if (page !== 'dashboard' && page !== 'matches' && page !== 'standings') {
                item.style.display = 'none';
            }
        });
    } else if (currentUser.role === 'viewer') {
        // Viewer can only see dashboard and standings
        document.querySelectorAll('.nav-item').forEach(item => {
            const page = item.dataset.page;
            if (page !== 'dashboard' && page !== 'standings') {
                item.style.display = 'none';
            }
        });
    }
    
    // Show/hide create buttons based on role
    const createButtons = [
        { id: 'btn-new-category', name: 'Nova Categoria' },
        { id: 'btn-new-team', name: 'Nova Equipa' },
        { id: 'btn-new-match', name: 'Novo Jogo' },
        { id: 'btn-new-user', name: 'Novo Utilizador' }
    ];
    
    createButtons.forEach(btnInfo => {
        const btn = document.getElementById(btnInfo.id);
        if (btn) {
            if (currentUser.role === 'admin') {
                btn.style.display = 'inline-block';
                btn.style.visibility = 'visible';
                btn.disabled = false;
                console.log(`✅ Botão "${btnInfo.name}" visível para admin`);
            } else {
                btn.style.display = 'none';
                btn.style.visibility = 'hidden';
                console.log(`❌ Botão "${btnInfo.name}" escondido para ${currentUser.role}`);
            }
        } else {
            console.warn(`⚠️ Botão "${btnInfo.name}" (${btnInfo.id}) não encontrado no DOM`);
        }
    });
    
    // Force re-render of lists to show/hide edit/delete buttons
    if (categories.length > 0) {
        renderCategories();
    }
    if (teams.length > 0) {
        renderTeams();
    }
    if (matches.length > 0) {
        renderMatches();
    }
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            switchPage(page);
        });
    });
}

function switchPage(page) {
    // Check permissions
    if (!currentUser) return;
    
    if (currentUser.role === 'viewer' && page !== 'dashboard' && page !== 'standings') {
        alert('Não tem permissão para aceder a esta página');
        return;
    }
    
    if (currentUser.role === 'referee' && page !== 'dashboard' && page !== 'matches' && page !== 'standings') {
        alert('Não tem permissão para aceder a esta página');
        return;
    }
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const navItem = document.querySelector(`[data-page="${page}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Update pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');
    
    currentPage = page;
    
    // Load page-specific data
    if (page === 'dashboard') {
        loadDashboard();
    } else if (page === 'categories') {
        loadCategories();
    } else if (page === 'teams') {
        loadTeams();
    } else if (page === 'matches') {
        loadMatches();
    } else if (page === 'standings') {
        loadStandings();
    } else if (page === 'users') {
        loadUsers();
    }
}

// API Calls
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    // Add authentication token if available
    const token = localStorage.getItem('token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        // Handle 204 No Content (DELETE operations) - return early, no parsing needed
        if (response.status === 204) {
            return null;
        }
        
        // Check response status first
        if (!response.ok) {
            // Try to get error message from response
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro na requisição');
                } catch (parseError) {
                    // If JSON parse fails, use status text
                    throw new Error(response.statusText || 'Erro na requisição');
                }
            } else {
                // Not JSON, try text
                try {
                    const text = await response.text();
                    throw new Error(text || response.statusText || 'Erro na requisição');
                } catch (textError) {
                    throw new Error(response.statusText || 'Erro na requisição');
                }
            }
        }
        
        // For successful responses, check if there's content
        const contentType = response.headers.get('content-type');
        
        // If no content-type or not JSON, return null (successful but empty)
        if (!contentType || !contentType.includes('application/json')) {
            return null;
        }
        
        // Try to parse JSON, but handle empty responses gracefully
        try {
            const text = await response.text();
            
            // If text is empty, return null
            if (!text || !text.trim()) {
                return null;
            }
            
            // Parse JSON
            const data = JSON.parse(text);
            return data;
        } catch (parseError) {
            // If parse fails but status was OK, it's likely an empty response
            if (response.ok) {
                console.log('Empty JSON response, returning null');
                return null;
            }
            // If status was not OK, we should have caught it above
            throw new Error('Erro ao processar resposta do servidor');
        }
    } catch (error) {
        console.error('API Error:', error);
        
        // Only show alert for meaningful errors (not JSON parse errors from empty responses)
        if (error.message && 
            !error.message.includes('JSON') && 
            !error.message.includes('Unexpected') &&
            !error.message.includes('end of data')) {
            alert(`Erro: ${error.message}`);
        }
        
        // For JSON parse errors on successful responses, just return null
        if (error.message && 
            (error.message.includes('JSON') || error.message.includes('Unexpected') || error.message.includes('end of data'))) {
            console.log('JSON parse error on likely empty response, returning null');
            return null;
        }
        
        throw error;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const [categoriesData, teamsData, matchesData] = await Promise.all([
            apiCall('/categories'),
            apiCall('/teams'),
            apiCall('/matches'),
        ]);
        
        // Update stats
        document.getElementById('stat-categories').textContent = categoriesData.length;
        document.getElementById('stat-teams').textContent = teamsData.length;
        document.getElementById('stat-matches').textContent = matchesData.length;
        document.getElementById('stat-playing').textContent = matchesData.filter(m => m.status === 'playing').length;
        
        // Upcoming matches (scheduled)
        const upcoming = matchesData
            .filter(m => m.status === 'scheduled')
            .sort((a, b) => {
                const dateA = a.scheduled_date || '9999-99-99';
                const dateB = b.scheduled_date || '9999-99-99';
                return dateA.localeCompare(dateB);
            })
            .slice(0, 5);
        
        renderMatchesList('upcoming-matches', upcoming);
        
        // Playing matches
        const playing = matchesData.filter(m => m.status === 'playing');
        renderMatchesList('playing-matches', playing);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Categories
async function loadCategories() {
    try {
        categories = await apiCall('/categories');
        renderCategories();
        populateCategoryFilters();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function renderCategories() {
    const container = document.getElementById('categories-list');
    
    if (categories.length === 0) {
        container.innerHTML = '<p>Nenhuma categoria encontrada.</p>';
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <div class="item-card">
            <div class="item-card-header">
                <div class="item-card-title">${cat.name}</div>
                <div class="item-card-actions">
                    ${currentUser && currentUser.role === 'admin' ? `
                        <button class="btn btn-sm btn-secondary" onclick="editCategory(${cat.category_id})">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCategory(${cat.category_id})">Eliminar</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function openCategoryModal(categoryId = null) {
    // Only admin can create/edit categories
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem criar ou editar categorias');
        return;
    }
    
    const modal = document.getElementById('category-modal');
    const form = document.getElementById('category-form');
    const title = document.getElementById('category-modal-title');
    
    if (categoryId) {
        const category = categories.find(c => c.category_id === categoryId);
        document.getElementById('category-id').value = category.category_id;
        document.getElementById('category-name').value = category.name;
        title.textContent = 'Editar Categoria';
    } else {
        form.reset();
        document.getElementById('category-id').value = '';
        title.textContent = 'Nova Categoria';
    }
    
    modal.classList.add('active');
}

async function saveCategory(event) {
    event.preventDefault();
    
    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value;
    
    try {
        if (id) {
            await apiCall(`/categories/${id}`, 'PUT', { name });
        } else {
            await apiCall('/categories', 'POST', { name });
        }
        
        closeModal('category-modal');
        loadCategories();
        loadDashboard();
    } catch (error) {
        console.error('Error saving category:', error);
    }
}

function editCategory(id) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem editar categorias');
        return;
    }
    openCategoryModal(id);
}

async function deleteCategory(id) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem eliminar categorias');
        return;
    }
    
    if (!confirm('Tem certeza que deseja eliminar esta categoria?')) return;
    
    try {
        const result = await apiCall(`/categories/${id}`, 'DELETE');
        // DELETE returns null on success (204), so we don't need to check result
        loadCategories();
        loadDashboard();
    } catch (error) {
        console.error('Error deleting category:', error);
        // Only show error if it's not a JSON parse error (which we handle silently)
        if (error.message && 
            !error.message.includes('JSON') && 
            !error.message.includes('Unexpected') &&
            !error.message.includes('end of data')) {
            alert(`Erro ao eliminar categoria: ${error.message}`);
        }
    }
}

// Teams
async function loadTeams() {
    try {
        const categoryId = document.getElementById('filter-category')?.value;
        const group = document.getElementById('filter-group')?.value;
        
        let endpoint = '/teams';
        const params = new URLSearchParams();
        if (categoryId) params.append('category_id', categoryId);
        if (group) params.append('group', group);
        if (params.toString()) endpoint += '?' + params.toString();
        
        teams = await apiCall(endpoint);
        renderTeams();
        // Update UI after loading to ensure buttons are visible
        if (currentUser && currentUser.role === 'admin') {
            updateUIForRole();
        }
    } catch (error) {
        console.error('Error loading teams:', error);
    }
}

function renderTeams() {
    const container = document.getElementById('teams-list');
    
    if (teams.length === 0) {
        container.innerHTML = '<p>Nenhuma equipa encontrada.</p>';
        return;
    }
    
    container.innerHTML = teams.map(team => `
        <div class="item-card">
            <div class="item-card-header">
                <div class="item-card-title">${team.name}</div>
                <div class="item-card-actions">
                    ${currentUser && currentUser.role === 'admin' ? `
                        <button class="btn btn-sm btn-secondary" onclick="editTeam(${team.team_id})">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTeam(${team.team_id})">Eliminar</button>
                    ` : ''}
                </div>
            </div>
            <div class="item-card-body">
                <div><strong>Categoria:</strong> ${team.category_name || 'N/A'}</div>
                <div><strong>Grupo:</strong> ${team.group_name || 'N/A'}</div>
            </div>
        </div>
    `).join('');
}

function openTeamModal(teamId = null) {
    // Only admin can create/edit teams
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem criar ou editar equipas');
        return;
    }
    
    const modal = document.getElementById('team-modal');
    const form = document.getElementById('team-form');
    const title = document.getElementById('team-modal-title');
    
    // Populate category select
    const categorySelect = document.getElementById('team-category');
    categorySelect.innerHTML = '<option value="">Selecione...</option>' +
        categories.map(cat => `<option value="${cat.category_id}">${cat.name}</option>`).join('');
    
    if (teamId) {
        const team = teams.find(t => t.team_id === teamId);
        document.getElementById('team-id').value = team.team_id;
        document.getElementById('team-name').value = team.name;
        document.getElementById('team-category').value = team.category_id;
        document.getElementById('team-group').value = team.group_name;
        title.textContent = 'Editar Equipa';
    } else {
        form.reset();
        document.getElementById('team-id').value = '';
        title.textContent = 'Nova Equipa';
    }
    
    modal.classList.add('active');
}

async function saveTeam(event) {
    event.preventDefault();
    
    const id = document.getElementById('team-id').value;
    const name = document.getElementById('team-name').value;
    const categoryId = document.getElementById('team-category').value;
    const groupName = document.getElementById('team-group').value;
    
    try {
        if (id) {
            await apiCall(`/teams/${id}`, 'PUT', { name, category_id: categoryId, group_name: groupName });
        } else {
            await apiCall('/teams', 'POST', { name, category_id: categoryId, group_name: groupName });
        }
        
        closeModal('team-modal');
        loadTeams();
        loadDashboard();
    } catch (error) {
        console.error('Error saving team:', error);
    }
}

function editTeam(id) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem editar equipas');
        return;
    }
    openTeamModal(id);
}

async function deleteTeam(id) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem eliminar equipas');
        return;
    }
    
    if (!confirm('Tem certeza que deseja eliminar esta equipa?')) return;
    
    try {
        const result = await apiCall(`/teams/${id}`, 'DELETE');
        // DELETE returns null on success (204)
        loadTeams();
        loadDashboard();
    } catch (error) {
        console.error('Error deleting team:', error);
        if (error.message && 
            !error.message.includes('JSON') && 
            !error.message.includes('Unexpected') &&
            !error.message.includes('end of data')) {
            alert(`Erro ao eliminar equipa: ${error.message}`);
        }
    }
}

// Matches
async function loadMatches() {
    try {
        const categoryId = document.getElementById('filter-match-category')?.value;
        const status = document.getElementById('filter-match-status')?.value;
        
        let endpoint = '/matches';
        const params = new URLSearchParams();
        if (categoryId) params.append('category_id', categoryId);
        if (status) params.append('status', status);
        if (params.toString()) endpoint += '?' + params.toString();
        
        matches = await apiCall(endpoint);
        renderMatches();
    } catch (error) {
        console.error('Error loading matches:', error);
        const container = document.getElementById('matches-list');
        if (container) {
            container.innerHTML = '<p>Erro ao carregar jogos. Por favor, tente novamente.</p>';
        }
    }
}

function renderMatches() {
    const container = document.getElementById('matches-list');
    
    if (!container) {
        console.error('matches-list container not found');
        return;
    }
    
    if (!matches || matches.length === 0) {
        container.innerHTML = '<p>Nenhum jogo encontrado.</p>';
        return;
    }
    
    // Ensure currentUser is available
    if (!currentUser) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        }
    }
    
    container.innerHTML = matches.map(match => {
        const result = formatMatchResult(match);
        return `
        <div class="match-card">
            <div class="match-info">
                <div class="match-teams">
                    ${match.team1_name || 'TBD'} vs ${match.team2_name || 'TBD'}
                    ${result ? `<div class="match-result">${result}</div>` : ''}
                </div>
                <div class="match-meta">
                    <span>${match.category_name || 'N/A'}</span>
                    <span>${match.scheduled_date || 'TBD'}</span>
                    <span>${match.scheduled_time || 'TBD'}</span>
                    <span>${match.court || 'TBD'}</span>
                    <span class="match-status ${match.status}">${getStatusLabel(match.status)}</span>
                </div>
            </div>
            <div class="match-actions">
                ${match.status === 'scheduled' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'referee') ? 
                    `<button class="btn btn-sm btn-primary" onclick="startMatch(${match.match_id})">Iniciar</button>` : ''}
                ${match.status === 'scheduled' || match.status === 'playing' ? 
                    `<button class="btn btn-sm btn-primary" onclick="openMatchPage(${match.match_id})">${currentUser && currentUser.role === 'referee' ? 'Árbitro' : 'Ver Jogo'}</button>` : ''}
                ${match.status === 'finished' && currentUser && currentUser.role === 'admin' ? 
                    `<button class="btn btn-sm btn-primary" onclick="openMatchPage(${match.match_id})">Ver Jogo</button>` : ''}
                ${currentUser && currentUser.role === 'admin' ? `
                    ${match.status === 'finished' ? 
                        `<button class="btn btn-sm btn-secondary" onclick="editMatchResult(${match.match_id})">Editar Resultado</button>` :
                        `<button class="btn btn-sm btn-secondary" onclick="editMatch(${match.match_id})">Editar</button>`
                    }
                    <button class="btn btn-sm btn-danger" onclick="deleteMatch(${match.match_id})">Eliminar</button>
                ` : ''}
            </div>
        </div>
    `;
    }).join('');
}

function renderMatchesList(containerId, matchesList) {
    const container = document.getElementById(containerId);
    
    if (!matchesList || matchesList.length === 0) {
        container.innerHTML = '<p>Nenhum jogo encontrado.</p>';
        return;
    }
    
    container.innerHTML = matchesList.map(match => {
        const result = formatMatchResult(match);
        return `
        <div class="match-card">
            <div class="match-info">
                <div class="match-teams">
                    ${match.team1_name || 'TBD'} vs ${match.team2_name || 'TBD'}
                    ${result ? `<div class="match-result">${result}</div>` : ''}
                </div>
                <div class="match-meta">
                    <span>${match.category_name || 'N/A'}</span>
                    <span>${match.scheduled_date || 'TBD'}</span>
                    <span>${match.scheduled_time || 'TBD'}</span>
                    <span class="match-status ${match.status}">${getStatusLabel(match.status)}</span>
                </div>
            </div>
            <div class="match-actions">
                ${match.status === 'scheduled' || match.status === 'playing' ? 
                    `<button class="btn btn-sm btn-primary" onclick="openMatchPage(${match.match_id})">${currentUser && currentUser.role === 'referee' ? 'Árbitro' : 'Ver Jogo'}</button>` : ''}
            </div>
        </div>
    `;
    }).join('');
}

function getStatusLabel(status) {
    const labels = {
        'scheduled': 'Agendado',
        'playing': 'Em Curso',
        'finished': 'Finalizado',
        'cancelled': 'Cancelado'
    };
    return labels[status] || status;
}

function formatMatchResult(match) {
    if (!match || match.status === 'scheduled' || match.status === 'cancelled') {
        return '';
    }
    
    try {
        const sets = match.sets_data ? JSON.parse(match.sets_data) : [];
        const currentSet = match.current_set_data ? JSON.parse(match.current_set_data) : { gamesA: 0, gamesB: 0, tiebreak: null };
        const currentSetIndex = match.current_set_index || 0;
        
        let result = [];
        
        // Add completed sets (always show Team A vs Team B)
        sets.forEach(set => {
            if (set.tiebreak && set.tiebreak !== null) {
                // Set with tiebreak - show games and tiebreak score
                const tiebreakA = set.tiebreak.pointsA || 0;
                const tiebreakB = set.tiebreak.pointsB || 0;
                result.push(`${set.gamesA}-${set.gamesB}(${tiebreakA}-${tiebreakB})`);
            } else {
                // Normal set
                result.push(`${set.gamesA}-${set.gamesB}`);
            }
        });
        
        // Add current set if match is playing
        if (match.status === 'playing' && currentSet) {
            if (currentSet.tiebreak && currentSet.tiebreak !== null) {
                // Current set is in tiebreak
                const tiebreakA = currentSet.tiebreak.pointsA || 0;
                const tiebreakB = currentSet.tiebreak.pointsB || 0;
                result.push(`${currentSet.gamesA}-${currentSet.gamesB} (${tiebreakA}-${tiebreakB})`);
            } else {
                // Current set normal
                result.push(`${currentSet.gamesA}-${currentSet.gamesB}`);
            }
        }
        
        return result.length > 0 ? result.join(', ') : '';
    } catch (error) {
        console.error('Error formatting match result:', error);
        return '';
    }
}

function openMatchModal(matchId = null) {
    // Only admin can create/edit matches
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem criar ou editar jogos');
        return;
    }
    
    const modal = document.getElementById('match-modal');
    const form = document.getElementById('match-form');
    const title = document.getElementById('match-modal-title');
    
    // Populate category select
    const categorySelect = document.getElementById('match-category');
    categorySelect.innerHTML = '<option value="">Selecione...</option>' +
        categories.map(cat => `<option value="${cat.category_id}">${cat.name}</option>`).join('');
    
    // Populate team selects (will be updated when category changes)
    updateTeamSelects();
    
    if (matchId) {
        const match = matches.find(m => m.match_id === matchId);
        document.getElementById('match-id').value = match.match_id;
        document.getElementById('match-category').value = match.category_id;
        document.getElementById('match-team1').value = match.team1_id;
        document.getElementById('match-team2').value = match.team2_id;
        document.getElementById('match-phase').value = match.phase;
        document.getElementById('match-group').value = match.group_name || '';
        document.getElementById('match-date').value = match.scheduled_date || '';
        document.getElementById('match-time').value = match.scheduled_time || '';
        document.getElementById('match-court').value = match.court || '';
        document.getElementById('match-use-super-tiebreak').checked = match.use_super_tiebreak || false;
        
        if (match.status === 'finished') {
            // For finished matches, redirect to result editor
            closeModal('match-modal');
            editMatchResult(matchId);
            return;
        } else {
            title.textContent = 'Editar Jogo';
        }
        
        // Update team selects after setting category
        updateTeamSelects(match.category_id);
    } else {
        form.reset();
        document.getElementById('match-id').value = '';
        document.getElementById('match-use-super-tiebreak').checked = false;
        title.textContent = 'Novo Jogo';
    }
    
    modal.classList.add('active');
}

function updateTeamSelects(categoryId = null) {
    const category = categoryId || document.getElementById('match-category').value;
    const team1Select = document.getElementById('match-team1');
    const team2Select = document.getElementById('match-team2');
    
    const categoryTeams = teams.filter(t => !category || t.category_id == category);
    
    team1Select.innerHTML = '<option value="">Selecione...</option>' +
        categoryTeams.map(team => `<option value="${team.team_id}">${team.name}</option>`).join('');
    
    team2Select.innerHTML = '<option value="">Selecione...</option>' +
        categoryTeams.map(team => `<option value="${team.team_id}">${team.name}</option>`).join('');
}

document.getElementById('match-category')?.addEventListener('change', () => {
    updateTeamSelects();
});

async function saveMatch(event) {
    event.preventDefault();
    
    const id = document.getElementById('match-id').value;
    const team1Id = document.getElementById('match-team1').value;
    const team2Id = document.getElementById('match-team2').value;
    const categoryId = document.getElementById('match-category').value;
    const phase = document.getElementById('match-phase').value;
    const groupName = document.getElementById('match-group').value || null;
    const date = document.getElementById('match-date').value || null;
    const time = document.getElementById('match-time').value || null;
    const court = document.getElementById('match-court').value || null;
    const useSuperTiebreak = document.getElementById('match-use-super-tiebreak').checked;
    
    const matchData = {
        team1_id: team1Id,
        team2_id: team2Id,
        category_id: categoryId,
        phase,
        group_name: groupName,
        scheduled_date: date,
        scheduled_time: time,
        court,
        use_super_tiebreak: useSuperTiebreak
    };
    
    try {
        if (id) {
            await apiCall(`/matches/${id}`, 'PUT', matchData);
        } else {
            await apiCall('/matches', 'POST', matchData);
        }
        
        closeModal('match-modal');
        loadMatches();
        loadDashboard();
    } catch (error) {
        console.error('Error saving match:', error);
    }
}

function editMatch(id) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem editar jogos');
        return;
    }
    openMatchModal(id);
}

function editMatchResult(id) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem editar resultados');
        return;
    }
    
    const match = matches.find(m => m.match_id === id);
    if (!match) {
        alert('Jogo não encontrado');
        return;
    }
    
    if (match.status !== 'finished') {
        alert('Apenas partidas finalizadas podem ter o resultado editado');
        return;
    }
    
    const modal = document.getElementById('match-result-modal');
    const form = document.getElementById('match-result-form');
    const container = document.getElementById('match-result-sets-container');
    
    document.getElementById('match-result-id').value = match.match_id;
    
    // Parse sets data
    let sets = [];
    try {
        sets = match.sets_data ? JSON.parse(match.sets_data) : [];
    } catch (e) {
        console.error('Error parsing sets_data:', e);
        sets = [];
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Add sets
    sets.forEach((set, index) => {
        const setDiv = document.createElement('div');
        setDiv.className = 'form-group';
        setDiv.style.border = '1px solid #e2e8f0';
        setDiv.style.padding = '15px';
        setDiv.style.marginBottom = '15px';
        setDiv.style.borderRadius = '6px';
        setDiv.innerHTML = `
            <label style="font-weight: 600; font-size: 1.1em; margin-bottom: 10px; display: block;">Set ${index + 1}</label>
            <div class="form-row">
                <div class="form-group">
                    <label>Jogos Equipa 1</label>
                    <input type="number" min="0" step="1" id="set-${index}-gamesA" value="${set.gamesA || 0}" required style="width: 100%;">
                    <small class="form-text text-muted">Permite qualquer valor para tie-breaks prolongados (ex: 15-13, 20-18)</small>
                </div>
                <div class="form-group">
                    <label>Jogos Equipa 2</label>
                    <input type="number" min="0" step="1" id="set-${index}-gamesB" value="${set.gamesB || 0}" required style="width: 100%;">
                    <small class="form-text text-muted">Permite qualquer valor para tie-breaks prolongados (ex: 15-13, 20-18)</small>
                </div>
            </div>
            <div class="form-row" id="tiebreak-row-${index}" style="${set.tiebreak ? '' : 'display: none;'}">
                <div class="form-group">
                    <label>Tie-break Equipa 1</label>
                    <input type="number" min="0" step="1" id="set-${index}-tiebreakA" value="${set.tiebreak ? (set.tiebreak.pointsA || 0) : 0}" style="width: 100%;">
                    <small class="form-text text-muted">Tie-break normal: até 7 pontos. Super tie-break: até 10+ pontos. Permite qualquer valor.</small>
                </div>
                <div class="form-group">
                    <label>Tie-break Equipa 2</label>
                    <input type="number" min="0" step="1" id="set-${index}-tiebreakB" value="${set.tiebreak ? (set.tiebreak.pointsB || 0) : 0}" style="width: 100%;">
                    <small class="form-text text-muted">Tie-break normal: até 7 pontos. Super tie-break: até 10+ pontos. Permite qualquer valor.</small>
                </div>
            </div>
            <div style="margin-top: 10px;">
                <button type="button" class="btn btn-sm btn-secondary" onclick="toggleTiebreak(${index})" id="tiebreak-toggle-${index}">
                    ${set.tiebreak ? 'Remover Tie-break' : 'Adicionar Tie-break'}
                </button>
            </div>
        `;
        container.appendChild(setDiv);
    });
    
    // Set winner
    if (match.winner_team_id) {
        if (match.winner_team_id === match.team1_id) {
            document.getElementById('match-result-winner').value = 'team1';
        } else if (match.winner_team_id === match.team2_id) {
            document.getElementById('match-result-winner').value = 'team2';
        }
    }
    
    // Set status
    document.getElementById('match-result-status').value = match.status || 'finished';
    
    modal.classList.add('active');
}

function toggleTiebreak(setIndex) {
    const tiebreakRow = document.getElementById(`tiebreak-row-${setIndex}`);
    const toggleBtn = document.getElementById(`tiebreak-toggle-${setIndex}`);
    const tiebreakA = document.getElementById(`set-${setIndex}-tiebreakA`);
    const tiebreakB = document.getElementById(`set-${setIndex}-tiebreakB`);
    
    if (tiebreakRow.style.display === 'none' || !tiebreakRow.style.display) {
        tiebreakRow.style.display = 'flex';
        toggleBtn.textContent = 'Remover Tie-break';
        if (tiebreakA) tiebreakA.value = tiebreakA.value || '0';
        if (tiebreakB) tiebreakB.value = tiebreakB.value || '0';
    } else {
        tiebreakRow.style.display = 'none';
        toggleBtn.textContent = 'Adicionar Tie-break';
        if (tiebreakA) tiebreakA.value = '0';
        if (tiebreakB) tiebreakB.value = '0';
    }
}

async function saveMatchResult(event) {
    event.preventDefault();
    
    const id = document.getElementById('match-result-id').value;
    const winner = document.getElementById('match-result-winner').value;
    const status = document.getElementById('match-result-status').value;
    
    const match = matches.find(m => m.match_id === id);
    if (!match) {
        alert('Jogo não encontrado');
        return;
    }
    
    // Collect sets data
    const sets = [];
    const container = document.getElementById('match-result-sets-container');
    const setDivs = container.querySelectorAll('.form-group');
    
    // Count actual set divs (each set has a form-group wrapper)
    const actualSetDivs = Array.from(container.children).filter(child => 
        child.querySelector(`input[id^="set-"][id$="-gamesA"]`)
    );
    
    actualSetDivs.forEach((setDiv, index) => {
        const gamesAInput = setDiv.querySelector(`#set-${index}-gamesA`);
        const gamesBInput = setDiv.querySelector(`#set-${index}-gamesB`);
        const tiebreakAInput = setDiv.querySelector(`#set-${index}-tiebreakA`);
        const tiebreakBInput = setDiv.querySelector(`#set-${index}-tiebreakB`);
        
        const gamesA = parseInt(gamesAInput?.value || 0);
        const gamesB = parseInt(gamesBInput?.value || 0);
        
        const setData = {
            gamesA: gamesA,
            gamesB: gamesB,
            tiebreak: null
        };
        
        // Check if tiebreak row is visible and has values
        const tiebreakRow = document.getElementById(`tiebreak-row-${index}`);
        if (tiebreakRow && tiebreakRow.style.display !== 'none' && tiebreakAInput && tiebreakBInput) {
            const tiebreakA = parseInt(tiebreakAInput.value || 0);
            const tiebreakB = parseInt(tiebreakBInput.value || 0);
            if (tiebreakA > 0 || tiebreakB > 0) {
                setData.tiebreak = {
                    pointsA: tiebreakA,
                    pointsB: tiebreakB
                };
            }
        }
        
        sets.push(setData);
    });
    
    // Determine winner_team_id
    let winner_team_id = null;
    if (winner === 'team1') {
        winner_team_id = match.team1_id;
    } else if (winner === 'team2') {
        winner_team_id = match.team2_id;
    }
    
    const matchData = {
        sets_data: JSON.stringify(sets),
        winner_team_id: winner_team_id,
        status: status,
        // Reset current set data if match is finished
        current_set_index: status === 'finished' ? 0 : match.current_set_index,
        current_set_data: status === 'finished' ? JSON.stringify({ gamesA: 0, gamesB: 0, tiebreak: null }) : match.current_set_data,
        current_game_data: status === 'finished' ? JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null }) : match.current_game_data
    };
    
    try {
        await apiCall(`/matches/${id}`, 'PUT', matchData);
        closeModal('match-result-modal');
        loadMatches();
        loadDashboard();
        // Success - interface updates automatically, no need for alert
    } catch (error) {
        console.error('Error saving match result:', error);
        alert(`Erro ao guardar resultado: ${error.message}`);
    }
}

async function deleteMatch(id) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem eliminar jogos');
        return;
    }
    
    if (!confirm('Tem certeza que deseja eliminar este jogo?')) return;
    
    try {
        const result = await apiCall(`/matches/${id}`, 'DELETE');
        // DELETE returns null on success (204)
        loadMatches();
        loadDashboard();
    } catch (error) {
        console.error('Error deleting match:', error);
        if (error.message && 
            !error.message.includes('JSON') && 
            !error.message.includes('Unexpected') &&
            !error.message.includes('end of data')) {
            alert(`Erro ao eliminar jogo: ${error.message}`);
        }
    }
}

async function startMatch(id) {
    // Ensure currentUser is available
    if (!currentUser) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
            } catch (error) {
                console.error('Error parsing currentUser:', error);
                alert('Erro ao carregar informações do utilizador. Por favor, faça login novamente.');
                return;
            }
        } else {
            alert('Precisa de fazer login para iniciar um jogo.');
            return;
        }
    }
    
    // Validate match ID
    if (!id || isNaN(id)) {
        console.error('Invalid match ID:', id);
        alert('ID do jogo inválido');
        return;
    }
    
    try {
        await apiCall(`/matches/${id}/start`, 'POST');
        loadMatches();
        loadDashboard();
        // If referee, redirect to referee tool
        if (currentUser.role === 'referee') {
            setTimeout(() => openMatchPage(id), 500);
        }
    } catch (error) {
        console.error('Error starting match:', error);
        alert(`Erro ao iniciar jogo: ${error.message || 'Erro desconhecido'}`);
    }
}

// Make function globally accessible
window.startMatch = startMatch;

function openMatchPage(id) {
    // Ensure currentUser is available
    if (!currentUser) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
            } catch (error) {
                console.error('Error parsing currentUser:', error);
                alert('Erro ao carregar informações do utilizador. Por favor, faça login novamente.');
                window.location.href = 'index.html';
                return;
            }
        } else {
            alert('Precisa de fazer login para aceder a esta página.');
            window.location.href = 'index.html';
            return;
        }
    }
    
    // Validate match ID
    if (!id || isNaN(id)) {
        console.error('Invalid match ID:', id);
        alert('ID do jogo inválido');
        return;
    }
    
    // Check user role - referees go to referee tool, others to match page
    if (currentUser.role === 'referee') {
        window.location.href = `referee.html?id=${id}`;
    } else {
        window.location.href = `match.html?id=${id}`;
    }
}

// Make function globally accessible
window.openMatchPage = openMatchPage;

// Standings
async function loadStandings() {
    try {
        const categoryId = document.getElementById('filter-standing-category')?.value;
        const group = document.getElementById('filter-standing-group')?.value;
        
        let endpoint = '/standings';
        const params = new URLSearchParams();
        if (categoryId) params.append('category_id', categoryId);
        if (group) params.append('group', group);
        if (params.toString()) endpoint += '?' + params.toString();
        
        standings = await apiCall(endpoint);
        renderStandings();
    } catch (error) {
        console.error('Error loading standings:', error);
    }
}

function renderStandings() {
    const container = document.getElementById('standings-list');
    
    if (standings.length === 0) {
        container.innerHTML = '<p>Nenhuma classificação encontrada.</p>';
        return;
    }
    
    // Group by category and group
    const grouped = {};
    standings.forEach(standing => {
        const key = `${standing.category_name}-${standing.group_name}`;
        if (!grouped[key]) {
            grouped[key] = {
                category: standing.category_name,
                group: standing.group_name,
                standings: []
            };
        }
        grouped[key].standings.push(standing);
    });
    
    container.innerHTML = Object.values(grouped).map(group => {
        const sorted = group.standings.sort((a, b) => {
            if (a.group_rank && b.group_rank) return a.group_rank - b.group_rank;
            if (a.points !== b.points) return b.points - a.points;
            return b.games_won - a.games_won;
        });
        
        return `
            <div class="standings-table" style="margin-bottom: 2rem;">
                <h3 style="padding: 1rem; background: var(--bg-color); border-bottom: 2px solid var(--border-color);">
                    ${group.category} - Grupo ${group.group}
                </h3>
                <table>
                    <thead>
                        <tr>
                            <th>Pos</th>
                            <th>Equipa</th>
                            <th>J</th>
                            <th>V</th>
                            <th>D</th>
                            <th>Pts</th>
                            <th>Jogos V</th>
                            <th>Jogos D</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map((s, index) => `
                            <tr>
                                <td>
                                    <span class="rank-badge ${s.group_rank === 1 ? 'rank-1' : s.group_rank === 2 ? 'rank-2' : s.group_rank === 3 ? 'rank-3' : ''}">
                                        ${s.group_rank || index + 1}
                                    </span>
                                </td>
                                <td><strong>${s.team_name}</strong></td>
                                <td>${s.matches_played || 0}</td>
                                <td>${s.wins || 0}</td>
                                <td>${s.losses || 0}</td>
                                <td><strong>${s.points || 0}</strong></td>
                                <td>${s.games_won || 0}</td>
                                <td>${s.games_lost || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');
}

// Helper functions
function populateCategoryFilters() {
    const selects = ['filter-category', 'filter-match-category', 'filter-standing-category'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Todas as Categorias</option>' +
                categories.map(cat => `<option value="${cat.category_id}">${cat.name}</option>`).join('');
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal') && !event.target.id.includes('login')) {
        event.target.classList.remove('active');
    }
}

// Authentication
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        alert('Por favor, preencha username e password');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        if (response.status === 401) {
            alert('Credenciais inválidas');
            return;
        }
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Erro ao fazer login');
        }
        
        const data = await response.json();
        if (data && data.token && data.user) {
            // Store token for API calls
            localStorage.setItem('token', data.token);
            // Store user info
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            console.log('✅ Login successful:', currentUser);
            showApp();
        } else {
            alert('Credenciais inválidas');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(`Erro: ${error.message || 'Erro ao fazer login'}`);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    showLogin();
    document.getElementById('login-form').reset();
}

// Users Management (Admin only)
async function loadUsers() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        users = await apiCall('/users');
        renderUsers();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers() {
    const container = document.getElementById('users-list');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = '<p>Nenhum utilizador encontrado.</p>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="item-card">
            <div class="item-card-header">
                <div class="item-card-title">${user.username}</div>
                <div class="item-card-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editUser(${user.user_id})">Editar</button>
                    ${user.user_id !== currentUser.user_id ? 
                        `<button class="btn btn-sm btn-danger" onclick="deleteUser(${user.user_id})">Eliminar</button>` : 
                        ''}
                </div>
            </div>
            <div class="item-card-body">
                <div><strong>Role:</strong> <span class="badge badge-${user.role}">${user.role}</span></div>
            </div>
        </div>
    `).join('');
}

function openUserModal(userId = null) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    const title = document.getElementById('user-modal-title');
    
    if (userId) {
        const user = users.find(u => u.user_id === userId);
        document.getElementById('user-id').value = user.user_id;
        document.getElementById('user-username').value = user.username;
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-password').value = '';
        document.getElementById('user-password').placeholder = 'Deixar vazio para não alterar';
        document.getElementById('user-password').required = false;
        title.textContent = 'Editar Utilizador';
    } else {
        form.reset();
        document.getElementById('user-id').value = '';
        document.getElementById('user-password').required = true;
        document.getElementById('user-password').placeholder = '';
        title.textContent = 'Novo Utilizador';
    }
    
    modal.classList.add('active');
}

async function saveUser(event) {
    event.preventDefault();
    
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const id = document.getElementById('user-id').value;
    const username = document.getElementById('user-username').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    
    try {
        if (id) {
            const updates = { username, role };
            if (password) {
                updates.password = password;
            }
            await apiCall(`/users/${id}`, 'PUT', updates);
        } else {
            await apiCall('/users', 'POST', { username, password, role });
        }
        
        closeModal('user-modal');
        loadUsers();
    } catch (error) {
        console.error('Error saving user:', error);
        alert(`Erro: ${error.message || 'Erro ao guardar utilizador'}`);
    }
}

function editUser(id) {
    openUserModal(id);
}

async function deleteUser(id) {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (id === currentUser.user_id) {
        alert('Não pode eliminar o seu próprio utilizador');
        return;
    }
    
    if (!confirm('Tem certeza que deseja eliminar este utilizador?')) return;
    
    try {
        await apiCall(`/users/${id}`, 'DELETE');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        if (error.message && 
            !error.message.includes('JSON') && 
            !error.message.includes('Unexpected') &&
            !error.message.includes('end of data')) {
            alert(`Erro ao eliminar utilizador: ${error.message}`);
        }
    }
}

