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

  // Updated: 2025-12-06 10:51:00 - v0.03-dev - Added duplicate name validation
  static create(name) {
    const data = db.load();
    
    // Check for duplicate name (case-insensitive)
    const duplicate = data.categories.find(cat => 
      cat.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (duplicate) {
      throw new Error(`Já existe uma categoria com o nome "${name}"`);
    }
    
    const newId = data.categories.length > 0 
      ? Math.max(...data.categories.map(c => c.category_id)) + 1 
      : 1;
    
    const category = {
      category_id: newId,
      name: name.trim(),
      created_at: new Date().toISOString()
    };
    
    data.categories.push(category);
    db.save(data);
    return category;
  }

  // Updated: 2025-12-06 10:51:00 - v0.03-dev - Added duplicate name validation
  static update(id, name) {
    const data = db.load();
    const index = data.categories.findIndex(cat => cat.category_id === parseInt(id));
    if (index === -1) return null;
    
    // Check for duplicate name (case-insensitive, excluding current category)
    const duplicate = data.categories.find(cat => 
      cat.category_id !== parseInt(id) && 
      cat.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (duplicate) {
      throw new Error(`Já existe uma categoria com o nome "${name}"`);
    }
    
    data.categories[index].name = name.trim();
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
