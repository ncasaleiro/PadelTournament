// Padel Tournament Manager - Backoffice
// Version: v0.03-dev
// Last Updated: 2025-12-06 10:47:50
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
let tournaments = [];
let selectedTopTeams = new Set();

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
        document.getElementById('nav-tournaments').style.display = 'block';
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
        // Viewer can only see dashboard and viewer page (bracket/standings)
        // Hide all nav items first
        document.querySelectorAll('.nav-item').forEach(item => {
            item.style.display = 'none';
        });
        
        // Show dashboard
        const dashboardNav = document.querySelector('.nav-item[data-page="dashboard"]');
        if (dashboardNav) {
            dashboardNav.style.display = 'block';
        }
        
        // Add or show viewer page navigation
        let viewerNav = document.querySelector('.nav-item[data-page="viewer"]');
        if (!viewerNav) {
            const nav = document.querySelector('.sidebar-nav');
            viewerNav = document.createElement('a');
            viewerNav.href = '#';
            viewerNav.className = 'nav-item';
            viewerNav.dataset.page = 'viewer';
            viewerNav.innerHTML = '<span class="icon">🏆</span><span>Classificações</span>';
            nav.appendChild(viewerNav);
            // Add event listener to the new nav item
            viewerNav.addEventListener('click', (e) => {
                e.preventDefault();
                switchPage('viewer');
            });
        } else {
            viewerNav.style.display = 'block';
        }
        
        // Load tournaments for viewer
        loadTournamentsForViewer();
    }
    
    // Show/hide create buttons based on role
    // Updated: 2025-12-06 10:47:50 - v0.03-dev - Removed inline style manipulation to let CSS flexbox control positioning
    const createButtons = [
        { id: 'btn-new-category', name: 'Nova Categoria' },
        { id: 'btn-new-team', name: 'Nova Equipa' },
        { id: 'btn-new-match', name: 'Novo Jogo' },
        { id: 'btn-new-user', name: 'Novo Utilizador' },
        { id: 'btn-new-tournament', name: 'Novo Torneio' }
    ];
    
    createButtons.forEach(btnInfo => {
        const btn = document.getElementById(btnInfo.id);
        if (btn) {
            if (currentUser.role === 'admin') {
                // Remove any inline styles that might interfere with CSS flexbox positioning
                // Updated: 2025-12-05 18:15:00 - Let CSS handle positioning, don't set display/visibility
                btn.removeAttribute('style');
                btn.disabled = false;
            } else {
                btn.style.display = 'none';
                btn.disabled = true;
            }
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
            // Only prevent default and handle navigation for items with data-page attribute
            // Allow normal navigation for links without data-page (like live.html)
            if (item.dataset.page) {
                e.preventDefault();
                const page = item.dataset.page;
                switchPage(page);
            }
            // If no data-page, let the link navigate normally
        });
    });
}

