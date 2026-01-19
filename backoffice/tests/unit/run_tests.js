/**
 * Simple test runner for ScoreEngine tests
 */

const ScoreEngine = require('../../src/scoring/scoreEngine');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        testsPassed++;
        console.log(`  ✓ ${name}`);
    } catch (error) {
        testsFailed++;
        console.error(`  ✗ ${name}: ${error.message}`);
        if (error.stack) {
            console.error(`    ${error.stack.split('\n')[1]}`);
        }
    }
}

function expect(actual) {
    return {
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected} but got ${actual}`);
            }
        },
        toBeGreaterThan: (expected) => {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        },
        toBeLessThan: (expected) => {
            if (actual >= expected) {
                throw new Error(`Expected ${actual} to be less than ${expected}`);
            }
        },
        toBeDefined: () => {
            if (actual === undefined) {
                throw new Error(`Expected value to be defined`);
            }
        },
        not: {
            toBeNull: () => {
                if (actual === null) {
                    throw new Error(`Expected value not to be null`);
                }
            }
        }
    };
}

function describe(description, fn) {
    console.log(`\n${description}`);
    fn();
}

function beforeEach(fn) {
    return fn;
}

// Run ScoreEngine tests
console.log('🧪 Running ScoreEngine Unit Tests\n');

describe('ScoreEngine - Normal Point Scoring', () => {
    let match, engine;
    
    const setup = () => {
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
    };

    test('should increment point from 0 to 15', () => {
        setup();
        engine.incrementPoint('A');
        const state = engine.getState();
        const game = JSON.parse(state.current_game_data);
        expect(game.pointsA).toBe(1);
    });

    test('should progress 0 -> 15 -> 30 -> 40', () => {
        setup();
        engine.incrementPoint('A');
        engine.incrementPoint('A');
        engine.incrementPoint('A');
        const state = engine.getState();
        const game = JSON.parse(state.current_game_data);
        expect(game.pointsA).toBe(3); // 40
    });

    test('should win game at 40-30', () => {
        setup();
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
        setup();
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
        setup();
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

describe('ScoreEngine - Set Completion', () => {
    let match, engine;
    
    const setup = () => {
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
    };

    test('should win set at 6-4', () => {
        setup();
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
        setup();
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

describe('ScoreEngine - Tiebreak', () => {
    let match, engine;
    
    const setup = () => {
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
    };

    test('should increment tiebreak points', () => {
        setup();
        engine.incrementPoint('A');
        const state = engine.getState();
        const set = JSON.parse(state.current_set_data);
        expect(set.tiebreak.pointsA).toBe(1);
        expect(set.tiebreak.pointsB).toBe(0);
    });

    test('should win tiebreak at 7-5 and finish set', () => {
        setup();
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
        expect(sets[0].tiebreak).not.toBeNull();
    });

    test('should require 2-point margin in tiebreak', () => {
        setup();
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
    });
});

describe('ScoreEngine - Decrement/Undo', () => {
    let match, engine;
    
    const setup = () => {
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
    };

    test('should decrement normal point', () => {
        setup();
        engine.incrementPoint('A');
        engine.incrementPoint('A');
        engine.decrementPoint('A');
        
        const state = engine.getState();
        const game = JSON.parse(state.current_game_data);
        expect(game.pointsA).toBe(1);
    });

    test('should undo game win', () => {
        setup();
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
        setup();
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
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50) + '\n');

if (testsFailed > 0) {
    process.exit(1);
}
















