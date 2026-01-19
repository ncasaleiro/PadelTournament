// API Base URL
const API_BASE = '/api';

let matches = [];
let autoRefreshInterval = null;
let isLoading = false; // Prevent overlapping requests

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMatches();
    
    // Auto-refresh every 1 second
    autoRefreshInterval = setInterval(() => {
        // Only load if not already loading
        if (!isLoading) {
            loadMatches();
        }
    }, 1000);
});

// Load matches
async function loadMatches() {
    // Prevent overlapping requests
    if (isLoading) {
        return;
    }
    
    isLoading = true;
    showLoadingStatus();
    
    try {
        const response = await fetch(`${API_BASE}/matches/live`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-cache' // Prevent browser caching
        });
        
        if (!response.ok) {
            let errorMessage = `Erro ${response.status}: ${response.statusText}`;
            
            // Try to get error details from response
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage = errorText;
                }
            }
            
            throw new Error(errorMessage);
        }
        
        const allMatches = await response.json();
        
        // Filter only matches with scheduled_date
        matches = allMatches.filter(match => 
            match.scheduled_date && 
            match.scheduled_date !== null && 
            match.scheduled_date !== ''
        );
        
        // Backend already returns max 2 matches (playing first, then finished)
        // So we just use what we get
        renderMatches();
        updateLastUpdate();
    } catch (error) {
        console.error('❌ [DEBUG] Error loading matches:', error);
        const container = document.getElementById('matches-container');
        if (container) {
            let errorMessage = error.message || 'Erro desconhecido';
            
            // Show more helpful error messages
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
            } else if (error.message.includes('403')) {
                errorMessage = 'Acesso negado. O endpoint pode estar protegido.';
            } else if (error.message.includes('404')) {
                errorMessage = 'Endpoint não encontrado. Verifique a URL.';
            }
            
            // Only show error if we don't have any matches cached
            if (matches.length === 0) {
                container.innerHTML = `
                    <div class="no-matches">
                        <div class="no-matches-icon">❌</div>
                        <p>Erro ao carregar jogos. Por favor, tente novamente.</p>
                        <p style="font-size: 0.875rem; color: #999; margin-top: 0.5rem;">${errorMessage}</p>
                        <p style="font-size: 0.75rem; color: #ccc; margin-top: 0.5rem;">Verifique o console do navegador (F12) para mais detalhes.</p>
                    </div>
                `;
            }
        }
    } finally {
        isLoading = false;
    }
}

// Render matches
function renderMatches() {
    const container = document.getElementById('matches-container');
    const countElement = document.getElementById('live-count');
    
    if (!container) return;
    
    // Update count
    if (countElement) {
        const count = matches.length;
        countElement.textContent = `${count} ${count === 1 ? 'jogo' : 'jogos'}`;
    }
    
    if (matches.length === 0) {
        container.innerHTML = `
            <div class="no-matches">
                <div class="no-matches-icon">🏸</div>
                <p>Nenhum jogo em curso no momento.</p>
            </div>
        `;
        return;
    }
    
    // Show only first 2 matches
    const matchesToShow = matches.slice(0, 2);
    
    container.innerHTML = matchesToShow.map(match => {
        const scoreData = parseMatchScore(match);
        const isFinished = match.status === 'finished';
        const currentLabel = isFinished ? 'Final' : (scoreData.isTiebreak ? 'Tiebreak' : 'Jogo');
        
        console.log('🔵 [DEBUG] Rendering match:', match.match_id, 'Status:', match.status, 'Score data:', scoreData);
        
        return `
            <div class="live-match-card" style="${isFinished ? 'border-left-color: #4CAF50; opacity: 0.95;' : ''}">
                <div class="match-header">
                    <div class="match-title">${match.team1_name || 'TBD'} vs ${match.team2_name || 'TBD'}</div>
                    <div class="match-category">${match.category_name || 'N/A'} ${isFinished ? '<span style="font-size: 0.75rem; margin-left: 0.5rem; opacity: 0.8;">(Finalizado)</span>' : ''}</div>
                </div>
                
                <div class="match-meta">
                    <span>📅 ${match.scheduled_date || 'TBD'}</span>
                    <span>🕐 ${match.scheduled_time || 'TBD'}</span>
                    ${match.court ? `<span>🏟️ Campo ${match.court}</span>` : ''}
                </div>
                
                <div class="scoreboard">
                    <div class="scoreboard-header">
                        <span></span>
                        <span>Set 1</span>
                        <span>Set 2</span>
                        <span>Set 3</span>
                        <span>${currentLabel}</span>
                    </div>
                    <div class="scoreboard-row">
                        <span class="team-name">${match.team1_name || 'Equipa A'}</span>
                        <span class="set-score">${scoreData.set1A}</span>
                        <span class="set-score">${scoreData.set2A}</span>
                        <span class="set-score">${scoreData.set3A}</span>
                        <span class="game-score">${scoreData.gameA}</span>
                    </div>
                    <div class="scoreboard-row">
                        <span class="team-name">${match.team2_name || 'Equipa B'}</span>
                        <span class="set-score">${scoreData.set1B}</span>
                        <span class="set-score">${scoreData.set2B}</span>
                        <span class="set-score">${scoreData.set3B}</span>
                        <span class="game-score">${scoreData.gameB}</span>
                    </div>
                </div>
                
                <div class="match-actions">
                    <a href="match.html?id=${match.match_id}" class="btn-view">Ver Detalhes</a>
                </div>
            </div>
        `;
    }).join('');
}

