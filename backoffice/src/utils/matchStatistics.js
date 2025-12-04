/**
 * Match Statistics Calculator
 * Calculates detailed statistics from match score history and sets data
 */

class MatchStatistics {
  /**
   * Calculate statistics for a match
   * @param {Object} match - Match object with sets_data and score_history
   * @returns {Object} Statistics object
   */
  static calculate(match) {
    const sets = JSON.parse(match.sets_data || '[]');
    const scoreHistory = JSON.parse(match.score_history || '[]');
    
    const stats = {
      totalSets: sets.length,
      setsWonByTeam1: 0,
      setsWonByTeam2: 0,
      totalGamesTeam1: 0,
      totalGamesTeam2: 0,
      totalPointsTeam1: 0,
      totalPointsTeam2: 0,
      gamesWonTeam1: 0,
      gamesWonTeam2: 0,
      tiebreaksPlayed: 0,
      tiebreaksWonTeam1: 0,
      tiebreaksWonTeam2: 0,
      longestSet: null,
      shortestSet: null,
      setDetails: [],
      pointFlow: [],
      totalDuration: null,
      averagePointsPerGame: 0,
      averageGamesPerSet: 0
    };

    // Calculate set statistics
    sets.forEach((set, index) => {
      const gamesTeam1 = set.gamesA || 0;
      const gamesTeam2 = set.gamesB || 0;
      
      stats.totalGamesTeam1 += gamesTeam1;
      stats.totalGamesTeam2 += gamesTeam2;
      
      if (gamesTeam1 > gamesTeam2) {
        stats.setsWonByTeam1++;
        stats.gamesWonTeam1 += gamesTeam1;
      } else if (gamesTeam2 > gamesTeam1) {
        stats.setsWonByTeam2++;
        stats.gamesWonTeam2 += gamesTeam2;
      }
      
      // Check for tiebreak
      if (set.tiebreak) {
        stats.tiebreaksPlayed++;
        const tiebreakPoints1 = set.tiebreak.pointsA || 0;
        const tiebreakPoints2 = set.tiebreak.pointsB || 0;
        
        if (tiebreakPoints1 > tiebreakPoints2) {
          stats.tiebreaksWonTeam1++;
        } else if (tiebreakPoints2 > tiebreakPoints1) {
          stats.tiebreaksWonTeam2++;
        }
        
        stats.totalPointsTeam1 += tiebreakPoints1;
        stats.totalPointsTeam2 += tiebreakPoints2;
      }
      
      const totalGames = gamesTeam1 + gamesTeam2;
      if (!stats.longestSet || totalGames > stats.longestSet.totalGames) {
        stats.longestSet = { set: index + 1, totalGames, gamesTeam1, gamesTeam2 };
      }
      if (!stats.shortestSet || totalGames < stats.shortestSet.totalGames) {
        stats.shortestSet = { set: index + 1, totalGames, gamesTeam1, gamesTeam2 };
      }
      
      stats.setDetails.push({
        setNumber: index + 1,
        gamesTeam1,
        gamesTeam2,
        tiebreak: set.tiebreak,
        winner: gamesTeam1 > gamesTeam2 ? 'team1' : gamesTeam2 > gamesTeam1 ? 'team2' : 'tie'
      });
    });

    // Calculate point flow from score history
    if (scoreHistory.length > 0) {
      let previousState = null;
      scoreHistory.forEach((state, index) => {
        const currentSet = JSON.parse(state.current_set_data || '{}');
        const currentGame = JSON.parse(state.current_game_data || '{}');
        const sets = JSON.parse(state.sets_data || '[]');
        
        // Determine which team scored based on state changes
        if (previousState) {
          const prevGame = JSON.parse(previousState.current_game_data || '{}');
          const prevSet = JSON.parse(previousState.current_set_data || '{}');
          
          // Check if point was scored
          if (currentGame.pointsA > prevGame.pointsA || 
              (currentSet.tiebreak && prevSet.tiebreak && currentSet.tiebreak.pointsA > prevSet.tiebreak.pointsA)) {
            stats.pointFlow.push({
              timestamp: state.timestamp,
              team: 'team1',
              set: state.current_set_index + 1,
              action: currentSet.tiebreak ? 'tiebreak_point' : 'point',
              score: {
                sets: sets.length,
                currentSet: currentSet,
                currentGame: currentGame
              }
            });
            stats.totalPointsTeam1++;
          } else if (currentGame.pointsB > prevGame.pointsB || 
                     (currentSet.tiebreak && prevSet.tiebreak && currentSet.tiebreak.pointsB > prevSet.tiebreak.pointsB)) {
            stats.pointFlow.push({
              timestamp: state.timestamp,
              team: 'team2',
              set: state.current_set_index + 1,
              action: currentSet.tiebreak ? 'tiebreak_point' : 'point',
              score: {
                sets: sets.length,
                currentSet: currentSet,
                currentGame: currentGame
              }
            });
            stats.totalPointsTeam2++;
          }
          
          // Check if game was won
          const prevGamesA = prevSet.gamesA || 0;
          const prevGamesB = prevSet.gamesB || 0;
          if (currentSet.gamesA > prevGamesA) {
            stats.pointFlow.push({
              timestamp: state.timestamp,
              team: 'team1',
              set: state.current_set_index + 1,
              action: 'game_won',
              score: {
                sets: sets.length,
                currentSet: currentSet,
                currentGame: currentGame
              }
            });
          } else if (currentSet.gamesB > prevGamesB) {
            stats.pointFlow.push({
              timestamp: state.timestamp,
              team: 'team2',
              set: state.current_set_index + 1,
              action: 'game_won',
              score: {
                sets: sets.length,
                currentSet: currentSet,
                currentGame: currentGame
              }
            });
          }
        }
        
        previousState = state;
      });
      
      // Calculate duration
      if (scoreHistory.length > 1) {
        const startTime = new Date(scoreHistory[0].timestamp);
        const endTime = new Date(scoreHistory[scoreHistory.length - 1].timestamp);
        const durationMs = endTime - startTime;
        stats.totalDuration = {
          milliseconds: durationMs,
          seconds: Math.floor(durationMs / 1000),
          minutes: Math.floor(durationMs / 60000),
          hours: Math.floor(durationMs / 3600000),
          formatted: this.formatDuration(durationMs)
        };
      }
    }

    // Calculate averages
    const totalGames = stats.totalGamesTeam1 + stats.totalGamesTeam2;
    const totalPoints = stats.totalPointsTeam1 + stats.totalPointsTeam2;
    
    if (totalGames > 0) {
      stats.averagePointsPerGame = (totalPoints / totalGames).toFixed(2);
    }
    
    if (stats.totalSets > 0) {
      stats.averageGamesPerSet = (totalGames / stats.totalSets).toFixed(2);
    }

    return stats;
  }

