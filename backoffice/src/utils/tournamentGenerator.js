/**
 * Tournament Generator - v0.02
 * 
 * INDEPENDENT MODULE: This module is completely independent from referee and match modules.
 * It serves ONLY to automatically create and schedule matches for tournaments.
 * 
 * Once matches are created, they function normally like any manually created match.
 */

// Category priority order (lower categories start earlier)
const CATEGORY_PRIORITY = {
  'F5': 1,
  'M5': 2,
  'F4': 3,
  'M4': 4,
  'MX': 5,
  'M3': 6
};

class TournamentGenerator {
  /**
   * Generate round-robin matches for a group of teams
   * @param {Array} teams - Array of team IDs
   * @returns {Array} Array of match pairs {team1_id, team2_id}
   */
  static generateRoundRobin(teams) {
    const matches = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          team1_id: teams[i],
          team2_id: teams[j]
        });
      }
    }
    return matches;
  }

  /**
   * Generate group stage matches with top teams distribution
   * @param {Array} teams - Array of team objects with team_id
   * @param {Number} teamsPerGroup - Number of teams per group (default: 4)
   * @param {Array} topTeamIds - Array of top team IDs (max 2 per group)
   * @returns {Array} Array of groups with matches
   */
  static generateGroupStage(teams, teamsPerGroup = 4, topTeamIds = []) {
    const numGroups = Math.ceil(teams.length / teamsPerGroup);
    const groups = [];
    
    // Shuffle teams (except top teams)
    const regularTeams = teams.filter(t => !topTeamIds.includes(t.team_id));
    const shuffledRegular = [...regularTeams].sort(() => Math.random() - 0.5);
    
    // Distribute top teams first (max 2 per group)
    const topTeams = teams.filter(t => topTeamIds.includes(t.team_id));
    const shuffledTop = [...topTeams].sort(() => Math.random() - 0.5);
    
    // Create groups
    for (let g = 0; g < numGroups; g++) {
      const groupName = String.fromCharCode(65 + g); // A, B, C, D...
      const groupTeams = [];
      
      // Add top teams (max 2 per group)
      const topForGroup = shuffledTop.slice(g * 2, (g * 2) + 2);
      groupTeams.push(...topForGroup);
      
      // Fill remaining slots with regular teams
      const remainingSlots = teamsPerGroup - groupTeams.length;
      const startIdx = g * teamsPerGroup - (g * 2); // Adjust for top teams already placed
      const regularForGroup = shuffledRegular.slice(startIdx, startIdx + remainingSlots);
      groupTeams.push(...regularForGroup);
      
      // Generate round-robin matches for this group
      const teamIds = groupTeams.map(t => t.team_id);
      const matches = this.generateRoundRobin(teamIds);
      
      groups.push({
        groupName: groupName,
        teams: groupTeams,
        matches: matches.map(m => ({
          ...m,
          group_name: groupName
        }))
      });
    }
    
    return groups;
  }

  /**
   * Generate knockout stage matches with proper group-based pairing
   * @param {Array} qualifiedTeams - Array of qualified team objects with {team_id, group_name, group_rank} (can be empty to create placeholder slots)
   * @param {String} phase - Phase name ('Quarter-final', 'Semi-final', 'Final', 'Third-Fourth')
   * @param {String} knockoutStageType - 'quarter_final' or 'semi_final'
   * @param {Boolean} allowPlaceholders - If true, allows creating matches without teams (placeholder slots)
   * @returns {Array} Array of match pairs (team_id can be null for placeholders)
   */
  static generateKnockoutStage(qualifiedTeams, phase, knockoutStageType = 'quarter_final', allowPlaceholders = false) {
    const matches = [];
    
    // If allowPlaceholders is true and no teams provided, generate placeholder slots
    if (allowPlaceholders && (!qualifiedTeams || qualifiedTeams.length === 0)) {
      console.log(`[DEBUG] Generating placeholder slots for phase ${phase} without teams`);
      
      if (phase === 'Semi-final') {
        // Generate 2 semi-final matches (placeholder slots)
        // For semi-finals: 1st Group A vs 2nd Group B, 1st Group B vs 2nd Group A
        matches.push({
          team1_id: null,
          team2_id: null,
          placeholder: true,
          placeholder_label: 'Vencedor Grupo A / 2º Apurado Grupo B'
        });
        matches.push({
          team1_id: null,
          team2_id: null,
          placeholder: true,
          placeholder_label: 'Vencedor Grupo B / 2º Apurado Grupo A'
        });
        return matches;
      } else if (phase === 'Final') {
        // Generate 1 final match (placeholder slot)
        matches.push({
          team1_id: null,
          team2_id: null,
          placeholder: true,
          placeholder_label: 'Vencedor Meia-final 1 vs Vencedor Meia-final 2'
        });
        return matches;
      } else if (phase === 'Quarter-final') {
        // Generate 4 quarter-final matches (placeholder slots)
        for (let i = 0; i < 4; i++) {
          matches.push({
            team1_id: null,
            team2_id: null,
            placeholder: true,
            placeholder_label: `Quarto-de-final ${i + 1}`
          });
        }
        return matches;
      }
    }
    
    // If qualifiedTeams is array of IDs (legacy format), use simple pairing
    if (qualifiedTeams.length > 0 && typeof qualifiedTeams[0] === 'number') {
      for (let i = 0; i < qualifiedTeams.length; i += 2) {
        if (i + 1 < qualifiedTeams.length) {
          matches.push({
            team1_id: qualifiedTeams[i],
            team2_id: qualifiedTeams[i + 1]
          });
        }
      }
      return matches;
    }
    
    // Group-based pairing: 1st Group A vs 2nd Group B, 1st Group B vs 2nd Group A, etc.
    const teamsByGroup = {};
    qualifiedTeams.forEach(team => {
      const groupName = team.group_name || 'no-group';
      if (!teamsByGroup[groupName]) {
        teamsByGroup[groupName] = [];
      }
      teamsByGroup[groupName].push(team);
    });
    
    // Sort groups alphabetically
    const groupNames = Object.keys(teamsByGroup).sort();
    
    // For Quarter-finals: pair 1st vs 2nd from different groups
    if (phase === 'Quarter-final') {
      // Pair groups: A-B, C-D, etc.
      for (let i = 0; i < groupNames.length; i += 2) {
        if (i + 1 < groupNames.length) {
          const groupA = groupNames[i];
          const groupB = groupNames[i + 1];
          
          const firstA = teamsByGroup[groupA].find(t => t.group_rank === 1);
          const secondB = teamsByGroup[groupB].find(t => t.group_rank === 2);
          const firstB = teamsByGroup[groupB].find(t => t.group_rank === 1);
          const secondA = teamsByGroup[groupA].find(t => t.group_rank === 2);
          
          if (firstA && secondB) {
            matches.push({
              team1_id: firstA.team_id,
              team2_id: secondB.team_id,
              team1_group: groupA,
              team2_group: groupB
            });
          }
          if (firstB && secondA) {
            matches.push({
              team1_id: firstB.team_id,
              team2_id: secondA.team_id,
              team1_group: groupB,
              team2_group: groupA
            });
          }
        }
      }
    } else if (phase === 'Semi-final') {
      // For Semi-finals: always pair 1st from one group vs 2nd from another group
      // Need 2 groups with 2 teams each (1st and 2nd) = 4 teams total for 2 semi-finals
      if (groupNames.length >= 2) {
        // Pair: 1st Group A vs 2nd Group B, 1st Group B vs 2nd Group A
        const firstA = teamsByGroup[groupNames[0]].find(t => t.group_rank === 1);
        const secondA = teamsByGroup[groupNames[0]].find(t => t.group_rank === 2);
        const firstB = teamsByGroup[groupNames[1]].find(t => t.group_rank === 1);
        const secondB = teamsByGroup[groupNames[1]].find(t => t.group_rank === 2);
        
        // Semi-final 1: 1st Group A vs 2nd Group B
        if (firstA && secondB) {
          matches.push({
            team1_id: firstA.team_id,
            team2_id: secondB.team_id
          });
        }
        
        // Semi-final 2: 1st Group B vs 2nd Group A
        if (firstB && secondA) {
          matches.push({
            team1_id: firstB.team_id,
            team2_id: secondA.team_id
          });
        }
      } else {
        // Fallback: simple pairing if less than 2 groups
        const teams = qualifiedTeams.map(t => t.team_id || t);
        for (let i = 0; i < teams.length; i += 2) {
          if (i + 1 < teams.length) {
            matches.push({
              team1_id: teams[i],
              team2_id: teams[i + 1]
            });
          }
        }
      }
    } else if (phase === 'Final') {
      // For Final: pair winners from semi-finals
      const teams = qualifiedTeams.map(t => t.team_id || t);
      if (teams.length >= 2) {
        matches.push({
          team1_id: teams[0],
          team2_id: teams[1]
        });
      }
    } else {
      // Other phases: simple pairing
      const teams = qualifiedTeams.map(t => t.team_id || t);
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          matches.push({
            team1_id: teams[i],
            team2_id: teams[i + 1]
          });
        }
      }
    }
    
    return matches;
  }
  
  /**
   * Get qualified teams from group stage standings
   * @param {Number} categoryId - Category ID
   * @param {String} phase - Phase name ('Quarter-final', 'Semi-final', 'Final')
   * @param {Number} teamsPerGroup - Number of teams per group (default: 4)
   * @param {String} knockoutStageType - 'quarter_final' or 'semi_final' (default: 'quarter_final')
   * @returns {Array} Array of qualified team objects with team_id, group_name, group_rank
   */
  static getQualifiedTeamsFromGroups(categoryId, phase, teamsPerGroup = 4, knockoutStageType = 'quarter_final') {
    const Standing = require('../database/models/Standing');
    
    // Get all standings for this category
    const allStandings = Standing.getByCategory(categoryId);
    
    console.log(`[DEBUG] getQualifiedTeamsFromGroups: categoryId=${categoryId}, phase=${phase}, knockoutStageType=${knockoutStageType}`);
    console.log(`[DEBUG] Found ${allStandings.length} standings for category ${categoryId}`);
    
    if (allStandings.length === 0) {
      console.warn(`[WARN] No standings found for category ${categoryId}. Group stage matches may not have been played yet.`);
      return [];
    }
    
    // Group standings by group_name
    const standingsByGroup = {};
    allStandings.forEach(standing => {
      if (standing.group_name) {
        if (!standingsByGroup[standing.group_name]) {
          standingsByGroup[standing.group_name] = [];
        }
        standingsByGroup[standing.group_name].push(standing);
      }
    });
    
    console.log(`[DEBUG] Standings grouped into ${Object.keys(standingsByGroup).length} groups:`, Object.keys(standingsByGroup));
    
    // Sort each group by rank
    Object.keys(standingsByGroup).forEach(groupName => {
      standingsByGroup[groupName].sort((a, b) => {
        if (a.group_rank !== b.group_rank) {
          return (a.group_rank || 999) - (b.group_rank || 999);
        }
        if (a.points !== b.points) return b.points - a.points;
        return b.games_won - a.games_won;
      });
    });
    
    const qualified = [];
    
    if (phase === 'Quarter-final') {
      // For quarter-finals: need 4 groups, 1st and 2nd from each group qualify (8 teams total)
      const numGroups = Object.keys(standingsByGroup).length;
      if (numGroups < 4) {
        console.warn(`[WARN] Quarter-finals require at least 4 groups, but only ${numGroups} groups found`);
        // Still qualify teams but warn
      }
      
      // 1st and 2nd from each group qualify
      Object.keys(standingsByGroup).sort().forEach(groupName => {
        const groupStandings = standingsByGroup[groupName];
        const first = groupStandings.find(s => s.group_rank === 1);
        const second = groupStandings.find(s => s.group_rank === 2);
        
        if (first) qualified.push({ team_id: first.team_id, group_name: groupName, group_rank: 1 });
        if (second) qualified.push({ team_id: second.team_id, group_name: groupName, group_rank: 2 });
      });
    } else if (phase === 'Semi-final') {
      // For semi-finals: always need 2 teams from each group (2 groups = 4 teams total for 2 semi-finals)
      // This applies regardless of knockout_stage_type
      const numGroups = Object.keys(standingsByGroup).length;
      if (numGroups < 2) {
        console.warn(`[WARN] Semi-finals require at least 2 groups, but only ${numGroups} groups found`);
        // Still qualify teams but warn
      }
      
      // Always qualify 1st and 2nd from each group for semi-finals
      // This ensures we have 4 teams total (2 from each of 2 groups) for 2 semi-finals
      Object.keys(standingsByGroup).sort().forEach(groupName => {
        const groupStandings = standingsByGroup[groupName];
        const first = groupStandings.find(s => s.group_rank === 1);
        const second = groupStandings.find(s => s.group_rank === 2);
        
        if (first) qualified.push({ team_id: first.team_id, group_name: groupName, group_rank: 1 });
        if (second) qualified.push({ team_id: second.team_id, group_name: groupName, group_rank: 2 });
      });
    } else if (phase === 'Final') {
      // Winners from semi-finals (would need to check match results, but for now use 1st from groups)
      Object.keys(standingsByGroup).sort().forEach(groupName => {
        const groupStandings = standingsByGroup[groupName];
        const first = groupStandings.find(s => s.group_rank === 1);
        if (first) qualified.push({ team_id: first.team_id, group_name: groupName, group_rank: 1 });
      });
      // Limit to top 2 if more than 2 groups
      if (qualified.length > 2) {
        qualified.splice(2);
      }
    }
    
    console.log(`[DEBUG] getQualifiedTeamsFromGroups: Returning ${qualified.length} qualified teams`);
    if (qualified.length === 0) {
      console.warn(`[WARN] No teams qualified. Check if group stage matches have been played and standings calculated.`);
      console.warn(`[WARN] Standings found: ${allStandings.length}, Groups: ${Object.keys(standingsByGroup).length}`);
      Object.keys(standingsByGroup).forEach(groupName => {
        const groupStandings = standingsByGroup[groupName];
        console.warn(`[WARN] Group ${groupName}: ${groupStandings.length} standings, ranks:`, groupStandings.map(s => s.group_rank));
      });
    } else {
      console.log(`[DEBUG] Qualified teams:`, qualified.map(q => ({ team_id: q.team_id, group: q.group_name, rank: q.group_rank })));
    }
    
    return qualified;
  }

  /**
   * Get category priority
   * @param {String} categoryName - Category name (e.g., 'F5', 'M3')
   * @returns {Number} Priority (lower = earlier)
   */
  static getCategoryPriority(categoryName) {
    return CATEGORY_PRIORITY[categoryName] || 999;
  }

  /**
   * Sort categories by priority
   * @param {Array} categories - Array of category objects
   * @returns {Array} Sorted categories
   */
  static sortCategoriesByPriority(categories) {
    return [...categories].sort((a, b) => {
      const priorityA = this.getCategoryPriority(a.name);
      const priorityB = this.getCategoryPriority(b.name);
      return priorityA - priorityB;
    });
  }

  /**
   * Generate time slots for a day
   * @param {String} startTime - Start time (HH:MM)
   * @param {String} endTime - End time (HH:MM)
   * @param {Number} matchDurationMinutes - Duration of each match
   * @param {Number} courts - Number of courts
   * @returns {Array} Array of time slots
   */
  static generateTimeSlots(startTime, endTime, matchDurationMinutes, courts) {
    // Validate inputs
    if (!startTime || !endTime) {
      console.warn(`[WARN] generateTimeSlots: Invalid times - startTime: ${startTime}, endTime: ${endTime}`);
      return [];
    }
    
    if (!matchDurationMinutes || matchDurationMinutes <= 0) {
      console.warn(`[WARN] generateTimeSlots: Invalid matchDurationMinutes: ${matchDurationMinutes}`);
      return [];
    }
    
    if (!courts || courts <= 0) {
      console.warn(`[WARN] generateTimeSlots: Invalid courts: ${courts}`);
      return [];
    }
    
    try {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
        console.warn(`[WARN] generateTimeSlots: Could not parse times - startTime: ${startTime}, endTime: ${endTime}`);
        return [];
      }
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      if (startMinutes >= endMinutes) {
        console.warn(`[WARN] generateTimeSlots: Start time (${startTime}) >= end time (${endTime})`);
        return [];
      }
      
      const slots = [];
      let currentMinutes = startMinutes;
      
      // endTime is the start time of the last possible slot
      // If endTime is 23:00 and duration is 60 minutes, the last slot is 23:00-24:00
      // So we allow slots that start at or before endTime
      while (currentMinutes <= endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        for (let c = 1; c <= courts; c++) {
          slots.push({
            date: null, // Will be set later
            time: timeString,
            court: `Court ${c}`
          });
        }
        
        currentMinutes += matchDurationMinutes;
      }
      
      console.log(`[DEBUG] generateTimeSlots: Generated ${slots.length} slots from ${startTime} to ${endTime} with ${courts} courts`);
      return slots;
    } catch (error) {
      console.error(`[ERROR] generateTimeSlots: Exception -`, error);
      return [];
    }
  }

  /**
   * Check if a time slot conflicts with existing matches
   * @param {String} date - Date (YYYY-MM-DD)
   * @param {String} time - Time (HH:MM)
   * @param {String} court - Court name
   * @param {Number} matchDurationMinutes - Match duration in minutes
   * @param {Array} existingMatches - Array of existing matches
   * @param {Object} match - The match being scheduled (to check team conflicts)
   * @returns {Boolean} True if conflict exists
   */
  static hasTimeSlotConflict(date, time, court, matchDurationMinutes, existingMatches, match = null) {
    const [matchH, matchM] = time.split(':').map(Number);
    const matchStartMinutes = matchH * 60 + matchM;
    const matchEndMinutes = matchStartMinutes + matchDurationMinutes;
    
    // Check court conflicts
    const courtConflict = existingMatches.some(existing => {
      if (!existing.scheduled_date || !existing.scheduled_time || !existing.court) {
        return false; // Unscheduled matches don't conflict
      }
      
      if (existing.scheduled_date !== date || existing.court !== court) {
        return false; // Different date or court, no conflict
      }
      
      const [existingH, existingM] = existing.scheduled_time.split(':').map(Number);
      const existingStartMinutes = existingH * 60 + existingM;
      const existingEndMinutes = existingStartMinutes + (existing.match_duration_minutes || matchDurationMinutes);
      
      // Check for overlap: new match starts before existing ends AND new match ends after existing starts
      return matchStartMinutes < existingEndMinutes && matchEndMinutes > existingStartMinutes;
    });
    
    if (courtConflict) {
      return true;
    }
    
    // Check team conflicts: a team cannot play in two courts at the same time
    if (match && match.team1_id && match.team2_id) {
      const teamConflict = existingMatches.some(existing => {
        if (!existing.scheduled_date || !existing.scheduled_time) {
          return false; // Unscheduled matches don't conflict
        }
        
        if (existing.scheduled_date !== date) {
          return false; // Different date, no conflict
        }
        
        // Check if any team from the new match is playing in an existing match at the same time
        const team1Playing = existing.team1_id === match.team1_id || existing.team2_id === match.team1_id;
        const team2Playing = existing.team1_id === match.team2_id || existing.team2_id === match.team2_id;
        
        if (!team1Playing && !team2Playing) {
          return false; // No team overlap
        }
        
        const [existingH, existingM] = existing.scheduled_time.split(':').map(Number);
        const existingStartMinutes = existingH * 60 + existingM;
        const existingEndMinutes = existingStartMinutes + (existing.match_duration_minutes || matchDurationMinutes);
        
        // Check for time overlap
        return matchStartMinutes < existingEndMinutes && matchEndMinutes > existingStartMinutes;
      });
      
      if (teamConflict) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Schedule matches automatically
   * @param {Array} matches - Array of match objects to schedule
   * @param {Object} tournamentConfig - Tournament configuration
   * @param {Object} categoryPriorities - Map of category_id to priority
   * @param {String} phaseStartDate - Optional: specific start date for this phase (YYYY-MM-DD)
   * @param {String} phaseStartTime - Optional: specific start time for this phase (HH:MM)
   * @param {Object} dayTimeOverrides - Optional: map of date (YYYY-MM-DD) to {startTime, endTime}
   * @param {Array} existingMatches - Optional: array of existing matches to check for conflicts
   * @returns {Array} Scheduled matches
   */
  static scheduleMatches(matches, tournamentConfig, categoryPriorities = {}, phaseStartDate = null, phaseStartTime = null, dayTimeOverrides = {}, existingMatches = []) {
    console.log(`[DEBUG] scheduleMatches called with ${matches.length} matches`);
    let { startDate, endDate, startTime, endTime, matchDurationMinutes, courts } = tournamentConfig;
    console.log(`[DEBUG] Tournament config:`, { startDate, endDate, startTime, endTime, matchDurationMinutes, courts });
    
    // Validate required fields BEFORE applying phase overrides
    if (!startDate || !endDate) {
      console.error(`[ERROR] scheduleMatches: Missing startDate or endDate - startDate: ${startDate}, endDate: ${endDate}`);
      return matches; // Return unscheduled matches
    }
    
    if (!startTime || !endTime) {
      console.error(`[ERROR] scheduleMatches: Missing startTime or endTime - startTime: ${startTime}, endTime: ${endTime}`);
      return matches; // Return unscheduled matches
    }
    
    if (!matchDurationMinutes || matchDurationMinutes <= 0) {
      console.error(`[ERROR] scheduleMatches: Invalid matchDurationMinutes: ${matchDurationMinutes}`);
      return matches; // Return unscheduled matches
    }
    
    if (!courts || courts <= 0) {
      console.error(`[ERROR] scheduleMatches: Invalid courts: ${courts}`);
      return matches; // Return unscheduled matches
    }
    
    // Priority: phaseStartDate/phaseStartTime > dayTimeOverrides > tournament defaults
    // But dayTimeOverrides must respect the minimum start date/time if specified
    
    // First, apply phase-specific start date/time if provided
    if (phaseStartDate) {
      startDate = phaseStartDate;
    }
    if (phaseStartTime) {
      startTime = phaseStartTime;
    }
    
    // Re-validate after applying phase overrides
    if (!startDate || !endDate || !startTime || !endTime) {
      console.error(`[ERROR] scheduleMatches: Invalid config after phase overrides - startDate: ${startDate}, endDate: ${endDate}, startTime: ${startTime}, endTime: ${endTime}`);
      return matches; // Return unscheduled matches
    }
    
    const hasDayOverrides = Object.keys(dayTimeOverrides).length > 0;
    
    // If dayTimeOverrides exist, filter them to only include dates >= startDate
    // and ensure times respect startTime as minimum
    if (hasDayOverrides) {
      const filteredOverrides = {};
      const overrideDates = Object.keys(dayTimeOverrides).sort();
      
      overrideDates.forEach(dateStr => {
        // Only include dates >= startDate
        if (dateStr >= startDate) {
          const override = dayTimeOverrides[dateStr];
          let overrideStartTime = override.startTime || startTime;
          let overrideEndTime = override.endTime || endTime;
          
          // If this is the start date and startTime is specified and override startTime is earlier, use startTime
          if (dateStr === startDate && startTime && overrideStartTime < startTime) {
            overrideStartTime = startTime;
          }
          
          filteredOverrides[dateStr] = {
            startTime: overrideStartTime,
            endTime: overrideEndTime
          };
        }
      });
      
      // Update dayTimeOverrides to filtered version
      Object.keys(dayTimeOverrides).forEach(key => delete dayTimeOverrides[key]);
      Object.assign(dayTimeOverrides, filteredOverrides);
    }
    
    // Group matches by category and phase for interleaving
    const matchesByCategoryPhase = {};
    matches.forEach(match => {
      const key = `${match.category_id}_${match.phase}`;
      if (!matchesByCategoryPhase[key]) {
        matchesByCategoryPhase[key] = [];
      }
      matchesByCategoryPhase[key].push(match);
    });
    
    // Interleave matches between categories first, then between groups within each category
    const interleavedMatches = [];
    const categoryPhaseKeys = Object.keys(matchesByCategoryPhase).sort((a, b) => {
      const [catA, phaseA] = a.split('_');
      const [catB, phaseB] = b.split('_');
      const priorityA = categoryPriorities[catA] || 999;
      const priorityB = categoryPriorities[catB] || 999;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      const phaseOrder = { 'Group': 1, 'Quarter-final': 2, 'Semi-final': 3, 'Final': 4, 'Third-Fourth': 5 };
      return (phaseOrder[phaseA] || 999) - (phaseOrder[phaseB] || 999);
    });
    
    // First, organize matches by category and group
    const matchesByCategory = {};
    categoryPhaseKeys.forEach(key => {
      const [categoryId] = key.split('_');
      if (!matchesByCategory[categoryId]) {
        matchesByCategory[categoryId] = [];
      }
      matchesByCategory[categoryId].push(...matchesByCategoryPhase[key]);
    });
    
    // Group matches within each category by group_name
    const categoryGroups = {};
    Object.keys(matchesByCategory).forEach(categoryId => {
      const categoryMatches = matchesByCategory[categoryId];
      const matchesByGroup = {};
      categoryMatches.forEach(match => {
        const groupName = match.group_name || 'no-group';
        if (!matchesByGroup[groupName]) {
          matchesByGroup[groupName] = [];
        }
        matchesByGroup[groupName].push(match);
      });
      categoryGroups[categoryId] = matchesByGroup;
    });
    
    // Interleave: take one match from each category in round-robin fashion, 
    // and within each category, take from different groups in round-robin
    const categoryIds = Object.keys(categoryGroups).sort((a, b) => {
      const priorityA = categoryPriorities[a] || 999;
      const priorityB = categoryPriorities[b] || 999;
      return priorityA - priorityB;
    });
    
    // Find maximum number of matches across all categories and groups
    let maxMatches = 0;
    categoryIds.forEach(catId => {
      const groups = categoryGroups[catId];
      const maxInCategory = Math.max(...Object.values(groups).map(g => g.length), 0);
      maxMatches = Math.max(maxMatches, maxInCategory);
    });
    
    // Interleave: take one match from each category in round-robin fashion
    // Within each category, take from different groups in round-robin fashion
    // Example with 2 categories (C1, C2) and 2 groups each (A, B):
    // C1-A[0], C2-A[0], C1-B[0], C2-B[0], C1-A[1], C2-A[1], C1-B[1], C2-B[1], ...
    
    // Track current position for each category-group combination
    const categoryGroupPositions = {};
    categoryIds.forEach(catId => {
      const groups = categoryGroups[catId];
      categoryGroupPositions[catId] = {};
      Object.keys(groups).sort().forEach(groupName => {
        categoryGroupPositions[catId][groupName] = 0;
      });
    });
    
    let allDone = false;
    while (!allDone) {
      allDone = true;
      
      // For each category, try to take one match
      categoryIds.forEach(categoryId => {
        const groups = categoryGroups[categoryId];
        const groupNames = Object.keys(groups).sort();
        
        // Try each group in order until we find one with matches available
        for (const groupName of groupNames) {
          const currentPos = categoryGroupPositions[categoryId][groupName];
          const matchesInGroup = groups[groupName];
          
          if (currentPos < matchesInGroup.length) {
            interleavedMatches.push(matchesInGroup[currentPos]);
            categoryGroupPositions[categoryId][groupName]++;
            allDone = false;
            break; // Take only one match per category per iteration
          }
        }
      });
    }
    
    const sortedMatches = interleavedMatches;
    
    // Generate all time slots for tournament period
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allSlots = [];
    
    // Check if any day-specific overrides are provided
    const hasAnyOverrides = Object.keys(dayTimeOverrides).length > 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Use day-specific time override if available, otherwise use default
      let dayStartTime, dayEndTime;
      
      if (dayTimeOverrides[dateStr]) {
        // Explicit override for this day - use it
        dayStartTime = dayTimeOverrides[dateStr].startTime;
        dayEndTime = dayTimeOverrides[dateStr].endTime;
        
        // Validate override times - if missing, fall back to defaults
        if (!dayStartTime) {
          dayStartTime = startTime;
        }
        if (!dayEndTime) {
          dayEndTime = endTime;
        }
        
        // IMPORTANT: If this is the start date, ensure override respects minimum startTime
        if (dateStr === startDate && startTime) {
          const [dayH, dayM] = dayStartTime.split(':').map(Number);
          const [minH, minM] = startTime.split(':').map(Number);
          const dayMinutes = dayH * 60 + dayM;
          const minMinutes = minH * 60 + minM;
          
          if (dayMinutes < minMinutes) {
            dayStartTime = startTime; // Use minimum startTime instead
          }
        }
      } else if (hasAnyOverrides) {
        // If there are overrides for other days but not this one, skip this day
        // This ensures we only schedule on days with explicit time configuration
        continue;
      } else {
        // No override for this day - use defaults (no overrides exist at all)
        dayStartTime = startTime;
        dayEndTime = endTime;
      }
      
      // Validate times
      if (!dayStartTime || !dayEndTime) {
        console.warn(`[WARN] scheduleMatches: Skipping day ${dateStr} - invalid times (start: ${dayStartTime}, end: ${dayEndTime})`);
        continue; // Skip days without valid times
      }
      
      const daySlots = this.generateTimeSlots(dayStartTime, dayEndTime, matchDurationMinutes, courts);
      if (daySlots.length === 0) {
        console.warn(`[WARN] scheduleMatches: No slots generated for day ${dateStr} with times ${dayStartTime}-${dayEndTime}`);
      }
      daySlots.forEach(slot => {
        slot.date = dateStr;
        allSlots.push(slot);
      });
    }
    
    // Sort slots by date and time to ensure proper ordering
    // This ensures that slots from days with later start times don't come before earlier days
    allSlots.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // Within same date, sort by time
      return a.time.localeCompare(b.time);
    });
    
    // Assign matches to slots, avoiding conflicts
    const scheduledMatches = [];
    console.log(`[DEBUG] Total slots available: ${allSlots.length}, matches to schedule: ${sortedMatches.length}`);
    
    // Early exit if not enough slots
    if (allSlots.length === 0) {
      console.warn(`[WARN] No slots available for scheduling. Returning unscheduled matches.`);
      return matches;
    }
    
    // Track used slots to avoid reassignment
    const usedSlots = new Set();
    
    let matchIndex = 0;
    for (const match of sortedMatches) {
      matchIndex++;
      let assigned = false;
      let slotIndex = 0;
      let attempts = 0;
      const maxAttempts = allSlots.length * 2; // Safety limit
      
      // Try to find a non-conflicting slot
      while (slotIndex < allSlots.length && !assigned && attempts < maxAttempts) {
        attempts++;
        const slot = allSlots[slotIndex];
        const slotKey = `${slot.date}_${slot.time}_${slot.court}`;
        
        // Skip if slot already used
        if (usedSlots.has(slotKey)) {
          slotIndex++;
          continue;
        }
        
        // Check for conflicts with existing matches (including matches from other categories)
        // Also check for team conflicts (team cannot play in two courts at same time)
        const hasConflict = this.hasTimeSlotConflict(
          slot.date,
          slot.time,
          slot.court,
          matchDurationMinutes,
          existingMatches,
          match
        );
        
        // If conflict with existing matches, skip this slot
        if (hasConflict) {
          slotIndex++; // CRITICAL: Increment to avoid infinite loop
          continue;
        }
        
        // Check conflicts with already scheduled matches in this batch
        const batchConflict = scheduledMatches.some(scheduled => {
          if (!scheduled.scheduled_date || !scheduled.scheduled_time) {
            return false;
          }
          
          // Check court conflict
          if (scheduled.scheduled_date === slot.date && scheduled.court === slot.court) {
            const [scheduledH, scheduledM] = scheduled.scheduled_time.split(':').map(Number);
            const scheduledStartMinutes = scheduledH * 60 + scheduledM;
            const scheduledEndMinutes = scheduledStartMinutes + matchDurationMinutes;
            
            const [slotH, slotM] = slot.time.split(':').map(Number);
            const slotStartMinutes = slotH * 60 + slotM;
            const slotEndMinutes = slotStartMinutes + matchDurationMinutes;
            
            if (slotStartMinutes < scheduledEndMinutes && slotEndMinutes > scheduledStartMinutes) {
              return true; // Court conflict
            }
          }
          
          // Check team conflict
          const team1Playing = scheduled.team1_id === match.team1_id || scheduled.team2_id === match.team1_id;
          const team2Playing = scheduled.team1_id === match.team2_id || scheduled.team2_id === match.team2_id;
          
          if ((team1Playing || team2Playing) && scheduled.scheduled_date === slot.date) {
            const [scheduledH, scheduledM] = scheduled.scheduled_time.split(':').map(Number);
            const scheduledStartMinutes = scheduledH * 60 + scheduledM;
            const scheduledEndMinutes = scheduledStartMinutes + matchDurationMinutes;
            
            const [slotH, slotM] = slot.time.split(':').map(Number);
            const slotStartMinutes = slotH * 60 + slotM;
            const slotEndMinutes = slotStartMinutes + matchDurationMinutes;
            
            return slotStartMinutes < scheduledEndMinutes && slotEndMinutes > scheduledStartMinutes;
          }
          
          return false;
        });
        
        if (batchConflict) {
          slotIndex++; // CRITICAL: Increment before continue to avoid infinite loop
          continue; // Skip this slot, try next
        }
        
        // No conflicts found - assign match to slot
        match.scheduled_date = slot.date;
        match.scheduled_time = slot.time;
        match.court = slot.court;
        usedSlots.add(slotKey); // Mark slot as used
        scheduledMatches.push(match);
        assigned = true;
        console.log(`[DEBUG] Assigned match ${match.team1_id} vs ${match.team2_id} to ${slot.date} ${slot.time} ${slot.court} (${matchIndex}/${sortedMatches.length}, attempt ${attempts})`);
        break; // Exit while loop since match is assigned
      }
      
      // Safety check: if max attempts reached, log warning
      if (attempts >= maxAttempts && !assigned) {
        console.warn(`[WARN] Max attempts (${maxAttempts}) reached for match ${match.team1_id} vs ${match.team2_id}. Stopping search.`);
      }
      
      // Safety check: if max attempts reached, break to avoid infinite loop
      if (attempts >= maxAttempts) {
        console.warn(`[WARN] Max attempts (${maxAttempts}) reached for match ${match.team1_id} vs ${match.team2_id}. Stopping search.`);
      }
      
      // If no slot found, leave match unscheduled
      if (!assigned) {
        console.log(`[WARN] Could not find slot for match ${match.team1_id} vs ${match.team2_id}, category ${match.category_id} after ${attempts} attempts`);
        match.scheduled_date = null;
        match.scheduled_time = null;
        match.court = null;
        scheduledMatches.push(match);
      }
    }
    
    const scheduledCount = scheduledMatches.filter(m => m.scheduled_date && m.scheduled_time && m.court).length;
    console.log(`[DEBUG] scheduleMatches completed: ${scheduledCount} scheduled out of ${scheduledMatches.length} matches`);
    return scheduledMatches;
  }
}

module.exports = TournamentGenerator;
