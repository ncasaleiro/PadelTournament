# 🖥️ Backoffice Design: Padel Tennis Tournament Manager

## 🎯 Core Features
- **Category System**
  - Organize tournaments by categories (e.g., M3 (Men’s Level 3), M4, M5, F4 (Women’s level 4), F5, Mx (Mixed)).
  - Each category has independent brackets and results.

- **Team Management**
  - Register teams (players, contact info).
  - Assign teams to categories.
  - Track team stats (wins, losses, points scored, points conceded).


## 📊 Tournament Structure

### Phase 1: Group Stage
- **2 Groups (Group A & Group B)**
  - Each group contains an equal number of teams.
  - **Round-robin format**: every team plays against all others in its group.
  - Points system:
    - Win → 3 points
    - Loss → 0 points
    - Optional: Tie-break rules if needed (e.g., head-to-head, point difference).

- **Group Ranking Table**
  - Columns: Team | Matches Played | Wins | Losses | Points | Games Won/Lost
  - Automatically updated after each match.

---

### Phase 2: Knockout Stage
- **Semi-finals**
  - Top 2 teams from Group A and Group B advance.
  - Matchups:
    - 1st Group A vs 2nd Group B
    - 1st Group B vs 2nd Group A
- **Final**
  - Winners of semi-finals play for the championship.
- **Optional: 3rd Place Match**
  - Losers of semi-finals play for bronze.

---

##  Backoffice Modules

### 1. Dashboard
- Overview of categories, groups, and current standings.
- Quick access to upcoming matches and results.

### 2. Match Scheduling
- Auto-generate fixtures for group stage.
- Allow manual adjustments (e.g., rescheduling).
- Calendar view for referees and organizers.

### 3. Results Entry
- Input match scores.
- System updates standings and progression automatically.

### 4. Statistics & Reports
- Player and team performance stats.
- Exportable reports (PDF/Excel).
- Historical archive of past tournaments.

### 5. User Roles
- **Admin:** Full control (create categories, manage teams, edit results).
- **Referee:** Enter match results only.
- **Viewer:** Read-only access to standings and schedules.

---

## 📈 Example Flow
1. **Setup Categories** → Men’s, Women’s, Mixed.
2. **Register Teams** → Assign to Group A or Group B.
3. **Generate Fixtures** → Round-robin matches in each group.
4. **Enter Results** → Standings auto-update.
5. **Advance Top 2 Teams** → Semi-finals.
6. **Play Semi-finals & Final** → Champion decided.

---

## 🧩 Database Schema (Simplified)

| Table        | Key Fields                                   |
|--------------|----------------------------------------------|
| Categories   | category_id, name                            |
| Teams        | team_id, name, category_id                   |
| Players      | player_id, name, team_id                     |
| Matches      | match_id, team1_id, team2_id, score, phase   |
| Standings    | team_id, wins, losses, points, group         |

---

## 🏟️ Knockout Bracket (ASCII Diagram)
