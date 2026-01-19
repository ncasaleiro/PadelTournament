// API Base URL
const API_BASE = '/api';

// Get match ID from URL
const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('id');

let currentMatch = null;
let events = [];
let autoRefreshInterval = null;

// Helper function to make authenticated API calls
function apiCall(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
        ...options,
        headers
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (!savedUser || !token) {
        alert('Precisa de fazer login');
        window.location.href = 'index.html';
        return;
    }
    
    const user = JSON.parse(savedUser);
    if (user.role !== 'referee' && user.role !== 'admin') {
        alert('Apenas árbitros podem aceder a esta página');
        window.location.href = 'index.html';
        return;
    }
    
    if (!matchId) {
        alert('ID do jogo não fornecido');
        window.location.href = 'index.html';
        return;
    }
    
    loadMatch();
    
    // Auto-refresh every 2 seconds if match is playing
    autoRefreshInterval = setInterval(() => {
        if (currentMatch && currentMatch.status === 'playing') {
            loadMatch();
        }
    }, 2000);
});

// Load match data
async function loadMatch() {
    try {
        const response = await apiCall(`${API_BASE}/matches/${matchId}`);
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Não tem permissão para aceder a este jogo');
            }
            throw new Error('Jogo não encontrado');
        }
        
        currentMatch = await response.json();
        renderMatch();
        loadEvents();
    } catch (error) {
        console.error('Error loading match:', error);
        alert(`Erro ao carregar jogo: ${error.message}`);
        window.location.href = 'index.html';
    }
}

// Render match
function renderMatch() {
    if (!currentMatch) return;
    
    // Header
    document.getElementById('match-title').textContent = 
        `${currentMatch.team1_name || 'TBD'} vs ${currentMatch.team2_name || 'TBD'}`;
    document.getElementById('match-category').textContent = 
        `Categoria: ${currentMatch.category_name || 'N/A'}`;
    document.getElementById('match-date').textContent = 
        currentMatch.scheduled_date ? `Data: ${currentMatch.scheduled_date}` : '';
    document.getElementById('match-time').textContent = 
        currentMatch.scheduled_time ? `Hora: ${currentMatch.scheduled_time}` : '';
    document.getElementById('match-court').textContent = 
        currentMatch.court ? `Campo: ${currentMatch.court}` : '';
    
    const statusEl = document.getElementById('match-status');
    statusEl.textContent = getStatusLabel(currentMatch.status);
    
    // Team names
    document.getElementById('team-a-name').textContent = currentMatch.team1_name || 'Equipa A';
    document.getElementById('team-b-name').textContent = currentMatch.team2_name || 'Equipa B';
    document.getElementById('team-a-btn').textContent = currentMatch.team1_name || 'Equipa A';
    document.getElementById('team-b-btn').textContent = currentMatch.team2_name || 'Equipa B';
    
    // Load notes
    if (currentMatch.referee_notes) {
        document.getElementById('referee-notes').value = currentMatch.referee_notes;
    }
    
    // Parse score data
    const sets = currentMatch.sets_data ? JSON.parse(currentMatch.sets_data) : [];
    const currentSet = currentMatch.current_set_data ? JSON.parse(currentMatch.current_set_data) : { gamesA: 0, gamesB: 0, tiebreak: null };
    const currentGame = currentMatch.current_game_data ? JSON.parse(currentMatch.current_game_data) : { pointsA: 0, pointsB: 0, deuceState: null };
    
    // Check if tiebreak
    const isTiebreak = currentSet.tiebreak !== null && currentSet.tiebreak !== undefined;
    
    // Update label
    document.getElementById('current-label').textContent = isTiebreak ? 'Tiebreak' : 'Jogo';
    
    // Render sets
    for (let i = 0; i < 3; i++) {
        if (i < sets.length) {
            // Completed set
            document.getElementById(`set-a-${i + 1}`).textContent = sets[i].gamesA || 0;
            document.getElementById(`set-b-${i + 1}`).textContent = sets[i].gamesB || 0;
        } else if (i === (currentMatch.current_set_index || 0) && currentMatch.status === 'playing') {
            // Current set
            document.getElementById(`set-a-${i + 1}`).textContent = currentSet.gamesA || 0;
            document.getElementById(`set-b-${i + 1}`).textContent = currentSet.gamesB || 0;
        } else {
            // Not started
            document.getElementById(`set-a-${i + 1}`).textContent = '-';
            document.getElementById(`set-b-${i + 1}`).textContent = '-';
        }
    }
    
    // Render current game
    if (isTiebreak) {
        const tiebreak = currentSet.tiebreak || { pointsA: 0, pointsB: 0 };
        document.getElementById('game-a').textContent = tiebreak.pointsA || 0;
        document.getElementById('game-b').textContent = tiebreak.pointsB || 0;
    } else {
        const pointA = formatPoint(currentGame.pointsA, currentGame.deuceState, 'A');
        const pointB = formatPoint(currentGame.pointsB, currentGame.deuceState, 'B');
        document.getElementById('game-a').textContent = pointA;
        document.getElementById('game-b').textContent = pointB;
    }
    
    // Show/hide buttons
    if (currentMatch.status === 'scheduled') {
        document.getElementById('start-btn').style.display = 'inline-block';
        document.getElementById('finish-btn').style.display = 'none';
    } else if (currentMatch.status === 'playing') {
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('finish-btn').style.display = 'inline-block';
    } else {
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('finish-btn').style.display = 'none';
    }
    
    // Disable controls if not playing
    const controls = document.querySelectorAll('.action-btn, .discipline-btn');
    controls.forEach(btn => {
        btn.disabled = currentMatch.status !== 'playing';
    });
}