function switchPage(page) {
    // Check permissions
    if (!currentUser) return;
    
    if (currentUser.role === 'viewer' && page !== 'dashboard' && page !== 'viewer') {
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
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    currentPage = page;
    
    // Load page-specific data
    if (page === 'dashboard') {
        loadDashboard();
    } else if (page === 'categories') {
        loadCategories();
    } else if (page === 'viewer') {
        loadTournamentsForViewer();
    } else if (page === 'teams') {
        loadTeams();
    } else if (page === 'matches') {
        loadMatches();
    } else if (page === 'standings') {
        loadStandings();
    } else if (page === 'users') {
        loadUsers();
    } else if (page === 'tournaments') {
        loadTournaments();
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
        console.log('🔵 [DEBUG] apiCall - Making fetch request to:', `${API_BASE}${endpoint}`);
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        console.log('🔵 [DEBUG] apiCall - Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        // Handle 204 No Content (DELETE operations) - return early, no parsing needed
        if (response.status === 204) {
            console.log('🔵 [DEBUG] apiCall - 204 No Content, returning null');
            return null;
        }
        
        // Check response status first
        if (!response.ok) {
            console.log('🔴 [DEBUG] apiCall - Response not OK, status:', response.status);
            // Try to get error message from response
            const contentType = response.headers.get('content-type');
            let errorMessage = 'Erro na requisição';
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    console.log('🔴 [DEBUG] apiCall - Error data:', errorData);
                    errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
                } catch (parseError) {
                    console.log('🔴 [DEBUG] apiCall - Failed to parse error JSON:', parseError);
                    // If JSON parse fails, use status text
                    errorMessage = response.statusText || `Erro ${response.status}`;
                }
            } else {
                // Not JSON, try text
                try {
                    const text = await response.text();
                    console.log('🔴 [DEBUG] apiCall - Error text:', text);
                    errorMessage = text || response.statusText || `Erro ${response.status}`;
                } catch (textError) {
                    console.log('🔴 [DEBUG] apiCall - Failed to get error text:', textError);
                    errorMessage = response.statusText || `Erro ${response.status}`;
                }
            }
            
            // Add status code info for better error messages
            if (response.status === 403) {
                errorMessage = 'Acesso negado. Apenas administradores podem realizar esta ação.';
            } else if (response.status === 401) {
                errorMessage = 'Não autenticado. Por favor, faça login novamente.';
            }
            
            console.log('🔴 [DEBUG] apiCall - Throwing error:', errorMessage);
            throw new Error(errorMessage);
        }
        
        // For successful responses, check if there's content
        const contentType = response.headers.get('content-type');
        console.log('🔵 [DEBUG] apiCall - Content-Type:', contentType);
        
        // If no content-type or not JSON, return null (successful but empty)
        if (!contentType || !contentType.includes('application/json')) {
            console.log('🔵 [DEBUG] apiCall - No JSON content-type, returning null');
            return null;
        }
        
        // Try to parse JSON, but handle empty responses gracefully
        try {
            console.log('🔵 [DEBUG] apiCall - Getting response text...');
            const text = await response.text();
            console.log('🔵 [DEBUG] apiCall - Response text length:', text.length);
            
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
        
        // Filter out matches without scheduled_date (draft matches)
        const scheduledMatches = matchesData.filter(m => m.scheduled_date && m.scheduled_date !== null && m.scheduled_date !== '');
        
        // Update stats (only count scheduled matches)
        document.getElementById('stat-categories').textContent = categoriesData.length;
        document.getElementById('stat-teams').textContent = teamsData.length;
        document.getElementById('stat-matches').textContent = scheduledMatches.length;
        document.getElementById('stat-playing').textContent = scheduledMatches.filter(m => m.status === 'playing').length;
        
        // Upcoming matches (scheduled)
        const upcoming = scheduledMatches
            .filter(m => m.status === 'scheduled')
            .sort((a, b) => {
                const dateA = a.scheduled_date || '9999-99-99';
                const dateB = b.scheduled_date || '9999-99-99';
                return dateA.localeCompare(dateB);
            })
            .slice(0, 5);
        
        renderMatchesList('upcoming-matches', upcoming);
        
        // Playing matches
        const playing = scheduledMatches.filter(m => m.status === 'playing');
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

// Updated: 2025-12-06 10:51:00 - v0.03-dev - Added duplicate name error handling
async function saveCategory(event) {
    event.preventDefault();
    
    // Only admin can create/edit categories
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem criar ou editar categorias');
        return;
    }
    
    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value;
    
    if (!name || name.trim() === '') {
        alert('Por favor, insira um nome para a categoria');
        return;
    }
    
    console.log('Saving category:', { id, name, currentUser, token: localStorage.getItem('token') ? 'present' : 'missing' });
    
    try {
        if (id) {
            const result = await apiCall(`/categories/${id}`, 'PUT', { name: name.trim() });
            console.log('Category updated:', result);
        } else {
            const result = await apiCall('/categories', 'POST', { name: name.trim() });
            console.log('Category created:', result);
        }
        
        closeModal('category-modal');
        loadCategories();
        loadDashboard();
    } catch (error) {
        console.error('Error saving category:', error);
        const errorMessage = error.message || 'Erro desconhecido';
        // Updated: 2025-12-06 10:51:00 - v0.03-dev - Show duplicate name errors clearly
        if (errorMessage.includes('Já existe')) {
            alert(`Erro: ${errorMessage}`);
        } else {
            alert(`Erro ao guardar categoria: ${errorMessage}`);
        }
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
        
        let endpoint = '/teams';
        const params = new URLSearchParams();
        if (categoryId) params.append('category_id', categoryId);
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
    
    // Only admin can create/edit teams
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem criar ou editar equipas');
        return;
    }
    
    const id = document.getElementById('team-id').value;
    const name = document.getElementById('team-name').value;
    const categoryId = document.getElementById('team-category').value;
    
    if (!name || name.trim() === '') {
        alert('Por favor, insira um nome para a equipa');
        return;
    }
    
    if (!categoryId) {
        alert('Por favor, selecione uma categoria');
        return;
    }
    
    try {
        if (id) {
            await apiCall(`/teams/${id}`, 'PUT', { name: name.trim(), category_id: categoryId });
        } else {
            await apiCall('/teams', 'POST', { name: name.trim(), category_id: categoryId });
        }
        
        closeModal('team-modal');
        loadTeams();
        loadDashboard();
    } catch (error) {
        console.error('Error saving team:', error);
        const errorMessage = error.message || 'Erro desconhecido';
        // Updated: 2025-12-06 10:51:00 - v0.03-dev - Show duplicate name errors clearly
        if (errorMessage.includes('Já existe')) {
            alert(`Erro: ${errorMessage}`);
        } else {
            alert(`Erro ao guardar equipa: ${errorMessage}`);
        }
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
        
        let allMatches = await apiCall(endpoint);
        
        // Filter out matches without scheduled_date (draft matches)
        // Only show matches that have been scheduled
        matches = allMatches.filter(match => match.scheduled_date && match.scheduled_date !== null && match.scheduled_date !== '');
        
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
                ${match.status === 'finished' ? 
                    `<button class="btn btn-sm btn-info" onclick="showMatchStatistics(${match.match_id})">Estatísticas</button>` : ''}
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
    const date = document.getElementById('match-date').value || null;
    const time = document.getElementById('match-time').value || null;
    const court = document.getElementById('match-court').value || null;
    const useSuperTiebreak = document.getElementById('match-use-super-tiebreak').checked;
    
    const matchData = {
        team1_id: team1Id,
        team2_id: team2Id,
        category_id: categoryId,
        phase,
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
    
    // Check if match is scheduled and warn if there's not enough time remaining
    const match = matches.find(m => m.match_id === id);
    if (match && match.scheduled_date && match.scheduled_time) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (match.scheduled_date === today) {
            const [scheduledH, scheduledM] = match.scheduled_time.split(':').map(Number);
            const scheduledMinutes = scheduledH * 60 + scheduledM;
            const [currentH, currentM] = currentTime.split(':').map(Number);
            const currentMinutes = currentH * 60 + currentM;
            
            // Get match duration from tournament if available, otherwise default to 90 minutes
            let matchDuration = 90;
            if (match.tournament_id && tournaments) {
                const tournament = tournaments.find(t => t.tournament_id === match.tournament_id);
                if (tournament && tournament.match_duration_minutes) {
                    matchDuration = tournament.match_duration_minutes;
                }
            }
            
            const slotEndMinutes = scheduledMinutes + matchDuration;
            const remainingMinutes = slotEndMinutes - currentMinutes;
            
            // Allow starting until the end of the slot, but warn if less time remains than duration
            if (remainingMinutes < matchDuration && remainingMinutes > 0) {
                const confirmMessage = `Atenção: Restam apenas ${remainingMinutes} minutos até ao fim do slot (duração prevista: ${matchDuration} minutos).\n\nDeseja iniciar o jogo mesmo assim?`;
                if (!confirm(confirmMessage)) {
                    return;
                }
            } else if (remainingMinutes <= 0) {
                // Slot has ended, but still allow starting
                if (!confirm(`O slot deste jogo já terminou. Deseja iniciar o jogo mesmo assim?`)) {
                    return;
                }
            }
        }
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
        
        let endpoint = '/standings';
        const params = new URLSearchParams();
        if (categoryId) params.append('category_id', categoryId);
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
    
    // Group by category only
    const grouped = {};
    standings.forEach(standing => {
        const key = standing.category_name;
        if (!grouped[key]) {
            grouped[key] = {
                category: standing.category_name,
                standings: []
            };
        }
        grouped[key].standings.push(standing);
    });
    
    container.innerHTML = Object.values(grouped).map(group => {
        const sorted = group.standings.sort((a, b) => {
            if (a.points !== b.points) return b.points - a.points;
            return b.games_won - a.games_won;
        });
        
        return `
            <div class="standings-table" style="margin-bottom: 2rem;">
                <h3 style="padding: 1rem; background: var(--bg-color); border-bottom: 2px solid var(--border-color);">
                    ${group.category}
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
                                    <span class="rank-badge ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}">
                                        ${index + 1}
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

// Match Statistics
async function showMatchStatistics(matchId) {
    const modal = document.getElementById('match-statistics-modal');
    const content = document.getElementById('match-statistics-content');
    const title = document.getElementById('match-statistics-modal-title');
    
    modal.classList.add('active');
    content.innerHTML = '<div class="loading">A carregar estatísticas...</div>';
    
    try {
        const response = await apiCall(`/matches/${matchId}/statistics`);
        if (!response) {
            throw new Error('Não foi possível carregar as estatísticas');
        }
        
        const { match, statistics, pointBreakdown } = response;
        title.textContent = `Estatísticas: ${match.team1_name} vs ${match.team2_name}`;
        
        // Build statistics HTML
        let html = `
            <div style="margin-bottom: 30px;">
                <h4>Informação da Partida</h4>
                <div class="form-row">
                    <div class="form-group">
                        <strong>Equipa 1:</strong> ${match.team1_name}
                    </div>
                    <div class="form-group">
                        <strong>Equipa 2:</strong> ${match.team2_name}
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <strong>Categoria:</strong> ${match.category_name || 'N/A'}
                    </div>
                    <div class="form-group">
                        <strong>Vencedor:</strong> ${match.winner_name || 'N/A'}
                    </div>
                </div>
                ${match.scheduled_date ? `<div><strong>Data:</strong> ${match.scheduled_date} ${match.scheduled_time || ''}</div>` : ''}
                ${match.court ? `<div><strong>Campo:</strong> ${match.court}</div>` : ''}
            </div>
            
            <div style="margin-bottom: 30px;">
                <h4>Resumo Estatístico</h4>
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div class="stat-card">
                        <div class="stat-value">${statistics.totalSets}</div>
                        <div class="stat-label">Sets Jogados</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${statistics.setsWonByTeam1}-${statistics.setsWonByTeam2}</div>
                        <div class="stat-label">Sets Ganhos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${statistics.totalGamesTeam1}-${statistics.totalGamesTeam2}</div>
                        <div class="stat-label">Total de Jogos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${statistics.totalPointsTeam1}-${statistics.totalPointsTeam2}</div>
                        <div class="stat-label">Total de Pontos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${statistics.tiebreaksPlayed}</div>
                        <div class="stat-label">Tie-breaks</div>
                    </div>
                    ${statistics.totalDuration ? `
                    <div class="stat-card">
                        <div class="stat-value">${statistics.totalDuration.formatted}</div>
                        <div class="stat-label">Duração</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h4>Detalhes por Set</h4>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background: var(--bg-color); border-bottom: 2px solid var(--border-color);">
                            <th style="padding: 10px; text-align: left;">Set</th>
                            <th style="padding: 10px; text-align: center;">${match.team1_name}</th>
                            <th style="padding: 10px; text-align: center;">${match.team2_name}</th>
                            <th style="padding: 10px; text-align: center;">Tie-break</th>
                            <th style="padding: 10px; text-align: center;">Vencedor</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        statistics.setDetails.forEach(set => {
            const tiebreakInfo = set.tiebreak ? 
                `${set.tiebreak.pointsA || 0}-${set.tiebreak.pointsB || 0}` : 
                '-';
            const winner = set.winner === 'team1' ? match.team1_name : 
                          set.winner === 'team2' ? match.team2_name : 'Empate';
            
            html += `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 10px;"><strong>Set ${set.setNumber}</strong></td>
                            <td style="padding: 10px; text-align: center;">${set.gamesTeam1}</td>
                            <td style="padding: 10px; text-align: center;">${set.gamesTeam2}</td>
                            <td style="padding: 10px; text-align: center;">${tiebreakInfo}</td>
                            <td style="padding: 10px; text-align: center;">${winner}</td>
                        </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Add point breakdown if available
        if (pointBreakdown && pointBreakdown.length > 0) {
            html += `
                <div style="margin-bottom: 30px;">
                    <h4>Fluxo de Pontuação (Últimos ${Math.min(50, pointBreakdown.length)} pontos)</h4>
                    <div style="max-height: 400px; overflow-y: auto; margin-top: 15px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="position: sticky; top: 0; background: var(--bg-color);">
                                <tr style="border-bottom: 2px solid var(--border-color);">
                                    <th style="padding: 8px; text-align: left;">#</th>
                                    <th style="padding: 8px; text-align: left;">Equipa</th>
                                    <th style="padding: 8px; text-align: left;">Tipo</th>
                                    <th style="padding: 8px; text-align: left;">Set</th>
                                    <th style="padding: 8px; text-align: left;">Pontuação</th>
                                    <th style="padding: 8px; text-align: left;">Hora</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            // Show last 50 points
            const recentPoints = pointBreakdown.slice(-50);
            recentPoints.forEach((point, index) => {
                const teamName = point.team === 'team1' ? match.team1_name : match.team2_name;
                const actionLabel = point.type === 'tiebreak_point' ? 'Ponto Tie-break' : 
                                   point.type === 'point' ? 'Ponto' : 'Jogo Ganho';
                const scoreDisplay = point.score.tiebreak || point.score.game || '-';
                const timestamp = new Date(point.timestamp).toLocaleTimeString('pt-PT');
                
                html += `
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <td style="padding: 8px;">${pointBreakdown.length - recentPoints.length + index + 1}</td>
                                    <td style="padding: 8px;"><strong>${teamName}</strong></td>
                                    <td style="padding: 8px;">${actionLabel}</td>
                                    <td style="padding: 8px;">Set ${point.set}</td>
                                    <td style="padding: 8px;">${scoreDisplay}</td>
                                    <td style="padding: 8px; font-size: 0.9em; color: #666;">${timestamp}</td>
                                </tr>
                `;
            });
            
            html += `
                            </tbody>
                        </table>
                    </div>
                    ${pointBreakdown.length > 50 ? `<p style="margin-top: 10px; color: #666; font-size: 0.9em;">Mostrando últimos 50 pontos de ${pointBreakdown.length} totais</p>` : ''}
                </div>
            `;
        }
        
        // Add additional statistics
        if (statistics.longestSet || statistics.shortestSet) {
            html += `
                <div style="margin-bottom: 30px;">
                    <h4>Estatísticas Adicionais</h4>
                    <div class="form-row">
                        ${statistics.longestSet ? `
                        <div class="form-group">
                            <strong>Set Mais Longo:</strong> Set ${statistics.longestSet.set} 
                            (${statistics.longestSet.gamesTeam1}-${statistics.longestSet.gamesTeam2}, 
                            ${statistics.longestSet.totalGames} jogos)
                        </div>
                        ` : ''}
                        ${statistics.shortestSet ? `
                        <div class="form-group">
                            <strong>Set Mais Curto:</strong> Set ${statistics.shortestSet.set} 
                            (${statistics.shortestSet.gamesTeam1}-${statistics.shortestSet.gamesTeam2}, 
                            ${statistics.shortestSet.totalGames} jogos)
                        </div>
                        ` : ''}
                    </div>
                    ${statistics.averagePointsPerGame ? `
                    <div>
                        <strong>Média de Pontos por Jogo:</strong> ${statistics.averagePointsPerGame}
                    </div>
                    ` : ''}
                    ${statistics.averageGamesPerSet ? `
                    <div>
                        <strong>Média de Jogos por Set:</strong> ${statistics.averageGamesPerSet}
                    </div>
                    ` : ''}
                </div>
            `;
        }
        
        content.innerHTML = html;
    } catch (error) {
        console.error('Error loading match statistics:', error);
        content.innerHTML = `
            <div class="alert alert-warning">
                <strong>Erro:</strong> Não foi possível carregar as estatísticas da partida.
                <br>${error.message}
            </div>
        `;
    }
}

// ============================================================================
// TOURNAMENT SCHEDULER - v0.02
// ============================================================================
// INDEPENDENT MODULE: This module is completely independent from referee and match modules.
// It serves ONLY to automatically create and schedule matches for tournaments.
// Once matches are created, they function normally like any manually created match.
// ============================================================================

// Tournaments Management
async function loadTournaments() {
    if (!currentUser || currentUser.role !== 'admin') {
        console.warn('⚠️ [DEBUG] Cannot load tournaments: user is not admin');
        return;
    }
    
    try {
        console.log('🔄 [DEBUG] Loading tournaments...');
        tournaments = await apiCall('/tournaments');
        console.log('✅ [DEBUG] Tournaments loaded:', tournaments?.length || 0, 'tournaments');
        
        // Ensure tournaments is an array
        if (!Array.isArray(tournaments)) {
            tournaments = [];
        }
        
        renderTournaments();
    } catch (error) {
        console.error('❌ [DEBUG] Error loading tournaments:', error);
        const container = document.getElementById('tournaments-list');
        if (container) {
            container.innerHTML = '<p>Erro ao carregar torneios. Por favor, tente novamente.</p>';
        }
    }
}

// Updated: 2025-12-06 10:47:50 - v0.03-dev - All buttons now properly inside card with flex-wrap
function renderTournaments() {
    const container = document.getElementById('tournaments-list');
    if (!container) return;
    
    if (tournaments.length === 0) {
        container.innerHTML = '<p>Nenhum torneio encontrado. Clique em "Novo Torneio" para criar um.</p>';
        return;
    }
    
    container.innerHTML = tournaments.map(tournament => {
        const statusLabels = {
            'draft': 'Rascunho',
            'active': 'Ativo',
            'completed': 'Concluído',
            'cancelled': 'Cancelado'
        };
        
        return `
            <div class="item-card">
                <div class="item-card-header">
                    <div class="item-card-title">${tournament.name}</div>
                    <div class="item-card-actions">
                        <button class="btn btn-sm btn-info" onclick="viewTournamentDetails(${tournament.tournament_id})">Ver Detalhes</button>
                        <button class="btn btn-sm btn-primary" onclick="openGenerateMatchesModal(${tournament.tournament_id})">Gerar Jogos</button>
                        ${currentUser && currentUser.role === 'admin' ? `
                            <button class="btn btn-sm btn-secondary" onclick="editTournament(${tournament.tournament_id})">Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteTournament(${tournament.tournament_id})">Eliminar</button>
                        ` : ''}
                    </div>
                </div>
                <div class="item-card-body">
                    <div><strong>Período:</strong> ${tournament.start_date} a ${tournament.end_date}</div>
                    <div><strong>Horário:</strong> ${tournament.start_time} - ${tournament.end_time} | <strong>Courts:</strong> ${tournament.courts} | <strong>Duração:</strong> ${tournament.match_duration_minutes} min</div>
                    <div><strong>Formato:</strong> ${tournament.use_super_tiebreak ? 'Super Tie-break' : '3 Sets'} | <strong>Estado:</strong> <span class="badge badge-${tournament.status}">${statusLabels[tournament.status] || tournament.status}</span></div>
                    ${tournament.category_ids && tournament.category_ids.length > 0 ? 
                        `<div><strong>Categorias:</strong> ${tournament.category_ids.map(catId => {
                            const cat = categories.find(c => c.category_id === catId);
                            return cat ? cat.name : `ID: ${catId}`;
                        }).join(', ')}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Updated: 2025-12-06 10:51:00 - v0.03-dev - Added category selection
async function openTournamentModal(tournamentId = null) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem criar ou editar torneios');
        return;
    }
    
    const modal = document.getElementById('tournament-modal');
    const form = document.getElementById('tournament-form');
    const title = document.getElementById('tournament-modal-title');
    
    // Load categories for selection
    await loadCategories();
    renderTournamentCategorySelection();
    
    if (tournamentId) {
        const tournament = tournaments.find(t => t.tournament_id === tournamentId);
        if (!tournament) {
            alert('Torneio não encontrado');
            return;
        }
        
        document.getElementById('tournament-id').value = tournament.tournament_id;
        document.getElementById('tournament-name').value = tournament.name;
        document.getElementById('tournament-start-date').value = tournament.start_date;
        document.getElementById('tournament-end-date').value = tournament.end_date;
        document.getElementById('tournament-start-time').value = tournament.start_time;
        document.getElementById('tournament-end-time').value = tournament.end_time;
        document.getElementById('tournament-courts').value = tournament.courts;
        document.getElementById('tournament-match-duration').value = tournament.match_duration_minutes;
        document.getElementById('tournament-match-format').value = tournament.use_super_tiebreak ? 'super_tiebreak' : '3_sets';
        document.getElementById('tournament-knockout-stage-type').value = tournament.knockout_stage_type || 'quarter_final';
        
        // Set selected categories
        const selectedCategoryIds = tournament.category_ids || [];
        selectedCategoryIds.forEach(catId => {
            const checkbox = document.getElementById(`tournament-category-${catId}`);
            if (checkbox) checkbox.checked = true;
        });
        
        title.textContent = 'Editar Torneio';
    } else {
        form.reset();
        document.getElementById('tournament-id').value = '';
        document.getElementById('tournament-match-format').value = 'super_tiebreak';
        document.getElementById('tournament-knockout-stage-type').value = 'quarter_final';
        // Clear all category checkboxes
        document.querySelectorAll('[id^="tournament-category-"]').forEach(cb => cb.checked = false);
        title.textContent = 'Novo Torneio';
    }
    
    modal.classList.add('active');
}

// Updated: 2025-12-06 10:51:00 - v0.03-dev - Render category checkboxes
function renderTournamentCategorySelection() {
    const container = document.getElementById('tournament-categories-container');
    if (!container) return;
    
    if (!categories || categories.length === 0) {
        container.innerHTML = '<p style="color: #666;">Nenhuma categoria disponível. Crie categorias primeiro.</p>';
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <label style="display: flex; align-items: center; margin-bottom: 10px; cursor: pointer; padding: 5px; border-radius: 4px; transition: background-color 0.2s;">
            <input type="checkbox" id="tournament-category-${cat.category_id}" 
                   value="${cat.category_id}" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer; flex-shrink: 0;">
            <span style="flex: 1; user-select: none;">${cat.name}</span>
        </label>
    `).join('');
    
    // Add hover effect
    container.querySelectorAll('label').forEach(label => {
        label.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f0f0f0';
        });
        label.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
    });
}

function editTournament(id) {
    openTournamentModal(id);
}

// Updated: 2025-12-06 10:51:00 - v0.03-dev - Added category_ids validation and selection
async function saveTournament(event) {
    event.preventDefault();
    
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem criar ou editar torneios');
        return;
    }
    
    const id = document.getElementById('tournament-id').value;
    const name = document.getElementById('tournament-name').value.trim();
    const startDate = document.getElementById('tournament-start-date').value;
    const endDate = document.getElementById('tournament-end-date').value;
    const startTime = document.getElementById('tournament-start-time').value;
    const endTime = document.getElementById('tournament-end-time').value;
    const courts = parseInt(document.getElementById('tournament-courts').value);
    const matchDuration = parseInt(document.getElementById('tournament-match-duration').value);
    const matchFormat = document.getElementById('tournament-match-format').value;
    const useSuperTiebreak = matchFormat === 'super_tiebreak';
    const knockoutStageType = document.getElementById('tournament-knockout-stage-type').value;
    
    // Get selected category IDs
    const selectedCategories = Array.from(document.querySelectorAll('[id^="tournament-category-"]:checked'))
        .map(cb => parseInt(cb.value));
    
    if (!name || !startDate || !endDate || !startTime || !endTime || !courts || !matchDuration) {
        alert('Por favor, preencha todos os campos');
        return;
    }
    
    if (selectedCategories.length === 0) {
        alert('Por favor, selecione pelo menos uma categoria para o torneio');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('A data de início deve ser anterior à data de fim');
        return;
    }
    
    try {
        const tournamentData = {
            name,
            start_date: startDate,
            end_date: endDate,
            start_time: startTime,
            end_time: endTime,
            courts,
            match_duration_minutes: matchDuration,
            use_super_tiebreak: useSuperTiebreak,
            category_ids: selectedCategories,
            knockout_stage_type: knockoutStageType
        };
        
        if (id) {
            await apiCall(`/tournaments/${id}`, 'PUT', tournamentData);
        } else {
            await apiCall('/tournaments', 'POST', tournamentData);
        }
        
        closeModal('tournament-modal');
        loadTournaments();
    } catch (error) {
        console.error('Error saving tournament:', error);
        const errorMessage = error.message || 'Erro desconhecido';
        alert(`Erro ao guardar torneio: ${errorMessage}`);
    }
}

async function deleteTournament(id) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem eliminar torneios');
        return;
    }
    
    if (!confirm('Tem certeza que deseja eliminar este torneio? Esta ação não pode ser desfeita e eliminará todos os jogos associados.')) return;
    
    try {
        console.log('🗑️ [DEBUG] Deleting tournament:', id);
        const result = await apiCall(`/tournaments/${id}`, 'DELETE');
        console.log('✅ [DEBUG] Tournament deleted successfully:', result);
        
        // Reload tournaments list
        await loadTournaments();
        
        // Show success message
        alert('Torneio eliminado com sucesso!');
    } catch (error) {
        console.error('❌ [DEBUG] Error deleting tournament:', error);
        console.error('❌ [DEBUG] Error details:', {
            message: error.message,
            stack: error.stack
        });
        alert(`Erro ao eliminar torneio: ${error.message || 'Erro desconhecido'}`);
    }
}

async function viewTournamentDetails(tournamentId) {
    const modal = document.getElementById('tournament-details-modal');
    const content = document.getElementById('tournament-details-content');
    const title = document.getElementById('tournament-details-title');
    
    currentTournamentId = tournamentId;
    
    modal.classList.add('active');
    content.innerHTML = '<div class="loading">A carregar...</div>';
    
    try {
        const tournament = await apiCall(`/tournaments/${tournamentId}`);
        const tournamentMatches = await apiCall(`/tournaments/${tournamentId}/matches`);
        
        // Set initial calendar date if not set
        if (!currentCalendarDate) {
            currentCalendarDate = new Date(tournament.start_date);
        }
        
        currentTournamentId = tournamentId;
        title.textContent = `Detalhes: ${tournament.name}`;
        
        let html = `
            <div style="margin-bottom: 30px;">
                <h4>Informação do Torneio</h4>
                <div class="form-row">
                    <div class="form-group">
                        <strong>Nome:</strong> ${tournament.name}
                    </div>
                    <div class="form-group">
                        <strong>Estado:</strong> ${tournament.status}
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <strong>Período:</strong> ${tournament.start_date} a ${tournament.end_date}
                    </div>
                    <div class="form-group">
                        <strong>Horário:</strong> ${tournament.start_time} - ${tournament.end_time}
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <strong>Courts:</strong> ${tournament.courts}
                    </div>
                    <div class="form-group">
                        <strong>Duração do Jogo:</strong> ${tournament.match_duration_minutes} minutos
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4>Calendário de Jogos (${tournamentMatches.length})</h4>
                    <div>
                        <button class="btn btn-sm btn-secondary" onclick="previousCalendarDay(${tournamentId})" id="prev-day-btn">◀ Dia Anterior</button>
                        <span id="current-calendar-date" style="margin: 0 15px; font-weight: 600;"></span>
                        <button class="btn btn-sm btn-secondary" onclick="nextCalendarDay(${tournamentId})" id="next-day-btn">Dia Seguinte ▶</button>
                    </div>
                </div>
                ${tournamentMatches.length === 0 ? '<p>Nenhum jogo gerado ainda.</p>' : ''}
        `;
        
        if (tournamentMatches.length > 0) {
            // Set CSS variable for courts
            document.documentElement.style.setProperty('--courts', tournament.courts);
            // Render calendar
            html += renderTournamentCalendar(tournament, tournamentMatches, tournamentId);
        }
        
        html += '</div>';
        content.innerHTML = html;
        
        // Scroll to top of content area
        setTimeout(() => {
            content.scrollTop = 0;
        }, 100);
        
        // Update date display after rendering
        const dateDisplay = document.getElementById('current-calendar-date');
        if (dateDisplay && currentCalendarDate) {
            const dateStrFormatted = currentCalendarDate.toLocaleDateString('pt-PT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            dateDisplay.textContent = dateStrFormatted.charAt(0).toUpperCase() + dateStrFormatted.slice(1);
        }
    } catch (error) {
        console.error('Error loading tournament details:', error);
        content.innerHTML = `
            <div class="alert alert-warning">
                <strong>Erro:</strong> Não foi possível carregar os detalhes do torneio.
                <br>${error.message}
            </div>
        `;
    }
}

function openGenerateMatchesModal(tournamentId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem gerar jogos');
        return;
    }
    
    const modal = document.getElementById('generate-matches-modal');
    const form = document.getElementById('generate-matches-form');
    
    document.getElementById('generate-tournament-id').value = tournamentId;
    
    // Get tournament for later use
    const currentTournament = tournaments.find(t => t.tournament_id === parseInt(tournamentId));
    
    // Populate categories list with checkboxes and teams per group inputs
    const categoriesList = document.getElementById('generate-categories-list');
    if (categoriesList) {
        categoriesList.innerHTML = categories.map(cat => `
            <div style="display: flex; align-items: center; padding: 5px; margin: 5px 0; border-bottom: 1px solid #eee;">
                <input type="checkbox" id="category-${cat.category_id}" class="category-checkbox" value="${cat.category_id}" style="margin-right: 10px;">
                <label for="category-${cat.category_id}" style="cursor: pointer; flex: 1; margin-right: 10px;">${cat.name}</label>
                <label style="font-size: 0.9em; margin-right: 5px;">Equipas/grupo:</label>
                <input type="number" id="teams-per-group-${cat.category_id}" class="teams-per-group-input" min="3" max="4" value="4" style="width: 60px; padding: 4px;" disabled>
            </div>
        `).join('');
        
        // Enable/disable teams per group inputs based on checkbox state
        categoriesList.querySelectorAll('.category-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const categoryId = this.value;
                const teamsInput = document.getElementById(`teams-per-group-${categoryId}`);
                if (teamsInput) {
                    teamsInput.disabled = !this.checked;
                }
            });
        });
    }
    
    // Reset form
    const phaseSelectEl = document.getElementById('generate-phase');
    if (phaseSelectEl) phaseSelectEl.value = 'Group';
    
    const teamsPerGroupInput = document.getElementById('generate-teams-per-group');
    if (teamsPerGroupInput) teamsPerGroupInput.value = 4;
    
    const autoScheduleCheckboxEl = document.getElementById('generate-auto-schedule');
    if (autoScheduleCheckboxEl) autoScheduleCheckboxEl.checked = true;
    
    const createPlaceholdersCheckboxEl = document.getElementById('generate-create-placeholders');
    if (createPlaceholdersCheckboxEl) createPlaceholdersCheckboxEl.checked = false;
    
    const matchFormatSelect = document.getElementById('generate-match-format');
    if (matchFormatSelect) matchFormatSelect.value = 'tournament_default';
    
    const topTeamsSection = document.getElementById('top-teams-section');
    if (topTeamsSection) topTeamsSection.style.display = 'none';
    
    const qualifiedTeamsSection = document.getElementById('qualified-teams-section');
    if (qualifiedTeamsSection) qualifiedTeamsSection.style.display = 'none';
    
    // Initially hide teams-per-group-group (will show only if exactly 1 category selected)
    const teamsPerGroupGroup = document.getElementById('teams-per-group-group');
    if (teamsPerGroupGroup) {
        teamsPerGroupGroup.style.display = 'none';
    }
    
    // Show/hide sections based on phase
    const phaseSelect = document.getElementById('generate-phase');
    if (phaseSelect) {
        phaseSelect.addEventListener('change', function() {
            const phase = this.value;
            const selectedCategories = getSelectedCategories();
            const teamsPerGroupGroup = document.getElementById('teams-per-group-group');
            
            if (phase === 'Group') {
                // Show general field only if 1 category selected, hide if multiple
                if (teamsPerGroupGroup) {
                    if (selectedCategories.length === 1) {
                        teamsPerGroupGroup.style.display = 'block';
                    } else {
                        teamsPerGroupGroup.style.display = 'none';
                    }
                }
                const topTeamsSection = document.getElementById('top-teams-section');
                if (topTeamsSection) topTeamsSection.style.display = 'none';
                const qualifiedTeamsSection = document.getElementById('qualified-teams-section');
                if (qualifiedTeamsSection) qualifiedTeamsSection.style.display = 'none';
                const createPlaceholdersSection = document.getElementById('create-placeholders-section');
                if (createPlaceholdersSection) createPlaceholdersSection.style.display = 'none';
            } else {
                if (teamsPerGroupGroup) teamsPerGroupGroup.style.display = 'none';
                const topTeamsSection = document.getElementById('top-teams-section');
                if (topTeamsSection) topTeamsSection.style.display = 'none';
                const qualifiedTeamsSection = document.getElementById('qualified-teams-section');
                if (qualifiedTeamsSection) qualifiedTeamsSection.style.display = 'block';
                const createPlaceholdersSection = document.getElementById('create-placeholders-section');
                if (createPlaceholdersSection) createPlaceholdersSection.style.display = 'block';
            }
        });
    }
    
    // Load top teams when categories change (for Group phase)
    // Also show/hide teams-per-group-group based on number of selected categories
    if (categoriesList) {
        categoriesList.addEventListener('change', function(e) {
            if (e.target.classList.contains('category-checkbox')) {
                const phase = document.getElementById('generate-phase').value;
                const selectedCategories = getSelectedCategories();
                
                // Show/hide general teams-per-group field based on number of selected categories
                const teamsPerGroupGroup = document.getElementById('teams-per-group-group');
                if (teamsPerGroupGroup && phase === 'Group') {
                    // Only show if exactly 1 category selected, hide otherwise (0 or 2+)
                    teamsPerGroupGroup.style.display = selectedCategories.length === 1 ? 'block' : 'none';
                }
                
                if (phase === 'Group' && selectedCategories.length > 0) {
                    loadTopTeamsSelectorMulti(selectedCategories);
                } else if (phase !== 'Group' && selectedCategories.length > 0) {
                    loadQualifiedTeamsSelectorMulti(selectedCategories);
                }
            }
        });
    }
    
    // Handle phase change (if not already added above)
    if (phaseSelect && !phaseSelect.hasAttribute('data-phase-listener')) {
        phaseSelect.setAttribute('data-phase-listener', 'true');
        phaseSelect.addEventListener('change', function() {
            const phase = this.value;
            const selectedCategories = getSelectedCategories();
            const autoQualifySection = document.getElementById('auto-qualify-section');
            const phaseScheduleSection = document.getElementById('phase-schedule-section');
            const phaseTimeSection = document.getElementById('phase-time-section');
            
            if (phase !== 'Group') {
                if (autoQualifySection) autoQualifySection.style.display = 'block';
                const createPlaceholdersSection = document.getElementById('create-placeholders-section');
                if (createPlaceholdersSection) createPlaceholdersSection.style.display = 'block';
                if (phaseScheduleSection) phaseScheduleSection.style.display = 'block';
                if (phaseTimeSection) phaseTimeSection.style.display = 'block';
                if (selectedCategories.length > 0) {
                    if (selectedCategories.length === 1) {
                        loadQualifiedTeamsSelector(selectedCategories[0]);
                    } else {
                        loadQualifiedTeamsSelectorMulti(selectedCategories);
                    }
                }
            } else {
                if (autoQualifySection) autoQualifySection.style.display = 'none';
                if (phaseScheduleSection) phaseScheduleSection.style.display = 'none';
                if (phaseTimeSection) phaseTimeSection.style.display = 'none';
                if (selectedCategories.length > 0) {
                    loadTopTeamsSelectorMulti(selectedCategories);
                }
            }
        });
    }
    
    // Handle auto-schedule checkbox change
    const autoScheduleCheckboxForListener = document.getElementById('generate-auto-schedule');
    if (autoScheduleCheckboxForListener && !autoScheduleCheckboxForListener.hasAttribute('data-auto-schedule-listener')) {
        autoScheduleCheckboxForListener.setAttribute('data-auto-schedule-listener', 'true');
        autoScheduleCheckboxForListener.addEventListener('change', function() {
            const isChecked = this.checked;
            const phaseScheduleSection = document.getElementById('phase-schedule-section');
            const phaseTimeSection = document.getElementById('phase-time-section');
            const phase = document.getElementById('generate-phase').value;
            
            if (isChecked && phase !== 'Group') {
                if (phaseScheduleSection) phaseScheduleSection.style.display = 'block';
                if (phaseTimeSection) phaseTimeSection.style.display = 'block';
            } else {
                if (phaseScheduleSection) phaseScheduleSection.style.display = 'none';
                if (phaseTimeSection) phaseTimeSection.style.display = 'none';
            }
        });
    }
    
    // Populate day time overrides
    if (currentTournament) {
        populateDayTimeOverrides(currentTournament);
    }
    
    modal.classList.add('active');
}

