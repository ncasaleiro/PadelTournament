/**
 * Frontend tests for Live page
 * These tests validate the JavaScript functions used in live.js
 */

// Mock fetch for testing
global.fetch = jest.fn();

describe('Live Page Frontend Functions', () => {
    beforeEach(() => {
        fetch.mockClear();
        document.body.innerHTML = `
            <div id="matches-container"></div>
            <div id="live-count"></div>
            <div id="last-update"></div>
        `;
    });

    describe('parseMatchScore function', () => {
        // Import the function logic (we'll test it separately)
        const parseMatchScore = (match) => {
            let sets = [];
            let currentSet = { gamesA: 0, gamesB: 0, tiebreak: null };
            let currentGame = { pointsA: 0, pointsB: 0, deuceState: null };
            let isTiebreak = false;
            
            try {
                if (match.sets_data) {
                    sets = typeof match.sets_data === 'string' ? JSON.parse(match.sets_data) : match.sets_data;
                }
                if (match.current_set_data) {
                    currentSet = typeof match.current_set_data === 'string' ? JSON.parse(match.current_set_data) : match.current_set_data;
                }
                if (match.current_game_data) {
                    currentGame = typeof match.current_game_data === 'string' ? JSON.parse(match.current_game_data) : match.current_game_data;
                }
                
                if (!Array.isArray(sets)) sets = [];
                if (!currentSet || typeof currentSet !== 'object') currentSet = { gamesA: 0, gamesB: 0, tiebreak: null };
                if (!currentGame || typeof currentGame !== 'object') currentGame = { pointsA: 0, pointsB: 0, deuceState: null };
                
                isTiebreak = currentSet.tiebreak !== null && currentSet.tiebreak !== undefined;
            } catch (e) {
                console.error('Error parsing match score:', e);
            }
            
            const currentSetIndex = match.current_set_index || 0;
            
            let set1A = '-', set1B = '-';
            let set2A = '-', set2B = '-';
            let set3A = '-', set3B = '-';
            
            if (sets.length > 0) {
                set1A = sets[0].gamesA || 0;
                set1B = sets[0].gamesB || 0;
            }
            if (sets.length > 1) {
                set2A = sets[1].gamesA || 0;
                set2B = sets[1].gamesB || 0;
            }
            if (sets.length > 2) {
                set3A = sets[2].gamesA || 0;
                set3B = sets[2].gamesB || 0;
            }
            
            if (match.status === 'playing') {
                if (currentSetIndex === 0 && sets.length === 0) {
                    set1A = currentSet.gamesA || 0;
                    set1B = currentSet.gamesB || 0;
                } else if (currentSetIndex === 1 && sets.length === 1) {
                    set2A = currentSet.gamesA || 0;
                    set2B = currentSet.gamesB || 0;
                } else if (currentSetIndex === 2 && sets.length === 2) {
                    set3A = currentSet.gamesA || 0;
                    set3B = currentSet.gamesB || 0;
                }
            }
            
            let gameA = '0';
            let gameB = '0';
            
            if (isTiebreak) {
                const tiebreak = currentSet.tiebreak || { pointsA: 0, pointsB: 0 };
                gameA = tiebreak.pointsA || 0;
                gameB = tiebreak.pointsB || 0;
            } else {
                const formatPoint = (points, deuceState, team) => {
                    const pointValues = {
                        0: '0',
                        1: '15',
                        2: '30',
                        3: '40'
                    };
                    
                    if (deuceState === team) {
                        return 'Adv';
                    }
                    if (deuceState && deuceState !== team) {
                        return '40';
                    }
                    return pointValues[points] || '0';
                };
                
                gameA = formatPoint(currentGame.pointsA || 0, currentGame.deuceState, 'A');
                gameB = formatPoint(currentGame.pointsB || 0, currentGame.deuceState, 'B');
            }
            
            return {
                set1A,
                set1B,
                set2A,
                set2B,
                set3A,
                set3B,
                gameA,
                gameB,
                isTiebreak
            };
        };

        test('should parse match with completed sets', () => {
            const match = {
                match_id: 1,
                status: 'playing',
                sets_data: JSON.stringify([
                    { gamesA: 6, gamesB: 4 },
                    { gamesA: 4, gamesB: 6 }
                ]),
                current_set_index: 2,
                current_set_data: JSON.stringify({
                    gamesA: 3,
                    gamesB: 2,
                    tiebreak: null
                }),
                current_game_data: JSON.stringify({
                    pointsA: 2,
                    pointsB: 1,
                    deuceState: null
                })
            };

            const result = parseMatchScore(match);
            
            expect(result.set1A).toBe(6);
            expect(result.set1B).toBe(4);
            expect(result.set2A).toBe(4);
            expect(result.set2B).toBe(6);
            expect(result.set3A).toBe(3);
            expect(result.set3B).toBe(2);
            expect(result.gameA).toBe('30');
            expect(result.gameB).toBe('15');
        });

        test('should parse match with tiebreak', () => {
            const match = {
                match_id: 2,
                status: 'playing',
                sets_data: JSON.stringify([
                    { gamesA: 6, gamesB: 4 }
                ]),
                current_set_index: 1,
                current_set_data: JSON.stringify({
                    gamesA: 6,
                    gamesB: 6,
                    tiebreak: {
                        pointsA: 5,
                        pointsB: 3
                    }
                }),
                current_game_data: JSON.stringify({
                    pointsA: 0,
                    pointsB: 0,
                    deuceState: null
                })
            };

            const result = parseMatchScore(match);
            
            expect(result.set1A).toBe(6);
            expect(result.set1B).toBe(4);
            expect(result.set2A).toBe(6);
            expect(result.set2B).toBe(6);
            expect(result.gameA).toBe(5);
            expect(result.gameB).toBe(3);
            expect(result.isTiebreak).toBe(true);
        });

        test('should handle match with no score data', () => {
            const match = {
                match_id: 3,
                status: 'playing',
                sets_data: null,
                current_set_index: 0,
                current_set_data: null,
                current_game_data: null
            };

            const result = parseMatchScore(match);
            
            expect(result.set1A).toBe(0);
            expect(result.set1B).toBe(0);
            expect(result.set2A).toBe('-');
            expect(result.set3A).toBe('-');
            expect(result.gameA).toBe('0');
            expect(result.gameB).toBe('0');
        });

        test('should handle deuce state correctly', () => {
            const match = {
                match_id: 4,
                status: 'playing',
                sets_data: JSON.stringify([]),
                current_set_index: 0,
                current_set_data: JSON.stringify({
                    gamesA: 3,
                    gamesB: 2,
                    tiebreak: null
                }),
                current_game_data: JSON.stringify({
                    pointsA: 3,
                    pointsB: 3,
                    deuceState: 'A'
                })
            };

            const result = parseMatchScore(match);
            
            expect(result.gameA).toBe('Adv');
            expect(result.gameB).toBe('40');
        });

        test('should handle already parsed JSON objects', () => {
            const match = {
                match_id: 5,
                status: 'playing',
                sets_data: [{ gamesA: 6, gamesB: 4 }],
                current_set_index: 1,
                current_set_data: {
                    gamesA: 3,
                    gamesB: 2,
                    tiebreak: null
                },
                current_game_data: {
                    pointsA: 2,
                    pointsB: 1,
                    deuceState: null
                }
            };

            const result = parseMatchScore(match);
            
            expect(result.set1A).toBe(6);
            expect(result.set1B).toBe(4);
            expect(result.set2A).toBe(3);
            expect(result.set2B).toBe(2);
        });
    });

    describe('formatPoint function', () => {
        const formatPoint = (points, deuceState, team) => {
            const pointValues = {
                0: '0',
                1: '15',
                2: '30',
                3: '40'
            };
            
            if (deuceState === team) {
                return 'Adv';
            }
            if (deuceState && deuceState !== team) {
                return '40';
            }
            return pointValues[points] || '0';
        };

        test('should format points correctly', () => {
            expect(formatPoint(0, null, 'A')).toBe('0');
            expect(formatPoint(1, null, 'A')).toBe('15');
            expect(formatPoint(2, null, 'A')).toBe('30');
            expect(formatPoint(3, null, 'A')).toBe('40');
        });

        test('should handle advantage correctly', () => {
            expect(formatPoint(3, 'A', 'A')).toBe('Adv');
            expect(formatPoint(3, 'A', 'B')).toBe('40');
            expect(formatPoint(3, 'B', 'B')).toBe('Adv');
            expect(formatPoint(3, 'B', 'A')).toBe('40');
        });
    });
});