// Format point display
function formatPoint(points, deuceState, team) {
    const pointValues = {
        0: '0',
        1: '15',
        2: '30',
        3: '40'
    };
    
    if (deuceState === team) {
        return 'Adv';
    }
    if (deuceState && deuceState !== team) {
        return '40';
    }
    return pointValues[points] || '0';
}

// Record point
async function recordPoint(team) {
    if (currentMatch.status !== 'playing') {
        alert('O jogo não está em curso');
        return;
    }
    
    try {
        const response = await apiCall(`${API_BASE}/matches/${matchId}/score/increment`, {
            method: 'POST',
            body: JSON.stringify({ team }),
        });
        
        if (!response.ok) {
            let errorMessage = 'Erro ao atualizar pontuação';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            if (response.status === 403) {
                errorMessage = 'Não tem permissão para marcar pontos. Verifique se está autenticado como árbitro.';
            }
            throw new Error(errorMessage);
        }
        
        // Add event
        addEvent('point', {
            team: team === 'A' ? currentMatch.team1_name : currentMatch.team2_name,
            timestamp: new Date().toISOString()
        });
        
        // Reload match data
        await loadMatch();
    } catch (error) {
        console.error('Error recording point:', error);
        alert(`Erro: ${error.message}`);
    }
}

// Record fault
async function recordFault() {
    if (currentMatch.status !== 'playing') {
        alert('O jogo não está em curso');
        return;
    }
    
    const team = prompt('Qual equipa cometeu a falta? (A ou B)');
    if (!team || (team !== 'A' && team !== 'B')) {
        return;
    }
    
    addEvent('fault', {
        team: team === 'A' ? currentMatch.team1_name : currentMatch.team2_name,
        timestamp: new Date().toISOString()
    });
    
    // Save events
    await saveEvents();
}

// Record let
async function recordLet() {
    if (currentMatch.status !== 'playing') {
        alert('O jogo não está em curso');
        return;
    }
    
    addEvent('let', {
        timestamp: new Date().toISOString()
    });
    
    await saveEvents();
}

// Record discipline action
async function recordDiscipline(type) {
    if (currentMatch.status !== 'playing') {
        alert('O jogo não está em curso');
        return;
    }
    
    const teamSelect = document.getElementById('discipline-team');
    const team = teamSelect.value;
    
    if (!team) {
        alert('Selecione uma equipa');
        return;
    }
    
    const labels = {
        'warning': 'Aviso',
        'penalty': 'Penalidade',
        'disqualification': 'Desqualificação'
    };
    
    addEvent('discipline', {
        type: type,
        label: labels[type],
        team: team === 'A' ? currentMatch.team1_name : currentMatch.team2_name,
        timestamp: new Date().toISOString()
    });
    
    teamSelect.value = '';
    await saveEvents();
}