// Day time overrides management
function populateDayTimeOverrides(tournament) {
    const container = document.getElementById('day-time-overrides-list');
    if (!container || !tournament) return;
    
    // Generate date range
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    const dates = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
    }
    
    // Create input fields for each day
    container.innerHTML = dates.map(date => {
        const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('pt-PT', { 
            weekday: 'short', 
            day: '2-digit', 
            month: '2-digit' 
        });
        return `
            <div class="day-time-override-item" style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <label style="min-width: 100px; font-weight: bold;">${dateFormatted}:</label>
                <input type="date" class="override-date" value="${date}" readonly style="flex: 1; background: #e9ecef;">
                <label style="min-width: 80px;">Início:</label>
                <input type="time" class="override-start-time" value="${tournament.start_time}" style="flex: 1;">
                <label style="min-width: 80px;">Fim:</label>
                <input type="time" class="override-end-time" value="${tournament.end_time}" style="flex: 1;">
            </div>
        `;
    }).join('');
}

function getDayTimeOverrides() {
    console.log('🔵 [DEBUG] getDayTimeOverrides called');
    const overrides = {};
    const overrideItems = document.querySelectorAll('.day-time-override-item');
    console.log('🔵 [DEBUG] Found override items:', overrideItems.length);
    
    overrideItems.forEach((item, index) => {
        console.log('🔵 [DEBUG] Processing override item', index);
        const dateInput = item.querySelector('.override-date');
        const startTimeInput = item.querySelector('.override-start-time');
        const endTimeInput = item.querySelector('.override-end-time');
        
        console.log('🔵 [DEBUG] Inputs found:', {
            date: dateInput?.value,
            startTime: startTimeInput?.value,
            endTime: endTimeInput?.value
        });
        
        if (dateInput && dateInput.value && startTimeInput && startTimeInput.value && endTimeInput && endTimeInput.value) {
            overrides[dateInput.value] = {
                startTime: startTimeInput.value,
                endTime: endTimeInput.value
            };
            console.log('🔵 [DEBUG] Added override for date:', dateInput.value);
        }
    });
    
    console.log('🔵 [DEBUG] Final overrides:', overrides);
    return overrides;
}

