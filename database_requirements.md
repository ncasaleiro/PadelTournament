# 🗄️ Database & CSV Integration for Padel Tournament Manager

## 📂 Database Schema

### Categories
- **category_id** (PK)
- **name** (e.g., Men’s, Women’s, Mixed)

### Teams
- **team_id** (PK)
- **name**
- **category_id** (FK → Categories)
- **group** (A or B)

### Players
- **player_id** (PK)
- **name**
- **team_id** (FK → Teams)

### Matches
- **match_id** (PK)
- **team1_id** (FK → Teams)
- **team2_id** (FK → Teams)
- **score_team1**
- **score_team2**
- **phase** (Group, Semi-final, Third-Fourth, Final)
- **date**

### Standings
- **team_id** (FK → Teams)
- **wins**
- **losses**
- **points**
- **games_won**
- **games_lost**
- **group_rank**

---

## 📊 CSV Import/Export

### Categories.csv
| category_id | name       |
|-------------|------------|
| 1           | Men’s      |
| 2           | Women’s    |

### Teams.csv
| team_id | name        | category_id | group |
|---------|-------------|-------------|-------|
| 1       | Smash Bros  | 1           | A     |
| 2       | Net Masters | 1           | B     |

### Players.csv
| player_id | name        | team_id |
|-----------|-------------|---------|
| 1         | João Silva  | 1       |
| 2         | Pedro Costa | 1       |

### Matches.csv
| match_id | team1_id | team2_id | score_team1 | score_team2 | phase       | date       |
|----------|----------|----------|-------------|-------------|-------------|------------|
| 1        | 1        | 2        | [6, 6]      |[4,3]        | Group Stage | 2025-12-03 |

### Standings.csv
| team_id | wins | losses | points | games_won | games_lost | group_rank |
|---------|------|--------|--------|-----------|------------|------------|
| 1       | 2    | 0      | 6      | 12        | 7          | 1          |

---

## 🔄 Workflow with CSV
1. **Import Data**
   - Admin uploads CSV files (Categories, Teams, Players).
   - System populates database tables automatically.

2. **Update Results**
   - Referees enter match scores → stored in `Matches` table.
   - Standings auto-calculated and updated in `Standings`.

3. **Export Data**
   - Admin can export updated tables back to CSV for reporting, sharing, or backup.

---

## ✅ Benefits
- **Simplicity:** Easy to load initial data with CSV.
- **Flexibility:** Export results for external analysis.
- **Automation:** Standings and progression calculated directly from database.