  /**
   * Format duration in human-readable format
   * @param {number} milliseconds
   * @returns {string}
   */
  static formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get point-by-point breakdown
   * @param {Object} match - Match object
   * @returns {Array} Array of point events
   */
  static getPointBreakdown(match) {
    const scoreHistory = JSON.parse(match.score_history || '[]');
    const breakdown = [];
    
    let previousState = null;
    scoreHistory.forEach((state, index) => {
      if (!previousState) {
        previousState = state;
        return;
      }
      
      const currentSet = JSON.parse(state.current_set_data || '{}');
      const currentGame = JSON.parse(state.current_game_data || '{}');
      const prevSet = JSON.parse(previousState.current_set_data || '{}');
      const prevGame = JSON.parse(previousState.current_game_data || '{}');
      
      // Use team_scored if available (more accurate)
      if (state.team_scored) {
        const team = state.team_scored === 'A' || state.team_scored === '1' ? 'team1' : 'team2';
        const isTiebreak = currentSet.tiebreak !== null;
        
        breakdown.push({
          index: index,
          timestamp: state.timestamp,
          team: team,
          type: isTiebreak ? 'tiebreak_point' : 'point',
          set: state.current_set_index + 1,
          score: isTiebreak ? {
            tiebreak: `${currentSet.tiebreak.pointsA || 0}-${currentSet.tiebreak.pointsB || 0}`,
            games: `${currentSet.gamesA || 0}-${currentSet.gamesB || 0}`
          } : {
            game: `${currentGame.pointsA || 0}-${currentGame.pointsB || 0}`,
            games: `${currentSet.gamesA || 0}-${currentSet.gamesB || 0}`
          }
        });
      } else {
        // Fallback: determine team from state changes
        if (currentSet.tiebreak) {
          const currentTiebreak = currentSet.tiebreak || { pointsA: 0, pointsB: 0 };
          const prevTiebreak = prevSet.tiebreak || { pointsA: 0, pointsB: 0 };
          
          if (currentTiebreak.pointsA > prevTiebreak.pointsA) {
            breakdown.push({
              index: index,
              timestamp: state.timestamp,
              team: 'team1',
              type: 'tiebreak_point',
              set: state.current_set_index + 1,
              score: {
                tiebreak: `${currentTiebreak.pointsA}-${currentTiebreak.pointsB}`,
                games: `${currentSet.gamesA || 0}-${currentSet.gamesB || 0}`
              }
            });
          } else if (currentTiebreak.pointsB > prevTiebreak.pointsB) {
            breakdown.push({
              index: index,
              timestamp: state.timestamp,
              team: 'team2',
              type: 'tiebreak_point',
              set: state.current_set_index + 1,
              score: {
                tiebreak: `${currentTiebreak.pointsA}-${currentTiebreak.pointsB}`,
                games: `${currentSet.gamesA || 0}-${currentSet.gamesB || 0}`
              }
            });
          }
        } else {
          if (currentGame.pointsA > prevGame.pointsA) {
            breakdown.push({
              index: index,
              timestamp: state.timestamp,
              team: 'team1',
              type: 'point',
              set: state.current_set_index + 1,
              score: {
                game: `${currentGame.pointsA}-${currentGame.pointsB}`,
                games: `${currentSet.gamesA || 0}-${currentSet.gamesB || 0}`
              }
            });
          } else if (currentGame.pointsB > prevGame.pointsB) {
            breakdown.push({
              index: index,
              timestamp: state.timestamp,
              team: 'team2',
              type: 'point',
              set: state.current_set_index + 1,
              score: {
                game: `${currentGame.pointsA}-${currentGame.pointsB}`,
                games: `${currentSet.gamesA || 0}-${currentSet.gamesB || 0}`
              }
            });
          }
        }
      }
      
      previousState = state;
    });
    
    return breakdown;
  }
}

module.exports = MatchStatistics;