function loadTopTeamsSelector(categoryId) {
    loadTopTeamsSelectorMulti([categoryId]);
}

function loadTopTeamsSelectorMulti(categoryIds) {
    if (!categoryIds || categoryIds.length === 0) {
        document.getElementById('top-teams-section').style.display = 'none';
        return;
    }
    
    const container = document.getElementById('top-teams-list');
    const teamsPerGroup = parseInt(document.getElementById('generate-teams-per-group').value) || 4;
    
    let allHtml = '';
    categoryIds.forEach(categoryId => {
        const categoryTeams = teams.filter(t => t.category_id === parseInt(categoryId));
        if (categoryTeams.length === 0) return;
        
        const category = categories.find(c => c.category_id === parseInt(categoryId));
        const categoryName = category ? category.name : `Categoria ${categoryId}`;
        const numGroups = Math.ceil(categoryTeams.length / teamsPerGroup);
        const maxTopTeams = numGroups * 2;
        
        // Filter selectedTopTeams to only include teams from this category
        const categoryTeamIds = new Set(categoryTeams.map(t => t.team_id));
        const categorySelectedTopTeams = Array.from(selectedTopTeams).filter(id => categoryTeamIds.has(id));
        
        allHtml += `<div style="margin-bottom: 15px; padding: 10px; background: #f0f0f0; border-radius: 4px;"><strong>${categoryName}</strong>`;
        allHtml += categoryTeams.map(team => {
            const isSelected = selectedTopTeams.has(team.team_id);
            return `
                <div class="top-team-item ${isSelected ? 'selected' : ''}" style="display: flex; align-items: center; padding: 5px; margin: 5px 0;">
                    <input type="checkbox" id="top-team-${team.team_id}" ${isSelected ? 'checked' : ''} 
                           onchange="toggleTopTeam(${team.team_id}, ${maxTopTeams}, ${categoryId})">
                    <label for="top-team-${team.team_id}" style="cursor: pointer; margin-left: 8px; flex: 1;">${team.name}</label>
                </div>
            `;
        }).join('');
        allHtml += `<small style="display: block; margin-top: 5px; color: #666;">Máximo ${maxTopTeams} top teams (2 por grupo)</small></div>`;
    });
    
    container.innerHTML = allHtml;
    document.getElementById('top-teams-section').style.display = 'block';
}

function loadQualifiedTeamsSelectorMulti(categoryIds) {
    // For multiple categories, show message that manual selection is needed
    const container = document.getElementById('qualified-teams-list');
    container.innerHTML = '<p style="color: #666;">Para múltiplas categorias, use a qualificação automática ou selecione uma categoria de cada vez.</p>';
    document.getElementById('qualified-teams-section').style.display = 'block';
}

