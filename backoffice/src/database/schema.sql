-- Padel Tournament Database Schema

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    team_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    group_name TEXT CHECK(group_name IN ('A', 'B')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    player_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    team_id INTEGER NOT NULL,
    contact_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    match_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team1_id INTEGER NOT NULL,
    team2_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    phase TEXT NOT NULL CHECK(phase IN ('Group', 'Semi-final', 'Third-Fourth', 'Final')),
    group_name TEXT CHECK(group_name IN ('A', 'B', NULL)),
    scheduled_date DATETIME,
    scheduled_time TEXT,
    court TEXT,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'playing', 'finished', 'cancelled')),
    -- Score data (JSON format for sets)
    sets_data TEXT, -- JSON: [{gamesA: 6, gamesB: 4, tiebreak: null}, ...]
    current_set_index INTEGER DEFAULT 0,
    current_set_data TEXT, -- JSON: {gamesA: 0, gamesB: 0, tiebreak: null}
    current_game_data TEXT, -- JSON: {pointsA: 0, pointsB: 0, deuceState: null}
    winner_team_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team1_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (team2_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
    FOREIGN KEY (winner_team_id) REFERENCES teams(team_id) ON DELETE SET NULL
);

-- Standings table (calculated/updated after each match)
CREATE TABLE IF NOT EXISTS standings (
    standing_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    group_name TEXT NOT NULL CHECK(group_name IN ('A', 'B')),
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0, -- Tournament points (3 for win, 0 for loss)
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    sets_won INTEGER DEFAULT 0,
    sets_lost INTEGER DEFAULT 0,
    group_rank INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
    UNIQUE(team_id, category_id, group_name)
);

-- Users table (for authentication and roles)
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'referee', 'viewer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_category ON teams(category_id);
CREATE INDEX IF NOT EXISTS idx_teams_group ON teams(group_name);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_category ON matches(category_id);
CREATE INDEX IF NOT EXISTS idx_matches_phase ON matches(phase);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_standings_team ON standings(team_id);
CREATE INDEX IF NOT EXISTS idx_standings_category_group ON standings(category_id, group_name);

