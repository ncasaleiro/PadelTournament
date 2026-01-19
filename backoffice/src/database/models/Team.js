const db = require('../db');
const Category = require('./Category');

class Team {
  static getAll() {
    const data = db.load();
    return data.teams.map(team => {
      const category = Category.getById(team.category_id);
      return {
        ...team,
        category_name: category ? category.name : null
      };
    });
  }

  static getById(id) {
    const data = db.load();
    const team = data.teams.find(t => t.team_id === parseInt(id));
    if (!team) return null;
    
    const category = Category.getById(team.category_id);
    return {
      ...team,
      category_name: category ? category.name : null
    };
  }

  static getByCategory(categoryId) {
    const data = db.load();
    return data.teams
      .filter(t => t.category_id === parseInt(categoryId))
      .map(team => {
        const category = Category.getById(team.category_id);
        return {
          ...team,
          category_name: category ? category.name : null
        };
      });
  }

  static getByGroup(categoryId, groupName) {
    const data = db.load();
    return data.teams
      .filter(t => t.category_id === parseInt(categoryId) && t.group_name === groupName)
      .map(team => {
        const category = Category.getById(team.category_id);
        return {
          ...team,
          category_name: category ? category.name : null
        };
      });
  }

  // Updated: 2025-12-06 10:51:00 - v0.03-dev - Added duplicate name validation (same category)
  static create(name, categoryId) {
    const data = db.load();
    
    // Check for duplicate name in the same category (case-insensitive)
    const duplicate = data.teams.find(team => 
      team.category_id === parseInt(categoryId) &&
      team.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (duplicate) {
      throw new Error(`Já existe uma equipa com o nome "${name}" nesta categoria`);
    }
    
    const newId = data.teams.length > 0 
      ? Math.max(...data.teams.map(t => t.team_id)) + 1 
      : 1;
    
    const team = {
      team_id: newId,
      name: name.trim(),
      category_id: parseInt(categoryId),
      created_at: new Date().toISOString()
    };
    
    data.teams.push(team);
    db.save(data);
    return this.getById(newId);
  }

  // Updated: 2025-12-06 10:51:00 - v0.03-dev - Added duplicate name validation (same category)
  static update(id, name, categoryId) {
    const data = db.load();
    const index = data.teams.findIndex(t => t.team_id === parseInt(id));
    if (index === -1) return null;
    
    // Check for duplicate name in the same category (case-insensitive, excluding current team)
    const duplicate = data.teams.find(team => 
      team.team_id !== parseInt(id) &&
      team.category_id === parseInt(categoryId) &&
      team.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (duplicate) {
      throw new Error(`Já existe uma equipa com o nome "${name}" nesta categoria`);
    }
    
    data.teams[index] = {
      ...data.teams[index],
      name: name.trim(),
      category_id: parseInt(categoryId)
    };
    
    db.save(data);
    return this.getById(id);
  }

  static delete(id) {
    const data = db.load();
    const index = data.teams.findIndex(t => t.team_id === parseInt(id));
    if (index === -1) return false;
    
    data.teams.splice(index, 1);
    db.save(data);
    return true;
  }
}

module.exports = Team;