async function loadQualifiedTeamsSelector(categoryId) {
    const phase = document.getElementById('generate-phase').value;
    const tournamentId = document.getElementById('generate-tournament-id').value;
    const teamsPerGroup = parseInt(document.getElementById('generate-teams-per-group').value) || 4;
    
    const container = document.getElementById('qualified-teams-list');
    container.innerHTML = '<p>A carregar qualificados...</p>';
    
    try {
        // Try to get qualified teams automatically from group standings
        const response = await apiCall(`/tournaments/${tournamentId}/qualified-teams?category_id=${categoryId}&phase=${phase}&teams_per_group=${teamsPerGroup}`, 'GET');
        
        if (response.qualified_teams && response.qualified_teams.length > 0) {
            // Show auto-qualified teams with group info
            container.innerHTML = `
                <div style="margin-bottom: 10px; padding: 10px; background: #e8f5e9; border-radius: 4px;">
                    <strong>Qualificados automaticamente dos grupos:</strong>
                </div>
                ${response.qualified_teams.map(team => `
                    <div style="display: flex; align-items: center; padding: 5px; margin: 5px 0; background: #f5f5f5; border-radius: 4px;">
                        <input type="checkbox" id="qualified-team-${team.team_id}" class="qualified-team-checkbox" value="${team.team_id}" checked disabled>
                        <label for="qualified-team-${team.team_id}" style="cursor: pointer; margin-left: 8px; flex: 1;">
                            ${team.team_name || 'Equipa ' + team.team_id} 
                            <span style="color: #666; font-size: 0.9em;">(Grupo ${team.group_name}, ${team.group_rank}º lugar)</span>
                        </label>
                    </div>
                `).join('')}
                <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 4px; font-size: 0.9em;">
                    <strong>Nota:</strong> Os qualificados são calculados automaticamente com base nas classificações dos grupos. 
                    Os jogos serão emparelhados: 1º Grupo A vs 2º Grupo B, 1º Grupo B vs 2º Grupo A, etc.
                </div>
            `;
            
            // Enable auto-qualify checkbox
            const autoQualifyCheckbox = document.getElementById('generate-auto-qualify');
            if (autoQualifyCheckbox) {
                autoQualifyCheckbox.checked = true;
            }
        } else {
            // Fallback: show all teams for manual selection
            const categoryTeams = teams.filter(t => t.category_id === parseInt(categoryId));
            container.innerHTML = `
                <div style="margin-bottom: 10px; padding: 10px; background: #fff3cd; border-radius: 4px;">
                    <strong>Atenção:</strong> Nenhum qualificado encontrado. Selecione manualmente as equipas qualificadas.
                </div>
                ${categoryTeams.map(team => `
                    <div style="display: flex; align-items: center; padding: 5px; margin: 5px 0;">
                        <input type="checkbox" id="qualified-team-${team.team_id}" class="qualified-team-checkbox" value="${team.team_id}">
                        <label for="qualified-team-${team.team_id}" style="cursor: pointer; margin-left: 8px; flex: 1;">${team.name}</label>
                    </div>
                `).join('')}
            `;
        }
    } catch (error) {
        console.error('Error loading qualified teams:', error);
        // Fallback: show all teams
        const categoryTeams = teams.filter(t => t.category_id === parseInt(categoryId));
        container.innerHTML = categoryTeams.map(team => `
            <div style="display: flex; align-items: center; padding: 5px; margin: 5px 0;">
                <input type="checkbox" id="qualified-team-${team.team_id}" class="qualified-team-checkbox" value="${team.team_id}">
                <label for="qualified-team-${team.team_id}" style="cursor: pointer; margin-left: 8px; flex: 1;">${team.name}</label>
            </div>
        `).join('');
    }
    
    document.getElementById('qualified-teams-section').style.display = 'block';
}

function toggleTopTeam(teamId, maxTopTeams, categoryId) {
    const checkbox = document.getElementById(`top-team-${teamId}`);
    if (!checkbox) return;
    
    const item = checkbox.closest('.top-team-item');
    const isCurrentlySelected = selectedTopTeams.has(teamId);
    
    // Count selected teams from current category
    const categoryTeamIds = teams
        .filter(t => t.category_id === parseInt(categoryId))
        .map(t => t.team_id);
    const categorySelectedCount = Array.from(selectedTopTeams)
        .filter(id => categoryTeamIds.includes(id)).length;
    
    if (!isCurrentlySelected) {
        if (categorySelectedCount >= maxTopTeams) {
            checkbox.checked = false;
            alert(`Pode selecionar no máximo ${maxTopTeams} top teams (2 por grupo) para esta categoria`);
            return;
        }
        selectedTopTeams.add(teamId);
        if (item) item.classList.add('selected');
    } else {
        selectedTopTeams.delete(teamId);
        if (item) item.classList.remove('selected');
    }
}

function getSelectedCategories() {
    console.log('🔵 [DEBUG] getSelectedCategories called');
    const checkboxes = document.querySelectorAll('.category-checkbox:checked');
    console.log('🔵 [DEBUG] Found checkboxes:', checkboxes.length);
    const categories = Array.from(checkboxes).map(cb => {
        const value = parseInt(cb.value);
        console.log('🔵 [DEBUG] Checkbox value:', cb.value, 'parsed:', value);
        return value;
    });
    console.log('🔵 [DEBUG] Selected categories:', categories);
    return categories;
}

