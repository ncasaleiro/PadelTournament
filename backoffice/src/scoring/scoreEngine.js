/**
 * Padel Tennis Scoring Engine
 * Handles point-by-point scoring, games, sets, and match completion
 */

const POINT_VALUES = {
  0: '0',
  1: '15',
  2: '30',
  3: '40',
};

const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  PLAYING: 'playing',
  FINISHED: 'finished',
  CANCELLED: 'cancelled'
};

class ScoreEngine {
  constructor(match) {
    this.match = match;
    this.sets = this.parseJSON(match.sets_data) || [];
    this.currentSetIndex = match.current_set_index || 0;
    this.currentSet = this.parseJSON(match.current_set_data) || { gamesA: 0, gamesB: 0, tiebreak: null };
    this.currentGame = this.parseJSON(match.current_game_data) || { pointsA: 0, pointsB: 0, deuceState: null };
    // Load score history for undo functionality
    this.scoreHistory = this.parseJSON(match.score_history || '[]') || [];
  }

  parseJSON(str) {
    if (!str) return null;
    try {
      return typeof str === 'string' ? JSON.parse(str) : str;
    } catch (e) {
      return null;
    }
  }

  /**
   * Increment point for team A or B
   */
  incrementPoint(team) {
    if (this.match.status !== MATCH_STATUS.PLAYING) {
      throw new Error('Match is not in playing status');
    }

    // Save current state to history before making changes
    this._saveStateToHistory();

    const isTeamA = team === 'A' || team === '1';
    
    // Check if we're in tiebreak
    if (this.currentSet.tiebreak !== null) {
      this._incrementTiebreakPoint(isTeamA);
    } else {
      this._incrementNormalPoint(isTeamA);
    }

    return this.getState();
  }

  /**
   * Decrement point (undo)
   * Reverts to the previous state from history
   */
  decrementPoint(team) {
    if (this.match.status !== MATCH_STATUS.PLAYING) {
      throw new Error('Match is not in playing status');
    }

    // Check if we have history to undo
    if (this.scoreHistory.length === 0) {
      // Only allow "no points to undo" if we're at 0-0 in first set with no history
      const isFirstSet = this.currentSetIndex === 0;
      const isSetAtZero = this.currentSet.gamesA === 0 && this.currentSet.gamesB === 0;
      const isGameAtZero = this.currentGame.pointsA === 0 && this.currentGame.pointsB === 0;
      const noCompletedSets = this.sets.length === 0;
      
      if (isFirstSet && isSetAtZero && isGameAtZero && noCompletedSets) {
        throw new Error('Não há pontos para desfazer');
      }
      
      // If we're at 0-0 but have completed sets, restore last set and try again
      if (isSetAtZero && isGameAtZero && this.sets.length > 0) {
        this._restoreLastSet();
        // After restoring, try to get history again or restore state
        if (this.scoreHistory.length > 0) {
          this._restoreStateFromHistory();
        } else {
          // No history for restored set, restore to end of that set
          // This means the last point of that set finished it, so we restore to just before
          throw new Error('Não há pontos para desfazer');
        }
        return this.getState();
      }
      
      throw new Error('Não há pontos para desfazer');
    }

    // Restore previous state from history
    this._restoreStateFromHistory();

    return this.getState();
  }

  /**
   * Normal point scoring (0, 15, 30, 40, Deuce, Advantage)
   */
  _incrementNormalPoint(isTeamA) {
    const game = this.currentGame;
    const pointKey = isTeamA ? 'pointsA' : 'pointsB';
    const otherPointKey = isTeamA ? 'pointsB' : 'pointsA';

    // Handle deuce/advantage
    if (game.deuceState) {
      if (game.deuceState === (isTeamA ? 'A' : 'B')) {
        // Team already has advantage, wins the game
        this._winGame(isTeamA);
        return;
      } else {
        // Other team had advantage, back to deuce
        game.deuceState = null;
        return;
      }
    }

    // Check if at deuce (both at 40)
    if (game.pointsA >= 3 && game.pointsB >= 3 && game.pointsA === game.pointsB) {
      // Deuce - next point gives advantage
      game.deuceState = isTeamA ? 'A' : 'B';
      return;
    }

    // Normal progression
    game[pointKey]++;

    // Check if game is won
    const points = game[pointKey];
    const otherPoints = game[otherPointKey];

    // Win conditions:
    // 1. Reached 4 points (40) and opponent has 2 or less (30 or less)
    // 2. Reached 4 points and opponent has 3 (40-40 deuce handled above)
    if (points >= 4 && points - otherPoints >= 2) {
      this._winGame(isTeamA);
    }
  }

