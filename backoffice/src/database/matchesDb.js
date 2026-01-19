const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const isPkg = typeof process.pkg !== 'undefined';
const baseDir = isPkg ? path.dirname(process.execPath) : path.join(__dirname, '../../');
const dataDir = path.join(baseDir, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const matchesDbPath = path.join(dataDir, 'matches.json');

// Initialize matches database
function initMatchesDatabase() {
  const defaultData = [];
  
  if (!fs.existsSync(matchesDbPath)) {
    fs.writeFileSync(matchesDbPath, JSON.stringify(defaultData, null, 2));
    console.log('✅ Matches database initialized');
  }
}

// Load matches database
function loadMatchesDatabase() {
  initMatchesDatabase();
  try {
    const data = fs.readFileSync(matchesDbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading matches database:', error);
    initMatchesDatabase();
    return [];
  }
}

// Save matches database
function saveMatchesDatabase(matches) {
  try {
    fs.writeFileSync(matchesDbPath, JSON.stringify(matches, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving matches database:', error);
    return false;
  }
}

// Migrate matches from main database if needed
function migrateMatchesFromMainDb() {
  const mainDbPath = path.join(dataDir, 'database.json');
  if (!fs.existsSync(mainDbPath)) {
    return;
  }
  
  try {
    const mainDb = JSON.parse(fs.readFileSync(mainDbPath, 'utf8'));
    if (mainDb.matches && mainDb.matches.length > 0) {
      const existingMatches = loadMatchesDatabase();
      if (existingMatches.length === 0) {
        // Only migrate if matches.json is empty
        saveMatchesDatabase(mainDb.matches);
        console.log(`✅ Migrated ${mainDb.matches.length} matches to matches.json`);
        
        // Remove matches from main database
        mainDb.matches = [];
        fs.writeFileSync(mainDbPath, JSON.stringify(mainDb, null, 2));
        console.log('✅ Removed matches from main database.json');
      }
    }
  } catch (error) {
    console.error('Error migrating matches:', error);
  }
}

// Matches database interface
const matchesDb = {
  load: loadMatchesDatabase,
  save: saveMatchesDatabase,
  path: matchesDbPath,
  migrate: migrateMatchesFromMainDb
};

// Initialize and migrate on first load
initMatchesDatabase();
migrateMatchesFromMainDb();

module.exports = matchesDb;