async function generateTournamentMatches(event) {
    console.log('🔵 [DEBUG] generateTournamentMatches called', event);
    try {
        if (event) {
            event.preventDefault();
        }
        console.log('🔵 [DEBUG] After preventDefault');
        
        if (!currentUser || currentUser.role !== 'admin') {
            console.log('🔴 [DEBUG] User check failed:', { currentUser, role: currentUser?.role });
            alert('Apenas administradores podem gerar jogos');
            return;
        }
        console.log('🔵 [DEBUG] User check passed');
        
        const tournamentIdInput = document.getElementById('generate-tournament-id');
        console.log('🔵 [DEBUG] Tournament ID input:', tournamentIdInput, tournamentIdInput?.value);
        if (!tournamentIdInput || !tournamentIdInput.value) {
            alert('Erro: ID do torneio não encontrado');
            return;
        }
        
        const tournamentId = parseInt(tournamentIdInput.value);
        console.log('🔵 [DEBUG] Tournament ID parsed:', tournamentId);
        if (isNaN(tournamentId)) {
            alert('Erro: ID do torneio inválido');
            return;
        }
        
        console.log('🔵 [DEBUG] Getting selected categories...');
        const selectedCategories = getSelectedCategories();
        console.log('🔵 [DEBUG] Selected categories:', selectedCategories);
        
        const phaseSelect = document.getElementById('generate-phase');
        console.log('🔵 [DEBUG] Phase select:', phaseSelect);
        if (!phaseSelect) {
            alert('Erro: Campo de fase não encontrado');
            return;
        }
        const phase = phaseSelect.value;
        console.log('🔵 [DEBUG] Phase:', phase);
        
        const autoScheduleCheckbox = document.getElementById('generate-auto-schedule');
        const autoSchedule = autoScheduleCheckbox ? autoScheduleCheckbox.checked : false;
        console.log('🔵 [DEBUG] Auto schedule:', autoSchedule);
        
        const matchFormatSelect = document.getElementById('generate-match-format');
        const matchFormat = matchFormatSelect ? matchFormatSelect.value : 'tournament_default';
        console.log('🔵 [DEBUG] Match format:', matchFormat);
        
        if (selectedCategories.length === 0) {
            console.log('🔴 [DEBUG] No categories selected');
            alert('Por favor, selecione pelo menos uma categoria');
            return;
        }
        
        // Get tournament to check default format
        console.log('🔵 [DEBUG] Finding tournament, tournaments array length:', tournaments.length);
        const tournament = tournaments.find(t => t.tournament_id === parseInt(tournamentId));
        console.log('🔵 [DEBUG] Tournament found:', tournament);
        let useSuperTiebreak;
        if (matchFormat === 'tournament_default') {
            useSuperTiebreak = tournament ? tournament.use_super_tiebreak : false;
        } else {
            useSuperTiebreak = matchFormat === 'super_tiebreak';
        }
        console.log('🔵 [DEBUG] Use super tiebreak:', useSuperTiebreak);
        
        // Get common settings
        console.log('🔵 [DEBUG] Getting start date/time...');
        const startDate = document.getElementById('generate-start-date')?.value || null;
        const startTime = document.getElementById('generate-start-time')?.value || null;
        console.log('🔵 [DEBUG] Start date:', startDate, 'Start time:', startTime);
        
        console.log('🔵 [DEBUG] Getting day time overrides...');
        const dayTimeOverrides = getDayTimeOverrides();
        console.log('🔵 [DEBUG] Day time overrides:', dayTimeOverrides);
        
        // Generate matches for multiple categories
        console.log('🔵 [DEBUG] Selected categories count:', selectedCategories.length);
        if (selectedCategories.length === 1) {
            console.log('🔵 [DEBUG] Single category path');
            // Single category - use existing endpoints
            const categoryId = selectedCategories[0];
            console.log('🔵 [DEBUG] Category ID:', categoryId);
            let result;
            
            if (phase === 'Group') {
                console.log('🔵 [DEBUG] Group phase - single category');
                const teamsPerGroupInput = document.getElementById('generate-teams-per-group');
                console.log('🔵 [DEBUG] Teams per group input:', teamsPerGroupInput);
                const teamsPerGroup = teamsPerGroupInput ? parseInt(teamsPerGroupInput.value) || 4 : 4;
                console.log('🔵 [DEBUG] Teams per group:', teamsPerGroup);
                
                console.log('🔵 [DEBUG] Filtering top teams, selectedTopTeams:', selectedTopTeams);
                console.log('🔵 [DEBUG] Teams array length:', teams.length);
                const topTeamIds = Array.from(selectedTopTeams).filter(teamId => {
                    const team = teams.find(t => t.team_id === teamId);
                    return team && team.category_id === categoryId;
                });
                console.log('🔵 [DEBUG] Top team IDs:', topTeamIds);
                
                let groupStageData = {
                    category_id: categoryId,
                    teams_per_group: teamsPerGroup,
                    top_team_ids: topTeamIds,
                    auto_schedule: autoSchedule,
                    use_super_tiebreak: useSuperTiebreak,
                    start_date: startDate,
                    start_time: startTime
                };
                
                if (Object.keys(dayTimeOverrides).length > 0) {
                    groupStageData.day_time_overrides = dayTimeOverrides;
                }
                
                console.log('🔵 [DEBUG] Group stage data:', JSON.stringify(groupStageData, null, 2));
                console.log('🔵 [DEBUG] Calling API: /tournaments/' + tournamentId + '/generate-group-stage');
                result = await apiCall(`/tournaments/${tournamentId}/generate-group-stage`, 'POST', groupStageData);
                console.log('🔵 [DEBUG] API response received:', result);
            } else {
                console.log('🔵 [DEBUG] Knockout stage - single category');
                // Knockout stage - single category
                const autoQualifyCheckbox = document.getElementById('generate-auto-qualify');
                const autoQualify = autoQualifyCheckbox ? autoQualifyCheckbox.checked : false;
                console.log('🔵 [DEBUG] Auto qualify:', autoQualify);
                
                const createPlaceholdersCheckbox = document.getElementById('generate-create-placeholders');
                const createPlaceholders = createPlaceholdersCheckbox ? createPlaceholdersCheckbox.checked : false;
                console.log('🔵 [DEBUG] Create placeholders:', createPlaceholders);
                
                const teamsPerGroupInput = document.getElementById('generate-teams-per-group');
                const teamsPerGroup = teamsPerGroupInput ? parseInt(teamsPerGroupInput.value) || 4 : 4;
                console.log('🔵 [DEBUG] Teams per group:', teamsPerGroup);
                
                const phaseStartDateInput = document.getElementById('generate-phase-start-date');
                const phaseStartDate = phaseStartDateInput ? phaseStartDateInput.value : startDate;
                const phaseStartTimeInput = document.getElementById('generate-phase-start-time');
                const phaseStartTime = phaseStartTimeInput ? phaseStartTimeInput.value : startTime;
                console.log('🔵 [DEBUG] Phase start date:', phaseStartDate, 'Phase start time:', phaseStartTime);
                
                let requestData = {
                    category_id: categoryId,
                    phase: phase,
                    auto_schedule: autoSchedule,
                    use_super_tiebreak: useSuperTiebreak,
                    teams_per_group: teamsPerGroup,
                    start_date: phaseStartDate || startDate,
                    start_time: phaseStartTime || startTime
                };
                
                if (createPlaceholders) {
                    // Create placeholder slots without teams
                    requestData.create_placeholders = true;
                    console.log('🔵 [DEBUG] Creating placeholder slots without teams');
                } else if (autoQualify) {
                    requestData.auto_qualify = true;
                } else {
                    console.log('🔵 [DEBUG] Getting qualified teams manually...');
                    const qualifiedCheckboxes = document.querySelectorAll('.qualified-team-checkbox:checked');
                    const qualifiedTeamIds = Array.from(qualifiedCheckboxes).map(cb => parseInt(cb.value));
                    console.log('🔵 [DEBUG] Qualified team IDs:', qualifiedTeamIds);
                    
                    if (qualifiedTeamIds.length < 2) {
                        alert('Selecione pelo menos 2 equipas qualificadas ou marque "Criar slots reservados (sem equipas definidas)"');
                        return;
                    }
                    
                    requestData.qualified_team_ids = qualifiedTeamIds;
                }
                
                if (Object.keys(dayTimeOverrides).length > 0) {
                    requestData.day_time_overrides = dayTimeOverrides;
                }
                
                console.log('🔵 [DEBUG] Knockout stage data:', JSON.stringify(requestData, null, 2));
                console.log('🔵 [DEBUG] Calling API: /tournaments/' + tournamentId + '/generate-knockout-stage');
                result = await apiCall(`/tournaments/${tournamentId}/generate-knockout-stage`, 'POST', requestData);
                console.log('🔵 [DEBUG] API response received:', result);
            }
            
            console.log('🔵 [DEBUG] Processing single category result...');
            if (result && result.success !== false) {
                console.log('🔵 [DEBUG] Success! Result:', result);
                const message = result.auto_scheduled 
                    ? `✅ ${result.matches_created || result.total_matches_created || 0} jogos gerados e agendados automaticamente!`
                    : `✅ ${result.matches_created || result.total_matches_created || 0} jogos gerados com sucesso!`;
                
                alert(message);
                closeModal('generate-matches-modal');
                loadTournaments();
                loadMatches();
                loadDashboard();
            } else {
                console.log('🔴 [DEBUG] Error in result:', result);
                alert(`Erro ao gerar jogos: ${result?.error || 'Erro desconhecido'}`);
            }
        } else {
            console.log('🔵 [DEBUG] Multiple categories path');
            // Multiple categories - use new endpoint
            if (phase === 'Group') {
                console.log('🔵 [DEBUG] Group phase - multiple categories');
                // Get teams per group for each selected category
                const teamsPerGroupByCategory = {};
                selectedCategories.forEach(catId => {
                    console.log('🔵 [DEBUG] Processing category:', catId);
                    const input = document.getElementById(`teams-per-group-${catId}`);
                    console.log('🔵 [DEBUG] Input for category', catId, ':', input);
                    teamsPerGroupByCategory[catId] = input ? parseInt(input.value) || 4 : 4;
                });
                console.log('🔵 [DEBUG] Teams per group by category:', teamsPerGroupByCategory);
                
                // Get top teams for each category
                console.log('🔵 [DEBUG] Getting top teams by category...');
                const topTeamsByCategory = {};
                selectedCategories.forEach(catId => {
                    console.log('🔵 [DEBUG] Filtering top teams for category:', catId);
                    topTeamsByCategory[catId] = Array.from(selectedTopTeams).filter(teamId => {
                        const team = teams.find(t => t.team_id === teamId);
                        return team && team.category_id === catId;
                    });
                    console.log('🔵 [DEBUG] Top teams for category', catId, ':', topTeamsByCategory[catId]);
                });
                console.log('🔵 [DEBUG] Top teams by category:', topTeamsByCategory);
                
                let requestData = {
                    category_ids: selectedCategories,
                    teams_per_group_by_category: teamsPerGroupByCategory,
                    top_team_ids_by_category: topTeamsByCategory,
                    auto_schedule: autoSchedule,
                    use_super_tiebreak: useSuperTiebreak,
                    start_date: startDate,
                    start_time: startTime
                };
                
                if (Object.keys(dayTimeOverrides).length > 0) {
                    requestData.day_time_overrides = dayTimeOverrides;
                }
                
                console.log('🔵 [DEBUG] Multiple categories request data:', JSON.stringify(requestData, null, 2));
                console.log('🔵 [DEBUG] Calling API: /tournaments/' + tournamentId + '/generate-group-stage-multiple');
                const result = await apiCall(`/tournaments/${tournamentId}/generate-group-stage-multiple`, 'POST', requestData);
                console.log('🔵 [DEBUG] API response received:', result);
                
                console.log('🔵 [DEBUG] Processing multiple categories result...');
                if (result && result.success) {
                    console.log('🔵 [DEBUG] Success! Result:', result);
                    const message = result.auto_scheduled 
                        ? `✅ ${result.total_matches_created} jogos gerados e agendados automaticamente para ${result.categories_processed} categorias!`
                        : `✅ ${result.total_matches_created} jogos gerados com sucesso para ${result.categories_processed} categorias!`;
                    
                    alert(message);
                    closeModal('generate-matches-modal');
                    loadTournaments();
                    loadMatches();
                    loadDashboard();
                } else {
                    console.log('🔴 [DEBUG] Error in result:', result);
                    alert(`Erro ao gerar jogos: ${result?.error || 'Erro desconhecido'}`);
                }
            } else {
                console.log('🔴 [DEBUG] Multiple categories knockout not supported');
                alert('Geração múltipla de categorias ainda não suportada para fases eliminatórias. Selecione uma categoria de cada vez.');
            }
        }
    } catch (error) {
        console.error('🔴 [DEBUG] Exception caught in generateTournamentMatches:', error);
        console.error('🔴 [DEBUG] Error name:', error.name);
        console.error('🔴 [DEBUG] Error message:', error.message);
        console.error('🔴 [DEBUG] Error stack:', error.stack);
        alert(`Erro ao gerar jogos: ${error.message || 'Erro desconhecido'}\n\nVerifique a consola (F12) para mais detalhes.`);
    }
}

// Legacy function - keep for backward compatibility but update to use new structure
async function generateTournamentMatchesOld(event) {
    // This is the old code path - keeping for reference but should not be called
    if (true) return; // Prevent execution
    
    try {
        let result;
        
        if (phase === 'Group') {
            // Check if auto-qualify is enabled
            const autoQualify = document.getElementById('generate-auto-qualify')?.checked || false;
            const teamsPerGroup = parseInt(document.getElementById('generate-teams-per-group').value) || 4;
            const phaseStartDate = document.getElementById('generate-phase-start-date')?.value || null;
            const phaseStartTime = document.getElementById('generate-phase-start-time')?.value || null;
            
            // Get day time overrides
            const dayTimeOverrides = getDayTimeOverrides();
            
            let requestData = {
                category_id: categoryId,
                phase: phase,
                auto_schedule: autoSchedule,
                use_super_tiebreak: useSuperTiebreak,
                teams_per_group: teamsPerGroup
            };
            
            if (autoQualify) {
                requestData.auto_qualify = true;
                if (phaseStartDate) requestData.phase_start_date = phaseStartDate;
                if (phaseStartTime) requestData.phase_start_time = phaseStartTime;
            } else {
                // Get qualified teams manually
                const qualifiedCheckboxes = document.querySelectorAll('.qualified-team-checkbox:checked');
                const qualifiedTeamIds = Array.from(qualifiedCheckboxes).map(cb => parseInt(cb.value));
                
                if (qualifiedTeamIds.length < 2) {
                    alert('Selecione pelo menos 2 equipas qualificadas');
                    return;
                }
                
                requestData.qualified_team_ids = qualifiedTeamIds;
                if (phaseStartDate) requestData.phase_start_date = phaseStartDate;
                if (phaseStartTime) requestData.phase_start_time = phaseStartTime;
            }
            
            // Add day time overrides if any
            if (Object.keys(dayTimeOverrides).length > 0) {
                requestData.day_time_overrides = dayTimeOverrides;
            }
            
            result = await apiCall(`/tournaments/${tournamentId}/generate-knockout-stage`, 'POST', requestData);
        }
        
        const message = result.auto_scheduled 
            ? `✅ ${result.matches_created} jogos gerados e agendados automaticamente!`
            : `✅ ${result.matches_created} jogos gerados com sucesso!`;
        
        alert(message);
        closeModal('generate-matches-modal');
        loadTournaments();
        loadMatches();
        loadDashboard();
    } catch (error) {
        console.error('Error generating matches:', error);
        alert(`Erro ao gerar jogos: ${error.message || 'Erro desconhecido'}`);
    }
}

// Tournament Calendar Functions
let currentCalendarDate = null;
let currentTournamentId = null;

