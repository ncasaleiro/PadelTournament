const db = require('../db');
const crypto = require('crypto');

class User {
  static getAll() {
    const data = db.load();
    return data.users.map(user => ({
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      created_at: user.created_at
      // Don't return password_hash
    }));
  }

  static getById(id) {
    const data = db.load();
    const user = data.users.find(u => u.user_id === parseInt(id));
    if (!user) return null;
    
    return {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      created_at: user.created_at
    };
  }

  static getByUsername(username) {
    const data = db.load();
    return data.users.find(u => u.username === username) || null;
  }

  static hashPassword(password) {
    // Simple hash for now (in production, use bcrypt)
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  static verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  }

  static create(username, password, role) {
    const data = db.load();
    
    // Check if username already exists
    if (data.users.find(u => u.username === username)) {
      throw new Error('Username already exists');
    }
    
    // Validate role
    const validRoles = ['admin', 'referee', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }
    
    const newId = data.users.length > 0 
      ? Math.max(...data.users.map(u => u.user_id || 0)) + 1 
      : 1;
    
    const user = {
      user_id: newId,
      username,
      password_hash: this.hashPassword(password),
      role,
      created_at: new Date().toISOString()
    };
    
    data.users.push(user);
    db.save(data);
    
    return {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      created_at: user.created_at
    };
  }

  static update(id, updates) {
    const data = db.load();
    const index = data.users.findIndex(u => u.user_id === parseInt(id));
    if (index === -1) return null;
    
    const user = data.users[index];
    
    // Update allowed fields
    if (updates.username !== undefined) {
      // Check if new username is unique
      if (data.users.find(u => u.username === updates.username && u.user_id !== parseInt(id))) {
        throw new Error('Username already exists');
      }
      user.username = updates.username;
    }
    
    if (updates.password !== undefined && updates.password) {
      user.password_hash = this.hashPassword(updates.password);
    }
    
    if (updates.role !== undefined) {
      const validRoles = ['admin', 'referee', 'viewer'];
      if (!validRoles.includes(updates.role)) {
        throw new Error('Invalid role');
      }
      user.role = updates.role;
    }
    
    db.save(data);
    
    return {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      created_at: user.created_at
    };
  }

  static delete(id) {
    const data = db.load();
    const index = data.users.findIndex(u => u.user_id === parseInt(id));
    if (index === -1) return false;
    
    data.users.splice(index, 1);
    db.save(data);
    return true;
  }

  static authenticate(username, password) {
    const user = this.getByUsername(username);
    if (!user) {
      return null;
    }
    
    if (!this.verifyPassword(password, user.password_hash)) {
      return null;
    }
    
    return {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      created_at: user.created_at
    };
  }
}

module.exports = User;

