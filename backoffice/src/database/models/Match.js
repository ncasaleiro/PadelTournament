const db = require('../db');
const matchesDb = require('../matchesDb');
const Category = require('./Category');
const Team = require('./Team');

// Helper function to enrich match with related data
function enrichMatch(match) {
  const data = db.load();
  const team1 = data.teams.find(t => t.team_id === match.team1_id);
  const team2 = data.teams.find(t => t.team_id === match.team2_id);
  const category = Category.getById(match.category_id);
  const winner = match.winner_team_id 
    ? data.teams.find(t => t.team_id === match.winner_team_id)
    : null;
  
  // Ensure use_super_tiebreak is a boolean
  const useSuperTiebreak = match.use_super_tiebreak !== undefined 
    ? (match.use_super_tiebreak === true || match.use_super_tiebreak === 'true' || match.use_super_tiebreak === 1)
    : false;
  
  return {
    ...match,
    use_super_tiebreak: useSuperTiebreak,
    team1_name: team1 ? team1.name : null,
    team2_name: team2 ? team2.name : null,
    category_name: category ? category.name : null,
    winner_name: winner ? winner.name : null
  };
}

class Match {
  static getAll() {
    const matches = matchesDb.load();
    return matches.map(match => enrichMatch(match));
  }

  static getById(id) {
    const matches = matchesDb.load();
    const match = matches.find(m => m.match_id === parseInt(id));
    if (!match) return null;
    
    return enrichMatch(match);
  }

  static getByCategory(categoryId) {
    const matches = matchesDb.load();
    return matches
      .filter(m => m.category_id === parseInt(categoryId))
      .map(match => enrichMatch(match));
  }

  static getByStatus(status) {
    const matches = matchesDb.load();
    return matches
      .filter(m => m.status === status)
      .map(match => enrichMatch(match));
  }

  static create(matchData) {
    const matches = matchesDb.load();
    const newId = matches.length > 0 
      ? Math.max(...matches.map(m => m.match_id)) + 1 
      : 1;
    
    const match = {
      match_id: newId,
      team1_id: parseInt(matchData.team1_id),
      team2_id: parseInt(matchData.team2_id),
      category_id: parseInt(matchData.category_id),
      phase: matchData.phase || 'Group',
      group_name: matchData.group_name || null,
      scheduled_date: matchData.scheduled_date || null,
      scheduled_time: matchData.scheduled_time || null,
      court: matchData.court || null,
      status: matchData.status || 'scheduled',
      sets_data: JSON.stringify([]),
      current_set_index: 0,
      current_set_data: JSON.stringify({ gamesA: 0, gamesB: 0, tiebreak: null }),
      current_game_data: JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null }),
      winner_team_id: null,
      referee_notes: matchData.referee_notes || null,
      events_data: matchData.events_data || JSON.stringify([]),
      score_history: JSON.stringify([]),
      use_super_tiebreak: matchData.use_super_tiebreak || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    matches.push(match);
    matchesDb.save(matches);
    return this.getById(newId);
  }

  static update(id, updates) {
    const matches = matchesDb.load();
    const index = matches.findIndex(m => m.match_id === parseInt(id));
    if (index === -1) return null;
    
    const match = matches[index];
    
    // Update allowed fields
    const allowedFields = [
      'team1_id', 'team2_id', 'category_id', 'phase', 'group_name',
      'scheduled_date', 'scheduled_time', 'court', 'status',
      'sets_data', 'current_set_index', 'current_set_data', 'current_game_data',
      'winner_team_id', 'referee_notes', 'events_data', 'score_history',
      'use_super_tiebreak'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (['sets_data', 'current_set_data', 'current_game_data', 'events_data', 'score_history'].includes(field)) {
          // For score_history, preserve existing history if update is empty/null/undefined
          // This ensures manual edits don't lose the scoring history
          if (field === 'score_history') {
            const updateValue = updates[field];
            // Only update if we have a valid value (not empty string, null, or undefined)
            if (updateValue !== null && updateValue !== undefined && updateValue !== '') {
              match[field] = typeof updateValue === 'string' 
                ? updateValue 
                : JSON.stringify(updateValue);
            }
            // If updateValue is empty/null/undefined, keep existing history
            return;
          }
          match[field] = typeof updates[field] === 'string' 
            ? updates[field] 
            : JSON.stringify(updates[field]);
        } else {
          match[field] = updates[field];
        }
      }
    });
    
    match.updated_at = new Date().toISOString();
    matchesDb.save(matches);
    return this.getById(id);
  }

  static delete(id) {
    const matches = matchesDb.load();
    const index = matches.findIndex(m => m.match_id === parseInt(id));
    if (index === -1) return false;
    
    matches.splice(index, 1);
    matchesDb.save(matches);
    return true;
  }
}

module.exports = Match;