function renderTournamentCalendar(tournament, matches, tournamentId) {
    if (!currentCalendarDate) {
        currentCalendarDate = new Date(tournament.start_date);
    }
    
    const dateStr = currentCalendarDate.toISOString().split('T')[0];
    
    // Get matches for current day
    const dayMatches = matches.filter(m => m.scheduled_date === dateStr);
    
    // Generate all hours from 0:00 to 23:00 (each slot represents one hour: 00:00-01:00, 01:00-02:00, ..., 23:00-24:00)
    const timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
        const timeString = `${String(hour).padStart(2, '0')}:00`;
        timeSlots.push(timeString);
    }
    
    // Get all unique match times from actual matches (to include non-standard times like 10:30)
    const matchTimes = new Set();
    dayMatches.forEach(match => {
        if (match.scheduled_time) {
            matchTimes.add(match.scheduled_time);
        }
    });
    
    // Combine hourly slots with actual match times and sort
    const allTimeSlots = new Set([...timeSlots, ...matchTimes]);
    const sortedTimeSlots = Array.from(allTimeSlots).sort((a, b) => {
        const [h1, m1] = a.split(':').map(Number);
        const [h2, m2] = b.split(':').map(Number);
        return (h1 * 60 + m1) - (h2 * 60 + m2);
    });
    
    // Use sorted slots
    const timeSlotsFinal = sortedTimeSlots;
    
    // Group matches by time and court
    const matchesByTimeCourt = {};
    dayMatches.forEach(match => {
        const matchTime = match.scheduled_time || '';
        const courtName = match.court || '';
        const key = `${matchTime}_${courtName}`;
        if (!matchesByTimeCourt[key]) {
            matchesByTimeCourt[key] = [];
        }
        matchesByTimeCourt[key].push(match);
    });
    
    // Build calendar HTML
    let html = `
        <div class="tournament-calendar">
            <div class="calendar-header">
                <div class="calendar-time-header">Hora</div>
                ${Array.from({length: tournament.courts}, (_, i) => `
                    <div class="calendar-court-header">Court ${i + 1}</div>
                `).join('')}
            </div>
    `;
    
    sortedTimeSlots.forEach(timeSlot => {
        html += `<div class="calendar-row">`;
        html += `<div class="calendar-time-cell">${timeSlot}</div>`;
        
        for (let c = 1; c <= tournament.courts; c++) {
            const courtName = `Court ${c}`;
            // Try exact match first
            let key = `${timeSlot}_${courtName}`;
            let slotMatches = matchesByTimeCourt[key] || [];
            
            // If no exact match, try different court name formats
            if (slotMatches.length === 0) {
                const courtVariations = [
                    `Court ${c}`,
                    `court ${c}`,
                    `Court${c}`,
                    `court${c}`,
                    c.toString(),
                    `Campo ${c}`,
                    `campo ${c}`
                ];
                
                for (const courtVar of courtVariations) {
                    key = `${timeSlot}_${courtVar}`;
                    slotMatches = matchesByTimeCourt[key] || [];
                    if (slotMatches.length > 0) break;
                }
            }
            
            // If still no match, check if any match has this exact time and court number matches
            if (slotMatches.length === 0) {
                slotMatches = dayMatches.filter(m => {
                    if (!m.scheduled_time || m.scheduled_time !== timeSlot) return false;
                    // Extract court number from court name (try different formats)
                    const courtStr = (m.court || '').toString();
                    const courtMatch = courtStr.match(/(\d+)/);
                    return courtMatch && parseInt(courtMatch[1]) === c;
                });
            }
            
            if (slotMatches.length > 0) {
                const match = slotMatches[0];
                const isPlaceholder = match.placeholder || (!match.team1_id && !match.team2_id);
                const phaseLabel = match.phase && match.phase !== 'Group' ? match.phase : null;
                const placeholderLabel = match.placeholder_label || null;
                
                // Determine display text for teams
                let teamsDisplay = '';
                if (isPlaceholder && placeholderLabel) {
                    teamsDisplay = placeholderLabel;
                } else if (match.team1_name && match.team2_name) {
                    teamsDisplay = `${(match.team1_name || 'TBD').substring(0, 12)} vs ${(match.team2_name || 'TBD').substring(0, 12)}`;
                } else {
                    teamsDisplay = 'TBD vs TBD';
                }
                
                html += `
                    <div class="calendar-match-cell" onclick="editMatchSchedule(${match.match_id}, ${tournamentId})" 
                         title="${match.team1_name || 'TBD'} vs ${match.team2_name || 'TBD'} - ${match.category_name || 'N/A'} - ${match.scheduled_time || timeSlot}${phaseLabel ? ' - ' + phaseLabel : ''}">
                        <div class="match-cell-teams">${teamsDisplay}</div>
                        <div class="match-cell-info">
                            <span class="match-cell-category">${match.category_name || 'N/A'}</span>
                            ${match.group_name ? `<span class="match-cell-group">Grupo ${match.group_name}</span>` : ''}
                            ${phaseLabel ? `<span class="match-cell-phase" style="background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 3px; font-size: 0.75em; font-weight: 500;">${phaseLabel}</span>` : ''}
                            ${match.scheduled_time && match.scheduled_time !== timeSlot ? `<span class="match-cell-time" style="font-size: 0.7em; color: #666; display: block; margin-top: 2px;">${match.scheduled_time}</span>` : ''}
                        </div>
                    </div>
                `;
            } else {
                html += `<div class="calendar-empty-cell"></div>`;
            }
        }
        
        html += `</div>`;
    });
    
    html += `</div>`;
    
    return html;
}

function previousCalendarDay(tournamentId) {
    const tournament = tournaments.find(t => t.tournament_id === tournamentId);
    if (!tournament) return;
    
    const startDate = new Date(tournament.start_date);
    if (!currentCalendarDate) {
        currentCalendarDate = new Date(startDate);
    }
    currentCalendarDate.setDate(currentCalendarDate.getDate() - 1);
    
    if (currentCalendarDate < startDate) {
        currentCalendarDate = new Date(startDate);
    }
    
    viewTournamentDetails(tournamentId);
}

function nextCalendarDay(tournamentId) {
    const tournament = tournaments.find(t => t.tournament_id === tournamentId);
    if (!tournament) return;
    
    const endDate = new Date(tournament.end_date);
    if (!currentCalendarDate) {
        currentCalendarDate = new Date(endDate);
    }
    currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    
    if (currentCalendarDate > endDate) {
        currentCalendarDate = new Date(endDate);
    }
    
    viewTournamentDetails(tournamentId);
}

async function editMatchSchedule(matchId, tournamentId) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem reagendar jogos');
        return;
    }
    
    const tournament = tournaments.find(t => t.tournament_id === parseInt(tournamentId));
    if (!tournament) {
        // Try to load tournament
        try {
            const t = await apiCall(`/tournaments/${tournamentId}`);
            showMatchScheduleModalFromAPI(matchId, t);
        } catch (err) {
            alert('Erro ao carregar torneio');
        }
        return;
    }
    
    // Load match from API
    try {
        const match = await apiCall(`/matches/${matchId}`);
        showMatchScheduleModal(match, tournament);
    } catch (err) {
        alert('Erro ao carregar jogo');
    }
}

async function showMatchScheduleModalFromAPI(matchId, tournament) {
    try {
        const match = await apiCall(`/matches/${matchId}`);
        showMatchScheduleModal(match, tournament);
    } catch (err) {
        alert('Erro ao carregar jogo');
    }
}

