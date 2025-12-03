const db = require('../db');

class Player {
  static getAll() {
    const data = db.load();
    return data.players.map(player => {
      const team = data.teams.find(t => t.team_id === player.team_id);
      return {
        ...player,
        team_name: team ? team.name : null,
        category_id: team ? team.category_id : null
      };
    });
  }

  static getById(id) {
    const data = db.load();
    const player = data.players.find(p => p.player_id === parseInt(id));
    if (!player) return null;
    
    const team = data.teams.find(t => t.team_id === player.team_id);
    return {
      ...player,
      team_name: team ? team.name : null,
      category_id: team ? team.category_id : null
    };
  }

  static getByTeam(teamId) {
    const data = db.load();
    return data.players.filter(p => p.team_id === parseInt(teamId));
  }

  static create(name, teamId, contactInfo = null) {
    const data = db.load();
    const newId = data.players.length > 0 
      ? Math.max(...data.players.map(p => p.player_id)) + 1 
      : 1;
    
    const player = {
      player_id: newId,
      name,
      team_id: parseInt(teamId),
      contact_info: contactInfo,
      created_at: new Date().toISOString()
    };
    
    data.players.push(player);
    db.save(data);
    return this.getById(newId);
  }

  static update(id, name, teamId, contactInfo = null) {
    const data = db.load();
    const index = data.players.findIndex(p => p.player_id === parseInt(id));
    if (index === -1) return null;
    
    data.players[index] = {
      ...data.players[index],
      name,
      team_id: parseInt(teamId),
      contact_info: contactInfo
    };
    
    db.save(data);
    return this.getById(id);
  }

  static delete(id) {
    const data = db.load();
    const index = data.players.findIndex(p => p.player_id === parseInt(id));
    if (index === -1) return false;
    
    data.players.splice(index, 1);
    db.save(data);
    return true;
  }
}

module.exports = Player;
