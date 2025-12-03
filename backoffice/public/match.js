// API Base URL
const API_BASE = '/api';

// Get match ID from URL
const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('id');

let currentMatch = null;
let autoRefreshInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
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
        const response = await fetch(`${API_BASE}/matches/${matchId}`);
        if (!response.ok) {
            throw new Error('Jogo não encontrado');
        }
        
        currentMatch = await response.json();
        renderMatch();
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
    statusEl.className = `match-status ${currentMatch.status}`;
    
    // Team names
    document.getElementById('team-a-name').textContent = currentMatch.team1_name || 'Equipa A';
    document.getElementById('team-b-name').textContent = currentMatch.team2_name || 'Equipa B';
    document.getElementById('control-team-a').textContent = currentMatch.team1_name || 'Equipa A';
    document.getElementById('control-team-b').textContent = currentMatch.team2_name || 'Equipa B';
    
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
        document.getElementById('score-display-a').textContent = tiebreak.pointsA || 0;
        document.getElementById('score-display-b').textContent = tiebreak.pointsB || 0;
    } else {
        const pointA = formatPoint(currentGame.pointsA, currentGame.deuceState, 'A');
        const pointB = formatPoint(currentGame.pointsB, currentGame.deuceState, 'B');
        document.getElementById('game-a').textContent = pointA;
        document.getElementById('game-b').textContent = pointB;
        document.getElementById('score-display-a').textContent = pointA;
        document.getElementById('score-display-b').textContent = pointB;
    }
    
    // Show/hide finish button
    if (currentMatch.status === 'playing') {
        document.getElementById('finish-btn').style.display = 'inline-block';
    } else {
        document.getElementById('finish-btn').style.display = 'none';
    }
    
    // Disable controls if not playing
    const controls = document.querySelectorAll('.btn-score');
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

// Increment score
async function incrementScore(team) {
    if (currentMatch.status !== 'playing') {
        alert('O jogo não está em curso');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/matches/${matchId}/score/increment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ team }),
        });
        
        if (!response.ok) {
            let errorMessage = 'Erro ao atualizar pontuação';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        // Reload match data
        await loadMatch();
    } catch (error) {
        console.error('Error incrementing score:', error);
        alert(`Erro: ${error.message}`);
    }
}

// Decrement score
async function decrementScore(team) {
    if (currentMatch.status !== 'playing') {
        alert('O jogo não está em curso');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/matches/${matchId}/score/decrement`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ team }),
        });
        
        if (!response.ok) {
            let errorMessage = 'Erro ao atualizar pontuação';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        // Reload match data
        await loadMatch();
    } catch (error) {
        console.error('Error decrementing score:', error);
        alert(`Erro: ${error.message}`);
    }
}

// Finish match
async function finishMatch() {
    if (!confirm('Tem certeza que deseja finalizar este jogo?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/matches/${matchId}/finish`, {
            method: 'POST',
        });
        
        if (!response.ok) {
            let errorMessage = 'Erro ao finalizar jogo';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
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