  /**
   * Decrement normal point
   */
  _decrementNormalPoint(isTeamA) {
    const game = this.currentGame;
    const pointKey = isTeamA ? 'pointsA' : 'pointsB';
    const otherPointKey = isTeamA ? 'pointsB' : 'pointsA';

    // Check if we need to restore a game that was just won
    // If current game is at 0-0 and set games > 0, we need to restore previous game
    if (game.pointsA === 0 && game.pointsB === 0) {
      const setGamesA = this.currentSet.gamesA;
      const setGamesB = this.currentSet.gamesB;
      
      // Check if we need to restore a game
      if ((isTeamA && setGamesA > 0) || (!isTeamA && setGamesB > 0)) {
        // Restore previous game state (was at 40-30 or 40-15 or 40-0)
        // For simplicity, restore to 40-30 (most common winning scenario)
        game[pointKey] = 3; // 40
        game[otherPointKey] = 2; // 30
        game.deuceState = null;
        
        // Decrement set games
        if (isTeamA) {
          this.currentSet.gamesA--;
        } else {
          this.currentSet.gamesB--;
        }
        
        // Check if we need to remove tiebreak
        if (this.currentSet.gamesA === 6 && this.currentSet.gamesB === 6) {
          // Still at 6-6, keep tiebreak if it exists
          if (!this.currentSet.tiebreak) {
            this.currentSet.tiebreak = { pointsA: 0, pointsB: 0 };
          }
        } else {
          // No longer at 6-6, remove tiebreak
          this.currentSet.tiebreak = null;
        }
        
        return;
      }
    }

    // Normal decrement - just reduce the point
    if (game[pointKey] > 0) {
      game[pointKey]--;
    }

    // Reset deuce state if needed
    if (game.deuceState) {
      game.deuceState = null;
    }
  }

  /**
   * Restore the last completed set back to current set
   * This is used when undoing at the start of a new set (0-0)
   */
  _restoreLastSet() {
    if (this.sets.length === 0) {
      return; // No sets to restore
    }

    const lastSet = this.sets[this.sets.length - 1];
    
    // Restore the set data
    this.currentSet = {
      gamesA: lastSet.gamesA,
      gamesB: lastSet.gamesB,
      tiebreak: lastSet.tiebreak ? JSON.parse(JSON.stringify(lastSet.tiebreak)) : null
    };
    
    // Remove the set from completed sets
    this.sets.pop();
    
    // Decrement set index
    if (this.currentSetIndex > 0) {
      this.currentSetIndex--;
    }
    
    // Reset match status if it was finished
    if (this.match.status === MATCH_STATUS.FINISHED) {
      this.match.status = MATCH_STATUS.PLAYING;
      this.match.winner_team_id = null;
    }
    
    // Reset current game to 0-0 (we'll decrement from the restored set state)
    this.currentGame = { pointsA: 0, pointsB: 0, deuceState: null };
  }

  /**
   * Tiebreak scoring (first to 7 with 2-point margin)
   */
  _incrementTiebreakPoint(isTeamA) {
    if (!this.currentSet.tiebreak) {
      this.currentSet.tiebreak = { pointsA: 0, pointsB: 0 };
    }

    const tiebreak = this.currentSet.tiebreak;
    const pointKey = isTeamA ? 'pointsA' : 'pointsB';
    const otherPointKey = isTeamA ? 'pointsB' : 'pointsA';

    tiebreak[pointKey]++;

    // Win tiebreak: first to 7 with 2-point margin
    const points = tiebreak[pointKey];
    const otherPoints = tiebreak[otherPointKey];

    if (points >= 7 && points - otherPoints >= 2) {
      // Team wins tiebreak and set
      // Set final score: 7-6 (winner has 7, loser has 6)
      if (isTeamA) {
        this.currentSet.gamesA = 7;
        this.currentSet.gamesB = 6;
      } else {
        this.currentSet.gamesA = 6;
        this.currentSet.gamesB = 7;
      }
      // Finish the set
      this._finishSet(isTeamA);
    }
  }

  /**
   * Decrement tiebreak point
   */
  _decrementTiebreakPoint(isTeamA) {
    if (!this.currentSet.tiebreak) {
      // If no tiebreak but we're at 6-6, create it
      if (this.currentSet.gamesA === 6 && this.currentSet.gamesB === 6) {
        this.currentSet.tiebreak = { pointsA: 0, pointsB: 0 };
      } else {
        return;
      }
    }
    
    const tiebreak = this.currentSet.tiebreak;
    const pointKey = isTeamA ? 'pointsA' : 'pointsB';
    const otherPointKey = isTeamA ? 'pointsB' : 'pointsA';

    // Check if tiebreak was just won (set finished via tiebreak)
    // If tiebreak points are at 0-0 but set was won via tiebreak (7-6 or 6-7), restore
    if (tiebreak.pointsA === 0 && tiebreak.pointsB === 0) {
      // Check if this set was just finished via tiebreak (games are 7-6 or 6-7)
      if ((this.currentSet.gamesA === 7 && this.currentSet.gamesB === 6) ||
          (this.currentSet.gamesA === 6 && this.currentSet.gamesB === 7)) {
        // Restore tiebreak to before winning point
        // Typically the winning point was at 7-5 or 8-6, so we restore to one point before
        // For simplicity, restore to 6-6 in tiebreak (just before the winning sequence)
        this.currentSet.gamesA = 6;
        this.currentSet.gamesB = 6;
        tiebreak.pointsA = 6;
        tiebreak.pointsB = 6;
        return;
      }
    }

    // Normal decrement
    if (tiebreak[pointKey] > 0) {
      tiebreak[pointKey]--;
    }
    
    // If tiebreak goes back to 0-0 and we're at 6-6, keep tiebreak
    // If we go below 6-6, remove tiebreak
    if (this.currentSet.gamesA < 6 || this.currentSet.gamesB < 6) {
      this.currentSet.tiebreak = null;
    }
  }

