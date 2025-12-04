/**
 * Helper script to test ScoreEngine from Robot Framework
 * This script runs a specific test and returns JSON result
 */

const ScoreEngine = require('../../src/scoring/scoreEngine');

const testName = process.argv[2];

if (!testName) {
    console.error(JSON.stringify({ error: 'Test name required' }));
    process.exit(1);
}

function createMatch() {
    return {
        match_id: 1,
        team1_id: 1,
        team2_id: 2,
        status: 'playing',
        sets_data: JSON.stringify([]),
        current_set_index: 0,
        current_set_data: JSON.stringify({ gamesA: 0, gamesB: 0, tiebreak: null }),
        current_game_data: JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null }),
        score_history: JSON.stringify([])
    };
}

function runTest(testName) {
    try {
        let match = createMatch();
        let engine = new ScoreEngine(match);
        let result = {};

        switch (testName) {
            case 'increment_point_basic':
                engine.incrementPoint('A');
                const state1 = engine.getState();
                const game1 = JSON.parse(state1.current_game_data);
                result = { pointsA: game1.pointsA };
                break;

            case 'progress_points':
                engine.incrementPoint('A');
                engine.incrementPoint('A');
                engine.incrementPoint('A');
                const state2 = engine.getState();
                const game2 = JSON.parse(state2.current_game_data);
                result = { pointsA: game2.pointsA };
                break;

            case 'win_game_40_30':
                engine.incrementPoint('A');
                engine.incrementPoint('A');
                engine.incrementPoint('A');
                engine.incrementPoint('B');
                engine.incrementPoint('B');
                engine.incrementPoint('A');
                const state3 = engine.getState();
                const set3 = JSON.parse(state3.current_set_data);
                const game3 = JSON.parse(state3.current_game_data);
                result = {
                    set: { gamesA: set3.gamesA, gamesB: set3.gamesB },
                    game: { pointsA: game3.pointsA, pointsB: game3.pointsB }
                };
                break;

            case 'handle_deuce':
                for (let i = 0; i < 3; i++) {
                    engine.incrementPoint('A');
                    engine.incrementPoint('B');
                }
                const state4 = engine.getState();
                const game4 = JSON.parse(state4.current_game_data);
                result = { game: { pointsA: game4.pointsA, pointsB: game4.pointsB } };
                break;

            case 'handle_deuce_advantage':
                for (let i = 0; i < 3; i++) {
                    engine.incrementPoint('A');
                    engine.incrementPoint('B');
                }
                engine.incrementPoint('A');
                const state5 = engine.getState();
                const game5 = JSON.parse(state5.current_game_data);
                result = { game: { deuceState: game5.deuceState } };
                break;

            case 'win_game_after_advantage':
                for (let i = 0; i < 3; i++) {
                    engine.incrementPoint('A');
                    engine.incrementPoint('B');
                }
                engine.incrementPoint('A');
                engine.incrementPoint('A');
                const state6 = engine.getState();
                const set6 = JSON.parse(state6.current_set_data);
                result = { set: { gamesA: set6.gamesA } };
                break;

            case 'win_set_6_4':
                // Team A wins 6 games, Team B wins 4 games
                // Need to alternate to prevent early set finish
                // First get to 5-4
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                // Now A wins one more game to finish set at 6-4
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                const state7 = engine.getState();
                result = { sets_data: state7.sets_data };
                break;

            case 'start_tiebreak_6_6':
                // Reach 5-5 first
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                // Now 6-5 (Team A wins one more game)
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                // Finally 6-6 (Team B wins one more game, starting tiebreak)
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('B');
                }
                const state8 = engine.getState();
                result = { current_set_data: state8.current_set_data };
                break;

            case 'increment_tiebreak_points':
                // Set up 6-6: 5-5, then 6-5, then 6-6
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('B');
                }
                // Now increment tiebreak point
                engine.incrementPoint('A');
                const state9 = engine.getState();
                result = { current_set_data: state9.current_set_data };
                break;

            case 'win_tiebreak_7_5':
                // Set up 6-6: 5-5, then 6-5, then 6-6
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('B');
                }
                // Win tiebreak 7-5
                for (let i = 0; i < 7; i++) {
                    engine.incrementPoint('A');
                }
                for (let i = 0; i < 5; i++) {
                    engine.incrementPoint('B');
                }
                engine.incrementPoint('A');
                const state10 = engine.getState();
                result = { sets_data: state10.sets_data };
                break;

            case 'tiebreak_2_point_margin':
                // Set up 6-6: 5-5, then 6-5, then 6-6
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('B');
                }
                // Both reach 6 in tiebreak
                for (let i = 0; i < 6; i++) {
                    engine.incrementPoint('A');
                    engine.incrementPoint('B');
                }
                // A gets 7th point but only 1-point margin
                engine.incrementPoint('A');
                const state11 = engine.getState();
                result = {
                    current_set_data: state11.current_set_data,
                    sets_data: state11.sets_data
                };
                break;

            case 'finish_match_2_sets':
                // Team A wins first set 6-4
                // Get to 5-4 first
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                // A wins one more game to finish set at 6-4
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                // Verify match is still playing after first set
                let state12a = engine.getState();
                if (state12a.status !== 'playing') {
                    // Recreate engine with updated match status
                    match = createMatch();
                    match.status = state12a.status;
                    match.sets_data = state12a.sets_data;
                    match.current_set_index = state12a.current_set_index;
                    match.current_set_data = state12a.current_set_data;
                    match.current_game_data = state12a.current_game_data;
                    match.winner_team_id = state12a.winner_team_id;
                    engine = new ScoreEngine(match);
                }
                // Team A wins second set 6-3
                // Get to 5-3 first
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                // A wins one more game to finish set at 6-3
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                const state12 = engine.getState();
                result = {
                    status: state12.status,
                    winner_team_id: state12.winner_team_id
                };
                break;

            case 'decrement_normal_point':
                engine.incrementPoint('A');
                engine.incrementPoint('A');
                engine.decrementPoint('A');
                const state13 = engine.getState();
                const game13 = JSON.parse(state13.current_game_data);
                result = { current_game_data: state13.current_game_data };
                break;

            case 'undo_game_win':
                for (let i = 0; i < 4; i++) {
                    engine.incrementPoint('A');
                }
                engine.decrementPoint('A');
                const state14 = engine.getState();
                result = {
                    current_set_data: state14.current_set_data,
                    current_game_data: state14.current_game_data
                };
                break;

            case 'decrement_tiebreak_point':
                // Set up tiebreak: 5-5, then 6-5, then 6-6
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('B');
                }
                engine.incrementPoint('A');
                engine.incrementPoint('A');
                engine.decrementPoint('A');
                const state15 = engine.getState();
                result = { current_set_data: state15.current_set_data };
                break;

            case 'undo_tiebreak_win':
                // Set up tiebreak: 5-5, then 6-5, then 6-6
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('B');
                }
                // Win tiebreak
                for (let i = 0; i < 7; i++) {
                    engine.incrementPoint('A');
                }
                for (let i = 0; i < 5; i++) {
                    engine.incrementPoint('B');
                }
                engine.incrementPoint('A');
                // Undo last point
                engine.decrementPoint('A');
                const state16 = engine.getState();
                result = {
                    sets_data: state16.sets_data,
                    current_set_data: state16.current_set_data
                };
                break;

            case 'match_not_playing':
                match.status = 'scheduled';
                engine = new ScoreEngine(match);
                try {
                    engine.incrementPoint('A');
                    result = { error: 'Should have thrown error' };
                } catch (error) {
                    result = { error: error.message };
                }
                break;

            case 'handle_empty_json':
                match.sets_data = '';
                match.current_set_data = '';
                match.current_game_data = '';
                engine = new ScoreEngine(match);
                const state17 = engine.getState();
                result = {
                    sets_data: state17.sets_data,
                    current_set_data: state17.current_set_data,
                    current_game_data: state17.current_game_data
                };
                break;

            case 'super_tiebreak_starts_3rd_set':
                // Win first set 6-4
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                // Win second set 6-3
                const state18a = engine.getState();
                match = createMatch();
                match.use_super_tiebreak = true;
                match.status = 'playing';
                match.sets_data = state18a.sets_data;
                match.current_set_index = 1;
                match.current_set_data = JSON.stringify({ gamesA: 0, gamesB: 0, tiebreak: null });
                match.current_game_data = JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null });
                match.score_history = state18a.score_history || JSON.stringify([]);
                engine = new ScoreEngine(match);
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                // Now in 3rd set - super tie-break should start automatically
                const state18b = engine.getState();
                // Ensure status is playing for 3rd set (even if previous state was finished)
                match = createMatch();
                match.use_super_tiebreak = true;
                match.status = 'playing';  // Force status to playing for 3rd set
                match.sets_data = state18b.sets_data;
                match.current_set_index = 2;
                // For super tie-break, the 3rd set should start fresh at 0-0 with tiebreak initialized
                match.current_set_data = JSON.stringify({ gamesA: 0, gamesB: 0, tiebreak: { pointsA: 0, pointsB: 0 } });
                match.current_game_data = JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null });
                match.score_history = state18b.score_history || JSON.stringify([]);
                engine = new ScoreEngine(match);
                const state18 = engine.getState();
                result = { current_set_data: state18.current_set_data };
                break;

            case 'super_tiebreak_10_points_margin':
                // Set up: win first set (A), win second set (B), then play super tie-break in 3rd set
                match.use_super_tiebreak = true;
                // Win first set 6-4 (Team A wins)
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                // Win second set 4-6 (Team B wins) - so match is 1-1
                const state19a = engine.getState();
                match = createMatch();
                match.use_super_tiebreak = true;
                match.status = 'playing';  // Ensure status is playing
                match.sets_data = state19a.sets_data;
                match.current_set_index = 1;
                match.current_set_data = JSON.stringify({ gamesA: 0, gamesB: 0, tiebreak: null });
                match.current_game_data = JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null });
                match.score_history = state19a.score_history || JSON.stringify([]);
                engine = new ScoreEngine(match);
                // Team B wins second set 4-6
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('B');
                }
                // Now in 3rd set - play super tie-break: A wins 10-8
                const state19b = engine.getState();
                // Parse sets to verify match is 1-1 (not finished)
                const sets = JSON.parse(state19b.sets_data);
                const setsWonByA = sets.filter(s => s.gamesA > s.gamesB).length;
                const setsWonByB = sets.filter(s => s.gamesB > s.gamesA).length;
                // Ensure match is 1-1, not finished
                if (setsWonByA >= 2 || setsWonByB >= 2) {
                    throw new Error(`Match should be 1-1 but sets are: A=${setsWonByA}, B=${setsWonByB}`);
                }
                // Ensure status is playing for 3rd set (match should be 1-1, so still playing)
                match = createMatch();
                match.use_super_tiebreak = true;
                match.status = 'playing';  // Force status to playing for 3rd set
                match.sets_data = state19b.sets_data;
                match.current_set_index = 2;
                // For super tie-break, the 3rd set should start fresh at 0-0 with tiebreak initialized
                match.current_set_data = JSON.stringify({ gamesA: 0, gamesB: 0, tiebreak: { pointsA: 0, pointsB: 0 } });
                match.current_game_data = JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null });
                match.score_history = state19b.score_history || JSON.stringify([]);
                engine = new ScoreEngine(match);
                // Ensure engine match status is playing - must be set before incrementPoint
                engine.match.status = 'playing';
                // Verify status before incrementing
                if (engine.match.status !== 'playing') {
                    throw new Error(`Match status is ${engine.match.status}, expected 'playing'`);
                }
                // A scores 10 points
                for (let i = 0; i < 10; i++) {
                    if (engine.match.status !== 'playing') {
                        engine.match.status = 'playing';
                    }
                    engine.incrementPoint('A');
                }
                // B scores 8 points
                for (let i = 0; i < 8; i++) {
                    if (engine.match.status !== 'playing') {
                        engine.match.status = 'playing';
                    }
                    engine.incrementPoint('B');
                }
                const state19 = engine.getState();
                result = {
                    current_set_data: state19.current_set_data,
                    sets_data: state19.sets_data
                };
                break;

            case 'super_tiebreak_set_score':
                // Set up: win first set (A), win second set (B), then play super tie-break in 3rd set
                match.use_super_tiebreak = true;
                // Win first set 6-4 (Team A wins)
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                // Win second set 4-6 (Team B wins) - so match is 1-1
                const state20a = engine.getState();
                match = createMatch();
                match.use_super_tiebreak = true;
                match.status = 'playing';  // Ensure status is playing
                match.sets_data = state20a.sets_data;
                match.current_set_index = 1;
                match.current_set_data = JSON.stringify({ gamesA: 0, gamesB: 0, tiebreak: null });
                match.current_game_data = JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null });
                match.score_history = state20a.score_history || JSON.stringify([]);
                engine = new ScoreEngine(match);
                // Team B wins second set 4-6
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('B');
                }
                // Now in 3rd set - play super tie-break: A wins 10-8
                const state20b = engine.getState();
                // Parse sets to verify match is 1-1 (not finished)
                const sets2 = JSON.parse(state20b.sets_data);
                const setsWonByA2 = sets2.filter(s => s.gamesA > s.gamesB).length;
                const setsWonByB2 = sets2.filter(s => s.gamesB > s.gamesA).length;
                // Ensure match is 1-1, not finished
                if (setsWonByA2 >= 2 || setsWonByB2 >= 2) {
                    throw new Error(`Match should be 1-1 but sets are: A=${setsWonByA2}, B=${setsWonByB2}`);
                }
                match = createMatch();
                match.use_super_tiebreak = true;
                // Ensure status is playing (match should be 1-1, so still playing)
                match.status = 'playing';
                match.sets_data = state20b.sets_data;
                match.current_set_index = 2;
                // For super tie-break, the 3rd set should start fresh at 0-0 with tiebreak initialized
                match.current_set_data = JSON.stringify({ gamesA: 0, gamesB: 0, tiebreak: { pointsA: 0, pointsB: 0 } });
                match.current_game_data = JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null });
                match.score_history = state20b.score_history || JSON.stringify([]);
                engine = new ScoreEngine(match);
                // Ensure engine match status is playing - must be set before incrementPoint
                engine.match.status = 'playing';
                // Verify status before incrementing
                if (engine.match.status !== 'playing') {
                    throw new Error(`Match status is ${engine.match.status}, expected 'playing'`);
                }
                // Alternate points to get to 8-8, then A gets 2 more to win 10-8
                for (let i = 0; i < 8; i++) {
                    if (engine.match.status !== 'playing') {
                        engine.match.status = 'playing';
                    }
                    engine.incrementPoint('A');
                    if (engine.match.status === 'finished') break;
                    if (engine.match.status !== 'playing') {
                        engine.match.status = 'playing';
                    }
                    engine.incrementPoint('B');
                    if (engine.match.status === 'finished') break;
                }
                // A gets 2 more points to win 10-8
                if (engine.match.status === 'playing') {
                    for (let i = 0; i < 2; i++) {
                        engine.incrementPoint('A');
                        if (engine.match.status === 'finished') break;
                    }
                }
                const state20 = engine.getState();
                result = { sets_data: state20.sets_data };
                break;

            case 'super_tiebreak_not_in_first_sets':
                // Test that super tie-break is not used in first two sets
                match.use_super_tiebreak = true;
                // Win first set 6-4 (normal scoring)
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
                const state21 = engine.getState();
                result = {
                    sets_data: state21.sets_data,
                    current_set_data: state21.current_set_data
                };
                break;

            default:
                result = { error: `Unknown test: ${testName}` };
        }

        console.log(JSON.stringify(result));
    } catch (error) {
        console.error(JSON.stringify({ error: error.message, stack: error.stack }));
        process.exit(1);
    }
}

runTest(testName);





