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

app.post('/api/categories', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const category = Category.create(name);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
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
    res.status(500).json({ error: error.message });
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
    const { category_id, group } = req.query;
    let teams;
    
    if (category_id && group) {
      teams = Team.getByGroup(category_id, group);
    } else if (category_id) {
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

app.post('/api/teams', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, category_id, group_name } = req.body;
    if (!name || !category_id || !group_name) {
      return res.status(400).json({ error: 'Name, category_id, and group_name are required' });
    }
    const team = Team.create(name, category_id, group_name);
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/teams/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, category_id, group_name } = req.body;
    if (!name || !category_id || !group_name) {
      return res.status(400).json({ error: 'Name, category_id, and group_name are required' });
    }
    const team = Team.update(req.params.id, name, category_id, group_name);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
app.get('/api/matches', (req, res) => {
  try {
    const { category_id, status } = req.query;
    let matches;
    
    if (status) {
      matches = Match.getByStatus(status);
    } else if (category_id) {
      matches = Match.getByCategory(category_id);
    } else {
      matches = Match.getAll();
    }
    
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/matches/:id', (req, res) => {
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

app.put('/api/matches/:id', (req, res) => {
  try {
    const match = Match.update(req.params.id, req.body);
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
app.post('/api/matches/:id/score/increment', (req, res) => {
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

app.post('/api/matches/:id/score/decrement', (req, res) => {
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

app.post('/api/matches/:id/start', (req, res) => {
  try {
    Match.update(req.params.id, { status: 'playing' });
    const match = Match.getById(req.params.id);
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/matches/:id/finish', (req, res) => {
  try {
    Match.update(req.params.id, { status: 'finished' });
    const match = Match.getById(req.params.id);
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STANDINGS API ====================
app.get('/api/standings', (req, res) => {
  try {
    const { category_id, group } = req.query;
    let standings;
    
    if (category_id && group) {
      standings = Standing.getByGroup(category_id, group);
    } else if (category_id) {
      standings = Standing.getByCategory(category_id);
    } else {
      standings = Standing.getAll();
    }
    
    res.json(standings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/standings/recalculate/:categoryId/:group', (req, res) => {
  try {
    Standing.recalculateGroupRankings(req.params.categoryId, req.params.group);
    const standings = Standing.getByGroup(req.params.categoryId, req.params.group);
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

