const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./database/db');

// Import models
const Category = require('./database/models/Category');
const Team = require('./database/models/Team');
const Player = require('./database/models/Player');
const Match = require('./database/models/Match');
const Standing = require('./database/models/Standing');
const User = require('./database/models/User');
const ScoreEngine = require('./scoring/scoreEngine');
const MatchStatistics = require('./utils/matchStatistics');
const Tournament = require('./database/models/Tournament');
const TournamentGenerator = require('./utils/tournamentGenerator');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Authentication middleware (optional - allows requests without token for backward compatibility)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    // Allow requests without token (backward compatibility)
    req.user = null;
    return next();
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Invalid token - allow request but set user to null
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  });
}

// Admin-only middleware
function requireAdmin(req, res, next) {
  // If no user or user is not admin, deny access
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Viewer or authenticated user middleware (read-only access)
function requireViewer(req, res, next) {
  // Allow viewer, referee, and admin to access
  if (!req.user || !['viewer', 'referee', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Authentication required' });
  }
  next();
}

// Referee or admin middleware (for scoring actions)
function requireReferee(req, res, next) {
  // Allow referee and admin to access
  if (!req.user || !['referee', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Referee access required' });
  }
  next();
}

// ==================== CATEGORIES API ====================
app.get('/api/categories', (req, res) => {
  try {
    const categories = Category.getAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories/:id', (req, res) => {
  try {
    const category = Category.getById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Updated: 2025-12-06 10:51:00 - v0.03-dev - Added duplicate name validation
app.post('/api/categories', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const category = Category.create(name);
    res.status(201).json(category);
  } catch (error) {
    // Return 400 for validation errors (duplicate names), 500 for other errors
    const statusCode = error.message.includes('Já existe') ? 400 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// Updated: 2025-12-06 10:51:00 - v0.03-dev - Added duplicate name validation
app.put('/api/categories/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const category = Category.update(req.params.id, name);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    // Return 400 for validation errors (duplicate names), 500 for other errors
    const statusCode = error.message.includes('Já existe') ? 400 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    const deleted = Category.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TEAMS API ====================
app.get('/api/teams', (req, res) => {
  try {
    const { category_id } = req.query;
    let teams;
    
    if (category_id) {
      teams = Team.getByCategory(category_id);
    } else {
      teams = Team.getAll();
    }
    
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teams/:id', (req, res) => {
  try {
    const team = Team.getById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Updated: 2025-12-06 10:51:00 - v0.03-dev - Added duplicate name validation
app.post('/api/teams', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, category_id } = req.body;
    if (!name || !category_id) {
      return res.status(400).json({ error: 'Name and category_id are required' });
    }
    const team = Team.create(name, category_id);
    res.status(201).json(team);
  } catch (error) {
    // Return 400 for validation errors (duplicate names), 500 for other errors
    const statusCode = error.message.includes('Já existe') ? 400 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// Updated: 2025-12-06 10:51:00 - v0.03-dev - Added duplicate name validation
app.put('/api/teams/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, category_id } = req.body;
    if (!name || !category_id) {
      return res.status(400).json({ error: 'Name and category_id are required' });
    }
    const team = Team.update(req.params.id, name, category_id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    // Return 400 for validation errors (duplicate names), 500 for other errors
    const statusCode = error.message.includes('Já existe') ? 400 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

app.delete('/api/teams/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const deleted = Team.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PLAYERS API ====================
app.get('/api/players', (req, res) => {
  try {
    const { team_id } = req.query;
    let players;
    
    if (team_id) {
      players = Player.getByTeam(team_id);
    } else {
      players = Player.getAll();
    }
    
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/players/:id', (req, res) => {
  try {
    const player = Player.getById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/players', (req, res) => {
  try {
    const { name, team_id, contact_info } = req.body;
    if (!name || !team_id) {
      return res.status(400).json({ error: 'Name and team_id are required' });
    }
    const player = Player.create(name, team_id, contact_info);
    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/players/:id', (req, res) => {
  try {
    const { name, team_id, contact_info } = req.body;
    if (!name || !team_id) {
      return res.status(400).json({ error: 'Name and team_id are required' });
    }
    const player = Player.update(req.params.id, name, team_id, contact_info);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/players/:id', (req, res) => {
  try {
    const deleted = Player.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MATCHES API ====================
// Public endpoint for live matches (must be before /api/matches to avoid route conflicts)
app.get('/api/matches/live', (req, res) => {
  try {
    // Get all matches (already enriched with team and category names)
    let allMatches = Match.getAll();
    
    // Filter by category_id if provided
    if (req.query.category_id) {
      allMatches = allMatches.filter(m => m.category_id === parseInt(req.query.category_id));
    }
    
    // Separate playing and finished matches
    const playingMatches = allMatches.filter(m => m.status === 'playing');
    const finishedMatches = allMatches
      .filter(m => m.status === 'finished' && m.scheduled_date && m.scheduled_date !== null && m.scheduled_date !== '')
      .sort((a, b) => {
        // Sort by updated_at descending (most recently finished first)
        const dateA = new Date(a.updated_at || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.created_at || 0);
        return dateB - dateA;
      });
    
    // Combine: playing matches first, then fill with finished matches up to 2 total
    let matches = [...playingMatches];
    const remainingSlots = 2 - matches.length;
    if (remainingSlots > 0 && finishedMatches.length > 0) {
      matches = [...matches, ...finishedMatches.slice(0, remainingSlots)];
    }
    
    // Limit to 2 matches total
    matches = matches.slice(0, 2);
    
    // Ensure all score fields are included (Match.getAll already enriches, but we ensure completeness)
    matches = matches.map(match => {
      // Match.getAll already enriches with team1_name, team2_name, category_name
      // Just ensure all score-related fields are present (don't override if they exist)
      const result = { ...match };
      
      if (!result.sets_data) {
        result.sets_data = JSON.stringify([]);
      }
      if (!result.current_set_data) {
        result.current_set_data = JSON.stringify({ gamesA: 0, gamesB: 0, tiebreak: null });
      }
      if (!result.current_game_data) {
        result.current_game_data = JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null });
      }
      if (result.current_set_index === undefined) {
        result.current_set_index = 0;
      }
      
      return result;
    });
    
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/matches/:id', authenticateToken, requireViewer, (req, res) => {
  try {
    const match = Match.getById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/matches/:id/statistics', (req, res) => {
  try {
    const match = Match.getById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    const statistics = MatchStatistics.calculate(match);
    const pointBreakdown = MatchStatistics.getPointBreakdown(match);
    
    res.json({
      match: {
        match_id: match.match_id,
        team1_name: match.team1_name,
        team2_name: match.team2_name,
        category_name: match.category_name,
        status: match.status,
        winner_name: match.winner_name,
        scheduled_date: match.scheduled_date,
        scheduled_time: match.scheduled_time,
        court: match.court
      },
      statistics,
      pointBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/matches/:id/score-history', (req, res) => {
  try {
    const match = Match.getById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Parse score history
    let scoreHistory = [];
    try {
      scoreHistory = typeof match.score_history === 'string' 
        ? JSON.parse(match.score_history || '[]')
        : (match.score_history || []);
    } catch (e) {
      console.error('Error parsing score_history:', e);
      scoreHistory = [];
    }
    
    res.json({
      match_id: match.match_id,
      team1_name: match.team1_name,
      team2_name: match.team2_name,
      total_points: scoreHistory.length,
      history: scoreHistory.map((entry, index) => ({
        sequence: index + 1,
        timestamp: entry.timestamp,
        team_scored: entry.team_scored,
        score_summary: entry.score_summary || {
          sets: JSON.parse(entry.sets_data || '[]'),
          currentSet: JSON.parse(entry.current_set_data || '{}'),
          currentGame: JSON.parse(entry.current_game_data || '{}')
        },
        status: entry.status,
        winner_team_id: entry.winner_team_id
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/matches', (req, res) => {
  try {
    const match = Match.create(req.body);
    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/matches/:id', authenticateToken, requireReferee, (req, res) => {
  try {
    // If status is being set to 'finished', ensure current_set_data is added to sets_data
    if (req.body.status === 'finished') {
      const currentMatch = Match.getById(req.params.id);
      if (currentMatch) {
        let sets = [];
        try {
          sets = JSON.parse(currentMatch.sets_data || '[]');
        } catch (e) {
          sets = [];
        }
        
        // Parse current_set_data
        let currentSet = {};
        try {
          currentSet = JSON.parse(currentMatch.current_set_data || '{}');
        } catch (e) {
          currentSet = {};
        }
        
        // Check if current set is already in sets_data
        const currentSetIndex = currentMatch.current_set_index || 0;
        const setAlreadyAdded = sets.some((set, index) => index === currentSetIndex);
        
        // If current set has games and hasn't been added yet, add it to sets_data
        if (!setAlreadyAdded && (currentSet.gamesA > 0 || currentSet.gamesB > 0)) {
          // Ensure sets array has enough elements
          while (sets.length <= currentSetIndex) {
            sets.push({ gamesA: 0, gamesB: 0, tiebreak: null });
          }
          sets[currentSetIndex] = {
            gamesA: currentSet.gamesA || 0,
            gamesB: currentSet.gamesB || 0,
            tiebreak: currentSet.tiebreak || null
          };
          req.body.sets_data = JSON.stringify(sets);
        }
      }
    }
    
    const match = Match.update(req.params.id, req.body);
    
    // If match was updated and has tournament_id, check if all matches are scheduled
    // Updated: 2025-12-06 10:47:50 - v0.03-dev - Auto-update tournament status when match is scheduled
    if (match && match.tournament_id) {
      updateTournamentStatusIfAllScheduled(match.tournament_id);
    }
    
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/matches/:id', (req, res) => {
  try {
    Match.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SCORING API ====================
app.post('/api/matches/:id/score/increment', authenticateToken, requireReferee, (req, res) => {
  try {
    const match = Match.getById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const { team } = req.body; // 'A' or 'B' (team1 = A, team2 = B)
    if (!team) {
      return res.status(400).json({ error: 'Team is required (A or B)' });
    }

    // Ensure use_super_tiebreak is a boolean
    if (match.use_super_tiebreak !== undefined) {
      match.use_super_tiebreak = match.use_super_tiebreak === true || match.use_super_tiebreak === 'true' || match.use_super_tiebreak === 1;
    }

    const engine = new ScoreEngine(match);
    const newState = engine.incrementPoint(team);
    
    Match.update(req.params.id, newState);
    
    // Recalculate standings if match is finished
    if (newState.status === 'finished') {
      // TODO: Recalculate standings
    }

    const updatedMatch = Match.getById(req.params.id);
    res.json(updatedMatch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/matches/:id/score/decrement', authenticateToken, requireReferee, (req, res) => {
  try {
    const match = Match.getById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const { team } = req.body;
    if (!team) {
      return res.status(400).json({ error: 'Team is required (A or B)' });
    }

    // Ensure use_super_tiebreak is a boolean
    if (match.use_super_tiebreak !== undefined) {
      match.use_super_tiebreak = match.use_super_tiebreak === true || match.use_super_tiebreak === 'true' || match.use_super_tiebreak === 1;
    }

    const engine = new ScoreEngine(match);
    const newState = engine.decrementPoint(team);
    
    Match.update(req.params.id, newState);
    
    const updatedMatch = Match.getById(req.params.id);
    res.json(updatedMatch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/matches/:id/start', authenticateToken, requireReferee, (req, res) => {
  try {
    const match = Match.getById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Allow starting match until the end of the slot, even if there's not enough time to complete
    // Check if match is scheduled and if we're still within the slot time
    if (match.scheduled_date && match.scheduled_time) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // If match is scheduled for today, check if we're still within the slot
      if (match.scheduled_date === today) {
        const [scheduledH, scheduledM] = match.scheduled_time.split(':').map(Number);
        const scheduledMinutes = scheduledH * 60 + scheduledM;
        const [currentH, currentM] = currentTime.split(':').map(Number);
        const currentMinutes = currentH * 60 + currentM;
        
        // Get match duration from tournament if available, otherwise default to 90 minutes
        let matchDuration = 90;
        if (match.tournament_id) {
          const Tournament = require('./database/models/Tournament');
          const tournament = Tournament.getById(match.tournament_id);
          if (tournament && tournament.match_duration_minutes) {
            matchDuration = tournament.match_duration_minutes;
          }
        }
        
        const slotEndMinutes = scheduledMinutes + matchDuration;
        
        // Allow starting if we're still within the slot (even if less time remains than duration)
        // This allows starting until the end of the slot, even if not enough time to complete
        if (currentMinutes > slotEndMinutes) {
          // Slot has ended, but still allow starting (user requested this behavior)
          console.log(`[INFO] Starting match ${req.params.id} after slot end time (slot ended at ${slotEndMinutes} minutes, current: ${currentMinutes} minutes)`);
        } else {
          const remainingMinutes = slotEndMinutes - currentMinutes;
          if (remainingMinutes < matchDuration) {
            console.log(`[INFO] Starting match ${req.params.id} with ${remainingMinutes} minutes remaining (less than full duration of ${matchDuration} minutes)`);
          }
        }
      }
    }
    
    Match.update(req.params.id, { status: 'playing' });
    const updatedMatch = Match.getById(req.params.id);
    res.json(updatedMatch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/matches/:id/finish', authenticateToken, requireReferee, (req, res) => {
  try {
    Match.update(req.params.id, { status: 'finished' });
    const match = Match.getById(req.params.id);
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STANDINGS API ====================
app.get('/api/standings', authenticateToken, requireViewer, (req, res) => {
  try {
    const { category_id } = req.query;
    let standings;
    
    if (category_id) {
      standings = Standing.getByCategory(category_id);
    } else {
      standings = Standing.getAll();
    }
    
    res.json(standings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/standings/recalculate/:categoryId', (req, res) => {
  try {
    Standing.recalculateRankings(req.params.categoryId);
    const standings = Standing.getByCategory(req.params.categoryId);
    res.json(standings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== USERS API ====================
app.get('/api/users', (req, res) => {
  try {
    const users = User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = User.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    const user = User.create(username, password, role);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const user = User.update(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const deleted = User.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUTHENTICATION API ====================
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = User.authenticate(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return token and user info
    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TOURNAMENT SCHEDULER API - v0.02
// ============================================================================
// INDEPENDENT MODULE: This module is completely independent from referee and match modules.
// It serves ONLY to automatically create and schedule matches for tournaments.
// Once matches are created, they function normally like any manually created match.
// ============================================================================

// Tournaments CRUD
app.get('/api/tournaments', authenticateToken, requireViewer, (req, res) => {
  try {
    const tournaments = Tournament.getAll();
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// IMPORTANT: More specific routes must come before generic :id route
// Get tournament bracket tree structure (must be before /api/tournaments/:id)
app.get('/api/tournaments/:tournament_id/bracket', authenticateToken, requireViewer, (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournament_id);
    const tournament = Tournament.getById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    const matches = Match.getByTournament(tournamentId);
    const Standing = require('./database/models/Standing');
    
    // Group matches by phase
    const bracket = {
      tournament_id: tournamentId,
      tournament_name: tournament.name,
      categories: []
    };
    
    // Process each category in the tournament
    for (const categoryId of tournament.category_ids || []) {
      const categoryMatches = matches.filter(m => m.category_id === categoryId);
      const categoryStandings = Standing.getByCategory(categoryId);
      
      // Group standings by group
      const standingsByGroup = {};
      categoryStandings.forEach(standing => {
        if (standing.group_name) {
          if (!standingsByGroup[standing.group_name]) {
            standingsByGroup[standing.group_name] = [];
          }
          standingsByGroup[standing.group_name].push(standing);
        }
      });
      
      // Sort standings within each group
      Object.keys(standingsByGroup).forEach(groupName => {
        standingsByGroup[groupName].sort((a, b) => {
          if (a.group_rank !== b.group_rank) {
            return (a.group_rank || 999) - (b.group_rank || 999);
          }
          if (a.points !== b.points) return b.points - a.points;
          return b.games_won - a.games_won;
        });
      });
      
      // Organize matches by phase
      const groupMatches = categoryMatches.filter(m => m.phase === 'Group');
      const quarterFinalMatches = categoryMatches.filter(m => m.phase === 'Quarter-final');
      const semiFinalMatches = categoryMatches.filter(m => m.phase === 'Semi-final');
      const finalMatches = categoryMatches.filter(m => m.phase === 'Final');
      
      // Get all unique group names from matches (even if no standings exist yet)
      const groupsFromMatches = {};
      groupMatches.forEach(match => {
        if (match.group_name) {
          if (!groupsFromMatches[match.group_name]) {
            groupsFromMatches[match.group_name] = [];
          }
          groupsFromMatches[match.group_name].push(match);
        }
      });
      
      // Combine groups from standings and matches
      const allGroupNames = new Set([
        ...Object.keys(standingsByGroup),
        ...Object.keys(groupsFromMatches)
      ]);
      
      bracket.categories.push({
        category_id: categoryId,
        category_name: categoryMatches[0]?.category_name || `Category ${categoryId}`,
        groups: Array.from(allGroupNames).map(groupName => ({
          group_name: groupName,
          standings: (standingsByGroup[groupName] || []).map(s => ({
            team_id: s.team_id,
            team_name: s.team_name || `Team ${s.team_id}`,
            rank: s.group_rank,
            points: s.points,
            wins: s.wins,
            losses: s.losses,
            matches_played: s.matches_played
          })),
          matches: (groupsFromMatches[groupName] || []).map(m => {
            // Parse sets data
            let sets = [];
            try {
              sets = JSON.parse(m.sets_data || '[]');
            } catch (e) {
              sets = [];
            }
            
            // Format sets result (e.g., "6 x 0 / 6 x 2")
            const setsResult = sets.length > 0 
              ? sets.map(set => {
                  if (set.tiebreak) {
                    return `${set.gamesA} x ${set.gamesB} (${set.tiebreak.A} x ${set.tiebreak.B})`;
                  }
                  return `${set.gamesA} x ${set.gamesB}`;
                }).join(' / ')
              : null;
            
            return {
              match_id: m.match_id,
              team1_id: m.team1_id,
              team2_id: m.team2_id,
              team1_name: m.team1_name,
              team2_name: m.team2_name,
              scheduled_date: m.scheduled_date,
              scheduled_time: m.scheduled_time,
              court: m.court,
              status: m.status,
              winner_team_id: m.winner_team_id,
              sets_data: sets,
              sets_result: setsResult
            };
          })
        })),
        all_group_matches: groupMatches.map(m => {
          // Parse sets data
          let sets = [];
          try {
            sets = JSON.parse(m.sets_data || '[]');
          } catch (e) {
            sets = [];
          }
          
          // Format sets result (e.g., "6 x 0 / 6 x 2")
          const setsResult = sets.length > 0 
            ? sets.map(set => {
                if (set.tiebreak) {
                  return `${set.gamesA} x ${set.gamesB} (${set.tiebreak.A} x ${set.tiebreak.B})`;
                }
                return `${set.gamesA} x ${set.gamesB}`;
              }).join(' / ')
            : null;
          
          return {
            match_id: m.match_id,
            match_number: m.match_id, // Use match_id as number for now
            team1_id: m.team1_id,
            team2_id: m.team2_id,
            team1_name: m.team1_name,
            team2_name: m.team2_name,
            group_name: m.group_name,
            scheduled_date: m.scheduled_date,
            scheduled_time: m.scheduled_time,
            court: m.court,
            status: m.status,
            winner_team_id: m.winner_team_id,
            sets_data: sets,
            sets_result: setsResult
          };
        }).sort((a, b) => {
          // Sort by date/time, then by match_id
          if (a.scheduled_date && b.scheduled_date) {
            if (a.scheduled_date !== b.scheduled_date) {
              return a.scheduled_date.localeCompare(b.scheduled_date);
            }
            if (a.scheduled_time && b.scheduled_time) {
              return a.scheduled_time.localeCompare(b.scheduled_time);
            }
          }
          return a.match_id - b.match_id;
        }),
        knockout: {
          quarter_finals: quarterFinalMatches.map(m => ({
            match_id: m.match_id,
            team1_id: m.team1_id,
            team2_id: m.team2_id,
            team1_name: m.team1_name || m.placeholder_label?.split(' vs ')[0] || 'TBD',
            team2_name: m.team2_name || m.placeholder_label?.split(' vs ')[1] || 'TBD',
            scheduled_date: m.scheduled_date,
            scheduled_time: m.scheduled_time,
            court: m.court,
            status: m.status,
            winner_team_id: m.winner_team_id,
            placeholder: m.placeholder || false
          })),
          semi_finals: semiFinalMatches.map(m => ({
            match_id: m.match_id,
            team1_id: m.team1_id,
            team2_id: m.team2_id,
            team1_name: m.team1_name || m.placeholder_label?.split(' vs ')[0] || 'TBD',
            team2_name: m.team2_name || m.placeholder_label?.split(' vs ')[1] || 'TBD',
            scheduled_date: m.scheduled_date,
            scheduled_time: m.scheduled_time,
            court: m.court,
            status: m.status,
            winner_team_id: m.winner_team_id,
            placeholder: m.placeholder || false
          })),
          final: finalMatches.map(m => ({
            match_id: m.match_id,
            team1_id: m.team1_id,
            team2_id: m.team2_id,
            team1_name: m.team1_name || m.placeholder_label?.split(' vs ')[0] || 'TBD',
            team2_name: m.team2_name || m.placeholder_label?.split(' vs ')[1] || 'TBD',
            scheduled_date: m.scheduled_date,
            scheduled_time: m.scheduled_time,
            court: m.court,
            status: m.status,
            winner_team_id: m.winner_team_id,
            placeholder: m.placeholder || false
          }))
        }
      });
    }
    
    res.json(bracket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// IMPORTANT: All specific routes with :tournament_id must come before generic :id route
// Get tournament matches (must be before /api/tournaments/:id)
app.get('/api/tournaments/:tournament_id/matches', authenticateToken, requireViewer, (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournament_id);
    const matches = Match.getByTournament(tournamentId);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tournaments/:id', authenticateToken, requireViewer, (req, res) => {
  try {
    const tournament = Tournament.getById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Updated: 2025-12-06 10:51:00 - v0.03-dev - Added category_ids selection
app.post('/api/tournaments', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, start_date, end_date, courts, start_time, end_time, match_duration_minutes, use_super_tiebreak, category_ids } = req.body;
    
    if (!name || !start_date || !end_date || !courts || !start_time || !end_time || !match_duration_minutes) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios são necessários' });
    }
    
    // Validate category_ids
    if (!category_ids || !Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({ error: 'Pelo menos uma categoria deve ser selecionada' });
    }
    
    // Validate dates
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'Data de início deve ser anterior à data de fim' });
    }
    
    // Validate time frame
    const [startH, startM] = start_time.split(':').map(Number);
    const [endH, endM] = end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    if (startMinutes >= endMinutes) {
      return res.status(400).json({ error: 'Hora de início deve ser anterior à hora de fim' });
    }
    
    const tournament = Tournament.create({
      name,
      start_date,
      end_date,
      courts: parseInt(courts),
      start_time,
      end_time,
      match_duration_minutes: parseInt(match_duration_minutes),
      use_super_tiebreak: use_super_tiebreak !== undefined ? use_super_tiebreak : false,
      category_ids: category_ids.map(id => parseInt(id))
    });
    
    res.status(201).json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tournaments/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const tournament = Tournament.update(req.params.id, req.body);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tournaments/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    
    // Get all matches for this tournament
    const allMatches = Match.getAll();
    const tournamentMatches = allMatches.filter(m => m.tournament_id === tournamentId);
    
    // Delete all matches associated with this tournament
    tournamentMatches.forEach(match => {
      Match.delete(match.match_id);
    });
    
    // Delete the tournament
    const deleted = Tournament.delete(tournamentId);
    if (!deleted) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to update tournament status if all matches are scheduled
// Updated: 2025-12-06 10:47:50 - v0.03-dev - Auto-update tournament status to 'completed' when all matches are scheduled
function updateTournamentStatusIfAllScheduled(tournamentId) {
  try {
    const tournamentMatches = Match.getByTournament(tournamentId);
    
    // If no matches, don't update status
    if (tournamentMatches.length === 0) {
      return;
    }
    
    // Check if all matches have scheduled_date
    const allScheduled = tournamentMatches.every(match => match.scheduled_date && match.scheduled_date !== null);
    
    if (allScheduled) {
      Tournament.update(tournamentId, { status: 'completed' });
      console.log(`Tournament ${tournamentId} status updated to 'completed' - all matches are scheduled`);
    }
  } catch (error) {
    console.error(`Error updating tournament status: ${error.message}`);
  }
}

// Generate group stage matches
app.post('/api/tournaments/:tournament_id/generate-group-stage', authenticateToken, requireAdmin, (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournament_id);
    const tournament = Tournament.getById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    const { category_id, teams_per_group, top_team_ids, auto_schedule, use_super_tiebreak, start_date, start_time, day_time_overrides } = req.body;
    
    if (!category_id) {
      return res.status(400).json({ error: 'category_id is required' });
    }
    
    const teams = Team.getByCategory(category_id);
    if (teams.length < 2) {
      return res.status(400).json({ error: 'At least 2 teams are required' });
    }
    
    const topTeamIds = top_team_ids || [];
    const groups = TournamentGenerator.generateGroupStage(teams, teams_per_group || 4, topTeamIds);
    
    const matches = [];
    groups.forEach(group => {
      group.matches.forEach(matchPair => {
        matches.push({
          tournament_id: tournamentId,
          tournament_name: tournament.name,
          team1_id: matchPair.team1_id,
          team2_id: matchPair.team2_id,
          category_id: parseInt(category_id),
          phase: 'Group',
          group_name: matchPair.group_name,
          status: auto_schedule ? 'draft' : 'draft', // Will be updated to 'scheduled' if auto_schedule succeeds
          use_super_tiebreak: use_super_tiebreak !== undefined ? use_super_tiebreak : tournament.use_super_tiebreak || false
        });
      });
    });
    
    // Auto-schedule if requested
    let scheduledMatches = matches;
    if (auto_schedule) {
      // Validate tournament has required fields for scheduling
      if (!tournament.start_date || !tournament.end_date || !tournament.start_time || !tournament.end_time) {
        console.error(`[ERROR] Tournament ${tournamentId} missing required scheduling fields:`, {
          start_date: tournament.start_date,
          end_date: tournament.end_date,
          start_time: tournament.start_time,
          end_time: tournament.end_time
        });
        return res.status(400).json({ 
          error: 'Tournament missing required scheduling fields (start_date, end_date, start_time, end_time)' 
        });
      }
      
      if (!tournament.match_duration_minutes || tournament.match_duration_minutes <= 0) {
        console.error(`[ERROR] Tournament ${tournamentId} has invalid match_duration_minutes:`, tournament.match_duration_minutes);
        return res.status(400).json({ 
          error: 'Tournament has invalid match_duration_minutes' 
        });
      }
      
      if (!tournament.courts || tournament.courts <= 0) {
        console.error(`[ERROR] Tournament ${tournamentId} has invalid courts:`, tournament.courts);
        return res.status(400).json({ 
          error: 'Tournament has invalid courts count' 
        });
      }
      
      const category = Category.getById(category_id);
      if (!category) {
        console.error(`[ERROR] Category ${category_id} not found`);
        return res.status(404).json({ error: 'Category not found' });
      }
      
      const categoryPriorities = {
        [category_id]: TournamentGenerator.getCategoryPriority(category.name)
      };
      
      // Get all existing matches to check for conflicts (including from other categories)
      const allExistingMatches = Match.getAll().filter(m => 
        m.scheduled_date && m.scheduled_time && m.court
      );
      
      // day_time_overrides format: { "2025-06-01": { "startTime": "09:00", "endTime": "18:00" }, ... }
      const dayTimeOverrides = day_time_overrides || {};
      
      // start_date and start_time define the MINIMUM - generation cannot start before these
      // dayTimeOverrides can override specific days but must respect this minimum
      let scheduleStartDate = start_date || tournament.start_date;
      let scheduleStartTime = start_time || tournament.start_time;
      
      // Filter dayTimeOverrides to only include dates >= scheduleStartDate
      // and ensure times respect scheduleStartTime as minimum for the start date
      if (Object.keys(dayTimeOverrides).length > 0) {
        const filteredOverrides = {};
        Object.keys(dayTimeOverrides).sort().forEach(dateStr => {
          if (dateStr >= scheduleStartDate) {
            const override = dayTimeOverrides[dateStr];
            let overrideStartTime = override.startTime || scheduleStartTime;
            let overrideEndTime = override.endTime || tournament.end_time;
            
            // If this is the start date and override startTime is earlier than scheduleStartTime, use scheduleStartTime
            if (dateStr === scheduleStartDate && scheduleStartTime && overrideStartTime < scheduleStartTime) {
              overrideStartTime = scheduleStartTime;
            }
            
            filteredOverrides[dateStr] = {
              startTime: overrideStartTime,
              endTime: overrideEndTime
            };
          }
        });
        
        // Replace dayTimeOverrides with filtered version
        Object.keys(dayTimeOverrides).forEach(key => delete dayTimeOverrides[key]);
        Object.assign(dayTimeOverrides, filteredOverrides);
      }
      
      console.log(`[DEBUG] Auto-scheduling ${matches.length} matches for tournament ${tournamentId}, category ${category_id}`);
      console.log(`[DEBUG] Tournament config:`, {
        startDate: scheduleStartDate,
        endDate: tournament.end_date,
        startTime: scheduleStartTime,
        endTime: tournament.end_time,
        matchDurationMinutes: tournament.match_duration_minutes,
        courts: tournament.courts
      });
      
      try {
        scheduledMatches = TournamentGenerator.scheduleMatches(matches, {
          startDate: scheduleStartDate,
          endDate: tournament.end_date,
          startTime: scheduleStartTime,
          endTime: tournament.end_time,
          matchDurationMinutes: tournament.match_duration_minutes,
          courts: tournament.courts
        }, categoryPriorities, null, null, dayTimeOverrides, allExistingMatches);
        
        // Update status to scheduled if auto-scheduled successfully
        scheduledMatches.forEach(match => {
          if (match.scheduled_date && match.scheduled_time && match.court) {
            match.status = 'scheduled';
          }
        });
        
        const scheduledCount = scheduledMatches.filter(m => m.status === 'scheduled').length;
        console.log(`[DEBUG] Auto-scheduled ${scheduledCount} out of ${scheduledMatches.length} matches`);
      } catch (scheduleError) {
        console.error(`[ERROR] Failed to auto-schedule matches:`, scheduleError);
        console.error(`[ERROR] Schedule error stack:`, scheduleError.stack);
        // Continue with unscheduled matches instead of crashing
        scheduledMatches = matches;
      }
    }
    
    // Create matches
    const createdMatches = [];
    scheduledMatches.forEach(matchData => {
      const match = Match.create(matchData);
      createdMatches.push(match);
    });
    
    // Update tournament status if all matches are scheduled
    updateTournamentStatusIfAllScheduled(tournamentId);
    
    res.json({
      success: true,
      matches_created: createdMatches.length,
      groups: groups.length,
      matches: createdMatches,
      auto_scheduled: auto_schedule || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate group stage matches for multiple categories
app.post('/api/tournaments/:tournament_id/generate-group-stage-multiple', authenticateToken, requireAdmin, (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournament_id);
    const tournament = Tournament.getById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    const { category_ids, teams_per_group, teams_per_group_by_category, top_team_ids_by_category, auto_schedule, use_super_tiebreak, start_date, start_time, day_time_overrides } = req.body;
    
    if (!category_ids || !Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({ error: 'category_ids array is required' });
    }
    
    // Generate matches for all categories
    const allMatches = [];
    const categoryPriorities = {};
    
    category_ids.forEach(category_id => {
      const teams = Team.getByCategory(category_id);
      if (teams.length < 2) {
        return; // Skip categories with insufficient teams
      }
      
      const category = Category.getById(category_id);
      if (!category) {
        console.warn(`Category ${category_id} not found, skipping`);
        return; // Skip categories that don't exist
      }
      categoryPriorities[category_id] = TournamentGenerator.getCategoryPriority(category.name);
      
      // Use category-specific teams_per_group if provided, otherwise use general or default to 4
      const categoryTeamsPerGroup = (teams_per_group_by_category && teams_per_group_by_category[category_id]) 
        || teams_per_group 
        || 4;
      
      const topTeamIds = (top_team_ids_by_category && top_team_ids_by_category[category_id]) || [];
      const groups = TournamentGenerator.generateGroupStage(teams, categoryTeamsPerGroup, topTeamIds);
      
      groups.forEach(group => {
        group.matches.forEach(matchPair => {
          allMatches.push({
            tournament_id: tournamentId,
            tournament_name: tournament.name,
            team1_id: matchPair.team1_id,
            team2_id: matchPair.team2_id,
            category_id: parseInt(category_id),
            phase: 'Group',
            group_name: matchPair.group_name,
            status: 'draft',
            use_super_tiebreak: use_super_tiebreak !== undefined ? use_super_tiebreak : tournament.use_super_tiebreak || false
          });
        });
      });
    });
    
    // Auto-schedule if requested
    let scheduledMatches = allMatches;
    if (auto_schedule) {
      // Validate tournament has required fields for scheduling
      if (!tournament.start_date || !tournament.end_date || !tournament.start_time || !tournament.end_time) {
        console.error(`[ERROR] Tournament ${tournamentId} missing required scheduling fields:`, {
          start_date: tournament.start_date,
          end_date: tournament.end_date,
          start_time: tournament.start_time,
          end_time: tournament.end_time
        });
        return res.status(400).json({ 
          error: 'Tournament missing required scheduling fields (start_date, end_date, start_time, end_time)' 
        });
      }
      
      if (!tournament.match_duration_minutes || tournament.match_duration_minutes <= 0) {
        console.error(`[ERROR] Tournament ${tournamentId} has invalid match_duration_minutes:`, tournament.match_duration_minutes);
        return res.status(400).json({ 
          error: 'Tournament has invalid match_duration_minutes' 
        });
      }
      
      if (!tournament.courts || tournament.courts <= 0) {
        console.error(`[ERROR] Tournament ${tournamentId} has invalid courts:`, tournament.courts);
        return res.status(400).json({ 
          error: 'Tournament has invalid courts count' 
        });
      }
      
      // Get all existing matches to check for conflicts
      const allExistingMatches = Match.getAll().filter(m => 
        m.scheduled_date && m.scheduled_time && m.court
      );
      
      const dayTimeOverrides = day_time_overrides || {};
      let scheduleStartDate = start_date || tournament.start_date;
      let scheduleStartTime = start_time || tournament.start_time;
      
      // Filter dayTimeOverrides to respect start_date/start_time as minimum
      if (Object.keys(dayTimeOverrides).length > 0) {
        const filteredOverrides = {};
        Object.keys(dayTimeOverrides).sort().forEach(dateStr => {
          if (dateStr >= scheduleStartDate) {
            const override = dayTimeOverrides[dateStr];
            let overrideStartTime = override.startTime || scheduleStartTime;
            let overrideEndTime = override.endTime || tournament.end_time;
            
            if (dateStr === scheduleStartDate && scheduleStartTime && overrideStartTime < scheduleStartTime) {
              overrideStartTime = scheduleStartTime;
            }
            
            filteredOverrides[dateStr] = {
              startTime: overrideStartTime,
              endTime: overrideEndTime
            };
          }
        });
        
        Object.keys(dayTimeOverrides).forEach(key => delete dayTimeOverrides[key]);
        Object.assign(dayTimeOverrides, filteredOverrides);
      }
      
      console.log(`[DEBUG] Auto-scheduling ${allMatches.length} matches for tournament ${tournamentId}, ${category_ids.length} categories`);
      console.log(`[DEBUG] Tournament config:`, {
        startDate: scheduleStartDate,
        endDate: tournament.end_date,
        startTime: scheduleStartTime,
        endTime: tournament.end_time,
        matchDurationMinutes: tournament.match_duration_minutes,
        courts: tournament.courts
      });
      try {
        scheduledMatches = TournamentGenerator.scheduleMatches(allMatches, {
          startDate: scheduleStartDate,
          endDate: tournament.end_date,
          startTime: scheduleStartTime,
          endTime: tournament.end_time,
          matchDurationMinutes: tournament.match_duration_minutes,
          courts: tournament.courts
        }, categoryPriorities, null, null, dayTimeOverrides, allExistingMatches);
        
        // Update status to scheduled if auto-scheduled successfully
        scheduledMatches.forEach(match => {
          if (match.scheduled_date && match.scheduled_time && match.court) {
            match.status = 'scheduled';
          }
        });
        
        const scheduledCount = scheduledMatches.filter(m => m.status === 'scheduled').length;
        console.log(`[DEBUG] Auto-scheduled ${scheduledCount} out of ${scheduledMatches.length} matches for multiple categories`);
      } catch (scheduleError) {
        console.error(`[ERROR] Failed to auto-schedule matches:`, scheduleError);
        console.error(`[ERROR] Schedule error stack:`, scheduleError.stack);
        // Continue with unscheduled matches instead of crashing
        scheduledMatches = allMatches;
      }
    }
    
    // Create matches
    const createdMatches = [];
    scheduledMatches.forEach(matchData => {
      const match = Match.create(matchData);
      createdMatches.push(match);
    });
    
    // Update tournament status if all matches are scheduled
    updateTournamentStatusIfAllScheduled(tournamentId);
    
    // Count actually processed categories (those with matches created)
    const processedCategoryIds = [...new Set(createdMatches.map(m => m.category_id))];
    
    res.json({
      success: true,
      total_matches_created: createdMatches.length,
      categories_processed: processedCategoryIds.length,
      matches: createdMatches,
      auto_scheduled: auto_schedule || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get qualified teams from group stage
app.get('/api/tournaments/:tournament_id/qualified-teams', authenticateToken, (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournament_id);
    const tournament = Tournament.getById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    const { category_id, phase, teams_per_group } = req.query;
    
    if (!category_id || !phase) {
      return res.status(400).json({ error: 'category_id and phase are required' });
    }
    
    const knockoutStageType = tournament.knockout_stage_type || 'quarter_final';
    
    const qualified = TournamentGenerator.getQualifiedTeamsFromGroups(
      parseInt(category_id),
      phase,
      teams_per_group ? parseInt(teams_per_group) : 4,
      knockoutStageType
    );
    
    // Enrich with team names
    const Team = require('./database/models/Team');
    const enriched = qualified.map(q => {
      const team = Team.getById(q.team_id);
      return {
        ...q,
        team_name: team ? team.name : null
      };
    });
    
    res.json({
      success: true,
      qualified_teams: enriched,
      phase: phase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate knockout stage matches
app.post('/api/tournaments/:tournament_id/generate-knockout-stage', authenticateToken, requireAdmin, (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournament_id);
    const tournament = Tournament.getById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    const { category_id, phase, qualified_team_ids, auto_schedule, use_super_tiebreak, 
            auto_qualify, teams_per_group, phase_start_date, phase_start_time, day_time_overrides, start_date, start_time,
            create_placeholders } = req.body;
    
    if (!category_id || !phase) {
      return res.status(400).json({ error: 'category_id and phase are required' });
    }
    
    let qualifiedTeams = [];
    const allowPlaceholders = create_placeholders === true || create_placeholders === 'true';
    
    console.log(`[DEBUG] Generate knockout stage - category_id: ${category_id}, phase: ${phase}, create_placeholders: ${create_placeholders}, allowPlaceholders: ${allowPlaceholders}, auto_qualify: ${auto_qualify}`);
    
    // If placeholders are allowed, skip team qualification and proceed directly
    if (allowPlaceholders) {
      console.log(`[DEBUG] Placeholders allowed - will generate matches without teams`);
      qualifiedTeams = []; // Empty array to trigger placeholder generation
    } else {
      // Auto-qualify from group standings if requested
      if (auto_qualify) {
        const knockoutStageType = tournament.knockout_stage_type || 'quarter_final';
        console.log(`[DEBUG] Auto-qualifying teams for category ${category_id}, phase ${phase}, knockoutStageType ${knockoutStageType}`);
        qualifiedTeams = TournamentGenerator.getQualifiedTeamsFromGroups(
          parseInt(category_id),
          phase,
          teams_per_group || 4,
          knockoutStageType
        );
        console.log(`[DEBUG] Auto-qualified ${qualifiedTeams.length} teams:`, qualifiedTeams.map(t => ({ team_id: t.team_id, group: t.group_name, rank: t.group_rank })));
        
        // If no teams qualified, return error
        if (qualifiedTeams.length === 0) {
          return res.status(400).json({ 
            error: 'Nenhuma equipa qualificada encontrada. Certifique-se de que os jogos da fase de grupos foram jogados e as classificações foram calculadas.',
            details: 'No qualified teams found. Make sure group stage matches have been played and standings have been calculated.',
            suggestion: 'Use create_placeholders=true to reserve calendar slots without teams'
          });
        }
      } else if (qualified_team_ids && Array.isArray(qualified_team_ids) && qualified_team_ids.length > 0) {
        // Use provided qualified team IDs (legacy format)
        qualifiedTeams = qualified_team_ids.map(id => ({ team_id: id }));
      } else {
        // If no teams provided and placeholders not allowed, return error
        return res.status(400).json({ 
          error: 'Either auto_qualify=true, qualified_team_ids array, or create_placeholders=true is required',
          suggestion: 'Use create_placeholders=true to reserve calendar slots without teams'
        });
      }
      
      // Require 2+ teams
      if (qualifiedTeams.length < 2) {
        return res.status(400).json({ 
          error: `São necessárias pelo menos 2 equipas qualificadas. Encontradas: ${qualifiedTeams.length}`,
          details: `At least 2 qualified teams are required. Found: ${qualifiedTeams.length}`,
          qualified_teams_count: qualifiedTeams.length,
          suggestion: 'Use create_placeholders=true to reserve calendar slots without teams'
        });
      }
    }
    
    const knockoutStageType = tournament.knockout_stage_type || 'quarter_final';
    const matchPairs = TournamentGenerator.generateKnockoutStage(qualifiedTeams, phase, knockoutStageType, allowPlaceholders);
    
    const matches = matchPairs.map(matchPair => ({
      tournament_id: tournamentId,
      tournament_name: tournament.name,
      team1_id: matchPair.team1_id || null,
      team2_id: matchPair.team2_id || null,
      category_id: parseInt(category_id),
      phase: phase,
      status: auto_schedule ? 'scheduled' : 'draft',
      use_super_tiebreak: use_super_tiebreak !== undefined ? use_super_tiebreak : tournament.use_super_tiebreak || false,
      placeholder: matchPair.placeholder || false,
      placeholder_label: matchPair.placeholder_label || null
    }));
    
    // Auto-schedule if requested
    let scheduledMatches = matches;
    if (auto_schedule) {
      const category = Category.getById(category_id);
      const categoryPriorities = {
        [category_id]: TournamentGenerator.getCategoryPriority(category.name)
      };
      
      // Get all existing matches to check for conflicts (including from other categories)
      const allExistingMatches = Match.getAll().filter(m => 
        m.scheduled_date && m.scheduled_time && m.court
      );
      
      // day_time_overrides format: { "2025-06-01": { "startTime": "09:00", "endTime": "18:00" }, ... }
      const dayTimeOverrides = day_time_overrides || {};
      
      // Priority: phase_start_date/phase_start_time > start_date/start_time > tournament defaults
      let scheduleStartDate = phase_start_date || start_date || tournament.start_date;
      let scheduleStartTime = phase_start_time || start_time || tournament.start_time;
      
      // Filter dayTimeOverrides to respect scheduleStartDate/scheduleStartTime as minimum
      if (Object.keys(dayTimeOverrides).length > 0) {
        const filteredOverrides = {};
        Object.keys(dayTimeOverrides).sort().forEach(dateStr => {
          if (dateStr >= scheduleStartDate) {
            const override = dayTimeOverrides[dateStr];
            let overrideStartTime = override.startTime || scheduleStartTime;
            let overrideEndTime = override.endTime || tournament.end_time;
            
            if (dateStr === scheduleStartDate && scheduleStartTime && overrideStartTime < scheduleStartTime) {
              overrideStartTime = scheduleStartTime;
            }
            
            filteredOverrides[dateStr] = {
              startTime: overrideStartTime,
              endTime: overrideEndTime
            };
          }
        });
        
        Object.keys(dayTimeOverrides).forEach(key => delete dayTimeOverrides[key]);
        Object.assign(dayTimeOverrides, filteredOverrides);
      }
      
      scheduledMatches = TournamentGenerator.scheduleMatches(matches, {
        startDate: scheduleStartDate,
        endDate: tournament.end_date,
        startTime: scheduleStartTime,
        endTime: tournament.end_time,
        matchDurationMinutes: tournament.match_duration_minutes,
        courts: tournament.courts
      }, categoryPriorities, phase_start_date || null, phase_start_time || null, dayTimeOverrides, allExistingMatches);
    }
    
    // Create matches
    const createdMatches = [];
    scheduledMatches.forEach(matchData => {
      const match = Match.create(matchData);
      createdMatches.push(match);
    });
    
    // Update tournament status if all matches are scheduled
    updateTournamentStatusIfAllScheduled(tournamentId);
    
    res.json({
      success: true,
      matches_created: createdMatches.length,
      phase: phase,
      matches: createdMatches,
      auto_scheduled: auto_schedule || false,
      auto_qualified: auto_qualify || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update matches endpoint to support tournament filtering
app.get('/api/matches', authenticateToken, requireViewer, (req, res) => {
  try {
    let matches = Match.getAll();
    
    // Filter by tournament_id if provided
    if (req.query.tournament_id) {
      matches = matches.filter(m => m.tournament_id === parseInt(req.query.tournament_id));
    }
    
    // Filter by category_id if provided
    if (req.query.category_id) {
      matches = matches.filter(m => m.category_id === parseInt(req.query.category_id));
    }
    
    // Filter by phase if provided
    if (req.query.phase) {
      matches = matches.filter(m => m.phase === req.query.phase);
    }
    
    // Filter by status if provided
    if (req.query.status) {
      matches = matches.filter(m => m.status === req.query.status);
    }
    
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server (only if not in test environment)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Backoffice server running on http://localhost:${PORT}`);
    console.log(`📊 Database: JSON file at ${db.path}`);
  });
}

module.exports = app;

