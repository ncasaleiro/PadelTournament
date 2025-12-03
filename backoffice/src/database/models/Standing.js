const db = require('../db');
const Category = require('./Category');

class Standing {
  static getAll() {
    const data = db.load();
    return data.standings.map(standing => {
      const team = data.teams.find(t => t.team_id === standing.team_id);
      const category = Category.getById(standing.category_id);
      return {
        ...standing,
        team_name: team ? team.name : null,
        category_name: category ? category.name : null
      };
    });
  }

  static getByCategory(categoryId) {
    const data = db.load();
    return data.standings
      .filter(s => s.category_id === parseInt(categoryId))
      .map(standing => {
        const team = data.teams.find(t => t.team_id === standing.team_id);
        const category = Category.getById(standing.category_id);
        return {
          ...standing,
          team_name: team ? team.name : null,
          category_name: category ? category.name : null
        };
      });
  }

  static getByGroup(categoryId, groupName) {
    const data = db.load();
    return data.standings
      .filter(s => s.category_id === parseInt(categoryId) && s.group_name === groupName)
      .map(standing => {
        const team = data.teams.find(t => t.team_id === standing.team_id);
        const category = Category.getById(standing.category_id);
        return {
          ...standing,
          team_name: team ? team.name : null,
          category_name: category ? category.name : null
        };
      })
      .sort((a, b) => {
        // Sort by rank, then by points, then by games won
        if (a.group_rank !== b.group_rank) return (a.group_rank || 999) - (b.group_rank || 999);
        if (a.points !== b.points) return b.points - a.points;
        return b.games_won - a.games_won;
      });
  }

  static getByTeam(teamId) {
    const data = db.load();
    const standing = data.standings.find(s => s.team_id === parseInt(teamId));
    if (!standing) return null;
    
    const team = data.teams.find(t => t.team_id === standing.team_id);
    const category = Category.getById(standing.category_id);
    return {
      ...standing,
      team_name: team ? team.name : null,
      category_name: category ? category.name : null
    };
  }

  static createOrUpdate(teamId, categoryId, groupName, stats) {
    const data = db.load();
    const index = data.standings.findIndex(
      s => s.team_id === parseInt(teamId) && 
           s.category_id === parseInt(categoryId) && 
           s.group_name === groupName
    );
    
    const standing = {
      team_id: parseInt(teamId),
      category_id: parseInt(categoryId),
      group_name: groupName,
      matches_played: stats.matches_played || 0,
      wins: stats.wins || 0,
      losses: stats.losses || 0,
      points: stats.points || 0,
      games_won: stats.games_won || 0,
      games_lost: stats.games_lost || 0,
      sets_won: stats.sets_won || 0,
      sets_lost: stats.sets_lost || 0,
      group_rank: stats.group_rank || null,
      updated_at: new Date().toISOString()
    };
    
    if (index === -1) {
      const newId = data.standings.length > 0 
        ? Math.max(...data.standings.map(s => s.standing_id || 0)) + 1 
        : 1;
      standing.standing_id = newId;
      data.standings.push(standing);
    } else {
      standing.standing_id = data.standings[index].standing_id;
      data.standings[index] = standing;
    }
    
    db.save(data);
    return this.getByTeam(teamId);
  }

  static recalculateGroupRankings(categoryId, groupName) {
    const standings = this.getByGroup(categoryId, groupName);
    
    // Sort by points, games won, wins
    standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.games_won !== b.games_won) return b.games_won - a.games_won;
      return b.wins - a.wins;
    });
    
    // Update ranks
    standings.forEach((standing, index) => {
      this.createOrUpdate(standing.team_id, categoryId, groupName, {
        ...standing,
        group_rank: index + 1
      });
    });
    
    return this.getByGroup(categoryId, groupName);
  }
}

module.exports = Standing;
