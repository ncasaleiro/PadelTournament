/**
 * Database initialization script
 * Creates the database and schema if it doesn't exist
 */

const db = require('./db');
const fs = require('fs');
const path = require('path');

console.log('✅ Database initialized successfully');
console.log(`📊 Database location: ${path.join(__dirname, '../../data/tournament.db')}`);

// Close database connection
db.close();

