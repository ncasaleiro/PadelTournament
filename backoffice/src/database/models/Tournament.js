const db = require('../db');

class Tournament {
  static getAll() {
    const data = db.load();
    return (data.tournaments || []).map(tournament => ({
      tournament_id: tournament.tournament_id,
      name: tournament.name,
      start_date: tournament.start_date,
      end_date: tournament.end_date,
      courts: tournament.courts,
      start_time: tournament.start_time,
      end_time: tournament.end_time,
      match_duration_minutes: tournament.match_duration_minutes,
      use_super_tiebreak: tournament.use_super_tiebreak !== undefined ? tournament.use_super_tiebreak : false,
      category_ids: tournament.category_ids || [],
      knockout_stage_type: tournament.knockout_stage_type || 'quarter_final', // 'quarter_final' or 'semi_final'
      status: tournament.status || 'draft',
      created_at: tournament.created_at,
      updated_at: tournament.updated_at
    }));
  }

  static getById(id) {
    const data = db.load();
    const tournaments = data.tournaments || [];
    return tournaments.find(t => t.tournament_id === parseInt(id)) || null;
  }

  static getActive() {
    const data = db.load();
    const tournaments = data.tournaments || [];
    return tournaments.filter(t => t.status === 'active');
  }

  static create(tournamentData) {
    const data = db.load();
    
    // Initialize tournaments array if it doesn't exist
    if (!data.tournaments) {
      data.tournaments = [];
    }
    
    const newId = data.tournaments.length > 0 
      ? Math.max(...data.tournaments.map(t => t.tournament_id)) + 1 
      : 1;
    
    // Updated: 2025-12-06 10:51:00 - v0.03-dev - Added category_ids field
    const tournament = {
      tournament_id: newId,
      name: tournamentData.name,
      start_date: tournamentData.start_date,
      end_date: tournamentData.end_date,
      courts: parseInt(tournamentData.courts),
      start_time: tournamentData.start_time,
      end_time: tournamentData.end_time,
      match_duration_minutes: parseInt(tournamentData.match_duration_minutes),
      use_super_tiebreak: tournamentData.use_super_tiebreak !== undefined ? tournamentData.use_super_tiebreak : false,
      category_ids: Array.isArray(tournamentData.category_ids) ? tournamentData.category_ids.map(id => parseInt(id)) : [],
      knockout_stage_type: tournamentData.knockout_stage_type || 'quarter_final', // 'quarter_final' or 'semi_final'
      status: tournamentData.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    data.tournaments.push(tournament);
    db.save(data);
    return this.getById(newId);
  }

  static update(id, updates) {
    const data = db.load();
    if (!data.tournaments) {
      return null;
    }
    
    const index = data.tournaments.findIndex(t => t.tournament_id === parseInt(id));
    if (index === -1) return null;
    
    const tournament = data.tournaments[index];
    
    // Update allowed fields
    // Updated: 2025-12-06 10:51:00 - v0.03-dev - Added category_ids to allowed fields
    const allowedFields = [
      'name', 'start_date', 'end_date', 'courts',
      'start_time', 'end_time', 'match_duration_minutes', 'use_super_tiebreak', 'category_ids', 'knockout_stage_type', 'status'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (['courts', 'match_duration_minutes'].includes(field)) {
          tournament[field] = parseInt(updates[field]);
        } else if (field === 'use_super_tiebreak') {
          tournament[field] = updates[field] === true || updates[field] === 'true' || updates[field] === 1;
        } else if (field === 'category_ids') {
          tournament[field] = Array.isArray(updates[field]) ? updates[field].map(id => parseInt(id)) : [];
        } else {
          tournament[field] = updates[field];
        }
      }
    });
    
    tournament.updated_at = new Date().toISOString();
    db.save(data);
    return this.getById(id);
  }

  static delete(id) {
    const data = db.load();
    if (!data.tournaments) {
      return false;
    }
    
    const index = data.tournaments.findIndex(t => t.tournament_id === parseInt(id));
    if (index === -1) return false;
    
    data.tournaments.splice(index, 1);
    db.save(data);
    return true;
  }
}

module.exports = Tournament;

