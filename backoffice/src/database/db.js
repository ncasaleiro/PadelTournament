const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.json');

// Initialize database structure
function initDatabase() {
  const defaultData = {
    categories: [],
    teams: [],
    players: [],
    matches: [],
    standings: [],
    users: []
  };
  
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
    console.log('✅ Database initialized (JSON)');
  }
}

// Load database
function loadDatabase() {
  initDatabase();
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading database:', error);
    initDatabase();
    return loadDatabase();
  }
}

// Save database
function saveDatabase(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving database:', error);
    return false;
  }
}

// Database interface
const db = {
  load: loadDatabase,
  save: saveDatabase,
  path: dbPath
};

// Initialize on first load
initDatabase();

module.exports = db;