function showMatchScheduleModal(match, tournament) {
    // Remove existing modal if any
    const existingModal = document.getElementById('match-schedule-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'match-schedule-modal';
    modal.dataset.tournamentId = tournament.tournament_id; // Store tournament ID for validation
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close" onclick="closeModal('match-schedule-modal')">&times;</span>
            <h3>Reagendar Jogo</h3>
            <form id="match-schedule-form" onsubmit="saveMatchSchedule(event, ${match.match_id})">
                <div class="form-group">
                    <label>Equipas</label>
                    <div style="padding: 10px; background: var(--bg-color); border-radius: 4px;">
                        ${match.team1_name || 'TBD'} vs ${match.team2_name || 'TBD'}
                    </div>
                </div>
                <div class="form-group">
                    <label>Categoria / Fase / Grupo</label>
                    <div style="padding: 10px; background: var(--bg-color); border-radius: 4px;">
                        ${match.category_name || 'N/A'} - ${match.phase || 'N/A'} ${match.group_name ? `(Grupo ${match.group_name})` : ''}
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Data</label>
                        <input type="date" id="schedule-match-date" 
                               min="${tournament.start_date}" 
                               max="${tournament.end_date}" 
                               value="${match.scheduled_date || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Hora</label>
                        <input type="time" id="schedule-match-time" 
                               min="${tournament.start_time}" 
                               max="23:59" 
                               value="${match.scheduled_time || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Court</label>
                    <select id="schedule-match-court" required>
                        ${Array.from({length: tournament.courts}, (_, i) => `
                            <option value="Court ${i + 1}" ${match.court === `Court ${i + 1}` ? 'selected' : ''}>Court ${i + 1}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('match-schedule-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('.close').addEventListener('click', () => {
        const modalEl = document.getElementById('match-schedule-modal');
        if (modalEl) {
            document.body.removeChild(modalEl);
        }
    });
}

async function saveMatchSchedule(event, matchId) {
    event.preventDefault();
    
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem reagendar jogos');
        return;
    }
    
    const date = document.getElementById('schedule-match-date').value;
    const time = document.getElementById('schedule-match-time').value;
    const court = document.getElementById('schedule-match-court').value;
    
    // Get tournament from modal data attribute or find it
    const modal = document.getElementById('match-schedule-modal');
    const tournamentId = modal ? modal.dataset.tournamentId : null;
    const tournament = tournamentId ? tournaments.find(t => t.tournament_id === parseInt(tournamentId)) : null;
    
    // Validate time against tournament end_time
    // end_time is the start time of the last possible slot
    // If end_time is 23:00, we allow slots starting at 23:00 (which end at 24:00)
    if (tournament && tournament.end_time) {
        const [timeH, timeM] = time.split(':').map(Number);
        const [endH, endM] = tournament.end_time.split(':').map(Number);
        const timeMinutes = timeH * 60 + timeM;
        const endMinutes = endH * 60 + endM;
        
        // Allow time if it's <= end_time (end_time is inclusive - it's the start of the last slot)
        if (timeMinutes > endMinutes) {
            alert(`A hora deve ser até ${tournament.end_time} (inclusive). O slot ${tournament.end_time} termina às 24:00.`);
            return;
        }
    }
    
    try {
        await apiCall(`/matches/${matchId}`, 'PUT', {
            scheduled_date: date,
            scheduled_time: time,
            court: court
        });
        
        if (modal) {
            document.body.removeChild(modal);
        }
        
        // Reload tournament details
        if (currentTournamentId) {
            viewTournamentDetails(currentTournamentId);
        }
        
        loadMatches();
        loadDashboard();
    } catch (error) {
        console.error('Error updating match schedule:', error);
        alert(`Erro ao atualizar agendamento: ${error.message || 'Erro desconhecido'}`);
    }
}

// Make functions globally accessible
window.openTournamentModal = openTournamentModal;
window.editTournament = editTournament;
window.deleteTournament = deleteTournament;
window.viewTournamentDetails = viewTournamentDetails;
window.openGenerateMatchesModal = openGenerateMatchesModal;
window.toggleTopTeam = toggleTopTeam;
window.generateTournamentMatches = generateTournamentMatches;
window.previousCalendarDay = previousCalendarDay;
window.nextCalendarDay = nextCalendarDay;
window.editMatchSchedule = editMatchSchedule;
window.saveMatchSchedule = saveMatchSchedule;

// Viewer functions
let tournamentBracket = null;

async function loadTournamentsForViewer() {
    try {
        const tournaments = await apiCall('/tournaments');
        const select = document.getElementById('viewer-tournament-select');
        if (select) {
            if (tournaments.length === 0) {
                select.innerHTML = '<option value="">Nenhum torneio disponível</option>';
                const content = document.getElementById('viewer-content');
                if (content) {
                    content.innerHTML = '<div class="alert alert-info">Nenhum torneio disponível. Contacte o administrador.</div>';
                }
            } else {
                select.innerHTML = '<option value="">-- Selecionar Torneio --</option>' +
                    tournaments.map(t => `<option value="${t.tournament_id}">${t.name}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error loading tournaments for viewer:', error);
        const select = document.getElementById('viewer-tournament-select');
        if (select) {
            select.innerHTML = '<option value="">Erro ao carregar torneios</option>';
        }
        const content = document.getElementById('viewer-content');
        if (content) {
            content.innerHTML = `<div class="alert alert-error">Erro ao carregar torneios: ${error.message || 'Erro desconhecido'}</div>`;
        }
    }
}

async function loadTournamentBracket() {
    const tournamentId = document.getElementById('viewer-tournament-select')?.value;
    if (!tournamentId) {
        document.getElementById('viewer-content').innerHTML = 
            '<div class="alert alert-info">Selecione um torneio para visualizar o bracket e classificações</div>';
        return;
    }
    
    try {
        tournamentBracket = await apiCall(`/tournaments/${tournamentId}/bracket`);
        renderTournamentBracket();
    } catch (error) {
        console.error('Error loading tournament bracket:', error);
        const content = document.getElementById('viewer-content');
        if (content) {
            content.innerHTML = `<div class="alert alert-error">Erro ao carregar bracket: ${error.message || 'Erro desconhecido'}</div>`;
        }
    }
}

function renderTournamentBracket() {
    if (!tournamentBracket) {
        console.error('No tournament bracket data available');
        return;
    }
    
    const container = document.getElementById('viewer-content');
    if (!container) {
        console.error('viewer-content element not found');
        return;
    }
    
    if (!tournamentBracket.categories || tournamentBracket.categories.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                Este torneio ainda não tem categorias ou jogos gerados.
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="tournament-bracket-viewer">
            <h3 style="margin-bottom: 2rem;">${tournamentBracket.tournament_name}</h3>
            ${tournamentBracket.categories.map(category => renderCategoryBracket(category)).join('')}
        </div>
    `;
}

function renderCategoryBracket(category) {
    const hasGroups = category.groups && category.groups.length > 0;
    const hasGroupMatches = category.all_group_matches && category.all_group_matches.length > 0;
    const hasKnockout = category.knockout && (
        (category.knockout.quarter_finals && category.knockout.quarter_finals.length > 0) ||
        (category.knockout.semi_finals && category.knockout.semi_finals.length > 0) ||
        (category.knockout.final && category.knockout.final.length > 0)
    );
    
    return `
        <div class="category-bracket" style="margin-bottom: 3rem; border: 2px solid #ddd; padding: 1.5rem; border-radius: 8px;">
            <h4 style="font-size: 1.5rem; margin-bottom: 1.5rem; color: #333;">${category.category_name}</h4>
            
            ${hasGroups ? `
                <!-- Group Stage Standings -->
                <div class="group-stage-section" style="margin-bottom: 2rem;">
                    <h5 style="font-size: 1.2rem; margin-bottom: 1rem; color: #555; border-bottom: 2px solid #ddd; padding-bottom: 0.5rem;">Classificação dos Grupos</h5>
                    <div class="groups-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem;">
                        ${category.groups.map(group => renderGroup(group)).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${hasGroupMatches ? `
                <!-- All Group Matches Table -->
                <div class="group-matches-section" style="margin-bottom: 2rem;">
                    <h5 style="font-size: 1.2rem; margin-bottom: 1rem; color: #555; border-bottom: 2px solid #ddd; padding-bottom: 0.5rem;">Jogos da Fase de Grupos</h5>
                    ${renderAllGroupMatches(category.all_group_matches)}
                </div>
            ` : ''}
            
            ${hasKnockout ? `
                <!-- Knockout Stage -->
                <div class="knockout-stage-section">
                    <h5 style="font-size: 1.2rem; margin-bottom: 1rem; color: #555; border-bottom: 2px solid #ddd; padding-bottom: 0.5rem;">Fase Eliminatória</h5>
                    ${renderKnockoutBracket(category.knockout)}
                </div>
            ` : ''}
            
            ${!hasGroups && !hasGroupMatches && !hasKnockout ? 
                '<div style="margin-bottom: 2rem; padding: 1rem; background: #f9f9f9; border-radius: 4px; color: #666;">Fase de grupos ainda não iniciada</div>' : ''}
        </div>
    `;
}

function renderGroup(group) {
    const hasMatches = group.matches && group.matches.length > 0;
    const hasStandings = group.standings && group.standings.length > 0;
    
    return `
        <div class="group-card" style="border: 1px solid #ccc; padding: 1rem; border-radius: 6px; background: #f9f9f9; margin-bottom: 1.5rem;">
            <h6 style="font-size: 1.1rem; margin-bottom: 1rem; color: #444; border-bottom: 2px solid #ddd; padding-bottom: 0.5rem;">Grupo ${group.group_name}</h6>
            
            ${hasStandings ? `
                <!-- Classificação -->
                <div style="margin-bottom: 1.5rem;">
                    <h7 style="font-size: 0.95rem; font-weight: bold; margin-bottom: 0.5rem; display: block; color: #555;">Classificação</h7>
                    <table style="width: 100%; font-size: 0.9rem; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #e9e9e9;">
                                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Pos</th>
                                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Equipa</th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">J</th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">V</th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">D</th>
                                <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${group.standings.map((s, idx) => `
                                <tr style="border-bottom: 1px solid #ddd; ${idx < 2 ? 'background: #f0f8ff;' : ''}">
                                    <td style="padding: 8px; border: 1px solid #ddd;">
                                        <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 50%; background: ${idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#e0e0e0'}; color: ${idx < 3 ? 'white' : '#333'}; font-weight: bold; font-size: 0.85rem;">
                                            ${idx + 1}
                                        </span>
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: ${idx < 2 ? 'bold' : 'normal'};">${s.team_name}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${s.matches_played || 0}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${s.wins || 0}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${s.losses || 0}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${s.points || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
            
            ${hasMatches ? `
                <!-- Jogos da Fase de Grupos -->
                <div>
                    <h7 style="font-size: 0.95rem; font-weight: bold; margin-bottom: 0.5rem; display: block; color: #555;">Jogos</h7>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${group.matches.map(match => {
                            const isFinished = match.status === 'finished';
                            const isPlaying = match.status === 'playing';
                            const winner1 = match.winner_team_id && match.team1_id === match.winner_team_id;
                            const winner2 = match.winner_team_id && match.team2_id === match.winner_team_id;
                            
                            return `
                                <div style="border: 1px solid ${isFinished ? '#4CAF50' : isPlaying ? '#FF9800' : '#ddd'}; padding: 0.75rem; border-radius: 4px; background: white; ${isFinished ? 'background: #f0fff0;' : ''}">
                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                                        <div style="flex: 1; min-width: 200px;">
                                            <div style="font-weight: ${winner1 ? 'bold' : 'normal'}; color: ${winner1 ? '#4CAF50' : '#333'}; margin-bottom: 0.25rem;">
                                                ${match.team1_name || 'TBD'}
                                            </div>
                                            <div style="font-weight: ${winner2 ? 'bold' : 'normal'}; color: ${winner2 ? '#4CAF50' : '#333'};">
                                                ${match.team2_name || 'TBD'}
                                            </div>
                                        </div>
                                        <div style="font-size: 0.85rem; color: #666; text-align: right;">
                                            ${match.scheduled_date ? `
                                                <div>${match.scheduled_date}</div>
                                                ${match.scheduled_time ? `<div>${match.scheduled_time}</div>` : ''}
                                                ${match.court ? `<div>${match.court}</div>` : ''}
                                            ` : '<div style="color: #999;">Não agendado</div>'}
                                            ${isFinished ? '<div style="color: #4CAF50; font-weight: bold; margin-top: 0.25rem;">Finalizado</div>' : ''}
                                            ${isPlaying ? '<div style="color: #FF9800; font-weight: bold; margin-top: 0.25rem;">Em curso</div>' : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : '<div style="color: #999; font-size: 0.9rem; font-style: italic;">Nenhum jogo gerado ainda</div>'}
        </div>
    `;
}

function renderKnockoutBracket(knockout) {
    const hasQuarterFinals = knockout.quarter_finals && knockout.quarter_finals.length > 0;
    const hasSemiFinals = knockout.semi_finals && knockout.semi_finals.length > 0;
    const hasFinal = knockout.final && knockout.final.length > 0;
    
    return `
        <div class="knockout-bracket" style="display: flex; flex-direction: column; gap: 2rem; align-items: center;">
            ${hasQuarterFinals ? `
                <div class="quarter-finals" style="width: 100%;">
                    <h6 style="font-size: 1rem; margin-bottom: 1rem; color: #666;">Quartos-de-final</h6>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        ${knockout.quarter_finals.map(match => renderMatchCard(match, 'Quarter-final')).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${hasSemiFinals ? `
                <div class="semi-finals" style="width: 100%;">
                    <h6 style="font-size: 1rem; margin-bottom: 1rem; color: #666;">Meias-finais</h6>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        ${knockout.semi_finals.map(match => renderMatchCard(match, 'Semi-final')).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${hasFinal ? `
                <div class="final" style="width: 100%; max-width: 400px;">
                    <h6 style="font-size: 1rem; margin-bottom: 1rem; color: #666;">Final</h6>
                    <div>
                        ${knockout.final.map(match => renderMatchCard(match, 'Final')).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderMatchCard(match, phase) {
    const isWinner1 = match.winner_team_id && match.team1_id === match.winner_team_id;
    const isWinner2 = match.winner_team_id && match.team2_id === match.winner_team_id;
    
    return `
        <div class="match-card" style="border: 2px solid ${match.status === 'finished' ? '#4CAF50' : match.status === 'playing' ? '#FF9800' : '#ddd'}; padding: 1rem; border-radius: 6px; background: white; min-width: 250px;">
            <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">${phase}</div>
            <div style="padding: 0.5rem 0; border-bottom: 1px solid #eee; font-weight: ${isWinner1 ? 'bold' : 'normal'}; color: ${isWinner1 ? '#4CAF50' : '#333'};">
                ${match.team1_name || 'TBD'}
            </div>
            <div style="padding: 0.5rem 0; font-weight: ${isWinner2 ? 'bold' : 'normal'}; color: ${isWinner2 ? '#4CAF50' : '#333'};">
                ${match.team2_name || 'TBD'}
            </div>
            ${match.scheduled_date ? `
                <div style="font-size: 0.8rem; color: #666; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #eee;">
                    ${match.scheduled_date} ${match.scheduled_time || ''} ${match.court ? `- ${match.court}` : ''}
                </div>
            ` : ''}
            ${match.placeholder ? `
                <div style="font-size: 0.75rem; color: #999; font-style: italic; margin-top: 0.5rem;">
                    (Aguardando apuramento)
                </div>
            ` : ''}
        </div>
    `;
}

function renderAllGroupMatches(matches) {
    if (!matches || matches.length === 0) {
        return '<div style="color: #999; font-size: 0.9rem; font-style: italic; padding: 1rem;">Nenhum jogo gerado ainda</div>';
    }
    
    return `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; background: white; border: 1px solid #ddd;">
                <thead>
                    <tr style="background: #4CAF50; color: white;">
                        <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Nº</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Equipa 1</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold;">vs</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Equipa 2</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Resultado</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Data/Hora</th>
                    </tr>
                </thead>
                <tbody>
                    ${matches.map((match, idx) => {
                        const isFinished = match.status === 'finished';
                        const isPlaying = match.status === 'playing';
                        const rowBg = isFinished ? '#f0fff0' : isPlaying ? '#fff8e1' : '';
                        
                        // Format date/time
                        let dateTimeStr = '-';
                        if (match.scheduled_date) {
                            const dateParts = match.scheduled_date.split('-');
                            const formattedDate = `${dateParts[2]}/${dateParts[1]}`;
                            if (match.scheduled_time) {
                                const timeParts = match.scheduled_time.split(':');
                                dateTimeStr = `${formattedDate} - ${timeParts[0]}h${timeParts[1] !== '00' ? ':' + timeParts[1] : ''}`;
                            } else {
                                dateTimeStr = formattedDate;
                            }
                        }
                        
                        return `
                            <tr style="border-bottom: 1px solid #ddd; ${rowBg ? `background: ${rowBg};` : ''}">
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${match.match_number || (idx + 1)}</td>
                                <td style="padding: 10px; text-align: left; border: 1px solid #ddd; ${match.winner_team_id === match.team1_id ? 'font-weight: bold; color: #4CAF50;' : ''}">${match.team1_name || 'TBD'}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold; color: #666;">vs</td>
                                <td style="padding: 10px; text-align: left; border: 1px solid #ddd; ${match.winner_team_id === match.team2_id ? 'font-weight: bold; color: #4CAF50;' : ''}">${match.team2_name || 'TBD'}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; ${match.sets_result ? 'font-weight: bold;' : 'color: #999;'}">
                                    ${match.sets_result || (isFinished ? 'Finalizado' : isPlaying ? 'Em curso' : '-')}
                                </td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #666;">${dateTimeStr}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.loadTournamentBracket = loadTournamentBracket;


