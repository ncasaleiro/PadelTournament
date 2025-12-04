

# Software Requirements Specification (SRS)  
## Padel Tennis Tournament Manager Backoffice

## 1. Functional Requirements


### 1.1 Category Management
- The system shall allow admins to create, edit, and delete categories (e.g., M3, M4, F4, Mixed).  
- Each category shall have independent brackets, standings, and results.  
- The system shall support assigning teams to categories.  

### 1.2 Team & Player Management
- The system shall allow registration of teams with player details and contact information.  
- The system shall allow assigning teams to specific categories and groups (A or B).  
- The system shall track team statistics: wins, losses, points scored, points conceded.  

### 1.3 Tournament Structure

#### Group Stage
- The system shall auto-generate round-robin fixtures for each group.  
- The system shall calculate points: Win = 3, Loss = 0.  
- The system shall maintain a ranking table with columns: Team, Matches Played, Wins, Losses, Points, Games Won/Lost.  
- The system shall apply tie-break rules (head-to-head, point difference) if needed.  

#### Knockout Stage
- The system shall advance the top 2 teams from each group to semi-finals.  
- The system shall schedule semi-final matchups:  
  - 1st Group A vs 2nd Group B  
  - 1st Group B vs 2nd Group A  
- The system shall schedule a final between semi-final winners.  
- The system shall optionally schedule a 3rd place match between semi-final losers.  

### 1.4 Match Scheduling
- The system shall auto-generate fixtures for group stage matches.  
- The system shall allow manual adjustments (rescheduling, editing).  
- The system shall provide a calendar view for referees and organizers.  

### 1.5 Results Entry
- The system shall allow referees/admins to input match scores.  
- The system shall automatically update standings and progression after results are entered.  

### 1.6 Statistics & Reports
- The system shall generate player and team performance statistics.  
- The system shall allow exporting reports in PDF and Excel formats.  
- The system shall maintain a historical archive of past tournaments.  

### 1.7 User Roles & Permissions
- **Admin:** Full control (categories, teams, scheduling, results).  
- **Referee:** Limited access (enter match results only).  
- **Viewer:** Read-only access (standings, schedules).  


## 2. Non-Functional Requirements

### 2.1 Usability
- The system shall provide a dashboard summarizing categories, groups, standings, and upcoming matches.  
- The system shall provide intuitive navigation for different user roles.  

### 2.2 Performance
- The system shall update standings immediately after results entry.  
- The system shall support concurrent access by multiple referees and admins.  

### 2.3 Security
- The system shall enforce role-based access control.  
- The system shall require authentication for all users except viewers.  

### 2.4 Reliability
- The system shall ensure data consistency across categories, groups, and standings.  
- The system shall provide backup and restore functionality for tournament data.  

### 2.5 Scalability
- The system shall support multiple tournaments running simultaneously.  
- The system shall allow adding new categories without affecting existing ones.  


## 3. Database Requirements

| Table      | Key Fields                                   |
|------------|----------------------------------------------|
| Categories | category_id, name                            |
| Teams      | team_id, name, category_id                   |
| Players    | player_id, name, team_id                     |
| Matches    | match_id, team1_id, team2_id, score, phase   |
| Standings  | team_id, wins, losses, points, group         |


## 4. Example User Flow
1. Admin creates categories.  
2. Teams are registered and assigned to groups.  
3. Fixtures are auto-generated.  
4. Referees enter match results.  
5. Standings auto-update.  
6. Top teams advance to knockout stage.  
7. Champion is decided in the final.  

---
