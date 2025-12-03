const db = require('../db');

class Category {
  static getAll() {
    const data = db.load();
    return data.categories.map(cat => ({
      category_id: cat.category_id,
      name: cat.name,
      created_at: cat.created_at
    }));
  }

  static getById(id) {
    const data = db.load();
    return data.categories.find(cat => cat.category_id === parseInt(id)) || null;
  }

  static create(name) {
    const data = db.load();
    const newId = data.categories.length > 0 
      ? Math.max(...data.categories.map(c => c.category_id)) + 1 
      : 1;
    
    const category = {
      category_id: newId,
      name,
      created_at: new Date().toISOString()
    };
    
    data.categories.push(category);
    db.save(data);
    return category;
  }

  static update(id, name) {
    const data = db.load();
    const index = data.categories.findIndex(cat => cat.category_id === parseInt(id));
    if (index === -1) return null;
    
    data.categories[index].name = name;
    db.save(data);
    return data.categories[index];
  }

  static delete(id) {
    const data = db.load();
    const index = data.categories.findIndex(cat => cat.category_id === parseInt(id));
    if (index === -1) return false;
    
    data.categories.splice(index, 1);
    db.save(data);
    return true;
  }
}

module.exports = Category;
