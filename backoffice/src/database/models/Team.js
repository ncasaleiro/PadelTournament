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

  static create(name, categoryId) {
    const data = db.load();
    const newId = data.teams.length > 0 
      ? Math.max(...data.teams.map(t => t.team_id)) + 1 
      : 1;
    
    const team = {
      team_id: newId,
      name,
      category_id: parseInt(categoryId),
      created_at: new Date().toISOString()
    };
    
    data.teams.push(team);
    db.save(data);
    return this.getById(newId);
  }

  static update(id, name, categoryId) {
    const data = db.load();
    const index = data.teams.findIndex(t => t.team_id === parseInt(id));
    if (index === -1) return null;
    
    data.teams[index] = {
      ...data.teams[index],
      name,
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
