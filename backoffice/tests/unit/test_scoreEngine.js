/**
 * Unit tests for ScoreEngine
 * Tests all scoring functionality including tiebreak and undo
 */

const ScoreEngine = require('../../src/scoring/scoreEngine');

describe('ScoreEngine', () => {
    let match;
    let engine;

    beforeEach(() => {
        match = {
            match_id: 1,
            team1_id: 1,
            team2_id: 2,
            status: 'playing',
            sets_data: JSON.stringify([]),
            current_set_index: 0,
            current_set_data: JSON.stringify({ gamesA: 0, gamesB: 0, tiebreak: null }),
            current_game_data: JSON.stringify({ pointsA: 0, pointsB: 0, deuceState: null })
        };
        engine = new ScoreEngine(match);
    });

    describe('Normal Point Scoring', () => {
        test('should increment point from 0 to 15', () => {
            engine.incrementPoint('A');
            const state = engine.getState();
            const game = JSON.parse(state.current_game_data);
            expect(game.pointsA).toBe(1);
        });

        test('should progress 0 -> 15 -> 30 -> 40', () => {
            engine.incrementPoint('A');
            engine.incrementPoint('A');
            engine.incrementPoint('A');
            const state = engine.getState();
            const game = JSON.parse(state.current_game_data);
            expect(game.pointsA).toBe(3); // 40
        });

        test('should win game at 40-30', () => {
            // Team A: 40, Team B: 30
            engine.incrementPoint('A');
            engine.incrementPoint('A');
            engine.incrementPoint('A'); // A at 40
            engine.incrementPoint('B');
            engine.incrementPoint('B'); // B at 30
            engine.incrementPoint('A'); // A wins game
            
            const state = engine.getState();
            const set = JSON.parse(state.current_set_data);
            expect(set.gamesA).toBe(1);
            expect(set.gamesB).toBe(0);
            
            // Game should reset
            const game = JSON.parse(state.current_game_data);
            expect(game.pointsA).toBe(0);
            expect(game.pointsB).toBe(0);
        });

        test('should handle deuce (40-40)', () => {
            // Both reach 40
            for (let i = 0; i < 3; i++) {
                engine.incrementPoint('A');
                engine.incrementPoint('B');
            }
            
            const state = engine.getState();
            const game = JSON.parse(state.current_game_data);
            expect(game.pointsA).toBe(3);
            expect(game.pointsB).toBe(3);
            
            // Next point should give advantage
            engine.incrementPoint('A');
            const state2 = engine.getState();
            const game2 = JSON.parse(state2.current_game_data);
            expect(game2.deuceState).toBe('A');
        });

        test('should win game after advantage', () => {
            // Reach deuce
            for (let i = 0; i < 3; i++) {
                engine.incrementPoint('A');
                engine.incrementPoint('B');
            }
            // A gets advantage
            engine.incrementPoint('A');
            // A wins game
            engine.incrementPoint('A');
            
            const state = engine.getState();
            const set = JSON.parse(state.current_set_data);
            expect(set.gamesA).toBe(1);
        });
    });

    describe('Set Completion', () => {
        test('should win set at 6-4', () => {
            // Team A wins 6 games, Team B wins 4 games
            for (let i = 0; i < 6; i++) {
                // Win a game (4 points)
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('A');
                }
            }
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    engine.incrementPoint('B');
                }
            }
            
            const state = engine.getState();
            const sets = JSON.parse(state.sets_data);
            expect(sets.length).toBe(1);
            expect(sets[0].gamesA).toBe(6);
            expect(sets[0].gamesB).toBe(4);
        });

        test('should start tiebreak at 6-6', () => {
            // Both teams reach 6 games
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
            
            const state = engine.getState();
            const set = JSON.parse(state.current_set_data);
            expect(set.gamesA).toBe(6);
            expect(set.gamesB).toBe(6);
            expect(set.tiebreak).not.toBeNull();
            expect(set.tiebreak.pointsA).toBe(0);
            expect(set.tiebreak.pointsB).toBe(0);
        });
    });

    describe('Tiebreak', () => {
        beforeEach(() => {
            // Set up 6-6 situation
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
        });

        test('should increment tiebreak points', () => {
            engine.incrementPoint('A');
            const state = engine.getState();
            const set = JSON.parse(state.current_set_data);
            expect(set.tiebreak.pointsA).toBe(1);
            expect(set.tiebreak.pointsB).toBe(0);
        });

        test('should win tiebreak at 7-5', () => {
            // Team A wins tiebreak 7-5
            for (let i = 0; i < 7; i++) {
                engine.incrementPoint('A');
            }
            for (let i = 0; i < 5; i++) {
                engine.incrementPoint('B');
            }
            engine.incrementPoint('A'); // A reaches 7 with 2-point margin
            
            const state = engine.getState();
            const sets = JSON.parse(state.sets_data);
            expect(sets.length).toBe(1);
            expect(sets[0].gamesA).toBe(7);
            expect(sets[0].gamesB).toBe(6);
        });

        test('should require 2-point margin in tiebreak', () => {
            // Both reach 6
            for (let i = 0; i < 6; i++) {
                engine.incrementPoint('A');
                engine.incrementPoint('B');
            }
            
            // A gets 7th point but only 1-point margin
            engine.incrementPoint('A');
            const state = engine.getState();
            const set = JSON.parse(state.current_set_data);
            expect(set.tiebreak.pointsA).toBe(7);
            expect(set.tiebreak.pointsB).toBe(6);
            // Set should not be finished yet
            const sets = JSON.parse(state.sets_data);
            expect(sets.length).toBe(0);
            
            // B ties at 7-7
            engine.incrementPoint('B');
            const state2 = engine.getState();
            const set2 = JSON.parse(state2.current_set_data);
            expect(set2.tiebreak.pointsA).toBe(7);
            expect(set2.tiebreak.pointsB).toBe(7);
        });

        test('should finish set with tiebreak win', () => {
            // Team A wins tiebreak 7-5
            for (let i = 0; i < 7; i++) {
                engine.incrementPoint('A');
            }
            for (let i = 0; i < 5; i++) {
                engine.incrementPoint('B');
            }
            engine.incrementPoint('A'); // Final point to win
            
            const state = engine.getState();
            const sets = JSON.parse(state.sets_data);
            expect(sets.length).toBe(1);
            expect(sets[0].gamesA).toBe(7);
            expect(sets[0].gamesB).toBe(6);
            expect(sets[0].tiebreak).not.toBeNull();
        });
    });

    describe('Match Completion', () => {
        test('should finish match after 2 sets won', () => {
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
            
            const state = engine.getState();
            expect(state.status).toBe('finished');
            expect(state.winner_team_id).toBe(match.team1_id);
        });
    });

    describe('Decrement/Undo', () => {
        test('should decrement normal point', () => {
            engine.incrementPoint('A');
            engine.incrementPoint('A');
            engine.decrementPoint('A');
            
            const state = engine.getState();
            const game = JSON.parse(state.current_game_data);
            expect(game.pointsA).toBe(1);
        });

        test('should undo game win', () => {
            // Win a game
            for (let i = 0; i < 4; i++) {
                engine.incrementPoint('A');
            }
            
            // Undo last point
            engine.decrementPoint('A');
            
            const state = engine.getState();
            const set = JSON.parse(state.current_set_data);
            expect(set.gamesA).toBe(0);
            
            const game = JSON.parse(state.current_game_data);
            expect(game.pointsA).toBeGreaterThan(0);
        });

        test('should decrement tiebreak point', () => {
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
            
            const state = engine.getState();
            const set = JSON.parse(state.current_set_data);
            expect(set.tiebreak.pointsA).toBe(1);
        });

        test('should undo tiebreak win', () => {
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
            
            const state = engine.getState();
            const sets = JSON.parse(state.sets_data);
            // Set should not be completed
            expect(sets.length).toBe(0);
            
            const set = JSON.parse(state.current_set_data);
            expect(set.tiebreak).not.toBeNull();
        });
    });

    describe('Edge Cases', () => {
        test('should not allow scoring when match is not playing', () => {
            match.status = 'scheduled';
            engine = new ScoreEngine(match);
            
            expect(() => {
                engine.incrementPoint('A');
            }).toThrow('Match is not in playing status');
        });

        test('should handle empty JSON strings', () => {
            match.sets_data = '';
            match.current_set_data = '';
            match.current_game_data = '';
            engine = new ScoreEngine(match);
            
            const state = engine.getState();
            expect(state.sets_data).toBeDefined();
            expect(state.current_set_data).toBeDefined();
            expect(state.current_game_data).toBeDefined();
        });
    });
});
















