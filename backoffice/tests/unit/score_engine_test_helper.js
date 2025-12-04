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
        current_game_data: JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null })
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
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                const state7 = engine.getState();
                result = { sets_data: state7.sets_data };
                break;

            case 'start_tiebreak_6_6':
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                const state8 = engine.getState();
                result = { current_set_data: state8.current_set_data };
                break;

            case 'increment_tiebreak_points':
                // Set up 6-6
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                engine.incrementPoint('A');
                const state9 = engine.getState();
                result = { current_set_data: state9.current_set_data };
                break;

            case 'win_tiebreak_7_5':
                // Set up 6-6
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
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
                // Set up 6-6
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
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
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                // Team A wins second set 6-3
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
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
                // Set up tiebreak
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
                }
                engine.incrementPoint('A');
                engine.incrementPoint('A');
                engine.decrementPoint('A');
                const state15 = engine.getState();
                result = { current_set_data: state15.current_set_data };
                break;

            case 'undo_tiebreak_win':
                // Set up tiebreak and win it
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('A');
                    }
                }
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 4; j++) {
                        engine.incrementPoint('B');
                    }
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