// Undo last action
async function undoLastAction() {
    if (currentMatch.status !== 'playing') {
        alert('O jogo não está em curso');
        return;
    }
    
    // Use any team (A or B) - the backend will use history to restore state
    // The team parameter is not critical since we're restoring from history
    const team = 'A';
    
    try {
        const response = await apiCall(`${API_BASE}/matches/${matchId}/score/decrement`, {
            method: 'POST',
            body: JSON.stringify({ team }),
        });
        
        if (!response.ok) {
            let errorMessage = 'Erro ao desfazer ação';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            if (response.status === 403) {
                errorMessage = 'Não tem permissão para desfazer ações. Verifique se está autenticado como árbitro.';
            }
            throw new Error(errorMessage);
        }
        
        // Remove last point event if it exists
        const pointEvents = events.filter(e => e.type === 'point');
        if (pointEvents.length > 0) {
            const lastPointEvent = pointEvents[pointEvents.length - 1];
            const eventIndex = events.indexOf(lastPointEvent);
            if (eventIndex > -1) {
                events.splice(eventIndex, 1);
            }
        }
        await saveEvents();
        
        // Reload match to get updated state
        await loadMatch();
    } catch (error) {
        console.error('Error undoing action:', error);
        alert(`Erro: ${error.message}`);
    }
}

// Add event to log
function addEvent(type, data) {
    const event = {
        id: Date.now(),
        type,
        data,
        timestamp: new Date().toISOString()
    };
    
    events.push(event);
    renderEvents();
}

// Render events
function renderEvents() {
    const container = document.getElementById('events-list');
    
    if (events.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Nenhum evento registado</p>';
        return;
    }
    
    // Sort by timestamp (newest first)
    const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    container.innerHTML = sortedEvents.map(event => {
        const time = new Date(event.timestamp).toLocaleTimeString('pt-PT');
        let description = '';
        
        switch (event.type) {
            case 'point':
                description = `Ponto para ${event.data.team}`;
                break;
            case 'fault':
                description = `Falta - ${event.data.team}`;
                break;
            case 'let':
                description = 'Let';
                break;
            case 'discipline':
                description = `${event.data.label} - ${event.data.team}`;
                break;
        }
        
        return `
            <div class="event-item">
                <div class="event-time">${time}</div>
                <div class="event-description">${description}</div>
            </div>
        `;
    }).join('');
}

// Load events from match data
function loadEvents() {
    if (currentMatch.events_data) {
        try {
            events = JSON.parse(currentMatch.events_data);
        } catch (e) {
            events = [];
        }
    } else {
        events = [];
    }
    renderEvents();
}

// Save events to match
async function saveEvents() {
    try {
        await apiCall(`${API_BASE}/matches/${matchId}`, {
            method: 'PUT',
            body: JSON.stringify({
                events_data: JSON.stringify(events)
            }),
        });
    } catch (error) {
        console.error('Error saving events:', error);
    }
}

// Save notes
async function saveNotes() {
    const notes = document.getElementById('referee-notes').value;
    
    try {
        await apiCall(`${API_BASE}/matches/${matchId}`, {
            method: 'PUT',
            body: JSON.stringify({
                referee_notes: notes
            }),
        });
    } catch (error) {
        console.error('Error saving notes:', error);
    }
}

// Start match
async function startMatch() {
    try {
        const response = await apiCall(`${API_BASE}/matches/${matchId}/start`, {
            method: 'POST',
        });
        
        if (!response.ok) {
            let errorMessage = 'Erro ao iniciar jogo';
            if (response.status === 403) {
                errorMessage = 'Não tem permissão para iniciar jogos. Verifique se está autenticado como árbitro.';
            }
            throw new Error(errorMessage);
        }
        
        // Add start event
        addEvent('match_start', {
            timestamp: new Date().toISOString()
        });
        await saveEvents();
        
        await loadMatch();
    } catch (error) {
        console.error('Error starting match:', error);
        alert(`Erro: ${error.message}`);
    }
}

// Finish match
async function finishMatch() {
    if (!confirm('Tem certeza que deseja finalizar este jogo?')) return;
    
    try {
        const response = await apiCall(`${API_BASE}/matches/${matchId}/finish`, {
            method: 'POST',
        });
        
        if (!response.ok) {
            let errorMessage = 'Erro ao finalizar jogo';
            if (response.status === 403) {
                errorMessage = 'Não tem permissão para finalizar jogos. Verifique se está autenticado como árbitro.';
            }
            throw new Error(errorMessage);
        }
        
        // Add finish event
        addEvent('match_finish', {
            timestamp: new Date().toISOString()
        });
        await saveEvents();
        
        await loadMatch();
        alert('Jogo finalizado com sucesso!');
    } catch (error) {
        console.error('Error finishing match:', error);
        alert(`Erro: ${error.message}`);
    }
}

// Get status label
function getStatusLabel(status) {
    const labels = {
        'scheduled': 'Agendado',
        'playing': 'Em Curso',
        'finished': 'Finalizado',
        'cancelled': 'Cancelado'
    };
    return labels[status] || status;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});