  /**
   * Team wins a game
   */
  _winGame(isTeamA) {
    // Increment games in current set
    if (isTeamA) {
      this.currentSet.gamesA++;
    } else {
      this.currentSet.gamesB++;
    }

    // Reset game points
    this.currentGame = { pointsA: 0, pointsB: 0, deuceState: null };

    // Check if set is finished
    this._checkSetFinished();
  }

  /**
   * Check if set is finished and handle tiebreak
   */
  _checkSetFinished() {
    const gamesA = this.currentSet.gamesA;
    const gamesB = this.currentSet.gamesB;

    // Set won: 6 games with 2-game margin
    if (gamesA >= 6 && gamesA - gamesB >= 2) {
      this._finishSet(true);
      return;
    }
    if (gamesB >= 6 && gamesB - gamesA >= 2) {
      this._finishSet(false);
      return;
    }

    // Tiebreak at 6-6 (only if not already in tiebreak)
    if (gamesA === 6 && gamesB === 6 && this.currentSet.tiebreak === null) {
      this.currentSet.tiebreak = { pointsA: 0, pointsB: 0 };
    }
  }

  /**
   * Finish current set and move to next
   */
  _finishSet(teamAWon) {
    // If tiebreak was played, set score is 7-6
    if (this.currentSet.tiebreak) {
      if (teamAWon) {
        this.currentSet.gamesA = 7;
        this.currentSet.gamesB = 6;
      } else {
        this.currentSet.gamesA = 6;
        this.currentSet.gamesB = 7;
      }
    }

    // Add completed set to sets array
    this.sets.push({
      gamesA: this.currentSet.gamesA,
      gamesB: this.currentSet.gamesB,
      tiebreak: this.currentSet.tiebreak
    });

    // Check if match is finished (best of 3 sets)
    const setsWonByA = this.sets.filter(s => s.gamesA > s.gamesB).length;
    const setsWonByB = this.sets.filter(s => s.gamesB > s.gamesA).length;

    if (setsWonByA >= 2 || setsWonByB >= 2) {
      // Match finished
      this.match.status = MATCH_STATUS.FINISHED;
      this.match.winner_team_id = teamAWon ? this.match.team1_id : this.match.team2_id;
    } else {
      // Move to next set
      this.currentSetIndex++;
      this.currentSet = { gamesA: 0, gamesB: 0, tiebreak: null };
      this.currentGame = { pointsA: 0, pointsB: 0, deuceState: null };
    }
  }

  /**
   * Save current state to history before making changes
   */
  _saveStateToHistory() {
    const state = {
      sets_data: JSON.stringify(this.sets),
      current_set_index: this.currentSetIndex,
      current_set_data: JSON.stringify(this.currentSet),
      current_game_data: JSON.stringify(this.currentGame),
      status: this.match.status,
      winner_team_id: this.match.winner_team_id,
      timestamp: new Date().toISOString()
    };
    
    this.scoreHistory.push(state);
    
    // Limit history to last 100 states to prevent memory issues
    if (this.scoreHistory.length > 100) {
      this.scoreHistory.shift();
    }
  }

  /**
   * Restore previous state from history
   */
  _restoreStateFromHistory() {
    if (this.scoreHistory.length === 0) {
      return;
    }
    
    const previousState = this.scoreHistory.pop();
    
    // Restore all state
    this.sets = this.parseJSON(previousState.sets_data) || [];
    this.currentSetIndex = previousState.current_set_index || 0;
    this.currentSet = this.parseJSON(previousState.current_set_data) || { gamesA: 0, gamesB: 0, tiebreak: null };
    this.currentGame = this.parseJSON(previousState.current_game_data) || { pointsA: 0, pointsB: 0, deuceState: null };
    this.match.status = previousState.status || MATCH_STATUS.PLAYING;
    this.match.winner_team_id = previousState.winner_team_id || null;
  }

  /**
   * Get current state for saving to database
   */
  getState() {
    return {
      sets_data: JSON.stringify(this.sets),
      current_set_index: this.currentSetIndex,
      current_set_data: JSON.stringify(this.currentSet),
      current_game_data: JSON.stringify(this.currentGame),
      status: this.match.status,
      winner_team_id: this.match.winner_team_id,
      score_history: JSON.stringify(this.scoreHistory)
    };
  }

  /**
   * Format point for display
   */
  static formatPoint(points, deuceState, team) {
    if (deuceState === team) {
      return 'Adv';
    }
    if (deuceState && deuceState !== team) {
      return '40';
    }
    return POINT_VALUES[points] || '0';
  }
}

module.exports = ScoreEngine;