// Parse match score data
function parseMatchScore(match) {
    let sets = [];
    let currentSet = { gamesA: 0, gamesB: 0, tiebreak: null };
    let currentGame = { pointsA: 0, pointsB: 0, deuceState: null };
    let isTiebreak = false;
    
    try {
        // Handle string or already parsed JSON
        if (match.sets_data) {
            sets = typeof match.sets_data === 'string' ? JSON.parse(match.sets_data) : match.sets_data;
        }
        if (match.current_set_data) {
            currentSet = typeof match.current_set_data === 'string' ? JSON.parse(match.current_set_data) : match.current_set_data;
        }
        if (match.current_game_data) {
            currentGame = typeof match.current_game_data === 'string' ? JSON.parse(match.current_game_data) : match.current_game_data;
        }
        
        // Ensure arrays and objects are properly initialized
        if (!Array.isArray(sets)) sets = [];
        if (!currentSet || typeof currentSet !== 'object') currentSet = { gamesA: 0, gamesB: 0, tiebreak: null };
        if (!currentGame || typeof currentGame !== 'object') currentGame = { pointsA: 0, pointsB: 0, deuceState: null };
        
        isTiebreak = currentSet.tiebreak !== null && currentSet.tiebreak !== undefined;
        
        console.log('🔵 [DEBUG] Parsed score data:', {
            sets,
            currentSet,
            currentGame,
            isTiebreak,
            currentSetIndex: match.current_set_index
        });
    } catch (e) {
        console.error('❌ [DEBUG] Error parsing match score:', e, match);
    }
    
    const currentSetIndex = match.current_set_index || 0;
    
    // Format sets - show completed sets first, then current set if playing
    let set1A = '-', set1B = '-';
    let set2A = '-', set2B = '-';
    let set3A = '-', set3B = '-';
    
    // Completed sets
    if (sets.length > 0) {
        set1A = sets[0].gamesA || 0;
        set1B = sets[0].gamesB || 0;
    }
    if (sets.length > 1) {
        set2A = sets[1].gamesA || 0;
        set2B = sets[1].gamesB || 0;
    }
    if (sets.length > 2) {
        set3A = sets[2].gamesA || 0;
        set3B = sets[2].gamesB || 0;
    }
    
    // Current set (if match is playing and set hasn't been completed yet)
    if (match.status === 'playing') {
        if (currentSetIndex === 0 && sets.length === 0) {
            set1A = currentSet.gamesA || 0;
            set1B = currentSet.gamesB || 0;
        } else if (currentSetIndex === 1 && sets.length === 1) {
            set2A = currentSet.gamesA || 0;
            set2B = currentSet.gamesB || 0;
        } else if (currentSetIndex === 2 && sets.length === 2) {
            set3A = currentSet.gamesA || 0;
            set3B = currentSet.gamesB || 0;
        }
    }
    
    // Format current game (only show if match is playing)
    let gameA = '-';
    let gameB = '-';
    
    if (match.status === 'playing') {
        if (isTiebreak) {
            const tiebreak = currentSet.tiebreak || { pointsA: 0, pointsB: 0 };
            gameA = tiebreak.pointsA || 0;
            gameB = tiebreak.pointsB || 0;
        } else {
            gameA = formatPoint(currentGame.pointsA || 0, currentGame.deuceState, 'A');
            gameB = formatPoint(currentGame.pointsB || 0, currentGame.deuceState, 'B');
        }
    }
    
    return {
        set1A,
        set1B,
        set2A,
        set2B,
        set3A,
        set3B,
        gameA,
        gameB,
        isTiebreak
    };
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

// Update last update time
function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-PT');
    const dateElement = document.getElementById('last-update');
    const statusElement = document.getElementById('refresh-status');
    
    if (dateElement) {
        dateElement.textContent = timeString;
    }
    
    if (statusElement) {
        statusElement.textContent = '✓';
        statusElement.style.color = '#10b981';
        
        // Clear status after 500ms
        setTimeout(() => {
            statusElement.textContent = '';
        }, 500);
    }
}

// Show loading status
function showLoadingStatus() {
    const statusElement = document.getElementById('refresh-status');
    if (statusElement) {
        statusElement.textContent = '⟳';
        statusElement.style.color = '#667eea';
        statusElement.style.animation = 'spin 1s linear infinite';
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});
